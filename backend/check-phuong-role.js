const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const u = await prisma.user.findUnique({
    where: { email: 'tranminhphuong732004@gmail.com' },
    include: { organizer_profile: true }
  });
  console.log('Role:', u?.role);
  console.log('ID:', u?.id);
  console.log('Org Profile ID:', u?.organizer_profile?.id);
}

checkUser().finally(() => prisma.$disconnect());
