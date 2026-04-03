const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateCheckIn() {
  const eventId = '25aa0bd9-e370-4f4f-899a-171827cf1ab0'; 
  
  try {
    // Tìm tất cả các vé của sự kiện này mà CHƯA sử dụng
    const tickets = await prisma.ticket.findMany({
      where: {
        event_id: eventId,
        is_used: false
      },
      take: 2 // Lấy thêm 2 người nữa
    });

    if (tickets.length === 0) {
      console.log('Không tìm thấy thêm vé nào chưa sử dụng.');
      return;
    }

    const updatePromises = tickets.map(ticket => 
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          is_used: true,
          checked_in_at: new Date(),
          status: 'used'
        }
      })
    );

    await Promise.all(updatePromises);
    console.log(`Đã cập nhật thêm ${tickets.length} vé sang trạng thái đã soát vé.`);
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateCheckIn();
