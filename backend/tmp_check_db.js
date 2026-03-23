const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEvents() {
  try {
    const eventCount = await prisma.event.count();
    const eventDetails = await prisma.event.findMany({
      take: 5,
      include: {
        category: true,
        organizer: {
          select: { organization_name: true }
        }
      }
    });

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { events: true }
        }
      }
    });

    console.log('--- DATABASE CHECK ---');
    console.log('Total Events:', eventCount);
    console.log('Sample Events:', JSON.stringify(eventDetails, null, 2));
    console.log('Categories & Event Counts:', JSON.stringify(categories, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();
