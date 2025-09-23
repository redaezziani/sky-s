// src/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from './payments.service';
import { StripePaymentStrategy } from './strategies/stripe.strategy';
import { CashPaymentStrategy } from './strategies/cash.strategy';
import { PaymentController } from './payments.controller';
import { PaymentEvent } from './payments.event';
import { EmailService } from 'src/common/services/email.service';

@Module({
  providers: [
    PrismaService,
    StripePaymentStrategy,
    CashPaymentStrategy,
    EmailService,
    {
      provide: PaymentService,
      useFactory: (
        stripe: StripePaymentStrategy,
        cash: CashPaymentStrategy,
      ) => {
        return new PaymentService([stripe, cash]);
      },
      inject: [StripePaymentStrategy, CashPaymentStrategy],
    },
    PaymentEvent
  ],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentsModule {}
