import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedPublicProductsResponseDto, ProductDetailsDto, PublicProductDetailDto, PublicProductQueryDto, PublicProductSummaryDto } from '../dto/public-products.dto';

@Injectable()
export class PublicProductsService {
  constructor(private prisma: PrismaService) {}


  async getLatestProducts(
    query: PublicProductQueryDto,
  ): Promise<PaginatedPublicProductsResponseDto> {
    const {
      page = 1,
      limit = 12,
      search,
      categorySlug,
      isFeatured,
      minPrice,
      maxPrice,
      inStock = true,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDesc: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (categorySlug) {
      where.categories = {
        some: {
          slug: categorySlug,
          isActive: true,
        },
      };
    }

    // Featured filter
    if (typeof isFeatured === 'boolean') {
      where.isFeatured = isFeatured;
    }

    // Stock filter
    if (inStock) {
      where.variants = {
        some: {
          isActive: true,
          skus: {
            some: {
              isActive: true,
              stock: { gt: 0 },
            },
          },
        },
      };
    }

    // Price filter - this is more complex as we need to check SKU prices
    const priceFilter: any = {};
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.variants = {
        some: {
          isActive: true,
          skus: {
            some: {
              isActive: true,
              ...(minPrice !== undefined && { price: { gte: minPrice } }),
              ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
              ...(inStock && { stock: { gt: 0 } }),
            },
          },
        },
      };
    }

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortOrder };
        break;
      case 'price':
        // For price sorting, we'll sort by the minimum price of active SKUs
        // This requires a more complex query, we'll handle it in the service
        orderBy = { createdAt: sortOrder }; // Fallback for now
        break;
      case 'featured':
        orderBy = [{ isFeatured: 'desc' }, { createdAt: sortOrder }];
        break;
      default:
        orderBy = { [sortBy]: sortOrder };
    }

    // Execute query
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          categories: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            where: { isActive: true },
            include: {
              skus: {
                where: { isActive: true },
                select: {
                  id: true,
                  price: true,
                  sku: true, // 👈 add this
                  comparePrice: true,
                  stock: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const transformedProducts: PublicProductSummaryDto[] = products.map(
      (product) => {
        const allSKUs = product.variants.flatMap((variant) => variant.skus);
        const activeSKUs = allSKUs.filter((sku) => sku.stock > 0);

        const prices = allSKUs.map((sku) => Number(sku.price));
        const comparePrices = allSKUs
          .map((sku) => (sku.comparePrice ? Number(sku.comparePrice) : null))
          .filter((price) => price !== null);

        const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const comparePrice =
          comparePrices.length > 0 ? Math.min(...comparePrices) : undefined;
        const inStockStatus = activeSKUs.length > 0;

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          shortDesc: product.shortDesc ?? undefined,
          coverImage: product.coverImage ?? undefined,
          isFeatured: product.isFeatured,
          startingPrice,
          comparePrice,
          inStock: inStockStatus,
          categories: product.categories,
          createdAt: product.createdAt,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name ?? '',
            skus: variant.skus.map((sku) => ({
              id: sku.id,
              sku: sku.sku,
              price: Number(sku.price),
              comparePrice: sku.comparePrice
                ? Number(sku.comparePrice)
                : undefined,
              stock: sku.stock,
            })),
          })),
        };
      },
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: transformedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async getPublicProductDetails(slug: string): Promise<ProductDetailsDto> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        categories: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          include: {
            skus: {
              include: { images: true },
            },
          },
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // --- Transform Variants & SKUs ---
    const transformedVariants = product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name ?? '',
      attributes: typeof variant.attributes === 'object' && variant.attributes !== null ? variant.attributes as Record<string, any> : {},
      skus: variant.skus.map((sku) => ({
        id: sku.id,
        sku: sku.sku,
        price: Number(sku.price), // 👈 convert Decimal to number
        stock: sku.stock,
        dimensions: typeof sku.dimensions === 'object' && sku.dimensions !== null ? sku.dimensions as Record<string, any> : {},
        coverImage: sku.coverImage ?? undefined,
        images: sku.images.map((img) => img.url),
        createdAt: sku.createdAt,
        updatedAt: sku.updatedAt,
      })),
    }));

    // --- Compute Stock & Pricing ---
    const allSkus = product.variants.flatMap((v) => v.skus);
    const inStock = allSkus.some((sku) => sku.stock > 0);
    const totalStock = allSkus.reduce((sum, sku) => sum + sku.stock, 0);
    const prices = allSkus.map((sku) => Number(sku.price));
    const startingPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const priceRange: [number, number] | undefined =
      startingPrice !== maxPrice ? [startingPrice, maxPrice] : undefined;

    // --- Compute Average Rating ---
    const avgRating = product.reviews.length
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0;

    // --- Return DTO ---
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description ?? undefined,
      shortDesc: product.shortDesc ?? undefined,
      coverImage: product.coverImage ?? undefined,
      isFeatured: product.isFeatured,
      metaTitle: product.metaTitle ?? undefined,
      metaDesc: product.metaDesc ?? undefined,
      categories: product.categories,
      variants: transformedVariants,
      startingPrice,
      priceRange,
      inStock,
      totalStock,
      avgRating,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async getBestProducts(
  query: PublicProductQueryDto,
): Promise<PaginatedPublicProductsResponseDto> {
  const {
    page = 1,
    limit = 12,
    search,
    categorySlug,
    inStock = true,
  } = query;

  const skip = (page - 1) * limit;

  // Build base where clause
  const where: any = {
    isActive: true,
    deletedAt: null,
  };

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortDesc: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Category filter
  if (categorySlug) {
    where.categories = {
      some: { slug: categorySlug, isActive: true },
    };
  }

  // Stock filter
  if (inStock) {
    where.variants = {
      some: {
        isActive: true,
        skus: { some: { isActive: true, stock: { gt: 0 } } },
      },
    };
  }

  // Fetch products with reviews
  const products = await this.prisma.product.findMany({
    where,
    include: {
      categories: { where: { isActive: true }, select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        include: {
          skus: { where: { isActive: true }, select: { id: true, sku: true, price: true, comparePrice: true, stock: true } },
        },
      },
      reviews: { select: { rating: true } },
    },
  });

  // Compute average rating for sorting
  const productsWithRating = products.map((p) => {
    const avgRating = p.reviews.length
      ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
      : 0;
    return { product: p, avgRating };
  });

  // Sort by rating descending, then by createdAt descending
  productsWithRating.sort((a, b) => {
    if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
    return b.product.createdAt.getTime() - a.product.createdAt.getTime();
  });

  // Pagination
  const paginatedProducts = productsWithRating.slice(skip, skip + limit).map((p) => p.product);
  const total = productsWithRating.length;

  // Transform products same as getLatestProducts
  const transformedProducts: PublicProductSummaryDto[] = paginatedProducts.map((product) => {
    const allSKUs = product.variants.flatMap((v) => v.skus);
    const activeSKUs = allSKUs.filter((sku) => sku.stock > 0);
    const prices = allSKUs.map((sku) => Number(sku.price));
    const comparePrices = allSKUs
      .map((sku) => sku.comparePrice)
      .filter((price) => price !== null && price !== undefined)
      .map((price) => Number(price));
    const startingPrice = prices.length ? Math.min(...prices) : 0;
    const comparePrice = comparePrices.length ? Math.min(...comparePrices) : undefined;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDesc: product.shortDesc ?? undefined,
      coverImage: product.coverImage ?? undefined,
      isFeatured: product.isFeatured,
      startingPrice,
      comparePrice,
      inStock: activeSKUs.length > 0,
      categories: product.categories,
      createdAt: product.createdAt,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name ?? '',
        skus: v.skus.map((sku) => ({
          id: sku.id,
          sku: sku.sku,
          price: Number(sku.price),
          comparePrice: sku.comparePrice ? Number(sku.comparePrice) : undefined,
          stock: sku.stock,
        })),
      })),
    };
  });

  return {
    data: transformedProducts,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}


  
}
