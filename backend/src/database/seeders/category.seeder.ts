import { PrismaClient, UserRole } from '../../../prisma/generated/prisma';


const prisma = new PrismaClient();

const categories = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and accessories',
    info: { icon: 'electronics', color: '#1976d2' },
    children: [
      {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Mobile phones and smartphones',
        info: { icon: 'phone', color: '#388e3c' },
      },
      {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Laptop computers and accessories',
        info: { icon: 'laptop', color: '#7b1fa2' },
      },
      {
        name: 'Audio',
        slug: 'audio',
        description: 'Headphones, speakers, and audio equipment',
        info: { icon: 'headphones', color: '#f57c00' },
      },
    ],
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and clothing items',
    info: { icon: 'clothing', color: '#e91e63' },
    children: [
      {
        name: 'Men\'s Clothing',
        slug: 'mens-clothing',
        description: 'Clothing for men',
        info: { icon: 'male', color: '#2196f3' },
      },
      {
        name: 'Women\'s Clothing',
        slug: 'womens-clothing',
        description: 'Clothing for women',
        info: { icon: 'female', color: '#e91e63' },
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Fashion accessories',
        info: { icon: 'accessories', color: '#ff9800' },
      },
    ],
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home improvement and garden supplies',
    info: { icon: 'home', color: '#4caf50' },
    children: [
      {
        name: 'Furniture',
        slug: 'furniture',
        description: 'Home and office furniture',
        info: { icon: 'chair', color: '#795548' },
      },
      {
        name: 'Garden Tools',
        slug: 'garden-tools',
        description: 'Tools for gardening and landscaping',
        info: { icon: 'garden', color: '#4caf50' },
      },
    ],
  },
];

export async function seedCategories() {
  console.log('🌱 Seeding categories...');

  for (const categoryData of categories) {
    // Create parent category
    const parentCategory = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        info: categoryData.info,
        isActive: true,
        sortOrder: 0,
      },
    });

    console.log(`✅ Created parent category: ${parentCategory.name}`);

    // Create child categories
    if (categoryData.children) {
      for (const [index, childData] of categoryData.children.entries()) {
        const childCategory = await prisma.category.upsert({
          where: { slug: childData.slug },
          update: {},
          create: {
            name: childData.name,
            slug: childData.slug,
            description: childData.description,
            info: childData.info,
            parentId: parentCategory.id,
            isActive: true,
            sortOrder: index,
          },
        });

        console.log(`  ✅ Created child category: ${childCategory.name}`);
      }
    }
  }

  console.log('✅ Categories seeded successfully');
}
