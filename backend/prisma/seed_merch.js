const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Reseeding Merchandise for testing ---');
  
  const organizer = await prisma.organizer.findFirst();
  if (!organizer) {
    console.error('No organizer found. Please create one first.');
    return;
  }

  const events = await prisma.event.findMany();
  if (events.length === 0) {
    console.error('No events found. Please create one first.');
    return;
  }

  for (const event of events) {
    // Delete existing merch for this event to avoid duplicates
    await prisma.merchandise.deleteMany({
      where: { event_id: event.id }
    });

    await prisma.merchandise.createMany({
      data: [
        {
          organizer_id: organizer.id,
          event_id: event.id,
          name: 'Combo Bắp Nước Platinum',
          description: '1 Bắp lớn vị phô mai + 1 Nước ngọt tùy chọn size L',
          price: 85000,
          stock: 99,
          image_url: 'https://images.unsplash.com/photo-1572177215152-32f247303126?q=80&w=400&auto=format&fit=crop'
        },
        {
          organizer_id: organizer.id,
          event_id: event.id,
          name: 'Áo Thun BASTICKET 2026',
          description: 'Áo thun cotton 100% cao cấp, thiết kế độc bản',
          price: 280000,
          stock: 50,
          image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop'
        },
        {
          organizer_id: organizer.id,
          event_id: event.id,
          name: 'Lightstick Neon Green',
          description: 'Lightstick đồng bộ ánh sáng tại khán đài',
          price: 550000,
          stock: 150,
          image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=400&auto=format&fit=crop'
        }
      ]
    });
    console.log(`- Seeded 3 products for event: ${event.title}`);
  }

  console.log('--- Done! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
