// src/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from './payment.service';
import { StripePaymentStrategy } from './strategies/stripe.strategy';
import { CashPaymentStrategy } from './strategies/cash.strategy';

@Module({
  providers: [
    PrismaService,
    StripePaymentStrategy,
    CashPaymentStrategy,
    {
      provide: PaymentService,
      useFactory: (stripe: StripePaymentStrategy, cash: CashPaymentStrategy) => {
        return new PaymentService([stripe, cash]);
      },
      inject: [StripePaymentStrategy, CashPaymentStrategy],
    },
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
