require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncEventFees() {
  console.log('🔄 Đang tải các thông số Cấu hình Hệ thống (System Settings) từ Database...');

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'event_platform_fee_percent',
            'event_transaction_fee_percent',
            'system_gas_fee',
            'default_royalty_percent',
            'resale_price_cap_percent',
            'resale_transaction_fee_percent'
          ]
        }
      }
    });

    const configMap = {};
    settings.forEach(s => { configMap[s.key] = s.value; });

    const platformFee = parseFloat(configMap['event_platform_fee_percent'] || 5.0);
    const commFee = parseFloat(configMap['event_transaction_fee_percent'] || 3.0);
    const gasFee = parseFloat(configMap['system_gas_fee'] || 10000.0);
    const royaltyFee = parseFloat(configMap['default_royalty_percent'] || 3.0);
    const resaleLimit = 100.0 + parseFloat(configMap['resale_price_cap_percent'] || 8.0);
    const resalePlatformFee = parseFloat(configMap['resale_transaction_fee_percent'] || 1.0);

    console.log('📌 Thông số chuẩn sẽ được đồng bộ sang tất cả sự kiện:');
    console.log(`- Phí nền tảng (platform_fee_percent): ${platformFee}%`);
    console.log(`- Phí giao dịch (commission_fee_percent): ${commFee}%`);
    console.log(`- Phí Gas NFT (resale_gas_fee): ${new Intl.NumberFormat('vi-VN').format(gasFee)} đ`);
    console.log(`- Tỷ lệ tác quyền (royalty_fee_percent): ${royaltyFee}%`);
    console.log(`- Giá trần bán lại tối đa (resale_price_limit_percent): ${resaleLimit}%`);
    console.log(`- Phí giao dịch chợ vé (resale_platform_fee_percent): ${resalePlatformFee}%`);

    console.log('\n🔄 Đang tiến hành cập nhật toàn bộ bảng Event...');
    
    const result = await prisma.event.updateMany({
      where: {}, // Update tất cả
      data: {
        platform_fee_percent: platformFee,
        commission_fee_percent: commFee,
        resale_gas_fee: gasFee,
        royalty_fee_percent: royaltyFee,
        resale_price_limit_percent: resaleLimit,
        resale_platform_fee_percent: resalePlatformFee
      }
    });

    console.log(`🎉 ĐÃ CẬP NHẬT THÀNH CÔNG ${result.count} SỰ KIỆN KHỚP VỚI BẢNG HỆ THỐNG!`);
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ phí sự kiện:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncEventFees();
