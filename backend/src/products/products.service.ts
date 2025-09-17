import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateProductDto, 
  CreateProductWithVariantsDto, 
  CreateProductVariantDto, 
  CreateProductSKUDto,
  UpdateProductDto 
} from './dto/create-product.dto';
import { ProductQueryDto } from './dto/query.dto';
import { 
  ProductResponseDto, 
  PaginatedProductsResponseDto,
  ProductVariantResponseDto,
  ProductSKUResponseDto 
} from './dto/response.dto';
import { Prisma } from '../../generated/prisma';
import { ImageKitService } from '../common/services/imagekit.service';
import { customAlphabet } from 'nanoid';
import { createCanvas } from 'canvas';
import JsBarcode from 'jsbarcode';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private imageKitService: ImageKitService,
  ) {}
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async ensureUniqueSlug(
    slug: string,
    excludeId?: string,
  ): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product.findFirst({
        where: {
          slug: uniqueSlug,
          id: excludeId ? { not: excludeId } : undefined,
          deletedAt: null,
        },
      });

      if (!existing) return uniqueSlug;
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  private generateSKU(length = 8): string {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nanoid = customAlphabet(alphabet, length);
    return nanoid();
  }

  private generateBarcodeBase64(sku: string): string {
    const canvasWidth = 300;
    const canvasHeight = 100;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    JsBarcode(canvas, sku, {
      format: 'CODE128',
      width: 2,
      height: canvasHeight,
      displayValue: true,
    });
    return canvas.toDataURL('image/png');
  }

  async create(
    createProductDto: CreateProductDto,
    coverImageFile?: Express.Multer.File,
    additionalImageFiles?: Express.Multer.File[],
  ): Promise<ProductResponseDto> {
    const slug =
      createProductDto.slug || this.generateSlug(createProductDto.name);
    const uniqueSlug = await this.ensureUniqueSlug(slug);

    // Check if categories exist
    if (createProductDto.categoryIds?.length) {
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: createProductDto.categoryIds },
          deletedAt: null,
        },
      });

      if (categories.length !== createProductDto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
    }

    let coverImageUrl = createProductDto.coverImage;

    // Upload cover image if provided
    if (coverImageFile) {
      try {
        const uploadResult = await this.imageKitService.uploadImage(
          coverImageFile,
          {
            folder: createProductDto.imageFolder || 'products',
            tags: createProductDto.imageTags || ['product'],
            fileName: `${uniqueSlug}-cover`,
          },
        );
        coverImageUrl = uploadResult.url;
      } catch (error) {
        throw new BadRequestException('Failed to upload cover image');
      }
    }

    // Create the product
    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        slug: uniqueSlug,
        description: createProductDto.description,
        shortDesc: createProductDto.shortDesc,
        coverImage: coverImageUrl,
        isActive: createProductDto.isActive ?? true,
        isFeatured: createProductDto.isFeatured ?? false,
        metaTitle: createProductDto.metaTitle,
        metaDesc: createProductDto.metaDesc,
        sortOrder: createProductDto.sortOrder ?? 0,
        categories: createProductDto.categoryIds?.length
          ? {
              connect: createProductDto.categoryIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        categories: true,
        variants: {
          include: {
            skus: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    // Upload additional images if provided
    if (additionalImageFiles && additionalImageFiles.length > 0) {
      try {
        await this.imageKitService.uploadMultipleImages(additionalImageFiles, {
          folder: createProductDto.imageFolder || 'products',
          tags: [...(createProductDto.imageTags || ['product']), product.slug],
        });
      } catch (error) {
        // Don't fail the product creation if additional images fail
        console.error('Failed to upload additional product images:', error);
      }
    }

    return this.formatProductResponse(product);
  }

  async createWithVariants(
    createProductDto: CreateProductWithVariantsDto,
  ): Promise<ProductResponseDto> {
    const slug =
      createProductDto.slug || this.generateSlug(createProductDto.name);
    const uniqueSlug = await this.ensureUniqueSlug(slug);

    // Check if categories exist
    if (createProductDto.categoryIds?.length) {
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: createProductDto.categoryIds },
          deletedAt: null,
        },
      });

      if (categories.length !== createProductDto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
    }

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        slug: uniqueSlug,
        description: createProductDto.description,
        shortDesc: createProductDto.shortDesc,
        coverImage: createProductDto.coverImage,
        isActive: createProductDto.isActive ?? true,
        isFeatured: createProductDto.isFeatured ?? false,
        metaTitle: createProductDto.metaTitle,
        metaDesc: createProductDto.metaDesc,
        sortOrder: createProductDto.sortOrder ?? 0,
        categories: createProductDto.categoryIds?.length
          ? {
              connect: createProductDto.categoryIds.map((id) => ({ id })),
            }
          : undefined,
        variants: createProductDto.variants?.length
          ? {
              create: createProductDto.variants.map((variant) => ({
                name: variant.name,
                attributes: variant.attributes,
                isActive: variant.isActive ?? true,
                sortOrder: variant.sortOrder ?? 0,
              })),
            }
          : undefined,
      },
      include: {
        categories: true,
        variants: {
          include: {
            skus: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    return this.formatProductResponse(product);
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedProductsResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      categorySlug,
      isActive,
      isFeatured,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeVariants = false,
      includeSKUs = false,
      includeCategories = false,
      includeImages = false,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (categoryId) {
      where.categories = {
        some: {
          id: categoryId,
          deletedAt: null,
        },
      };
    }

    if (categorySlug) {
      where.categories = {
        some: {
          slug: categorySlug,
          deletedAt: null,
        },
      };
    }

    // Price and stock filters require checking variants/SKUs
    if (
      minPrice !== undefined ||
      maxPrice !== undefined ||
      inStock !== undefined
    ) {
      const skuWhere: Prisma.ProductSKUWhereInput = {
        deletedAt: null,
        isActive: true,
      };

      if (minPrice !== undefined || maxPrice !== undefined) {
        skuWhere.price = {};
        if (minPrice !== undefined) {
          skuWhere.price.gte = minPrice;
        }
        if (maxPrice !== undefined) {
          skuWhere.price.lte = maxPrice;
        }
      }

      if (inStock !== undefined) {
        skuWhere.stock = inStock ? { gt: 0 } : { lte: 0 };
      }

      where.variants = {
        some: {
          deletedAt: null,
          isActive: true,
          skus: {
            some: skuWhere,
          },
        },
      };
    }

    // Build order by clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};

    if (sortBy === 'price') {
      // For price sorting, we need to order by the minimum price of active SKUs
      orderBy = {
        variants: {
          _count: sortOrder === 'desc' ? 'desc' : 'asc',
        },
      };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Build include clause based on query parameters
    let includeClause: any = {};

    if (includeCategories) {
      includeClause.categories = {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      };
    }

    if (includeVariants || includeSKUs || includeImages) {
      includeClause.variants = {
        where: { deletedAt: null },
      };

      if (includeSKUs || includeImages) {
        includeClause.variants.include = {
          skus: {
            where: { deletedAt: null },
          },
        };

        if (includeImages) {
          includeClause.variants.include.skus.include = {
            images: {
              orderBy: { position: 'asc' as const },
            },
          };
        }
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: includeClause,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products.map((product) => this.formatProductResponse(product)),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(
    id: string,
    includeRelations = true,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: includeRelations
        ? {
            categories: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
              },
            },
            variants: {
              where: { deletedAt: null },
              include: {
                skus: {
                  where: { deletedAt: null },
                  include: {
                    images: {
                      orderBy: { position: 'asc' as const },
                    },
                  },
                },
              },
            },
          }
        : undefined,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProductResponse(product);
  }

  async findBySlug(
    slug: string,
    includeRelations = true,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: includeRelations
        ? {
            categories: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
              },
            },
            variants: {
              where: { deletedAt: null },
              include: {
                skus: {
                  where: { deletedAt: null },
                  include: {
                    images: {
                      orderBy: { position: 'asc' as const },
                    },
                  },
                },
              },
            },
          }
        : undefined,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.formatProductResponse(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let uniqueSlug: string | undefined;
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const slug = this.generateSlug(updateProductDto.name);
      uniqueSlug = await this.ensureUniqueSlug(slug, id);
    }

    // Check if categories exist
    if (updateProductDto.categoryIds?.length) {
      const categories = await this.prisma.category.findMany({
        where: {
          id: { in: updateProductDto.categoryIds },
          deletedAt: null,
        },
      });

      if (categories.length !== updateProductDto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.name,
        slug: uniqueSlug,
        description: updateProductDto.description,
        shortDesc: updateProductDto.shortDesc,
        coverImage: updateProductDto.coverImage,
        isActive: updateProductDto.isActive,
        isFeatured: updateProductDto.isFeatured,
        metaTitle: updateProductDto.metaTitle,
        metaDesc: updateProductDto.metaDesc,
        sortOrder: updateProductDto.sortOrder,
        categories: updateProductDto.categoryIds?.length
          ? {
              set: updateProductDto.categoryIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        categories: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        variants: {
          where: { deletedAt: null },
          include: {
            skus: {
              where: { deletedAt: null },
              include: {
                images: {
                  orderBy: { position: 'asc' as const },
                },
              },
            },
          },
        },
      },
    });

    return this.formatProductResponse(updatedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Variant operations
  async addVariant(
    productId: string,
    createVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariantResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        name: createVariantDto.name,
        attributes: createVariantDto.attributes,
        isActive: createVariantDto.isActive ?? true,
        sortOrder: createVariantDto.sortOrder ?? 0,
      },
      include: {
        skus: {
          where: { deletedAt: null },
          include: {
            images: {
              orderBy: { position: 'asc' as const },
            },
          },
        },
      },
    });

    return this.formatVariantResponse(variant);
  }

  async updateVariant(
    variantId: string,
    updateVariantDto: Partial<CreateProductVariantDto>,
  ): Promise<ProductVariantResponseDto> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const updatedVariant = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: updateVariantDto,
      include: {
        skus: {
          where: { deletedAt: null },
          include: {
            images: {
              orderBy: { position: 'asc' as const },
            },
          },
        },
      },
    });

    return this.formatVariantResponse(updatedVariant);
  }

  async removeVariant(variantId: string): Promise<void> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { deletedAt: new Date() },
    });
  }

  async addSKU(
    variantId: string,
    createSKUDto: CreateProductSKUDto,
    imageFiles?: Express.Multer.File[],
  ): Promise<ProductSKUResponseDto> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
    });
    if (!variant) throw new NotFoundException('Variant not found');

    // Auto-generate SKU if not provided
    const skuValue = createSKUDto.sku || this.generateSKU();
    // Auto-generate barcode if not provided
    const barcodeValue = createSKUDto.barcode || skuValue;

    // Check for conflicts
    const existingSKU = await this.prisma.productSKU.findFirst({
      where: { sku: skuValue, deletedAt: null },
    });
    if (existingSKU) throw new ConflictException('SKU already exists');

    const existingBarcode = await this.prisma.productSKU.findFirst({
      where: { barcode: barcodeValue, deletedAt: null },
    });
    if (existingBarcode) throw new ConflictException('Barcode already exists');

    const sku = await this.prisma.productSKU.create({
      data: {
        variantId,
        sku: skuValue,
        barcode: barcodeValue,
        price: createSKUDto.price,
        comparePrice: createSKUDto.comparePrice,
        costPrice: createSKUDto.costPrice,
        stock: createSKUDto.stock ?? 0,
        lowStockAlert: createSKUDto.lowStockAlert ?? 5,
        weight: createSKUDto.weight,
        dimensions: createSKUDto.dimensions,
        coverImage: createSKUDto.coverImage,
        isActive: createSKUDto.isActive ?? true,
      },
      include: { images: { orderBy: { position: 'asc' as const } } },
    });

    // Upload SKU images if provided
    if (imageFiles?.length) {
      try {
        const uploadResults = await this.imageKitService.uploadMultipleImages(
          imageFiles,
          {
            folder: 'products/skus',
            tags: ['sku', sku.sku],
          },
        );
        const imagePromises = uploadResults.map((res, index) =>
          this.prisma.productSKUImage.create({
            data: {
              skuId: sku.id,
              url: res.url,
              altText: `${variant.name} - ${sku.sku}`,
              position: index,
            },
          }),
        );
        await Promise.all(imagePromises);

        if (!sku.coverImage && uploadResults.length > 0) {
          await this.prisma.productSKU.update({
            where: { id: sku.id },
            data: { coverImage: uploadResults[0].url },
          });
        }
      } catch (err) {
        console.error('Failed to upload SKU images:', err);
      }
    }

    return this.formatSKUResponse(sku);
  }

  async updateSKU(
    skuId: string,
    updateSKUDto: Partial<CreateProductSKUDto>,
    imageFiles?: Express.Multer.File[],
  ): Promise<ProductSKUResponseDto> {
    const sku = await this.prisma.productSKU.findFirst({
      where: { id: skuId, deletedAt: null },
    });

    if (!sku) {
      throw new NotFoundException('SKU not found');
    }

    // Check if updated SKU already exists
    if (updateSKUDto.sku && updateSKUDto.sku !== sku.sku) {
      const existingSKU = await this.prisma.productSKU.findFirst({
        where: {
          sku: updateSKUDto.sku,
          id: { not: skuId },
          deletedAt: null,
        },
      });

      if (existingSKU) {
        throw new ConflictException('SKU already exists');
      }
    }

    // Check if updated barcode already exists
    if (updateSKUDto.barcode && updateSKUDto.barcode !== sku.barcode) {
      const existingBarcode = await this.prisma.productSKU.findFirst({
        where: {
          barcode: updateSKUDto.barcode,
          id: { not: skuId },
          deletedAt: null,
        },
      });

      if (existingBarcode) {
        throw new ConflictException('Barcode already exists');
      }
    }

    const updatedSKU = await this.prisma.productSKU.update({
      where: { id: skuId },
      data: updateSKUDto,
      include: {
        images: {
          orderBy: { position: 'asc' as const },
        },
      },
    });

    // Handle image upload and SKU image creation
    if (imageFiles && imageFiles.length > 0) {
      try {
        const uploadResults = await this.imageKitService.uploadMultipleImages(
          imageFiles,
          {
            folder: 'products/skus',
            tags: ['sku', updatedSKU.sku],
          },
        );

        const imagePromises = uploadResults.map((result, index) =>
          this.prisma.productSKUImage.create({
            data: {
              skuId: updatedSKU.id,
              url: result.url,
              altText: `${updatedSKU.sku}`,
              position: index,
            },
          }),
        );
        await Promise.all(imagePromises);

        // Set cover image if not already set
        if (!updatedSKU.coverImage && uploadResults.length > 0) {
          await this.prisma.productSKU.update({
            where: { id: updatedSKU.id },
            data: { coverImage: uploadResults[0].url },
          });
        }
      } catch (error) {
        // Don't fail SKU update if image upload fails
        console.error('Failed to upload SKU images:', error);
      }
    }

    // Fetch updated SKU with images
    const refreshedSKU = await this.prisma.productSKU.findFirst({
      where: { id: updatedSKU.id },
      include: {
        images: { orderBy: { position: 'asc' as const } },
      },
    });

    return this.formatSKUResponse(refreshedSKU);
  }

  async removeSKU(skuId: string): Promise<void> {
    const sku = await this.prisma.productSKU.findFirst({
      where: { id: skuId, deletedAt: null },
    });

    if (!sku) {
      throw new NotFoundException('SKU not found');
    }

    await this.prisma.productSKU.update({
      where: { id: skuId },
      data: { deletedAt: new Date() },
    });
  }

  // Image upload methods
  async uploadProductImages(productId: string, files: Express.Multer.File[]) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      const uploadResults = await this.imageKitService.uploadMultipleImages(
        files,
        {
          folder: 'products',
          tags: ['product', product.slug],
        },
      );

      // If this is the first image and product doesn't have a cover image, set it
      if (!product.coverImage && uploadResults.length > 0) {
        await this.prisma.product.update({
          where: { id: productId },
          data: { coverImage: uploadResults[0].url },
        });
      }

      return {
        message: `Successfully uploaded ${uploadResults.length} images`,
        images: uploadResults,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload images');
    }
  }

  async uploadSKUImages(skuId: string, files: Express.Multer.File[]) {
    const sku = await this.prisma.productSKU.findFirst({
      where: { id: skuId, deletedAt: null },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sku) {
      throw new NotFoundException('SKU not found');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      const uploadResults = await this.imageKitService.uploadMultipleImages(
        files,
        {
          folder: 'products/skus',
          tags: ['sku', sku.sku, sku.variant.product.slug],
        },
      );

      // Create SKU image records
      const imagePromises = uploadResults.map((result, index) =>
        this.prisma.productSKUImage.create({
          data: {
            skuId: skuId,
            url: result.url,
            altText: `${sku.variant.product.name} - ${sku.sku}`,
            position: index,
          },
        }),
      );

      const createdImages = await Promise.all(imagePromises);

      // If this is the first image and SKU doesn't have a cover image, set it
      if (!sku.coverImage && uploadResults.length > 0) {
        await this.prisma.productSKU.update({
          where: { id: skuId },
          data: { coverImage: uploadResults[0].url },
        });
      }

      return {
        message: `Successfully uploaded ${uploadResults.length} images`,
        images: uploadResults,
        skuImages: createdImages,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload SKU images');
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.prisma.productSKUImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    try {
      // Extract file ID from URL or use a stored fileId if available
      // For now, we'll just delete the database record
      // In a real implementation, you'd store the ImageKit fileId in the database
      await this.prisma.productSKUImage.delete({
        where: { id: imageId },
      });

      // Note: To properly delete from ImageKit, you'd need to store the fileId
      // and then call: await this.imageKitService.deleteImage(fileId);
    } catch (error) {
      throw new BadRequestException('Failed to delete image');
    }
  }

  private formatProductResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDesc: product.shortDesc,
      coverImage: product.coverImage,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      metaTitle: product.metaTitle,
      metaDesc: product.metaDesc,
      sortOrder: product.sortOrder,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      variants: product.variants?.map((variant) =>
        this.formatVariantResponse(variant),
      ),
      categories: product.categories?.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
      })),
    };
  }

  private formatVariantResponse(variant: any): ProductVariantResponseDto {
    return {
      id: variant.id,
      name: variant.name,
      attributes: variant.attributes,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
      skus: variant.skus?.map((sku) => this.formatSKUResponse(sku)),
    };
  }

  private formatSKUResponse(sku: any): ProductSKUResponseDto {
    return {
      id: sku.id,
      sku: sku.sku,
      barcode: sku.barcode,
      price: Number(sku.price),
      comparePrice: sku.comparePrice ? Number(sku.comparePrice) : undefined,
      costPrice: sku.costPrice ? Number(sku.costPrice) : undefined,
      stock: sku.stock,
      lowStockAlert: sku.lowStockAlert,
      weight: sku.weight ? Number(sku.weight) : undefined,
      dimensions: sku.dimensions,
      coverImage: sku.coverImage,
      isActive: sku.isActive,
      createdAt: sku.createdAt,
      updatedAt: sku.updatedAt,
      images: sku.images?.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        position: img.position,
        createdAt: img.createdAt,
      })),
    };
  }
}
