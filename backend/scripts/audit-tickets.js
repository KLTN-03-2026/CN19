const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showAllTickets() {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        event: { select: { title: true } },
        current_owner: { select: { full_name: true } }
      }
    });
    console.log('--- Tất cả vé trong hệ thống ---');
    tickets.forEach(t => {
      console.log(`ID: ${t.id} | Sự kiện: ${t.event.title} | Khách: ${t.current_owner.full_name} | Đã dùng: ${t.is_used}`);
    });
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showAllTickets();
