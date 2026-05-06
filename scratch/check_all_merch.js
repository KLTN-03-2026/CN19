const { PrismaClient } = require('../backend/prisma/src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const merchandise = await prisma.merchandise.findMany();
  console.log('Total Merchandise Count:', merchandise.length);
  console.log('All Merchandise:', JSON.stringify(merchandise, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
