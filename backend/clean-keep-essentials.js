const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanKeepEssentials() {
  console.log('🔄 BẮT ĐẦU DỌN DẸP DATABASE (Giữ lại Blog, Danh mục Sự kiện, Cấu hình và Admin)...');

  try {
    // 1. Tìm các tài khoản Admin để giữ lại
    const admins = await prisma.user.findMany({
      where: { role: 'admin' }
    });
    const adminIds = admins.map(a => a.id);
    console.log(`✔️ Giữ lại ${admins.length} tài khoản Admin:`, admins.map(a => a.email).join(', '));

    // 2. Xóa dữ liệu giao dịch và các bảng phụ thuộc (Bottom-up)
    console.log('🗑️ Đang xóa các dữ liệu giao dịch, vé, đơn hàng, sự kiện và thông báo...');
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
    
    // Xóa các tương tác trên blog nhưng GIỮ LẠI bảng Blog
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.blogReport.deleteMany({});

    // Xóa vé và đơn hàng
    await prisma.ticket.deleteMany({});
    await prisma.order.deleteMany({});
    
    // Xóa phân công nhân viên và hạng vé
    await prisma.eventStaffAssignment.deleteMany({});
    await prisma.ticketTier.deleteMany({});
    
    // Xóa sản phẩm, sự kiện và nhà tổ chức
    await prisma.merchandise.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.organizer.deleteMany({});
    
    // Xóa log và thông báo
    await prisma.notification.deleteMany({});
    await prisma.adminActionLog.deleteMany({});
    await prisma.botDetectionLog.deleteMany({});
    
    // 3. Xóa các User không phải Admin
    console.log('🗑️ Đang xóa các tài khoản User / Khách hàng / Nhân viên...');
    const deleteUsersResult = await prisma.user.deleteMany({
      where: {
        id: { notIn: adminIds }
      }
    });
    console.log(`✔️ Đã xóa ${deleteUsersResult.count} tài khoản không phải Admin.`);

    // 4. Kiểm tra và xác nhận số lượng dữ liệu giữ lại
    const blogCount = await prisma.blog.count();
    const categoryCount = await prisma.category.count();
    const settingCount = await prisma.systemSetting.count();

    console.log('--------------------------------------------------');
    console.log('🎉 DỌN DẸP HOÀN TẤT THÀNH CÔNG! THỐNG KÊ HIỆN TẠI:');
    console.log(`  - Tài khoản Admin: ${admins.length}`);
    console.log(`  - Bài viết (Blog): ${blogCount}`);
    console.log(`  - Danh mục sự kiện (Category): ${categoryCount}`);
    console.log(`  - Tham số cấu hình (System Settings): ${settingCount}`);
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Lỗi nghiêm trọng khi dọn dẹp:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanKeepEssentials();
