// src/payment/strategies/payment-strategy.interface.ts
import { Payment } from '@prisma/client';
import { CreatePaymentDto } from '../dto/create-payment.dto';

export interface PaymentStrategy {
  method: string; // "STRIPE" | "CASH"
  create(dto: CreatePaymentDto): Promise<Payment & {
    checkoutUrl?: string;
    clientSecret?: string;
  }>;
  confirm?(transactionId: string): Promise<any>; // for Stripe
}
