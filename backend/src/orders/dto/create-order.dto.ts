import {
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
