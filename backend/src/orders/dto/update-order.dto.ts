import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderItemDto } from './create-order.dto';

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'User ID placing the order' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description:
      'List of items in the order (will replace existing items if provided)',
    type: [OrderItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  // Delivery info
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

  // Shipping info
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

  // Billing info
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

  @ApiPropertyOptional({
    description: 'Order status',
    enum: [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'REFUNDED',
    ],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
  })
  @IsOptional()
  @IsString()
  paymentStatus?: string;
}
