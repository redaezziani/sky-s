import { PrismaClient } from '../../generated/prisma';
import { seedUsers, clearUsers } from './seeders/user.seeder';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database seeding...');
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear') || args.includes('-c');
    const shouldSeed = args.includes('--seed') || args.includes('-s') || args.length === 0;

    if (shouldClear) {
      console.log('🧹 Clearing existing data...');
      await clearUsers();
    }

    if (shouldSeed) {
      console.log('🌱 Seeding data...');
      await seedUsers();
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
