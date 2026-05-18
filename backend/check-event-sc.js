const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEventContract() {
  const event = await prisma.event.findUnique({
    where: { id: 'a4152c17-f845-4b06-a72e-9b67f5ef1645' },
    select: {
      id: true,
      title: true,
      status: true,
      smart_contract_address: true,
      updated_at: true
    }
  });

  console.log(JSON.stringify(event, null, 2));
  await prisma.$disconnect();
}

checkEventContract();
