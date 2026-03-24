const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.findUnique({ where: { id: "fdf55494-f931-4261-87d4-f7af5cf95fe8" } });
  const org = await prisma.organizer.findUnique({ where: { id: "d8c3df8d-657c-44ed-aaa4-5138f0f70125" } });
  
  console.log('Category Found:', JSON.stringify(cat, null, 2));
  console.log('Organizer Found:', JSON.stringify(org, null, 2));
  
  const allCats = await prisma.category.findMany();
  console.log('All Category IDs:', allCats.map(c => c.id));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
