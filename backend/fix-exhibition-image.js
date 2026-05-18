const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExhibitionImage() {
  console.log('🔄 Đang thay thế ảnh sự kiện Triển Lãm bằng một link Unsplash nghệ thuật ổn định 100%...');

  const reliableImageUrl = 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80';

  try {
    const event = await prisma.event.findFirst({
      where: { title: 'Triển Lãm Nghệ Thuật Đương Đại & Ánh Sáng 3D' }
    });

    if (event) {
      await prisma.event.update({
        where: { id: event.id },
        data: { image_url: reliableImageUrl }
      });
      console.log('🎉 Đã thay thế thành công ảnh Triển Lãm 3D!');
    } else {
      console.log('⚠️ Không tìm thấy sự kiện Triển Lãm.');
    }
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExhibitionImage();
