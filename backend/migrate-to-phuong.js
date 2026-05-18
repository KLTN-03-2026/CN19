const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  console.log('🔄 Đang chuyển toàn bộ dữ liệu 5 Sự kiện, 3 Sản phẩm và 2 Blog sang tài khoản: tranminhphuong732004@gmail.com...');

  try {
    const phuongUser = await prisma.user.findUnique({
      where: { email: 'tranminhphuong732004@gmail.com' },
      include: { organizer_profile: true }
    });

    const oldOrgUser = await prisma.user.findUnique({
      where: { email: 'organizer@basticket.com' },
      include: { organizer_profile: true }
    });

    if (!phuongUser || !phuongUser.organizer_profile) {
      console.log('❌ Không tìm thấy hồ sơ BTC của tranminhphuong732004@gmail.com');
      return;
    }

    if (!oldOrgUser || !oldOrgUser.organizer_profile) {
      console.log('⚠️ Không tìm thấy tài khoản organizer@basticket.com để chuyển đổi.');
      return;
    }

    const newOrgId = phuongUser.organizer_profile.id;
    const oldOrgId = oldOrgUser.organizer_profile.id;

    // 1. Chuyển Sự kiện
    const updatedEvents = await prisma.event.updateMany({
      where: { organizer_id: oldOrgId },
      data: { organizer_id: newOrgId }
    });
    console.log(`✔️ Đã chuyển ${updatedEvents.count} sự kiện.`);

    // 2. Chuyển Sản phẩm (Merchandise)
    const updatedMerch = await prisma.merchandise.updateMany({
      where: { organizer_id: oldOrgId },
      data: { organizer_id: newOrgId }
    });
    console.log(`✔️ Đã chuyển ${updatedMerch.count} sản phẩm.`);

    // 3. Chuyển Blog
    const updatedBlogs = await prisma.blog.updateMany({
      where: { author_id: oldOrgUser.id },
      data: { author_id: phuongUser.id }
    });
    console.log(`✔️ Đã chuyển ${updatedBlogs.count} bài blog.`);

    // 4. Cập nhật EventStaffAssignment (creator_id)
    await prisma.eventStaffAssignment.updateMany({
      where: { creator_id: oldOrgUser.id },
      data: { creator_id: phuongUser.id }
    });
    console.log('✔️ Đã cập nhật quyền phân công nhân viên kiểm soát cổng.');

    // 5. Xóa tài khoản cũ để tránh trùng lặp
    await prisma.organizer.delete({ where: { id: oldOrgId } });
    await prisma.user.delete({ where: { id: oldOrgUser.id } });
    console.log('🗑️ Đã dọn dẹp tài khoản tạm organizer@basticket.com.');

    console.log('🎉 QUÁ TRÌNH CHUYỂN ĐỔI HOÀN TẤT THÀNH CÔNG!!!');
  } catch (error) {
    console.error('❌ Lỗi khi chuyển đổi dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
