const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listEvents() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      smart_contract_address: true,
      updated_at: true
    },
    orderBy: { updated_at: 'desc' }
  });

  console.log(JSON.stringify(events, null, 2));
  await prisma.$disconnect();
}

listEvents();
