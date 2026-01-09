import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PublicProductsService } from './public-products.service';
import { PaginatedPublicProductsResponseDto, ProductDetailsDto, PublicProductDetailDto, PublicProductQueryDto } from '../dto/public-products.dto';
import { RelatedProductsQueryDto } from '../dto/related-products';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Permission } from '../../auth/permissions/permissions.enum';

@ApiTags('Products')
@Controller('public/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PublicProductsController {
  constructor(private readonly publicProductsService: PublicProductsService) {}

  @Get('latest')
  @Permissions(Permission.PRODUCT_READ)
  @ApiOperation({
    summary: 'Get latest products',
    description:
      'Get the latest products with minimal information for display',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest products retrieved successfully',
    type: PaginatedPublicProductsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
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
@Permissions(Permission.PRODUCT_READ)
@ApiOperation({
  summary: 'Get best products',
  description:
    'Get the best-selling or highest-rated products for display',
})
@ApiResponse({
  status: 200,
  description: 'Best products retrieved successfully',
  type: PaginatedPublicProductsResponseDto,
})
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
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

  @Get('/:identifier/related')
@Permissions(Permission.PRODUCT_READ)
@ApiOperation({
  summary: 'Get related products',
  description:
    'Fetch products related to the given product based on categories, price, and popularity',
})
@ApiParam({
  name: 'identifier',
  description: 'Product UUID or slug',
  example: 'diverge-4-comp-carbon',
})
@ApiQuery({
  name: 'limit',
  required: false,
  description: 'Number of related products',
  example: 6,
})
@ApiResponse({
  status: 200,
  description: 'Related products retrieved successfully',
  type: PaginatedPublicProductsResponseDto,
})
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
async getRelatedProducts(
  @Param('identifier') identifier: string,
  @Query() { limit }: RelatedProductsQueryDto,
): Promise<PaginatedPublicProductsResponseDto> {
  return this.publicProductsService.getRelatedProducts(identifier, limit);
}

  @Get('/:identifier')
  @Permissions(Permission.PRODUCT_READ)
  @ApiOperation({
    summary: 'Get product details by ID or slug',
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getPublicProductDetails(
    @Param('identifier') identifier: string,
  ): Promise<ProductDetailsDto> {
    return this.publicProductsService.getPublicProductDetails(identifier);
  }



}
