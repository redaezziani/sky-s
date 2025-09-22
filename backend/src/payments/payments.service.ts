// src/payment/payment.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentStrategy } from './strategies/payment-strategy.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from '@prisma/client';

@Injectable()
export class PaymentService {
  private strategies: Map<string, PaymentStrategy> = new Map();

  constructor(strategies: PaymentStrategy[]) {
    strategies.forEach((s) => this.strategies.set(s.method, s));
  }

  async createPayment(
    dto: CreatePaymentDto,
  ): Promise<Payment & { checkoutUrl?: string }> {
    const strategy = this.strategies.get(dto.method);
    if (!strategy) throw new BadRequestException('Unsupported payment method');
    return strategy.create(dto);
  }

  async confirmPayment(method: string, transactionId: string) {
    const strategy = this.strategies.get(method);
    if (!strategy?.confirm) {
      throw new BadRequestException('Confirm not supported for this method');
    }
    return strategy.confirm(transactionId);
  }

  async cancelPayment(method: string, transactionId: string) {
    const strategy = this.strategies.get(method);
    if (!strategy?.cancel) {
      throw new BadRequestException('Cancel not supported for this method');
    }
    return strategy.cancel(transactionId);
  }
  
}
