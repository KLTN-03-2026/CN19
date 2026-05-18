const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const u = await prisma.user.findUnique({
    where: { email: 'tranminhphuong732004@gmail.com' },
    include: { organizer_profile: true }
  });
  console.log(JSON.stringify(u, null, 2));
}

checkUser().finally(() => prisma.$disconnect());
