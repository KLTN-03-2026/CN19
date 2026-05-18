const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncMerchFees() {
  console.log('🔄 Đang tải thông số phí sản phẩm từ bảng cài đặt hệ thống (SystemSetting)...');

  try {
    const platformSetting = await prisma.systemSetting.findUnique({ where: { key: 'product_platform_fee_percent' } });
    const commissionSetting = await prisma.systemSetting.findUnique({ where: { key: 'product_transaction_fee_percent' } });

    const platformFee = platformSetting ? Number(platformSetting.value) : 3;
    const commissionFee = commissionSetting ? Number(commissionSetting.value) : 2;

    console.log(`📌 Giá trị cài đặt hệ thống: Phí nền tảng sản phẩm = ${platformFee}%, Phí hoa hồng sản phẩm = ${commissionFee}%`);

    const result = await prisma.merchandise.updateMany({
      data: {
        platform_fee_percent: platformFee,
        commission_fee_percent: commissionFee
      }
    });

    console.log(`✔️ Đã đồng bộ thành công ${result.count} sản phẩm trong hệ thống về đúng tỷ lệ phí (${platformFee}% và ${commissionFee}%)!`);
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ phí sản phẩm:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncMerchFees();
