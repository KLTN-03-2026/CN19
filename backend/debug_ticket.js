const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  try {
    const userId = '8bc7cc2b-2401-447a-8742-f28325a7457d'; // organizer ID from seed
    const organizer = await prisma.organizer.findFirst({
        where: { user: { email: 'organizer@congty.com' } }
    });
    
    if (!organizer) {
        console.log('Organizer not found');
        return;
    }

    const where = {
      event: { organizer_id: organizer.id }
    };

    console.log('Querying with where:', JSON.stringify(where, null, 2));

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          event: { select: { title: true } },
          ticket_tier: { select: { tier_name: true, price: true } },
          current_owner: { select: { full_name: true, email: true } }
        },
        orderBy: { created_at: 'desc' },
        skip: 0,
        take: 10
      }),
      prisma.ticket.count({ where })
    ]);

    console.log('Success! Count:', total);
    console.log('Tickets sample:', tickets.length > 0 ? tickets[0].ticket_number : 'None');
  } catch (error) {
    console.error('DEBUG ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
