const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBrokenImages() {
  console.log('🔄 Đang thay thế các link ảnh bị lỗi bằng các link Unsplash chất lượng cao hoạt động 100%...');

  const imageUpdates = [
    {
      title: 'Đại Nhạc Hội Giao Thừa BASTICKET Countdown 2026',
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Triển Lãm Nghệ Thuật Đương Đại & Ánh Sáng 3D',
      image_url: 'https://images.unsplash.com/photo-1540039155732-680f4f913d35?w=1200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Giải Chạy Bộ Marathon Vượt Núi Basticket Trail 2026',
      image_url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Lễ Hội Âm Nhạc Điện Tử EDM WaterWorld 2026',
      image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80'
    }
  ];

  try {
    for (const update of imageUpdates) {
      const event = await prisma.event.findFirst({ where: { title: update.title } });
      if (event) {
        await prisma.event.update({
          where: { id: event.id },
          data: { image_url: update.image_url }
        });
        console.log(`✔️ Đã cập nhật ảnh thành công cho sự kiện: "${update.title}"`);
      } else {
        console.log(`⚠️ Không tìm thấy sự kiện: "${update.title}"`);
      }
    }
    console.log('🎉 ĐÃ THAY THẾ TOÀN BỘ ẢNH LỖI THÀNH CÔNG!!!');
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật ảnh:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBrokenImages();
