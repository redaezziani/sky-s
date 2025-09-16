import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function seedOrders() {
  console.log('🌱 Seeding orders...');

  // Get some users
  const users = await prisma.user.findMany({
    where: { isActive: true },
    take: 2,
  });
  if (users.length === 0) {
    console.log('No active users found. Skipping order seeding.');
    return;
  }

  // Get some products and their SKUs
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 2,
    include: {
      variants: {
        include: {
          skus: true,
        },
      },
    },
  });
  if (products.length === 0) {
    console.log('No active products found. Skipping order seeding.');
    return;
  }

  for (const [i, user] of users.entries()) {
    const product = products[i % products.length];
    const variant = product.variants[0];
    const sku = variant.skus[0];

    // Create an order
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i}`,
        userId: user.id,
        status: 'CONFIRMED',
        paymentStatus: 'COMPLETED',
        subtotal: sku.price,
        taxAmount: 0,
        shippingAmount: 5,
        discountAmount: 0,
        totalAmount: sku.price.plus(5),
        currency: 'USD',
        shippingName: user.name || 'Test User',
        shippingEmail: user.email,
        shippingPhone: null,
        shippingAddress: {
          address: '123 Test St',
          city: 'Testville',
          country: 'Testland',
        },
        billingName: user.name || 'Test User',
        billingEmail: user.email,
        billingAddress: {
          address: '123 Test St',
          city: 'Testville',
          country: 'Testland',
        },
        notes: 'Seeded order',
        trackingNumber: `TRACK-${Date.now()}-${i}`,
        shippedAt: new Date(),
        deliveredAt: new Date(),
        // Delivery Coordinates
        deliveryLat: 35.751206,
        deliveryLng: -5.800534,
        deliveryPlace: 'no 3, Rue 20, Tangier 90060',
        items: {
          create: [
            {
              skuId: sku.id,
              quantity: 1,
              unitPrice: sku.price,
              totalPrice: sku.price,
              productName: product.name,
              skuCode: sku.sku,
            },
          ],
        },
      },
    });
    console.log(`✅ Created order ${order.orderNumber} for user ${user.email}`);
  }

  console.log('✅ Orders seeding complete');
}
