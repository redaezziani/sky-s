import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PaymentStatus } from 'generated/prisma';

export class OrderItemResponseDto {
  @ApiProperty({ description: 'SKU ID of the product' })
  skuId: string;

  @ApiProperty({ description: 'Product name snapshot' })
  productName: string;

  @ApiProperty({ description: 'SKU code snapshot' })
  skuCode: string;

  @ApiProperty({ description: 'Quantity ordered', example: 1 })
  quantity: number;

  @ApiProperty({ description: 'Price per unit', example: 10.99 })
  unitPrice: number;

  @ApiProperty({ description: 'Total price for this item', example: 21.98 })
  totalPrice: number;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Unique order number' })
  orderNumber: string;

  @ApiProperty({ description: 'User ID who placed the order' })
  userId: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Subtotal amount', example: 50.0 })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount', example: 5.0 })
  taxAmount: number;

  @ApiProperty({ description: 'Shipping amount', example: 10.0 })
  shippingAmount: number;

  @ApiProperty({ description: 'Discount amount', example: 0.0 })
  discountAmount: number;

  @ApiProperty({ description: 'Total amount to pay', example: 65.0 })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  currency: string;

  @ApiPropertyOptional({ description: 'Shipping recipient name' })
  shippingName?: string;

  @ApiPropertyOptional({ description: 'Shipping recipient email' })
  shippingEmail?: string;

  @ApiPropertyOptional({ description: 'Shipping phone number' })
  shippingPhone?: string;

  @ApiPropertyOptional({ description: 'Shipping address object', type: Object })
  shippingAddress?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Billing recipient name' })
  billingName?: string;

  @ApiPropertyOptional({ description: 'Billing recipient email' })
  billingEmail?: string;

  @ApiPropertyOptional({ description: 'Billing address object', type: Object })
  billingAddress?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional notes for the order' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Tracking number for the shipment' })
  trackingNumber?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({
    description: 'List of items in the order',
    type: [OrderItemResponseDto],
  })
  items: OrderItemResponseDto[];

  @ApiPropertyOptional({
    description: 'Delivery latitude coordinate',
    example: 40.7128,
  })
  deliveryLat?: number;

  @ApiPropertyOptional({
    description: 'Delivery longitude coordinate',
    example: -74.006,
  })
  deliveryLng?: number;

  @ApiPropertyOptional({ description: 'Delivery place description' })
  deliveryPlace?: string;
}
