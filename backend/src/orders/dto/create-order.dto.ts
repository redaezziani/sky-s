import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty({ description: 'SKU ID of the product' })
  @IsUUID()
  skuId: string;

  @ApiProperty({ description: 'Quantity of this SKU', example: 1 })
  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'User ID placing the order' })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'List of items in the order',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Delivery info should only be here (per order, not per item)
  @ApiPropertyOptional({ description: 'Delivery latitude', example: 40.7128 })
  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @ApiPropertyOptional({ description: 'Delivery longitude', example: -74.006 })
  @IsOptional()
  @IsNumber()
  deliveryLng?: number;

  @ApiPropertyOptional({
    description: 'Delivery place description',
    example: 'Warehouse 5',
  })
  @IsOptional()
  @IsString()
  deliveryPlace?: string;

  @ApiPropertyOptional({ description: 'Shipping name' })
  @IsOptional()
  @IsString()
  shippingName?: string;

  @ApiPropertyOptional({ description: 'Shipping email' })
  @IsOptional()
  @IsString()
  shippingEmail?: string;

  @ApiPropertyOptional({ description: 'Shipping phone number' })
  @IsOptional()
  @IsString()
  shippingPhone?: string;

  @ApiPropertyOptional({ description: 'Shipping address object', type: Object })
  @IsOptional()
  shippingAddress?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Billing name' })
  @IsOptional()
  @IsString()
  billingName?: string;

  @ApiPropertyOptional({ description: 'Billing email' })
  @IsOptional()
  @IsString()
  billingEmail?: string;

  @ApiPropertyOptional({ description: 'Billing address object', type: Object })
  @IsOptional()
  billingAddress?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional notes for the order' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tracking number for the order' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({
    description: 'Payment method: STRIPE or CASH',
    default: PaymentMethod.STRIPE,
  })
  @IsEnum(PaymentMethod, { message: 'method must be STRIPE or CASH' })
  method: PaymentMethod = PaymentMethod.STRIPE;
  @IsOptional()
  @IsBoolean()
  redirectToCheckout?: boolean = true;
}
