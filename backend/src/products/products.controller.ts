import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  CreateProductWithVariantsDto,
  CreateProductVariantDto,
  CreateProductSKUDto,
  UpdateProductDto,
} from './dto/create-product.dto';
import { ProductQueryDto } from './dto/query.dto';
import {
  ProductResponseDto,
  PaginatedProductsResponseDto,
  ProductVariantResponseDto,
  ProductSKUResponseDto,
} from './dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto);
  }

  @Post('with-variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product with variants' })
  @ApiResponse({
    status: 201,
    description: 'Product with variants created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createWithVariants(
    @Body() createProductDto: CreateProductWithVariantsDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.createWithVariants(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    type: PaginatedProductsResponseDto,
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
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'categorySlug',
    required: false,
    description: 'Filter by category slug',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    type: Boolean,
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
    enum: ['name', 'price', 'createdAt', 'updatedAt', 'sortOrder'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @ApiQuery({
    name: 'includeVariants',
    required: false,
    description: 'Include variants in response',
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeSKUs',
    required: false,
    description: 'Include SKUs in response',
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeCategories',
    required: false,
    description: 'Include categories in response',
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeImages',
    required: false,
    description: 'Include images in response',
    type: Boolean,
  })
  async findAll(@Query() query: ProductQueryDto): Promise<PaginatedProductsResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiParam({
    name: 'slug',
    description: 'Product slug',
    example: 'wireless-bluetooth-headphones',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async findBySlug(@Param('slug') slug: string): Promise<ProductResponseDto> {
    return this.productsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Product deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  // Variant endpoints
  @Post(':productId/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a variant to a product' })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Variant created successfully',
    type: ProductVariantResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async addVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() createVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.productsService.addVariant(productId, createVariantDto);
  }

  @Patch('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiParam({
    name: 'variantId',
    description: 'Variant UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Variant updated successfully',
    type: ProductVariantResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  async updateVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() updateVariantDto: Partial<CreateProductVariantDto>,
  ): Promise<ProductVariantResponseDto> {
    return this.productsService.updateVariant(variantId, updateVariantDto);
  }

  @Delete('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product variant (soft delete)' })
  @ApiParam({
    name: 'variantId',
    description: 'Variant UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Variant deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  async removeVariant(@Param('variantId', ParseUUIDPipe) variantId: string): Promise<void> {
    return this.productsService.removeVariant(variantId);
  }

  // SKU endpoints
  @Post('variants/:variantId/skus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a SKU to a variant' })
  @ApiParam({
    name: 'variantId',
    description: 'Variant UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'SKU created successfully',
    type: ProductSKUResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  @ApiResponse({
    status: 409,
    description: 'SKU or barcode already exists',
  })
  async addSKU(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() createSKUDto: CreateProductSKUDto,
  ): Promise<ProductSKUResponseDto> {
    return this.productsService.addSKU(variantId, createSKUDto);
  }

  @Patch('skus/:skuId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product SKU' })
  @ApiParam({
    name: 'skuId',
    description: 'SKU UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'SKU updated successfully',
    type: ProductSKUResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'SKU not found',
  })
  @ApiResponse({
    status: 409,
    description: 'SKU or barcode already exists',
  })
  async updateSKU(
    @Param('skuId', ParseUUIDPipe) skuId: string,
    @Body() updateSKUDto: Partial<CreateProductSKUDto>,
  ): Promise<ProductSKUResponseDto> {
    return this.productsService.updateSKU(skuId, updateSKUDto);
  }

  @Delete('skus/:skuId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product SKU (soft delete)' })
  @ApiParam({
    name: 'skuId',
    description: 'SKU UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'SKU deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'SKU not found',
  })
  async removeSKU(@Param('skuId', ParseUUIDPipe) skuId: string): Promise<void> {
    return this.productsService.removeSKU(skuId);
  }
}
