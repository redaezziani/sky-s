// src/payment/dto/create-payment.dto.ts
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsBoolean, ValidateNested, ArrayNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';

class PaymentItemDto {
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  quantity: number;
  @IsOptional()
  @IsString()
  coverImage?: string; // Add this new field
}

export class CreatePaymentDto {
  @IsNotEmpty()
  orderId: string;

  @IsNotEmpty()
  userId: string;

  @IsEnum(PaymentMethod, { message: 'method must be STRIPE or CASH' })
  method: PaymentMethod;

  @IsNumber()
  amount: number;

  @IsOptional()
  currency?: string = 'USD';

  // ✅ New fields for Stripe Checkout
  @IsOptional()
  @IsBoolean()
  redirectToCheckout?: boolean = false;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  @ArrayNotEmpty()
  items?: PaymentItemDto[];
}
