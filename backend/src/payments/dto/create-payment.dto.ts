// src/payment/dto/create-payment.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @IsNotEmpty()
  orderId: string;

  @IsNotEmpty()
  userId: string;

  @IsEnum(PaymentMethod, { message: 'method must be CASH' })
  method: PaymentMethod;

  @IsNumber()
  amount: number;

  @IsOptional()
  currency?: string = 'USD';
}
