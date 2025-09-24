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

const trailShieldGlovesImageFiles = {
  black: [
    '67121-450_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-BLK-M_HERO.webp',
    '67121-450_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-BLK-M_PALM.webp',
  ],
  'dove-grey': [
    '67121-453_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-DOVGRY-M_DETAIL1.webp',
    '67121-453_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-DOVGRY-M_FRONT-3-4.webp',
    '67121-453_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-DOVGRY-M_DETAIL2.webp',
    '67121-453_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-DOVGRY-M_HERO.webp',
  ],
  'garnet-red': [
    '67123-452_APP_TRAIL-SHIELD-GLOVE-LF-WMN-GNTRED_BACK.webp',
    '67123-452_APP_TRAIL-SHIELD-GLOVE-LF-WMN-GNTRED_HERO.webp',
  ],
  limestone: [
    '67122-452_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-LMSTN-M_BACK.webp',
    '67122-452_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-LMSTN-M_FRONT-3-4.webp',
    '67122-452_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-LMSTN-M_DETAIL1.webp',
    '67122-452_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-LMSTN-M_HERO.webp',
    '67122-452_GLV_TRAIL-SHIELD-GLOVE-LF-WMN-LMSTN-M_DETAIL2.webp',
  ],
};

const reconShoesImageFiles = {
  black: [
    '61524-3042_SHOE_24_RECON_30_Black_BOTTOM.webp',
    '61524-3042_SHOE_24_RECON_30_Black_MEDIAL.webp',
    '61524-3042_SHOE_24_RECON_30_Black_TOP.webp',
    '61524-3042_SHOE_24_RECON_30_Black_HERO.webp',
    '61524-3042_SHOE_24_RECON_30_Black_PAIR.webp',
  ],
  'deep-orange': [
    '61525-203_SHOE_RECON-30-MTB-SHOE-DPORG_BOTTOM.webp',
    '61525-203_SHOE_RECON-30-MTB-SHOE-DPORG_PAIR.webp',
    '61525-203_SHOE_RECON-30-MTB-SHOE-DPORG_HERO-PDP.webp',
    '61525-203_SHOE_RECON-30-MTB-SHOE-DPORG_TOP.webp',
    '61525-203_SHOE_RECON-30-MTB-SHOE-DPORG_MEDIAL.webp',
  ],
};

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

  // Clear all existing products
  await prisma.product.deleteMany({});
  console.log('✅ All products cleared');

  console.log('🌱 Seeding products...');

  // === DIVERGE 4 COMP CARBON ===
  console.log('✨ Seeding Diverge 4 Comp Carbon...');
  const dolomiteImages = await uploadImages(
    dolomiteMetallicImageFiles,
    './bike/Dolomite-Metallic',
  );
  const laurelGreenImages = await uploadImages(
    laurelGreenMetallicImageFiles,
    './bike/Laurel-Green-Metallic',
  );

  const bikesCategorySlug = 'bikes';
  let bikesCategory = await prisma.category.findUnique({
    where: { slug: bikesCategorySlug },
  });
  if (!bikesCategory) {
    bikesCategory = await prisma.category.create({
      data: {
        name: 'Bikes',
        slug: bikesCategorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Bikes');
  }

  const divergeProductSlug = 'diverge-4-comp-carbon';
  const divergeProductExists = await prisma.product.findUnique({
    where: { slug: divergeProductSlug },
  });

  if (!divergeProductExists) {
    await prisma.product.create({
      data: {
        name: 'Diverge 4 Comp Carbon',
        slug: divergeProductSlug,
        description:
          'Gravel adventure to gravel race—unmatched speed, unrivaled capability, total confidence. SRAM Apex AXS/S1000. Part No.: 95426-5356',
        shortDesc:
          'Gravel adventure to gravel race—unmatched speed, unrivaled capability',
        coverImage: dolomiteImages[3],
        isFeatured: true,
        metaTitle: 'Diverge 4 Comp Carbon - Gravel Bike',
        metaDesc:
          'Shop Diverge 4 Comp Carbon gravel bike with SRAM Apex AXS/S1000, available in multiple sizes and colors.',
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: bikesCategory.id },
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
                  const size = 49 + i * 2;
                  return {
                    sku: `DIVERGE-COMP-DOLOMITE-${size}`,
                    price: 4199.99,
                    stock: 5,
                    weight: 9500,
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
                  const size = 49 + i * 2;
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

  // === WOMEN'S TRAIL SHIELD GLOVES ===
  console.log("✨ Seeding Women's Trail Shield Gloves...");
  const glovesCategorySlug = 'gloves';
  let glovesCategory = await prisma.category.findUnique({
    where: { slug: glovesCategorySlug },
  });
  if (!glovesCategory) {
    glovesCategory = await prisma.category.create({
      data: {
        name: 'Gloves',
        slug: glovesCategorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Gloves');
  }

  const trailShieldGlovesSlug = 'womens-trail-shield-gloves';
  const trailShieldGlovesExists = await prisma.product.findUnique({
    where: { slug: trailShieldGlovesSlug },
  });

  if (!trailShieldGlovesExists) {
    const blackImages = await uploadImages(
      trailShieldGlovesImageFiles.black,
      './Trail-Shield-Gloves/black',
    );
    const doveGreyImages = await uploadImages(
      trailShieldGlovesImageFiles['dove-grey'],
      './Trail-Shield-Gloves/Dove-Grey',
    );
    const garnetRedImages = await uploadImages(
      trailShieldGlovesImageFiles['garnet-red'],
      './Trail-Shield-Gloves/garnet-red',
    );
    const limestoneImages = await uploadImages(
      trailShieldGlovesImageFiles.limestone,
      './Trail-Shield-Gloves/Limestone',
    );

    await prisma.product.create({
      data: {
        name: "Women's Trail Shield Gloves",
        slug: trailShieldGlovesSlug,
        description:
          'Go big and stay protected with the Trail Shield Gloves. Featuring TPU knuckle guards.',
        shortDesc: 'Go big and stay protected with the Trail Shield Gloves.',
        coverImage: blackImages[0],
        isFeatured: false,
        metaTitle: "Women's Trail Shield Gloves - Final Sale",
        metaDesc:
          "Shop Women's Trail Shield Gloves with TPU knuckle guards, available in multiple colors and sizes.",
        isActive: true,
        sortOrder: 1,
        categories: {
          connect: { id: glovesCategory.id },
        },
        variants: {
          create: [
            {
              name: 'Black',
              attributes: { color: 'Black' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
                  sku: `TRAIL-SHIELD-GLOVE-BLK-${size}`,
                  price: 9.95,
                  stock: 10,
                  weight: 100,
                  dimensions: {
                    length: 25,
                    width: 15,
                    height: 5,
                    size: size,
                  },
                  coverImage: blackImages[0],
                  lowStockAlert: 2,
                  isActive: true,
                  images: {
                    create: blackImages.map((url, idx) => ({
                      url,
                      altText: `Women's Trail Shield Gloves Black size ${size} view ${idx + 1}`,
                      position: idx,
                    })),
                  },
                })),
              },
            },
            {
              name: 'Dove Grey',
              attributes: { color: 'Dove Grey' },
              isActive: true,
              sortOrder: 1,
              skus: {
                create: ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
                  sku: `TRAIL-SHIELD-GLOVE-DOVGRY-${size}`,
                  price: 9.95,
                  stock: 10,
                  weight: 100,
                  dimensions: {
                    length: 25,
                    width: 15,
                    height: 5,
                    size: size,
                  },
                  coverImage: doveGreyImages[3],
                  lowStockAlert: 2,
                  isActive: true,
                  images: {
                    create: doveGreyImages.map((url, idx) => ({
                      url,
                      altText: `Women's Trail Shield Gloves Dove Grey size ${size} view ${idx + 1}`,
                      position: idx,
                    })),
                  },
                })),
              },
            },
            {
              name: 'Garnet Red',
              attributes: { color: 'Garnet Red' },
              isActive: true,
              sortOrder: 2,
              skus: {
                create: ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
                  sku: `TRAIL-SHIELD-GLOVE-GNTRED-${size}`,
                  price: 9.95,
                  stock: 10,
                  weight: 100,
                  dimensions: {
                    length: 25,
                    width: 15,
                    height: 5,
                    size: size,
                  },
                  coverImage: garnetRedImages[1],
                  lowStockAlert: 2,
                  isActive: true,
                  images: {
                    create: garnetRedImages.map((url, idx) => ({
                      url,
                      altText: `Women's Trail Shield Gloves Garnet Red size ${size} view ${idx + 1}`,
                      position: idx,
                    })),
                  },
                })),
              },
            },
            {
              name: 'Limestone',
              attributes: { color: 'Limestone' },
              isActive: true,
              sortOrder: 3,
              skus: {
                create: ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
                  sku: `TRAIL-SHIELD-GLOVE-LMSTN-${size}`,
                  price: 9.95,
                  stock: 10,
                  weight: 100,
                  dimensions: {
                    length: 25,
                    width: 15,
                    height: 5,
                    size: size,
                  },
                  coverImage: limestoneImages[3],
                  lowStockAlert: 2,
                  isActive: true,
                  images: {
                    create: limestoneImages.map((url, idx) => ({
                      url,
                      altText: `Women's Trail Shield Gloves Limestone size ${size} view ${idx + 1}`,
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
    console.log("✅ Created product: Women's Trail Shield Gloves");
  }

  // === RECON 3.0 GRAVEL & MOUNTAIN BIKE SHOE ===
  console.log('✨ Seeding Recon 3.0 Gravel & Mountain Bike Shoe...');
  const shoesCategorySlug = 'shoes';
  let shoesCategory = await prisma.category.findUnique({
    where: { slug: shoesCategorySlug },
  });
  if (!shoesCategory) {
    shoesCategory = await prisma.category.create({
      data: {
        name: 'Shoes',
        slug: shoesCategorySlug,
        isActive: true,
      },
    });
    console.log('✅ Created category: Shoes');
  }

  const reconShoesSlug = 'recon-3-0-gravel-mountain-bike-shoe';
  const reconShoesExists = await prisma.product.findUnique({
    where: { slug: reconShoesSlug },
  });

  if (!reconShoesExists) {
    const blackReconImages = await uploadImages(
      reconShoesImageFiles.black,
      './Recon/black',
    );
    const deepOrangeReconImages = await uploadImages(
      reconShoesImageFiles['deep-orange'],
      './Recon/Deep-Orange',
    );

    await prisma.product.create({
      data: {
        name: 'Recon 3.0 Gravel & Mountain Bike Shoe',
        slug: reconShoesSlug,
        description:
          'KOM/QOM chasers, race podium challengers, and all devotees of speed don’t need to sacrifice.',
        shortDesc:
          'KOM/QOM chasers, race podium challengers, and all devotees of speed.',
        coverImage: blackReconImages[3],
        isFeatured: true,
        metaTitle: 'Recon 3.0 Gravel & Mountain Bike Shoe',
        metaDesc:
          'Shop Recon 3.0 Gravel & Mountain Bike Shoe, available in multiple sizes and colors.',
        isActive: true,
        sortOrder: 2,
        categories: {
          connect: { id: shoesCategory.id },
        },
        variants: {
          create: [
            {
              name: 'Black',
              attributes: { color: 'Black' },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: Array.from({ length: 9 }, (_, i) => {
                  const size = 36 + i;
                  return {
                    sku: `RECON-3-0-BLK-${size}`,
                    price: 279.99,
                    stock: 5,
                    weight: 700,
                    dimensions: {
                      length: 35,
                      width: 25,
                      height: 15,
                      size: size,
                    },
                    coverImage: blackReconImages[3],
                    lowStockAlert: 1,
                    isActive: true,
                    images: {
                      create: blackReconImages.map((url, idx) => ({
                        url,
                        altText: `Recon 3.0 Gravel & Mountain Bike Shoe Black size ${size} view ${idx + 1}`,
                        position: idx,
                      })),
                    },
                  };
                }),
              },
            },
            {
              name: 'Deep Orange',
              attributes: { color: 'Deep Orange' },
              isActive: true,
              sortOrder: 1,
              skus: {
                create: Array.from({ length: 9 }, (_, i) => {
                  const size = 36 + i;
                  return {
                    sku: `RECON-3-0-DPORG-${size}`,
                    price: 279.99,
                    stock: 5,
                    weight: 700,
                    dimensions: {
                      length: 35,
                      width: 25,
                      height: 15,
                      size: size,
                    },
                    coverImage: deepOrangeReconImages[2],
                    lowStockAlert: 1,
                    isActive: true,
                    images: {
                      create: deepOrangeReconImages.map((url, idx) => ({
                        url,
                        altText: `Recon 3.0 Gravel & Mountain Bike Shoe Deep Orange size ${size} view ${idx + 1}`,
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
    console.log('✅ Created product: Recon 3.0 Gravel & Mountain Bike Shoe');
  }

  console.log('✅ Product seeding complete');
}
