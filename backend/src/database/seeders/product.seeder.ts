import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced camera system and titanium design',
    shortDesc: 'Premium smartphone with titanium build',
    coverImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
    isFeatured: true,
    metaTitle: 'iPhone 15 Pro - Premium Smartphone',
    metaDesc: 'Discover the iPhone 15 Pro with titanium design and advanced camera',
    categorySlug: 'smartphones',
    variants: [
      {
        name: '128GB - Natural Titanium',
        attributes: { storage: '128GB', color: 'Natural Titanium' },
        skus: [
          {
            sku: 'IPHONE15PRO-128-NAT',
            price: 999.00,
            comparePrice: 1099.00,
            stock: 50,
            weight: 187,
            dimensions: { length: 146.6, width: 70.6, height: 8.25 },
            coverImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
                altText: 'iPhone 15 Pro front view',
                position: 0,
              },
              {
                url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=800&fit=crop',
                altText: 'iPhone 15 Pro back view',
                position: 1,
              },
            ],
          },
        ],
      },
      {
        name: '256GB - Natural Titanium',
        attributes: { storage: '256GB', color: 'Natural Titanium' },
        skus: [
          {
            sku: 'IPHONE15PRO-256-NAT',
            price: 1099.00,
            comparePrice: 1199.00,
            stock: 30,
            weight: 187,
            dimensions: { length: 146.6, width: 70.6, height: 8.25 },
            coverImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
                altText: 'iPhone 15 Pro 256GB front view',
                position: 0,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling wireless headphones with crystal clear hands-free calling',
    shortDesc: 'Premium noise-canceling headphones',
    coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    isFeatured: true,
    metaTitle: 'Sony WH-1000XM5 - Premium Noise Canceling Headphones',
    metaDesc: 'Experience superior sound quality with Sony WH-1000XM5 noise canceling headphones',
    categorySlug: 'audio',
    variants: [
      {
        name: 'Black',
        attributes: { color: 'Black' },
        skus: [
          {
            sku: 'SONY-WH1000XM5-BLK',
            price: 399.99,
            comparePrice: 449.99,
            stock: 25,
            weight: 250,
            dimensions: { length: 254, width: 203, height: 76 },
            coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
                altText: 'Sony WH-1000XM5 Black headphones',
                position: 0,
              },
              {
                url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800&h=800&fit=crop',
                altText: 'Sony WH-1000XM5 Black side view',
                position: 1,
              },
            ],
          },
        ],
      },
      {
        name: 'Silver',
        attributes: { color: 'Silver' },
        skus: [
          {
            sku: 'SONY-WH1000XM5-SLV',
            price: 399.99,
            comparePrice: 449.99,
            stock: 20,
            weight: 250,
            dimensions: { length: 254, width: 203, height: 76 },
            coverImage: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
                altText: 'Sony WH-1000XM5 Silver headphones',
                position: 0,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'MacBook Air M2',
    description: 'Supercharged by M2 chip, the redesigned MacBook Air is more portable than ever',
    shortDesc: 'Lightweight laptop with M2 chip',
    coverImage: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
    isFeatured: false,
    metaTitle: 'MacBook Air M2 - Lightweight Performance',
    metaDesc: 'Experience the power of M2 chip in the ultra-portable MacBook Air',
    categorySlug: 'laptops',
    variants: [
      {
        name: '8GB RAM, 256GB SSD - Midnight',
        attributes: { ram: '8GB', storage: '256GB SSD', color: 'Midnight' },
        skus: [
          {
            sku: 'MBA-M2-8-256-MID',
            price: 1199.00,
            comparePrice: 1299.00,
            stock: 15,
            weight: 1240,
            dimensions: { length: 304.1, width: 215, height: 11.3 },
            coverImage: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&h=600&fit=crop',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
                altText: 'MacBook Air M2 Midnight',
                position: 0,
              },
              {
                url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
                altText: 'MacBook Air M2 open view',
                position: 1,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Classic Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt perfect for everyday wear',
    shortDesc: 'Comfortable everyday cotton tee',
    coverImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    isFeatured: false,
    metaTitle: 'Classic Cotton T-Shirt - Comfortable Everyday Wear',
    metaDesc: 'High-quality cotton t-shirt for casual comfort and style',
    categorySlug: 'mens-clothing',
    variants: [
      {
        name: 'Small - White',
        attributes: { size: 'S', color: 'White' },
        skus: [
          {
            sku: 'TSHIRT-COT-S-WHT',
            price: 24.99,
            stock: 100,
            weight: 150,
            coverImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
                altText: 'White cotton t-shirt',
                position: 0,
              },
            ],
          },
        ],
      },
      {
        name: 'Medium - Black',
        attributes: { size: 'M', color: 'Black' },
        skus: [
          {
            sku: 'TSHIRT-COT-M-BLK',
            price: 24.99,
            stock: 110,
            weight: 160,
            coverImage: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=600&fit=crop',
            images: [
              {
                url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=800&fit=crop',
                altText: 'Black cotton t-shirt',
                position: 0,
              },
            ],
          },
        ],
      },
    ],
  },
];

export async function seedProducts() {
  console.log('🌱 Seeding products...');

  for (const productData of sampleProducts) {
    // Find the category
    const category = await prisma.category.findUnique({
      where: { slug: productData.categorySlug },
    });

    if (!category) {
      console.warn(`⚠️ Category ${productData.categorySlug} not found, skipping product ${productData.name}`);
      continue;
    }

    // Check if product already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') },
    });

    if (existingProduct) {
      console.log(`ℹ️ Product ${productData.name} already exists, skipping...`);
      continue;
    }

    // Create product with variants and SKUs
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: productData.description,
        shortDesc: productData.shortDesc,
        coverImage: productData.coverImage,
        isFeatured: productData.isFeatured,
        metaTitle: productData.metaTitle,
        metaDesc: productData.metaDesc,
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: category.id },
        },
        variants: {
          create: productData.variants.map((variant, variantIndex) => ({
            name: variant.name,
            attributes: variant.attributes,
            isActive: true,
            sortOrder: variantIndex,
            skus: {
              create: variant.skus.map(sku => ({
                sku: sku.sku,
                price: sku.price,
                comparePrice: sku.comparePrice,
                stock: sku.stock,
                weight: sku.weight,
                dimensions: sku.dimensions,
                coverImage: sku.coverImage,
                lowStockAlert: 5,
                isActive: true,
                images: sku.images ? {
                  create: sku.images.map(image => ({
                    url: image.url,
                    altText: image.altText,
                    position: image.position,
                  })),
                } : undefined,
              })),
            },
          })),
        },
      },
    });

    console.log(`✅ Created product: ${product.name} with ${productData.variants.length} variants`);
  }

  console.log('✅ Products seeded successfully');
}
