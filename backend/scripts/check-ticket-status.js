const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTicketStatus() {
  const eventId = '25aa0bd9-e370-4f4f-899a-171827cf1ab0';
  try {
    const tickets = await prisma.ticket.findMany({
      where: { event_id: eventId },
      take: 5,
      select: { id: true, status: true, is_used: true }
    });
    console.log('--- Trạng thái vé hiện tại ---');
    console.table(tickets);
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái vé:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTicketStatus();
