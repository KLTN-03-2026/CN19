const { PrismaClient } = require('../backend/prisma/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 'd7278d6e-7878-4878-a819-77f8bc04a1bf';
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      merchandise_items: true
    }
  });

  if (!order) {
    console.log('Order not found');
    return;
  }

  console.log('Order Type:', order.order_type);
  console.log('Event ID:', order.event_id);
  console.log('Event Title:', order.event.title);

  const merchandise = await prisma.merchandise.findMany({
    where: { event_id: order.event_id }
  });

  console.log('Merchandise Count:', merchandise.length);
  console.log('Merchandise:', merchandise);
}

main().catch(console.error).finally(() => prisma.$disconnect());
