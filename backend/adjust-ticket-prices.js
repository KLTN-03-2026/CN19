const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function adjustTicketPrices() {
  console.log('🔄 Đang đồng bộ điều chỉnh toàn bộ giá vé các sự kiện về mức 30.000đ - 100.000đ...');

  try {
    const tiers = await prisma.ticketTier.findMany({
      include: { event: { select: { title: true } } }
    });

    let count = 0;
    for (const t of tiers) {
      let newPrice = 50000; // Mặc định 50k

      const nameLower = t.tier_name.toLowerCase();
      if (nameLower.includes('ga') || nameLower.includes('thường') || nameLower.includes('cổng') || nameLower.includes('standard')) {
        newPrice = 30000; // Hạng phổ thông 30k
      } else if (nameLower.includes('vip') || nameLower.includes('fanzone') || nameLower.includes('bib 21km')) {
        newPrice = 80000; // Hạng VIP / Fanzone 80k
      } else if (nameLower.includes('vvip') || nameLower.includes('president') || nameLower.includes('meet') || nameLower.includes('42km')) {
        newPrice = 100000; // Hạng cao nhất 100k
      }

      await prisma.ticketTier.update({
        where: { id: t.id },
        data: { price: newPrice }
      });

      console.log(`✔️ [${t.event?.title || 'Event'}] ${t.tier_name} -> Giá mới: ${newPrice.toLocaleString('vi-VN')}đ`);
      count++;
    }

    console.log('--------------------------------------------------');
    console.log(`🎉 ĐÃ ĐIỀU CHỈNH THÀNH CÔNG GIÁ CHO TOÀN BỘ ${count} HẠNG VÉ!`);
    console.log('Toàn bộ giá vé hiện tại nằm trong khoảng 30.000đ đến 100.000đ cực kỳ tối ưu để test thanh toán.');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Lỗi khi điều chỉnh giá vé:', error);
  } finally {
    await prisma.$disconnect();
  }
}

adjustTicketPrices();
