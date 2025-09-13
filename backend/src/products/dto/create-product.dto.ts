import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsUUID, ValidateNested, IsDecimal, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Bluetooth Headphones'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product URL slug (will be auto-generated if not provided)',
    example: 'wireless-bluetooth-headphones'
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Detailed product description',
    example: 'High-quality wireless headphones with noise cancellation...'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Short product description',
    example: 'Premium wireless headphones with 30h battery life'
  })
  @IsOptional()
  @IsString()
  shortDesc?: string;

  @ApiPropertyOptional({
    description: 'Product cover image URL',
    example: 'https://example.com/images/headphones.jpg'
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Whether the product is active',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the product is featured',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'SEO meta title'
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'SEO meta description'
  })
  @IsOptional()
  @IsString()
  metaDesc?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying products',
    default: 0
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Array of category IDs to assign to this product',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}

export class CreateProductVariantDto {
  @ApiPropertyOptional({
    description: 'Variant name',
    example: 'Large - Black'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Variant attributes as JSON object',
    example: { size: 'Large', color: 'Black', material: 'Leather' }
  })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether the variant is active',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for variants',
    default: 0
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductSKUDto {
  @ApiProperty({
    description: 'Unique SKU code',
    example: 'WBH-001-LG-BLK'
  })
  @IsString()
  sku: string;

  @ApiPropertyOptional({
    description: 'Product barcode',
    example: '1234567890123'
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    description: 'Product price',
    example: 199.99
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Compare at price (original price for discounts)',
    example: 249.99
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  comparePrice?: number;

  @ApiPropertyOptional({
    description: 'Cost price for profit calculation',
    example: 89.99
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Current stock quantity',
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    description: 'Low stock alert threshold',
    default: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockAlert?: number;

  @ApiPropertyOptional({
    description: 'Product weight in grams',
    example: 250
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Product dimensions',
    example: { length: 20, width: 15, height: 8 }
  })
  @IsOptional()
  dimensions?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'SKU cover image URL'
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Whether the SKU is active',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProductWithVariantsDto extends CreateProductDto {
  @ApiPropertyOptional({
    description: 'Product variants',
    type: [CreateProductVariantDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product name'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Product description'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Short product description'
  })
  @IsOptional()
  @IsString()
  shortDesc?: string;

  @ApiPropertyOptional({
    description: 'Product cover image URL'
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Whether the product is active'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the product is featured'
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'SEO meta title'
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'SEO meta description'
  })
  @IsOptional()
  @IsString()
  metaDesc?: string;

  @ApiPropertyOptional({
    description: 'Sort order'
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Array of category IDs',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
