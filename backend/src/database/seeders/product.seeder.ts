import { PrismaClient } from '../../../generated/prisma';
import { ImageKitService } from '../../common/services/imagekit.service';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const imageKit = new ImageKitService();

const nb9060ImageFiles = [
  '55b4a69c-525c-46e8-93ea-6debcec3a6e7.webp',
  '74337dad-e890-4b3f-99e1-c583451a30e5.webp',
  '9167fe04-9558-4be2-8eb9-45fe94b2e019.webp',
  'bc19fea5-188e-417a-bbc9-cf5de713cca5.webp',
  'c463d4b8-0192-4fea-85d9-a7caab286bfb.webp',
];

const bonaImageFiles = [
  '785a0d84-5ca2-4c75-967f-abc6b84563c2.webp',
  '8cef2f7f-9c18-430d-91ec-32add263709a.webp',
  'b8dfb729-d487-4112-87da-0692271be21c.webp',
  'c76bb525-bee6-4053-9116-1e161b6754e9.webp',
  'ded799b5-aade-49bf-b6a6-01f525467d19.webp',
  'e34e8b21-73cb-44d2-8a4a-9883c2f24cc7.webp',
  'f2b1242f-5d93-4add-9f1a-76ab145bad7e.webp',
];

async function uploadNB9060Images() {
  const uploadPromises = nb9060ImageFiles.map(async (filename) => {
    const filePath = path.resolve(__dirname, './new-balance', filename);
    const buffer = fs.readFileSync(filePath);
    const file: any = {
      buffer,
      originalname: filename,
      mimetype: 'image/webp',
      size: buffer.length,
    };
    const result = await imageKit.uploadImage(file, {
      fileName: filename,
      folder: 'products/new-balance-9060',
    });
    return result.url;
  });
  return Promise.all(uploadPromises);
}

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

export async function seedProducts() {
  console.log('🌱 Seeding New Balance 9060 product...');

  // Optionally clear previous products (uncomment if needed)
  // await prisma.product.deleteMany({});

  // Upload images
  const nb9060Images = await uploadNB9060Images();
  const bonaImages = await uploadBonaImages();

  // Find or create sneakers category
  const categorySlug = 'sneakers';
  let category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });
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

  // Find or create leggings category
  const leggingsCategorySlug = 'leggings';
  let leggingsCategory = await prisma.category.findUnique({
    where: { slug: leggingsCategorySlug },
  });
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

  // Create New Balance 9060 product only
  const productSlug = 'new-balance-9060';
  const productExists = await prisma.product.findUnique({
    where: { slug: productSlug },
  });
  if (!productExists) {
    await prisma.product.create({
      data: {
        name: 'New Balance 9060',
        slug: productSlug,
        description: 'New Balance 9060 in white, available in sizes 38-44.',
        shortDesc: 'White New Balance 9060',
        coverImage: nb9060Images[0],
        isFeatured: true,
        metaTitle: 'New Balance 9060 - White',
        metaDesc: 'Shop New Balance 9060 in white, sizes 38-44.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: category.id },
        },
        variants: {
          create: [
            {
              name: 'White',
              attributes: { color: 'White' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: Array.from({ length: 7 }, (_, i) => {
                  const size = 38 + i;
                  return {
                    sku: `NB9060-WHITE-${size}`,
                    price: 120.0,
                    stock: 10,
                    weight: 350,
                    dimensions: { length: 30, width: 20, height: 12, size },
                    coverImage: nb9060Images[i % nb9060Images.length],
                    lowStockAlert: 2,
                    isActive: true,
                    images: {
                      create: nb9060Images.map((url, idx) => ({
                        url,
                        altText: `New Balance 9060 White size ${size} view ${idx + 1}`,
                        position: idx,
                      })),
                    },
                  };
                }),
              },
            },
          ],
        },
      },
    });
    console.log('✅ Created product: New Balance 9060');
  }

  // Add Bona Fide Premium Quality Leggings product
  const bonaSlug = 'bona-fide-premium-leggings';
  const bonaExists = await prisma.product.findUnique({
    where: { slug: bonaSlug },
  });
  if (!bonaExists) {
    await prisma.product.create({
      data: {
        name: 'Bona Fide Premium Quality Leggings for Women with Unique Design and Push Up - High Waisted Tummy Control Legging',
        slug: bonaSlug,
        description:
          'Premium quality leggings for women with unique design, push up effect, and high waisted tummy control.',
        shortDesc: 'High waisted, tummy control, push up leggings',
        coverImage: bonaImages[0],
        isFeatured: true,
        metaTitle: 'Bona Fide Premium Leggings - Black',
        metaDesc:
          'Shop Bona Fide premium quality leggings for women, black color, unique design.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: leggingsCategory.id },
        },
        variants: {
          create: [
            {
              name: 'Black',
              attributes: { color: 'Black' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: [
                  {
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
                  },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✅ Created product: Bona Fide Premium Leggings');
  }

  console.log('✅ Product seeding complete');
}
