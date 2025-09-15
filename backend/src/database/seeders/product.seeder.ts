import { PrismaClient } from '../../../generated/prisma';
import { ImageKitService } from '../../common/services/imagekit.service';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const imageKit = new ImageKitService();

const sneakerImageFiles = [
  '36d9d2a2-7b23-4af3-b921-683f45ce5788.webp',
  '50aa8a1d-d966-4c7c-946a-7e0cc990aaa3.webp',
  'ac3faf28-e6fa-46c8-9aae-dd8ac84eddb7.webp',
  'd7a66636-3b7d-4a32-a930-7eaf44cc5982.webp',
];

async function uploadImages() {
  const uploadPromises = sneakerImageFiles.map(async (filename) => {
    const filePath = path.resolve(__dirname, './img-product', filename);
    const buffer = fs.readFileSync(filePath);
    const file: any = {
      buffer,
      originalname: filename,
      mimetype: 'image/webp',
      size: buffer.length,
    };
    const result = await imageKit.uploadImage(file, {
      fileName: filename,
      folder: 'products/new-balance-530',
    });
    return result.url;
  });
  return Promise.all(uploadPromises);
}

// Upload Bona Leggings images
const bonaImageFiles = [
  'ba39a749-04d9-4b98-8cb6-78a9c5786104.webp',
  'c4417f39-b6ef-46fe-b311-89e06b4a2971.webp',
  'dda3eeff-5ea0-436d-9612-c5bc54836dc1.webp',
];
async function uploadBonaImages() {
  const uploadPromises = bonaImageFiles.map(async (filename) => {
    const filePath = path.resolve(__dirname, './bona', filename);
    const buffer = fs.readFileSync(filePath);
    const file: any = {
      buffer,
      originalname: filename,
      mimetype: 'image/webp',
      size: buffer.length,
    };
    const result = await imageKit.uploadImage(file, {
      fileName: filename,
      folder: 'products/bona-leggings',
    });
    return result.url;
  });
  return Promise.all(uploadPromises);
}

export async function uploadEllaImages() {
  const ellaImageFiles = [
    '7787aba3-fced-4718-ab9b-e913d4b4e162.webp',
    '9cc025a6-3064-42a0-ad25-adf420d53b27.webp',
    'b879e6b5-85e5-4bd8-86ce-9bb87673dc92.webp',
    'f0c00c86-11df-46e5-a7ba-3ae36f565437.webp',
  ];
  const uploadPromises = ellaImageFiles.map(async (filename) => {
    const filePath = path.resolve(__dirname, './ella', filename);
    const buffer = fs.readFileSync(filePath);
    const file: any = {
      buffer,
      originalname: filename,
      mimetype: 'image/webp',
      size: buffer.length,
    };
    const result = await imageKit.uploadImage(file, {
      fileName: filename,
      folder: 'products/ella',
    });
    return result.url;
  });
  return Promise.all(uploadPromises);
}

export async function seedProducts() {
  console.log('🌱 Seeding products...');

  // Remove deletion of all products and related data

  // Upload images and get URLs for existing products
  const sneakerImages = await uploadImages();
  const bonaImages = await uploadBonaImages();
  const ellaImages = await uploadEllaImages();

  // Find or create categories
  const categorySlug = 'sneakers';
  let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Sneakers',
        slug: categorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Sneakers');
  }

  const leggingsCategorySlug = 'leggings';
  let leggingsCategory = await prisma.category.findUnique({ where: { slug: leggingsCategorySlug } });
  if (!leggingsCategory) {
    leggingsCategory = await prisma.category.create({
      data: {
        name: 'Leggings',
        slug: leggingsCategorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Leggings');
  }

  const shortsCategorySlug = 'shorts';
  let shortsCategory = await prisma.category.findUnique({ where: { slug: shortsCategorySlug } });
  if (!shortsCategory) {
    shortsCategory = await prisma.category.create({
      data: {
        name: 'Shorts',
        slug: shortsCategorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Shorts');
  }

  // Create products only if not exists
  const sneakerExists = await prisma.product.findUnique({ where: { slug: 'new-balance-530-sneakers' } });
  if (!sneakerExists) {
    await prisma.product.create({
      data: {
        name: 'New Balance 530 Sneakers',
        slug: 'new-balance-530-sneakers',
        description: 'Classic New Balance 530 sneakers in blue, available in multiple sizes.',
        shortDesc: 'Blue New Balance 530 sneakers',
        coverImage: sneakerImages[0],
        isFeatured: true,
        metaTitle: 'New Balance 530 Sneakers - Blue',
        metaDesc: 'Shop New Balance 530 sneakers in blue, sizes 38-42.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: category.id },
        },
        variants: {
          create: [{
            name: 'Blue',
            attributes: { color: 'Blue' },
            isActive: true,
            sortOrder: 0,
            skus: {
              create: [38, 39, 40, 41, 42].map((size, idx) => ({
                sku: `NB530-BLUE-${size}`,
                price: 120.00,
                stock: 10,
                weight: 350,
                dimensions: { length: 30, width: 20, height: 12, size },
                coverImage: sneakerImages[idx % sneakerImages.length],
                lowStockAlert: 2,
                isActive: true,
                images: {
                  create: [
                    {
                      url: sneakerImages[idx % sneakerImages.length],
                      altText: `New Balance 530 Blue size ${size}`,
                      position: 0,
                    },
                  ],
                },
              })),
            },
          }],
        },
      },
    });
    console.log('✅ Created product: New Balance 530 Sneakers');
  }

  const bonaExists = await prisma.product.findUnique({ where: { slug: 'bona-fide-premium-leggings' } });
  if (!bonaExists) {
    await prisma.product.create({
      data: {
        name: 'Bona Fide Premium Quality Leggings for Women with Unique Design and Push Up - High Waisted Tummy Control Legging',
        slug: 'bona-fide-premium-leggings',
        description: 'Premium quality leggings for women with unique design, push up effect, and high waisted tummy control.',
        shortDesc: 'High waisted, tummy control, push up leggings',
        coverImage: bonaImages[0],
        isFeatured: true,
        metaTitle: 'Bona Fide Premium Leggings - Black',
        metaDesc: 'Shop Bona Fide premium quality leggings for women, black color, unique design.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: leggingsCategory.id },
        },
        variants: {
          create: [{
            name: 'Black',
            attributes: { color: 'Black' },
            isActive: true,
            sortOrder: 0,
            skus: {
              create: [{
                sku: 'BONA-BLACK-ONE',
                price: 49.99,
                stock: 50,
                weight: 250,
                dimensions: { length: 90, width: 30, height: 2 },
                coverImage: bonaImages[0],
                lowStockAlert: 5,
                isActive: true,
                images: {
                  create: bonaImages.map((url, idx) => ({
                    url,
                    altText: `Bona Fide Leggings Black view ${idx + 1}`,
                    position: idx,
                  })),
                },
              }],
            },
          }],
        },
      },
    });
    console.log('✅ Created product: Bona Fide Premium Leggings');
  }

  // Add ELLA product
  const ellaExists = await prisma.product.findUnique({ where: { slug: 'ella-sculpt-high-waisted-shorts' } });
  if (!ellaExists) {
    await prisma.product.create({
      data: {
        name: 'ELLA Sculpt High-Waisted Shorts',
        slug: 'ella-sculpt-high-waisted-shorts',
        description: 'Sculpting high-waisted shorts for women, perfect for workouts and everyday wear.',
        shortDesc: 'High-waisted sculpt shorts',
        coverImage: ellaImages[0],
        isFeatured: true,
        metaTitle: 'ELLA Sculpt High-Waisted Shorts',
        metaDesc: 'Shop ELLA sculpt high-waisted shorts for women.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: shortsCategory.id },
        },
        variants: {
          create: [{
            name: 'Black',
            attributes: { color: 'Black' },
            isActive: true,
            sortOrder: 0,
            skus: {
              create: [{
                sku: 'ELLA-BLACK-ONE',
                price: 39.99,
                stock: 30,
                weight: 200,
                dimensions: { length: 60, width: 25, height: 2 },
                coverImage: ellaImages[0],
                lowStockAlert: 5,
                isActive: true,
                images: {
                  create: ellaImages.map((url, idx) => ({
                    url,
                    altText: `ELLA Shorts Black view ${idx + 1}`,
                    position: idx,
                  })),
                },
              }],
            },
          }],
        },
      },
    });
    console.log('✅ Created product: ELLA Sculpt High-Waisted Shorts');
  }

  console.log('✅ Products seeded successfully');
}
