const { PrismaClient } = require('../backend/prisma/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = 'd7278d6e-7878-4878-a819-77f8bc04a1bf';
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: true
    }
  });

  if (!order) {
    console.log('Order not found');
    return;
  }

  const organizerId = order.event.organizer_id;
  console.log('Organizer ID:', organizerId);

  // Find all merchandise for this organizer
  const orgMerch = await prisma.merchandise.findMany({
    where: { organizer_id: organizerId }
  });

  console.log('Organizer Merchandise Count:', orgMerch.length);
  console.log('Organizer Merchandise:', orgMerch.map(m => ({ id: m.id, name: m.name, event_id: m.event_id })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
