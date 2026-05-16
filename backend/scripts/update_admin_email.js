const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });

    if (admin) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { email: 'basticket.noreply@gmail.com' }
      });
      console.log('Successfully updated admin email to basticket.noreply@gmail.com');
    } else {
      console.log('No admin user found');
    }
  } catch (error) {
    console.error('Error updating admin email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
