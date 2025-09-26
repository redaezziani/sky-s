import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicProductsService } from './public-products.service';
import { PaginatedPublicProductsResponseDto, ProductDetailsDto, PublicProductDetailDto, PublicProductQueryDto } from '../dto/public-products.dto';

@ApiTags('Public Products')
@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly publicProductsService: PublicProductsService) {}

  @Get('latest')
  @ApiOperation({
    summary: 'Get latest products (public endpoint)',
    description:
      'Get the latest products with minimal information for storefront display',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest products retrieved successfully',
    type: PaginatedPublicProductsResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (max 50)',
    example: 12,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'categorySlug',
    required: false,
    description: 'Filter by category slug',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    description: 'Filter by featured status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price filter',
    type: Number,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price filter',
    type: Number,
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter by stock availability',
    type: Boolean,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by field',
    enum: ['name', 'price', 'createdAt', 'featured'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  async getLatestProducts(
    @Query() query: PublicProductQueryDto,
  ): Promise<PaginatedPublicProductsResponseDto> {
    return this.publicProductsService.getLatestProducts(query);
  }

    @Get('best')
@ApiOperation({
  summary: 'Get best products (public endpoint)',
  description:
    'Get the best-selling or highest-rated products for storefront display',
})
@ApiResponse({
  status: 200,
  description: 'Best products retrieved successfully',
  type: PaginatedPublicProductsResponseDto,
})
@ApiQuery({
  name: 'page',
  required: false,
  description: 'Page number',
  example: 1,
})
@ApiQuery({
  name: 'limit',
  required: false,
  description: 'Items per page (max 50)',
  example: 12,
})
@ApiQuery({
  name: 'sortBy',
  required: false,
  description: 'Criteria for best products',
  enum: ['sales', 'rating'],
  example: 'sales',
})
async getBestProducts(
  @Query('page') page = 1,
  @Query('limit') limit = 12,
  @Query('sortBy') sortBy: 'sales' | 'rating' = 'sales',
): Promise<PaginatedPublicProductsResponseDto> {
  return this.publicProductsService.getBestProducts({ page, limit, sortBy });
}

  @Get('/:identifier')
  @ApiOperation({
    summary: 'Get product details by ID or slug (public endpoint)',
    description: 'Get detailed product information including variants and SKUs',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Product UUID or slug',
    example: 'diverge-4-comp-carbon',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
    type: PublicProductDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getPublicProductDetails(
    @Param('identifier') identifier: string,
  ): Promise<ProductDetailsDto> {
    return this.publicProductsService.getPublicProductDetails(identifier);
  }



}
