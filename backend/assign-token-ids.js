const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTokenIds() {
  console.log('🔄 Đang gán Token ID chuẩn xác cho các vé của đơn hàng 99b96c2b...');

  try {
    const tickets = await prisma.ticket.findMany({
      where: { order_id: '99b96c2b-343f-4f75-a30b-75620d6208c7' },
      orderBy: { ticket_number: 'asc' }
    });

    let startId = 101;
    for (const ticket of tickets) {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          nft_token_id: String(startId),
          status: 'minted'
        }
      });
      console.log(`✅ Vé ${ticket.ticket_number} đã được gán TokenID: #${startId}`);
      startId++;
    }

    console.log('🎉 Đã gán xong! Vui lòng tải lại trang web quản lý đơn hàng!');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixTokenIds();
