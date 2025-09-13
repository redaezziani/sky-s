import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

const sampleProducts = [
  {
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced camera system and titanium design',
    shortDesc: 'Premium smartphone with titanium build',
    coverImage: 'https://example.com/images/iphone-15-pro.jpg',
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
          },
        ],
      },
    ],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling wireless headphones with crystal clear hands-free calling',
    shortDesc: 'Premium noise-canceling headphones',
    coverImage: 'https://example.com/images/sony-wh1000xm5.jpg',
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
          },
        ],
      },
    ],
  },
  {
    name: 'MacBook Air M2',
    description: 'Supercharged by M2 chip, the redesigned MacBook Air is more portable than ever',
    shortDesc: 'Lightweight laptop with M2 chip',
    coverImage: 'https://example.com/images/macbook-air-m2.jpg',
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
          },
        ],
      },
      {
        name: '16GB RAM, 512GB SSD - Starlight',
        attributes: { ram: '16GB', storage: '512GB SSD', color: 'Starlight' },
        skus: [
          {
            sku: 'MBA-M2-16-512-STR',
            price: 1499.00,
            comparePrice: 1599.00,
            stock: 10,
            weight: 1240,
            dimensions: { length: 304.1, width: 215, height: 11.3 },
          },
        ],
      },
    ],
  },
  {
    name: 'Classic Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt perfect for everyday wear',
    shortDesc: 'Comfortable everyday cotton tee',
    coverImage: 'https://example.com/images/cotton-tshirt.jpg',
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
          },
        ],
      },
      {
        name: 'Medium - White',
        attributes: { size: 'M', color: 'White' },
        skus: [
          {
            sku: 'TSHIRT-COT-M-WHT',
            price: 24.99,
            stock: 120,
            weight: 160,
          },
        ],
      },
      {
        name: 'Large - White',
        attributes: { size: 'L', color: 'White' },
        skus: [
          {
            sku: 'TSHIRT-COT-L-WHT',
            price: 24.99,
            stock: 80,
            weight: 170,
          },
        ],
      },
      {
        name: 'Small - Black',
        attributes: { size: 'S', color: 'Black' },
        skus: [
          {
            sku: 'TSHIRT-COT-S-BLK',
            price: 24.99,
            stock: 90,
            weight: 150,
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
          },
        ],
      },
      {
        name: 'Large - Black',
        attributes: { size: 'L', color: 'Black' },
        skus: [
          {
            sku: 'TSHIRT-COT-L-BLK',
            price: 24.99,
            stock: 75,
            weight: 170,
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
                lowStockAlert: 5,
                isActive: true,
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
