import { PrismaClient } from '../../generated/prisma';
import { seedUsers, clearUsers } from './seeders/user.seeder';
import { seedCategories } from './seeders/category.seeder';
import { seedProducts } from './seeders/product.seeder';

const prisma = new PrismaClient();

async function clearAll() {
  console.log('🧹 Clearing existing data...');
  
  // Clear in reverse dependency order
  await prisma.productSKUImage.deleteMany();
  await prisma.productSKU.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await clearUsers();
  
  console.log('✅ All data cleared');
}

async function seedAll() {
  console.log('🌱 Seeding all data...');
  
  // Seed in dependency order
  await seedUsers();
  await seedCategories();
  await seedProducts();
  
  console.log('✅ All data seeded');
}

async function main() {
  console.log('🚀 Starting database seeding...');
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');
    const shouldSeed = args.includes('--seed') || args.includes('-s') || args.length === 0;

    if (shouldClear) {
      await clearAll();
    }

    if (shouldSeed) {
      await seedAll();
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
