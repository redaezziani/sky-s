import { IsOptional, IsEnum } from 'class-validator';
import { OrderStatus, PaymentStatus } from 'generated/prisma';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  trackingNumber?: string;
}
