const { PrismaClient } = require('../backend/prisma/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 'd7278d6e-7878-4878-a819-77f8bc04a1bf';
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      merchandise_items: {
        include: { merchandise: true }
      }
    }
  });

  if (!order) {
    console.log('Order not found');
    return;
  }

  console.log('Order Type:', order.order_type);
  console.log('Order Merchandise Items Count:', order.merchandise_items.length);
  console.log('Order Merchandise Items:', order.merchandise_items);
}

main().catch(console.error).finally(() => prisma.$disconnect());
