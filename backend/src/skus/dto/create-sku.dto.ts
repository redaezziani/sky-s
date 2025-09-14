import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const CreateSKUSchema = z.object({
  sku: z.string().min(1).max(100),
  barcode: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
  }).optional(),
  requiresShipping: z.boolean().optional(),
  taxable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSKUSchema = CreateSKUSchema.partial();

export class CreateSKUDto {
  @ApiProperty({ description: 'Unique SKU code', example: 'SKU-001-RED-M' })
  sku: string;

  @ApiProperty({ description: 'Product barcode', required: false, example: '1234567890123' })
  barcode?: string;

  @ApiProperty({ description: 'SKU price', example: 29.99 })
  price: number;

  @ApiProperty({ description: 'Compare at price (MSRP)', required: false, example: 39.99 })
  compareAtPrice?: number;

  @ApiProperty({ description: 'Stock quantity', example: 100 })
  stock: number;

  @ApiProperty({ description: 'Low stock threshold', required: false, example: 10 })
  lowStockThreshold?: number;

  @ApiProperty({ description: 'Product weight in grams', required: false, example: 250 })
  weight?: number;

  @ApiProperty({
    description: 'Product dimensions in cm',
    required: false,
    example: { length: 10, width: 5, height: 2 }
  })
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };

  @ApiProperty({ description: 'Requires shipping', required: false, default: true })
  requiresShipping?: boolean;

  @ApiProperty({ description: 'Is taxable', required: false, default: true })
  taxable?: boolean;

  @ApiProperty({ description: 'Is active', required: false, default: true })
  isActive?: boolean;
}

export class UpdateSKUDto {
  @ApiProperty({ description: 'Unique SKU code', required: false, example: 'SKU-001-RED-M' })
  sku?: string;

  @ApiProperty({ description: 'Product barcode', required: false, example: '1234567890123' })
  barcode?: string;

  @ApiProperty({ description: 'SKU price', required: false, example: 29.99 })
  price?: number;

  @ApiProperty({ description: 'Compare at price (MSRP)', required: false, example: 39.99 })
  compareAtPrice?: number;

  @ApiProperty({ description: 'Stock quantity', required: false, example: 100 })
  stock?: number;

  @ApiProperty({ description: 'Low stock threshold', required: false, example: 10 })
  lowStockThreshold?: number;

  @ApiProperty({ description: 'Product weight in grams', required: false, example: 250 })
  weight?: number;

  @ApiProperty({
    description: 'Product dimensions in cm',
    required: false,
    example: { length: 10, width: 5, height: 2 }
  })
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };

  @ApiProperty({ description: 'Requires shipping', required: false })
  requiresShipping?: boolean;

  @ApiProperty({ description: 'Is taxable', required: false })
  taxable?: boolean;

  @ApiProperty({ description: 'Is active', required: false })
  isActive?: boolean;
}
