const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const blogImages = {
  'Bí quyết chuẩn bị thể lực cho giải chạy bộ Basticket Mountain Trail 2026': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070&auto=format&fit=crop',
  'BASTICKET Live công bố chuỗi 5 siêu sự kiện hoành tráng nửa cuối năm 2026': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop'
};

async function updateBlogImages() {
  console.log('Bắt đầu cập nhật ảnh cho 2 blog...');
  
  for (const [title, imgUrl] of Object.entries(blogImages)) {
    // Tìm các blog có title chứa đoạn title này (để phòng trường hợp sai khác nhỏ về dấu câu)
    const blogs = await prisma.blog.findMany({
      where: { 
        title: {
          contains: title.substring(0, 20) // Lấy 20 ký tự đầu để tìm cho chắc
        }
      }
    });

    if (blogs.length > 0) {
      for (const blog of blogs) {
        await prisma.blog.update({
          where: { id: blog.id },
          data: { image_url: imgUrl }
        });
        console.log(`Đã cập nhật ảnh cho blog: ${blog.title}`);
      }
    } else {
       console.log(`Không tìm thấy blog nào cho từ khóa: ${title.substring(0, 20)}`);
    }
  }

  console.log('Cập nhật hoàn tất!');
}

updateBlogImages().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
