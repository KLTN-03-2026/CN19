const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEventStatus() {
  console.log('🔄 Đang đồng bộ chuẩn hóa trạng thái sự kiện từ "approved" sang chuẩn hệ thống "active"...');

  try {
    const updated = await prisma.event.updateMany({
      where: { status: 'approved' },
      data: { status: 'active' }
    });
    console.log(`🎉 Đã chuẩn hóa thành công ${updated.count} sự kiện sang trạng thái "active" (Đang bán)!`);

    // Kiểm tra lại toàn bộ sự kiện trong hệ thống
    const events = await prisma.event.findMany({
      select: { id: true, title: true, status: true, organizer: { select: { organization_name: true } } }
    });

    console.log('\n📋 DANH SÁCH SỰ KIỆN VÀ TRẠNG THÁI HIỆN TẠI:');
    events.forEach((ev, i) => {
      console.log(`${i+1}. [${ev.organizer?.organization_name || 'N/A'}] ${ev.title} -> Trạng thái: ${ev.status}`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ trạng thái:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEventStatus();
