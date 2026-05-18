const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPendingTestEvent() {
  console.log('🔄 Đang khởi tạo sự kiện kiểm thử mới ở trạng thái CHỜ DUYỆT (pending)...');

  try {
    // 1. Tải thông số phí từ SystemSetting để đồng bộ 100%
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'event_platform_fee_percent',
            'event_transaction_fee_percent',
            'system_gas_fee',
            'default_royalty_percent',
            'resale_price_cap_percent',
            'resale_transaction_fee_percent',
            'product_platform_fee_percent',
            'product_transaction_fee_percent'
          ]
        }
      }
    });

    const configMap = {};
    settings.forEach(s => { configMap[s.key] = s.value; });

    const eventPlatformFee = parseFloat(configMap['event_platform_fee_percent'] || 5.0);
    const eventCommFee = parseFloat(configMap['event_transaction_fee_percent'] || 3.0);
    const gasFee = parseFloat(configMap['system_gas_fee'] || 10000.0);
    const royaltyFee = parseFloat(configMap['default_royalty_percent'] || 5.0);
    const resaleLimit = 100.0 + parseFloat(configMap['resale_price_cap_percent'] || 8.0);
    const resalePlatformFee = parseFloat(configMap['resale_transaction_fee_percent'] || 1.0);

    const productPlatformFee = parseFloat(configMap['product_platform_fee_percent'] || 3.0);
    const productCommFee = parseFloat(configMap['product_transaction_fee_percent'] || 2.0);

    console.log('📌 Đã lấy thông số phí chuẩn từ Hệ thống:');
    console.log(`- Phí sự kiện: Platform = ${eventPlatformFee}%, Commission = ${eventCommFee}%, Gas = ${gasFee}đ`);
    console.log(`- Phí sản phẩm: Platform = ${productPlatformFee}%, Commission = ${productCommFee}%`);

    // 2. Tìm tài khoản Ban tổ chức tranminhphuong732004@gmail.com
    const phuongUser = await prisma.user.findUnique({
      where: { email: 'tranminhphuong732004@gmail.com' },
      include: { organizer_profile: true }
    });

    if (!phuongUser || !phuongUser.organizer_profile) {
      console.error('❌ Không tìm thấy hồ sơ Ban tổ chức của tranminhphuong732004@gmail.com!');
      return;
    }
    const organizerId = phuongUser.organizer_profile.id;

    // 3. Tìm danh mục Âm nhạc
    let category = await prisma.category.findFirst({ where: { name: 'Âm nhạc' } });
    if (!category) {
      category = await prisma.category.findFirst({});
    }

    // 4. Khởi tạo Sự kiện
    const eventDate = new Date('2026-05-17T19:30:00.000Z');
    const endDate = new Date('2026-05-18T23:00:00.000Z');

    const newEvent = await prisma.event.create({
      data: {
        organizer_id: organizerId,
        category_id: category ? category.id : undefined,
        title: 'Live Concert "Hành Trình Thanh Xuân 2026"',
        description: 'Đêm nhạc bùng nổ quy tụ những giọng ca thanh xuân hàng đầu Việt Nam với hệ thống âm thanh ánh sáng chuẩn quốc tế. Khán giả tham dự sẽ được đắm chìm trong không gian nghệ thuật sống động và sở hữu vé NFT độc quyền có giá trị sưu tầm vĩnh viễn trên chuỗi khối Polygon.',
        location_address: 'Sân vận động Quân khu 7, 202 Hoàng Văn Thụ, Phường 9, Phú Nhuận, TP. Hồ Chí Minh',
        event_date: eventDate,
        end_date: endDate,
        event_time: '19:30',
        end_time: '23:00',
        image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
        status: 'pending', // Đúng yêu cầu: CHỜ DUYỆT
        allow_refund: true,
        refund_deadline_days: 1,
        
        // Đồng bộ 100% với bảng Hệ thống
        platform_fee_percent: eventPlatformFee,
        commission_fee_percent: eventCommFee,
        resale_gas_fee: gasFee,
        royalty_fee_percent: royaltyFee,
        resale_price_limit_percent: resaleLimit,
        resale_platform_fee_percent: resalePlatformFee
      }
    });
    console.log(`✔️ Đã tạo sự kiện mới thành công (ID: ${newEvent.id}, Trạng thái: ${newEvent.status})`);

    // 5. Khởi tạo 3 Hạng vé chuẩn test sinh viên
    await prisma.ticketTier.createMany({
      data: [
        {
          event_id: newEvent.id,
          tier_name: 'Hạng GA (Sân cỏ)',
          section_name: 'Khu vực GA - Đứng tự do',
          price: 30000,
          quantity_total: 100,
          quantity_available: 100,
          benefits: 'Vé vào cổng khu vực GA tự do'
        },
        {
          event_id: newEvent.id,
          tier_name: 'Hạng VIP (Khán đài)',
          section_name: 'Khu vực VIP - Khán đài A',
          price: 50000,
          quantity_total: 50,
          quantity_available: 50,
          benefits: 'Ghế ngồi khán đài có đệm + Tặng 1 Nước suối'
        },
        {
          event_id: newEvent.id,
          tier_name: 'Hạng VVIP (Đặc quyền)',
          section_name: 'Khu vực VVIP - Cận sân khấu',
          price: 100000,
          quantity_total: 20,
          quantity_available: 20,
          benefits: 'Ghế ngồi VVIP cận sân khấu + Lối check-in riêng biệt + Tặng set quà lưu niệm'
        }
      ]
    });
    console.log(`✔️ Đã tạo 3 hạng vé (GA 30k, VIP 50k, VVIP 100k) cho sự kiện.`);

    // 6. Khởi tạo Sản phẩm Mua kèm (Merchandise)
    await prisma.merchandise.create({
      data: {
        event_id: newEvent.id,
        organizer_id: organizerId,
        name: 'Áo Thun Oversize "Hành Trình Thanh Xuân" (Bản Premium)',
        description: 'Áo thun 100% Cotton 2 chiều thoáng mát, thiết kế độc quyền kèm logo phản quang phát sáng trong đêm nhạc. Khách hàng xuất trình mã QR đơn hàng để nhận áo trực tiếp tại quầy check-in sự kiện.',
        price: 25000, // Giá test sinh viên
        stock: 100,
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
        is_active: true,
        
        // Đồng bộ 100% với bảng Hệ thống
        platform_fee_percent: productPlatformFee,
        commission_fee_percent: productCommFee
      }
    });
    console.log(`✔️ Đã tạo sản phẩm kèm theo (Áo thun 25k) với phí nền tảng ${productPlatformFee}%, phí hoa hồng ${productCommFee}%.`);

    console.log('🎉 KHỞI TẠO HOÀN TẤT! Bạn có thể vào trang Quản trị viên (Admin) để kiểm tra và duyệt sự kiện!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình khởi tạo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPendingTestEvent();
