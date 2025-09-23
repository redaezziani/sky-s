import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStrategy } from './payment-strategy.interface';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StripePaymentStrategy implements PaymentStrategy {
  private readonly logger = new Logger(StripePaymentStrategy.name);
  method = 'STRIPE';
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {
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
            product_data: {
              name: i.productName,
              images: i.coverImage ? [i.coverImage] : [],
            },
            unit_amount: Math.round(i.unitPrice * 100),
          },
          quantity: i.quantity,
        })),
        mode: 'payment',
        success_url: `http://localhost:3001/payment/success?session_id={CHECKOUT_SESSION_ID}&method=STRIPE`,
        cancel_url: `http://localhost:3001/payment/cancel`,
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
    let stripeObject: Stripe.PaymentIntent | Stripe.Checkout.Session | null =
      null;

    try {
      stripeObject = await this.stripe.paymentIntents.retrieve(transactionId);
    } catch {
      try {
        stripeObject = await this.stripe.checkout.sessions.retrieve(
          transactionId,
          {
            expand: ['payment_intent'],
          },
        );
      } catch {
        throw new Error(`Stripe object not found for ${transactionId}`);
      }
    }

    if (!stripeObject)
      throw new Error(`Stripe object not found for ${transactionId}`);

    // normalize status
    let newStatus: 'PENDING' | 'COMPLETED' | 'FAILED' = 'PENDING';
    if ('status' in stripeObject) {
      if (
        stripeObject.status === 'succeeded' ||
        stripeObject.status === 'complete'
      )
        newStatus = 'COMPLETED';
      else if (
        stripeObject.status === 'requires_payment_method' ||
        stripeObject.status === 'canceled'
      )
        newStatus = 'FAILED';
    }

    // update payment in DB
    const payment = await this.prisma.payment.updateMany({
      where: { transactionId },
      data: { status: newStatus, rawResponse: stripeObject as any },
    });

    // emit event to handle order update
    this.eventEmitter.emit('payment.updated', {
      transactionId,
      status: newStatus,
    });

    return stripeObject;
  }

  async cancel(transactionId: string) {
    try {
      const pi = await this.stripe.paymentIntents.retrieve(transactionId);
      if (pi && pi.status !== 'canceled' && pi.status !== 'succeeded') {
        const canceled = await this.stripe.paymentIntents.cancel(transactionId);
        await this.prisma.payment.updateMany({
          where: { transactionId },
          data: { status: PaymentStatus.FAILED, rawResponse: canceled as any },
        });
        return canceled;
      }

      if (pi?.status === 'succeeded') {
        const refund = await this.stripe.refunds.create({
          payment_intent: pi.id,
        });
        await this.prisma.payment.updateMany({
          where: { transactionId },
          data: { status: PaymentStatus.REFUNDED, rawResponse: refund as any },
        });
        return refund;
      }
    } catch {
      const session = await this.stripe.checkout.sessions.retrieve(
        transactionId,
        { expand: ['payment_intent'] },
      );
      const pi = session.payment_intent as Stripe.PaymentIntent;
      if (pi.status !== 'succeeded') {
        const canceled = await this.stripe.paymentIntents.cancel(pi.id);
        await this.prisma.payment.updateMany({
          where: { transactionId },
          data: { status: PaymentStatus.FAILED, rawResponse: canceled as any },
        });
        return canceled;
      } else {
        const refund = await this.stripe.refunds.create({
          payment_intent: pi.id,
        });
        await this.prisma.payment.updateMany({
          where: { transactionId },
          data: { status: PaymentStatus.REFUNDED, rawResponse: refund as any },
        });
        return refund;
      }
    }

    throw new Error(`Unable to cancel payment ${transactionId}`);
  }
}
