import { ApiProperty } from '@nestjs/swagger';

export class SKUImageResponseDto {
  @ApiProperty({ description: 'Image ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Image URL', example: 'https://example.com/image.jpg' })
  url: string;

  @ApiProperty({ description: 'Alt text', example: 'Product image' })
  altText?: string;

  @ApiProperty({ description: 'Display order', example: 1 })
  order: number;

  @ApiProperty({ description: 'Is primary image', example: true })
  isPrimary: boolean;
}

export class SKUVariantResponseDto {
  @ApiProperty({ description: 'Variant ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Variant name', example: 'Red - Medium' })
  name: string;

  @ApiProperty({ description: 'Variant attributes', example: { color: 'Red', size: 'Medium' } })
  attributes: Record<string, any>;
}

export class SKUProductResponseDto {
  @ApiProperty({ description: 'Product ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'Product name', example: 'Premium T-Shirt' })
  name: string;

  @ApiProperty({ description: 'Product slug', example: 'premium-t-shirt' })
  slug: string;

  @ApiProperty({ description: 'Product status', example: 'ACTIVE' })
  status: string;
}

export class SKUResponseDto {
  @ApiProperty({ description: 'SKU ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'SKU code', example: 'SKU-001-RED-M' })
  sku: string;

  @ApiProperty({ description: 'Barcode', required: false, example: '1234567890123' })
  barcode?: string;

  @ApiProperty({ description: 'Price', example: 29.99 })
  price: number;

  @ApiProperty({ description: 'Compare at price', required: false, example: 39.99 })
  compareAtPrice?: number;

  @ApiProperty({ description: 'Stock quantity', example: 100 })
  stock: number;

  @ApiProperty({ description: 'Low stock threshold', required: false, example: 10 })
  lowStockThreshold?: number;

  @ApiProperty({ description: 'Weight in grams', required: false, example: 250 })
  weight?: number;

  @ApiProperty({
    description: 'Dimensions in cm',
    required: false,
    example: { length: 10, width: 5, height: 2 }
  })
  dimensions?: Record<string, any>;

  @ApiProperty({ description: 'Requires shipping', example: true })
  requiresShipping: boolean;

  @ApiProperty({ description: 'Is taxable', example: true })
  taxable: boolean;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Variant ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  variantId: string;

  @ApiProperty({ description: 'Creation date', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Deletion date', required: false, example: null })
  deletedAt?: Date;

  @ApiProperty({ description: 'Product information', required: false, type: SKUProductResponseDto })
  product?: SKUProductResponseDto;

  @ApiProperty({ description: 'Variant information', required: false, type: SKUVariantResponseDto })
  variant?: SKUVariantResponseDto;

  @ApiProperty({ description: 'Images', required: false, type: [SKUImageResponseDto] })
  images?: SKUImageResponseDto[];
}

export class PaginatedSKUsResponseDto {
  @ApiProperty({ description: 'SKUs data', type: [SKUResponseDto] })
  data: SKUResponseDto[];

  @ApiProperty({ description: 'Total count', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 10 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevPage: boolean;
}
