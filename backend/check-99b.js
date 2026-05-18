const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  const order = await prisma.order.findFirst({
    where: { id: { startsWith: '99b96c2b' } },
    include: { event: true, tickets: true }
  });
  console.log(JSON.stringify(order, null, 2));
  await prisma.$disconnect();
}
checkOrder();
