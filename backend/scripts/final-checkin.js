const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInSpecificTicket() {
  const ticketId = 'c78ecf48-b311-40bb-9e69-a434d5bcfa44';
  try {
    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        is_used: true,
        checked_in_at: new Date(),
        status: 'used'
      }
    });
    console.log(`Đã check-in thành công cho vé: ${updated.ticket_number}`);
  } catch (error) {
    console.error('Lỗi khi cập nhật vé:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInSpecificTicket();
