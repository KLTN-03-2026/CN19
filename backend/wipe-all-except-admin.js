const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeAllExceptAdmin() {
  console.log('⚠️ BẮT ĐẦU XÓA SẠCH TOÀN BỘ DATABASE (Chỉ giữ lại duy nhất tài khoản Admin)...');

  try {
    // 1. Lấy danh sách Admin để bảo toàn
    const admins = await prisma.user.findMany({
      where: { role: 'admin' }
    });
    const adminIds = admins.map(a => a.id);
    console.log(`🛡️ Đang giữ lại ${admins.length} tài khoản Admin:`, admins.map(a => a.email).join(', '));

    // 2. Xóa toàn bộ dữ liệu giao dịch, vé, đơn hàng, sự kiện...
    console.log('🗑️ Đang xóa toàn bộ dữ liệu giao dịch, đơn hàng, vé và lịch sử...');
    await prisma.merchandiseScanHistory.deleteMany({});
    await prisma.merchandiseOrderItem.deleteMany({});
    await prisma.scanHistory.deleteMany({});
    await prisma.dynamicQRToken.deleteMany({});
    await prisma.ticketTransfer.deleteMany({});
    await prisma.marketplaceTransaction.deleteMany({});
    await prisma.marketplaceListing.deleteMany({});
    await prisma.refundRequest.deleteMany({});
    await prisma.escrowPayout.deleteMany({});
    await prisma.emergencyRequest.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.withdrawalRequest.deleteMany({});
    await prisma.walletTransaction.deleteMany({});
    
    console.log('🗑️ Đang xóa các tương tác và bài viết blog...');
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.blogReport.deleteMany({});
    await prisma.blog.deleteMany({});

    console.log('🗑️ Đang xóa toàn bộ vé, đơn hàng, sản phẩm và sự kiện...');
    await prisma.ticket.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.eventStaffAssignment.deleteMany({});
    await prisma.ticketTier.deleteMany({});
    await prisma.merchandise.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.organizer.deleteMany({});
    
    console.log('🗑️ Đang xóa log hệ thống, thông báo, danh mục và cấu hình...');
    await prisma.notification.deleteMany({});
    await prisma.adminActionLog.deleteMany({});
    await prisma.botDetectionLog.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.systemSetting.deleteMany({});

    // 3. Xóa toàn bộ User không phải Admin
    console.log('🗑️ Đang xóa toàn bộ tài khoản người dùng, khách hàng, nhân viên và BTC...');
    const deleteUsersResult = await prisma.user.deleteMany({
      where: {
        id: { notIn: adminIds }
      }
    });
    console.log(`✔️ Đã xóa ${deleteUsersResult.count} tài khoản người dùng thường.`);

    // 4. Kiểm tra thống kê cuối cùng
    const userCount = await prisma.user.count();
    const blogCount = await prisma.blog.count();
    const catCount = await prisma.category.count();
    const settingCount = await prisma.systemSetting.count();
    const eventCount = await prisma.event.count();

    console.log('--------------------------------------------------');
    console.log('🚨 ĐÃ XÓA TRẮNG TOÀN BỘ CƠ SỞ DỮ LIỆU THÀNH CÔNG!');
    console.log(`  - Tài khoản Admin còn lại: ${userCount} (${admins.map(a => a.email).join(', ')})`);
    console.log(`  - Sự kiện: ${eventCount}`);
    console.log(`  - Blog: ${blogCount}`);
    console.log(`  - Danh mục: ${catCount}`);
    console.log(`  - Cấu hình hệ thống: ${settingCount}`);
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeAllExceptAdmin();
