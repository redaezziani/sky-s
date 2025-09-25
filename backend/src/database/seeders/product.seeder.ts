// backend/src/database/seeders/seedProducts.ts
import { PrismaClient } from '@prisma/client';
import { ImageKitService } from '../../common/services/imagekit.service';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const imageKit = new ImageKitService();

const newBalanceImages = [
  '36d9d2a2-7b23-4af3-b921-683f45ce5788.webp',
  '50aa8a1d-d966-4c7c-946a-7e0cc990aaa3.webp',
  'ac3faf28-e6fa-46c8-9aae-dd8ac84eddb7.webp',
  'd7a66636-3b7d-4a32-a930-7eaf44cc5982.webp',
];

async function uploadImages(imageFiles: string[], folder: string) {
  const uploadPromises = imageFiles.map(async (filename) => {
    const filePath = path.resolve(__dirname, folder, filename);
    const buffer = fs.readFileSync(filePath);

    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: 'image/webp',
      size: buffer.length,
      buffer,
      destination: '',
      filename,
      path: filePath,
      stream: undefined as any,
    };

    const result = await imageKit.uploadImage(file, {
      fileName: filename,
      folder: folder.replace('./', 'products/').replace(/\/$/, ''),
    });

    return result.url;
  });

  return Promise.all(uploadPromises);
}

export async function seedProducts() {
  console.log('🌱 Clearing existing products...');
  
  console.log('✅ All products cleared');

  // === NEW BALANCE 530 ===
  console.log('✨ Seeding New Balance 530 Sneakers...');

  const lifestyleCategorySlug = 'lifestyle';
  let lifestyleCategory = await prisma.category.findUnique({
    where: { slug: lifestyleCategorySlug },
  });

  if (!lifestyleCategory) {
    lifestyleCategory = await prisma.category.create({
      data: {
        name: 'Lifestyle',
        slug: lifestyleCategorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Lifestyle');
  }

  const sneakerSlug = 'new-balance-530-sneakers';
  const sneakerExists = await prisma.product.findUnique({
    where: { slug: sneakerSlug },
  });

  if (!sneakerExists) {
    const sneakerImages = await uploadImages(newBalanceImages, './New-Balance');

    await prisma.product.create({
      data: {
        name: 'New Balance 530 Sneakers',
        slug: sneakerSlug,
        description:
          'Unisex lifestyle sneakers with a classic 530 design. Comfortable, stylish, and perfect for everyday wear. Style No: Mr530Sgd',
        shortDesc: 'Unisex lifestyle sneakers in white/blue (110)',
        coverImage: sneakerImages[0],
        isFeatured: true,
        metaTitle: 'New Balance 530 Sneakers - Lifestyle Shoes',
        metaDesc:
          'Shop New Balance 530 Sneakers (Unisex) in sizes 36–44. Comfortable lifestyle shoes in white/blue.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: lifestyleCategory.id },
        },
        variants: {
          create: [
            {
              name: 'White/Blue',
              attributes: { color: 'White/Blue (110)' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: Array.from({ length: 9 }, (_, i) => {
                  const size = 36 + i;
                  return {
                    sku: `NB-530-WHT-BLU-${size}`,
                    price: 550,
                    stock: 15,
                    weight: 900,
                    dimensions: {
                      length: 35,
                      width: 25,
                      height: 15,
                      size: size,
                    },
                    coverImage: sneakerImages[0],
                    lowStockAlert: 2,
                    isActive: true,
                    images: {
                      create: sneakerImages.map((url, idx) => ({
                        url,
                        altText: `New Balance 530 Sneakers White/Blue size ${size} view ${idx + 1}`,
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

    console.log('✅ Created product: New Balance 530 Sneakers');
  }

  console.log('🎉 Product seeding complete');
}
