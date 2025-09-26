// backend/src/database/seeders/seedProducts.ts
import { PrismaClient } from '@prisma/client';
import { ImageKitService } from '../../common/services/imagekit.service';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const imageKit = new ImageKitService();

// === IMAGE LISTS FOR PRODUCTS ===
const newBalanceImages = [
  '36d9d2a2-7b23-4af3-b921-683f45ce5788.webp',
  '50aa8a1d-d966-4c7c-946a-7e0cc990aaa3.webp',
  'ac3faf28-e6fa-46c8-9aae-dd8ac84eddb7.webp',
  'd7a66636-3b7d-4a32-a930-7eaf44cc5982.webp',
];

const bonaGoldStandardImages = [
  '0540e5cc-c062-41da-b16b-6fabddc3d817.webp',
  '203fbdc4-d645-4ae9-8f2b-1549079c24ab.webp',
  '4b68619d-1870-4c92-a1fb-9ef6a3eb220f.webp',
  '4bdcc243-e725-4521-b1c0-b409b05470d3.webp',
  '794fac48-7363-40c7-8b26-c9eaf21c1c98.webp',
  'a8df6955-0ea6-4f20-be3c-f718cc25a7c1.webp',
  'a95374c1-f516-43e9-b855-e635ebdd72a1.webp',
  'a9914a1f-042b-42b2-ac46-39e3ff2a6121.webp',
  'b3394886-6837-4efd-83aa-d98a669b2a81.webp',
];

const bonaTightsBlackImages = [
  '170cd7c9-0932-42cd-b72c-8b5bf40250b8.webp',
  '5041a482-95c8-4657-9221-13b227b06f09.webp',
  '562dd6ef-cd0f-4ed3-b2c6-83f85b3692a7.webp',
  'b8eb42cd-69a0-4aec-ac7b-8d3ed0db7a9a.webp',
  'f88d2459-065c-4555-9ffd-df38ffdee6c4.webp',
];

const dolceLightBlueImages = [
  '9267.jpg',
  'Dolce_gabbana_light_blue_eau_intense_f_1024x1024_2x_4fc67335-6f0b-4e66-9773-6512fc891e5b.webp',
  'Dolce_gabbana_light_blue_eau_intense_f_1024x1024_2x_4fc67335-6f0b-4e66-9773-6512fc891e5b (1).webp',
  'dolce-gabbana-light-blue-eau-intense-homme-a1_1024x1024_2x_6177b987-27e0-45c8-9fcb-2b41620b7189.webp',
];

// === HELPERS ===
async function uploadImages(imageFiles: string[], folder: string) {
  const uploadPromises = imageFiles.map(async (filename) => {
    const filePath = path.resolve(__dirname, folder, filename);
    const buffer = fs.readFileSync(filePath);

    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: filename.endsWith('.jpg') ? 'image/jpeg' : 'image/webp',
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

// === MAIN SEED FUNCTION ===
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

  // === BONA FIDE LEGGINGS ===
  console.log('✨ Seeding Bona Fide Leggings...');

  const womensCategorySlug = 'womens';
  let womensCategory = await prisma.category.findUnique({
    where: { slug: womensCategorySlug },
  });

  if (!womensCategory) {
    womensCategory = await prisma.category.create({
      data: {
        name: "Women's",
        slug: womensCategorySlug,
        isActive: true,
      },
    });
    console.log("✅ Created category: Women's");
  }

  const bonaSlug = 'bona-fide-premium-leggings';
  const bonaExists = await prisma.product.findUnique({
    where: { slug: bonaSlug },
  });

  if (!bonaExists) {
    const bonaGoldImages = await uploadImages(
      bonaGoldStandardImages,
      './bona/Bona-GoldStandard-Black',
    );
    const bonaTightsImages = await uploadImages(
      bonaTightsBlackImages,
      './bona/Bona-Tights-Black',
    );

    const sizes = ['XS', 'S', 'M', 'L'];

    await prisma.product.create({
      data: {
        name: 'Bona Fide Premium Leggings',
        slug: bonaSlug,
        description:
          'Bona Fide Premium Quality Leggings for Women with Unique Design and Push Up - High Waisted Tummy Control Legging. Country of Origin: Russia.',
        shortDesc:
          'High-waisted, push-up leggings with unique design and tummy control.',
        coverImage: bonaGoldImages[0],
        isFeatured: true,
        metaTitle: 'Bona Fide Leggings - Premium Push Up Tights',
        metaDesc:
          'Shop Bona Fide Premium Quality Leggings for women. High-waisted, tummy control, and push-up design. Available in multiple colors and sizes.',
        isActive: true,
        sortOrder: 1,
        categories: {
          connect: { id: womensCategory.id },
        },
        variants: {
          create: [
            {
              name: 'Gold Standard Black',
              attributes: { color: 'Black/Gold' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: sizes.map((size, i) => ({
                  sku: `BONA-GLD-BLK-${size}`,
                  price: 120,
                  stock: 10,
                  weight: 350,
                  dimensions: {
                    length: 30,
                    width: 20,
                    height: 5,
                    size: size,
                  },
                  coverImage: bonaGoldImages[0],
                  lowStockAlert: 2,
                  isActive: true,
                  images: {
                    create: bonaGoldImages.map((url, idx) => ({
                      url,
                      altText: `Bona Fide Gold Standard Leggings Black size ${size} view ${idx + 1}`,
                      position: idx,
                    })),
                  },
                })),
              },
            },
            {
              name: 'Tights Black',
              attributes: { color: 'Black' },
              isActive: true,
              sortOrder: 1,
              skus: {
                create: sizes.map((size, i) => ({
                  sku: `BONA-TIGHTS-BLK-${size}`,
                  price: 120,
                  stock: 10,
                  weight: 350,
                  dimensions: {
                    length: 30,
                    width: 20,
                    height: 5,
                    size: size,
                  },
                  coverImage: bonaTightsImages[0],
                  lowStockAlert: 2,
                  isActive: true,
                  images: {
                    create: bonaTightsImages.map((url, idx) => ({
                      url,
                      altText: `Bona Fide Tights Black size ${size} view ${idx + 1}`,
                      position: idx,
                    })),
                  },
                })),
              },
            },
          ],
        },
      },
    });

    console.log('✅ Created product: Bona Fide Premium Leggings');
  }

  // === DOLCE & GABBANA LIGHT BLUE EAU INTENSE HOMME ===
  console.log('✨ Seeding Dolce & Gabbana Light Blue Eau Intense Homme...');

  const perfumeCategorySlug = 'perfumes';
  let perfumeCategory = await prisma.category.findUnique({
    where: { slug: perfumeCategorySlug },
  });

  if (!perfumeCategory) {
    perfumeCategory = await prisma.category.create({
      data: {
        name: 'Perfumes',
        slug: perfumeCategorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Perfumes');
  }

  const dolceSlug = 'dolce-gabbana-light-blue-eau-intense-homme';
  const dolceExists = await prisma.product.findUnique({
    where: { slug: dolceSlug },
  });

  if (!dolceExists) {
    const dolceImages = await uploadImages(
      dolceLightBlueImages,
      './DOLCE-GABBANA-LIGHT-BLUE-EAU-INTENSE-HOMME',
    );

    await prisma.product.create({
      data: {
        name: 'Dolce & Gabbana Light Blue Eau Intense Homme',
        slug: dolceSlug,
        description:
          'Discover Light Blue Eau Intense Pour Homme, the magnetic masculine fragrance by Dolce & Gabbana. Launched in 2007, it embodies timeless masculine elegance. Crafted by master perfumer Alberto Morillas, this composition balances freshness and sensuality. A woody-aromatic scent with refreshing mandarin and grapefruit, aromatic juniper with a salty aquatic accord, and a base of amber woods and musk. Perfect for men seeking a captivating and original fragrance in Morocco.',
        shortDesc:
          'Woody-aromatic fragrance with citrus, juniper, amber woods, and musk.',
        coverImage: dolceImages[0],
        isFeatured: true,
        metaTitle:
          'Dolce & Gabbana Light Blue Eau Intense Homme - Perfume for Men',
        metaDesc:
          'Shop Dolce & Gabbana Light Blue Eau Intense Homme at Perfume Maroc. Fresh, sensual, and elegant masculine fragrance available in 50ml and 100ml bottles.',
        isActive: true,
        sortOrder: 2,
        categories: {
          connect: { id: perfumeCategory.id },
        },
        variants: {
          create: [
            {
              name: '50ml',
              attributes: { size: '50ml' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: [
                  {
                    sku: 'DG-LIGHT-BLUE-50ML',
                    price: 549,
                    stock: 20,
                    weight: 400,
                    dimensions: {
                      length: 12,
                      width: 6,
                      height: 18,
                      size: '50ml',
                    },
                    coverImage: dolceImages[0],
                    lowStockAlert: 2,
                    isActive: true,
                    images: {
                      create: dolceImages.map((url, idx) => ({
                        url,
                        altText: `Dolce & Gabbana Light Blue Eau Intense Homme 50ml view ${idx + 1}`,
                        position: idx,
                      })),
                    },
                  },
                ],
              },
            },
            {
              name: '100ml',
              attributes: { size: '100ml' },
              isActive: true,
              sortOrder: 1,
              skus: {
                create: [
                  {
                    sku: 'DG-LIGHT-BLUE-100ML',
                    price: 1100,
                    stock: 15,
                    weight: 600,
                    dimensions: {
                      length: 15,
                      width: 8,
                      height: 20,
                      size: '100ml',
                    },
                    coverImage: dolceImages[0],
                    lowStockAlert: 2,
                    isActive: true,
                    images: {
                      create: dolceImages.map((url, idx) => ({
                        url,
                        altText: `Dolce & Gabbana Light Blue Eau Intense Homme 100ml view ${idx + 1}`,
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

    console.log(
      '✅ Created product: Dolce & Gabbana Light Blue Eau Intense Homme',
    );
  }

  console.log('🎉 Product seeding complete');
}
