const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateMerchPrices() {
  console.log('🔄 Đang cập nhật giá bán toàn bộ sản phẩm/vật phẩm về phân khúc sinh viên (20k - 30k)...');

  const prices = [20000, 25000, 30000];

  try {
    const merchItems = await prisma.merchandise.findMany();

    for (let i = 0; i < merchItems.length; i++) {
      const item = merchItems[i];
      const newPrice = prices[i % prices.length];
      
      await prisma.merchandise.update({
        where: { id: item.id },
        data: { price: newPrice }
      });

      console.log(`✔️ [${item.name}]: Đã điều chỉnh giá từ ${item.price}đ -> ${newPrice.toLocaleString('vi-VN')}đ`);
    }

    console.log(`🎉 Đã điều chỉnh thành công giá bán của ${merchItems.length} sản phẩm!`);
  } catch (error) {
    console.error('❌ Lỗi khi điều chỉnh giá sản phẩm:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMerchPrices();
