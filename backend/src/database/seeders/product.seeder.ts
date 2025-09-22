import { PrismaClient } from '@prisma/client';
import { ImageKitService } from '../../common/services/imagekit.service';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const imageKit = new ImageKitService();

const dolomiteMetallicImageFiles = [
  '95426-50_DIVERGE-COMP-DLMMET-ORGZST_D1-POV.webp',
  '95426-50_DIVERGE-COMP-DLMMET-ORGZST_D3-HT.webp',
  '95426-50_DIVERGE-COMP-DLMMET-ORGZST_FDSQ.webp',
  '95426-50_DIVERGE-COMP-DLMMET-ORGZST_HERO-PDP.webp',
  '95426-50_DIVERGE-COMP-DLMMET-ORGZST_RDSQ.webp',
];

const laurelGreenMetallicImageFiles = [
  '95426-53_DIVERGE-COMP-LRLGRNMET-GLDPRL-DLMMET_D1-POV.webp',
  '95426-53_DIVERGE-COMP-LRLGRNMET-GLDPRL-DLMMET_D3-HT.webp',
  '95426-53_DIVERGE-COMP-LRLGRNMET-GLDPRL-DLMMET_FDSQ.webp',
  '95426-53_DIVERGE-COMP-LRLGRNMET-GLDPRL-DLMMET_HERO-PDP.webp',
  '95426-53_DIVERGE-COMP-LRLGRNMET-GLDPRL-DLMMET_RDSQ.webp',
];

async function uploadDolomiteImages() {
  const uploadPromises = dolomiteMetallicImageFiles.map(async (filename) => {
    const filePath = path.resolve(
      __dirname,
      './bike/Dolomite-Metallic',
      filename,
    );
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
      folder: 'products/diverge-comp-carbon/dolomite-metallic',
    });
    return result.url;
  });
  return Promise.all(uploadPromises);
}

async function uploadLaurelGreenImages() {
  const uploadPromises = laurelGreenMetallicImageFiles.map(async (filename) => {
    const filePath = path.resolve(
      __dirname,
      './bike/Laurel-Green-Metallic',
      filename,
    );
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
      folder: 'products/diverge-comp-carbon/laurel-green-metallic',
    });
    return result.url;
  });
  return Promise.all(uploadPromises);
}

export async function seedProducts() {
  console.log('🌱 Clearing existing products...');

  // Clear all existing products
  await prisma.product.deleteMany({});
  console.log('✅ All products cleared');

  console.log('🌱 Seeding Diverge 4 Comp Carbon product...');

  // Upload images for both variants
  const dolomiteImages = await uploadDolomiteImages();
  const laurelGreenImages = await uploadLaurelGreenImages();

  // Find or create bikes category
  const categorySlug = 'bikes';
  let category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Bikes',
        slug: categorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Bikes');
  }

  // Create Diverge 4 Comp Carbon product
  const productSlug = 'diverge-4-comp-carbon';
  const productExists = await prisma.product.findUnique({
    where: { slug: productSlug },
  });

  if (!productExists) {
    await prisma.product.create({
      data: {
        name: 'Diverge 4 Comp Carbon',
        slug: productSlug,
        description:
          'Gravel adventure to gravel race—unmatched speed, unrivaled capability, total confidence. SRAM Apex AXS/S1000. Part No.: 95426-5356',
        shortDesc:
          'Gravel adventure to gravel race—unmatched speed, unrivaled capability',
        coverImage: dolomiteImages[3], // Using HERO-PDP image as cover
        isFeatured: true,
        metaTitle: 'Diverge 4 Comp Carbon - Gravel Bike',
        metaDesc:
          'Shop Diverge 4 Comp Carbon gravel bike with SRAM Apex AXS/S1000, available in multiple sizes and colors.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: category.id },
        },
        variants: {
          create: [
            {
              name: 'Dolomite Metallic',
              attributes: { color: 'Dolomite Metallic' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: Array.from({ length: 7 }, (_, i) => {
                  const size = 49 + i * 2; // Sizes 49, 51, 53, 55, 57, 59, 61
                  return {
                    sku: `DIVERGE-COMP-DOLOMITE-${size}`,
                    price: 4199.99,
                    stock: 5,
                    weight: 9500, // Approximate weight in grams for a carbon gravel bike
                    dimensions: {
                      length: 180,
                      width: 60,
                      height: 110,
                      size: size,
                    },
                    coverImage: dolomiteImages[3],
                    lowStockAlert: 1,
                    isActive: true,
                    images: {
                      create: dolomiteImages.map((url, idx) => ({
                        url,
                        altText: `Diverge 4 Comp Carbon Dolomite Metallic size ${size} view ${idx + 1}`,
                        position: idx,
                      })),
                    },
                  };
                }),
              },
            },
            {
              name: 'Laurel Green Metallic',
              attributes: { color: 'Laurel Green Metallic' },
              isActive: true,
              sortOrder: 1,
              skus: {
                create: Array.from({ length: 7 }, (_, i) => {
                  const size = 49 + i * 2; // Sizes 49, 51, 53, 55, 57, 59, 61
                  return {
                    sku: `DIVERGE-COMP-LAUREL-${size}`,
                    price: 4199.99,
                    stock: 5,
                    weight: 9500,
                    dimensions: {
                      length: 180,
                      width: 60,
                      height: 110,
                      size: size,
                    },
                    coverImage: laurelGreenImages[3],
                    lowStockAlert: 1,
                    isActive: true,
                    images: {
                      create: laurelGreenImages.map((url, idx) => ({
                        url,
                        altText: `Diverge 4 Comp Carbon Laurel Green Metallic size ${size} view ${idx + 1}`,
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
    console.log('✅ Created product: Diverge 4 Comp Carbon');
  }

  console.log('✅ Product seeding complete');
}
