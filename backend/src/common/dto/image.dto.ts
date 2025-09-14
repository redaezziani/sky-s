import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsNumber, Min, Max } from 'class-validator';

export class ImageUploadDto {
  @ApiPropertyOptional({
    description: 'Folder to upload the image to',
    example: 'products'
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Custom filename for the image',
    example: 'product-hero-image'
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Tags for the image',
    type: [String],
    example: ['product', 'electronics']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ImageTransformationDto {
  @ApiPropertyOptional({
    description: 'Image height in pixels',
    example: 400
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(4000)
  height?: number;

  @ApiPropertyOptional({
    description: 'Image width in pixels',
    example: 400
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(4000)
  width?: number;

  @ApiPropertyOptional({
    description: 'Image quality (1-100)',
    example: 80
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiPropertyOptional({
    description: 'Output format',
    example: 'webp',
    enum: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  })
  @IsOptional()
  @IsString()
  format?: string;
}

export class ImageResponseDto {
  @ApiProperty({
    description: 'Image URL',
    example: 'https://ik.imagekit.io/demo/medium_cafe_B1iTdD0C.jpg'
  })
  url: string;

  @ApiProperty({
    description: 'Thumbnail URL',
    example: 'https://ik.imagekit.io/demo/tr:h-200,w-200/medium_cafe_B1iTdD0C.jpg'
  })
  thumbnailUrl: string;

  @ApiProperty({
    description: 'File ID for deletion',
    example: '5e2a0b6d7b45a50012345678'
  })
  fileId: string;

  @ApiProperty({
    description: 'File name',
    example: 'product-image.jpg'
  })
  name: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000
  })
  size: number;

  @ApiProperty({
    description: 'File path in ImageKit',
    example: '/products/product-image.jpg'
  })
  filePath: string;
}

export class ResponsiveImageUrlsDto {
  @ApiProperty({
    description: 'Thumbnail size (150x150)',
    example: 'https://ik.imagekit.io/demo/tr:h-150,w-150/image.jpg'
  })
  thumbnail: string;

  @ApiProperty({
    description: 'Small size (300x300)',
    example: 'https://ik.imagekit.io/demo/tr:h-300,w-300/image.jpg'
  })
  small: string;

  @ApiProperty({
    description: 'Medium size (600x600)',
    example: 'https://ik.imagekit.io/demo/tr:h-600,w-600/image.jpg'
  })
  medium: string;

  @ApiProperty({
    description: 'Large size (1200x1200)',
    example: 'https://ik.imagekit.io/demo/tr:h-1200,w-1200/image.jpg'
  })
  large: string;

  @ApiProperty({
    description: 'Original image',
    example: 'https://ik.imagekit.io/demo/image.jpg'
  })
  original: string;
}
