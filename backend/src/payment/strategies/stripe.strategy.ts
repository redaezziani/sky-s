// src/payment/strategies/stripe.strategy.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStrategy } from './payment-strategy.interface';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@Injectable()
export class StripePaymentStrategy implements PaymentStrategy {
  method = 'STRIPE';
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-08-27.basil',
    });
  }

async create(dto: CreatePaymentDto) {
  if (dto.redirectToCheckout) {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: (dto.items ?? []).map((i) => ({
        price_data: {
          currency: dto.currency ?? 'usd',
          product_data: { name: i.productName },
          unit_amount: Math.round(i.unitPrice * 100),
        },
        quantity: i.quantity,
      })),
      mode: 'payment',
      success_url: `https://localhost:3000`,
      cancel_url: `https://localhost:3000`,
      metadata: { orderId: dto.orderId, userId: dto.userId },
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        userId: dto.userId,
        method: 'STRIPE',
        amount: dto.amount,
        currency: dto.currency,
        status: 'PENDING',
        transactionId: session.id,
        provider: 'stripe',
        rawResponse: session as any,
      },
    });

    return { ...payment, checkoutUrl: session.url ?? undefined };
  }

  // fallback: original PaymentIntent flow
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: Math.round(dto.amount * 100),
    currency: dto.currency ?? 'usd',
    metadata: { orderId: dto.orderId, userId: dto.userId },
  });

  const payment = await this.prisma.payment.create({
    data: {
      orderId: dto.orderId,
      userId: dto.userId,
      method: 'STRIPE',
      amount: dto.amount,
      currency: dto.currency,
      status: 'PENDING',
      transactionId: paymentIntent.id,
      provider: 'stripe',
      rawResponse: paymentIntent as any,
    },
  });

  const clientSecret = paymentIntent.client_secret ?? undefined;
  return clientSecret ? { ...payment, clientSecret } : { ...payment };
}
  async confirm(transactionId: string) {
    const intent = await this.stripe.paymentIntents.retrieve(transactionId);
    if (intent.status === 'succeeded') {
      await this.prisma.payment.updateMany({
        where: { transactionId },
        data: { status: 'COMPLETED', rawResponse: intent as any },
      });
    }
    return intent;
  }
}
