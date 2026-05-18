const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSeatingCharts() {
  console.log('🔄 Đang đồng bộ chuẩn hóa toàn bộ sơ đồ ghế ngồi sang các link Unsplash HD ổn định...');

  const reliableSeatingCharts = [
    'https://images.unsplash.com/photo-1540039155732-680f4f913d35?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80'
  ];

  try {
    const events = await prisma.event.findMany();
    for (const ev of events) {
      await prisma.event.update({
        where: { id: ev.id },
        data: { seating_charts: reliableSeatingCharts }
      });
      console.log(`✔️ Đã cập nhật sơ đồ chỗ ngồi cho: "${ev.title}"`);
    }
    console.log('🎉 ĐÃ CHUẨN HÓA TOÀN BỘ SƠ ĐỒ CHỖ NGỒI THÀNH CÔNG!!!');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSeatingCharts();
