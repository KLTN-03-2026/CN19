const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Users for Firebase URLs ---');
  const usersWithFirebase = await prisma.user.findMany({
    where: {
      OR: [
        { avatar_url: { contains: 'firebasestorage.googleapis.com' } }
      ]
    },
    select: { id: true, email: true, avatar_url: true }
  });
  console.log('Users:', usersWithFirebase);

  console.log('\n--- Checking Categories for Firebase URLs ---');
  const categoriesWithFirebase = await prisma.category.findMany({
    where: {
      image_url: { contains: 'firebasestorage.googleapis.com' }
    },
    select: { id: true, name: true, image_url: true }
  });
  console.log('Categories:', categoriesWithFirebase);

  console.log('\n--- Checking Events for Firebase URLs ---');
  const eventsWithFirebase = await prisma.event.findMany({
    where: {
      OR: [
        { image_url: { contains: 'firebasestorage.googleapis.com' } },
        { video_url: { contains: 'firebasestorage.googleapis.com' } }
      ]
    },
    select: { id: true, title: true, image_url: true, video_url: true }
  });
  console.log('Events:', eventsWithFirebase);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
