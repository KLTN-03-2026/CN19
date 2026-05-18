const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAllCategories() {
  console.log('🔄 Đang kiểm tra và đồng bộ hóa toàn bộ 11 Danh mục Sự kiện chuẩn HD cho BASTICKET...');

  try {
    const categoriesData = [
      {
        name: 'Âm nhạc',
        image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Hội thảo',
        image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Thể thao',
        image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Sân khấu',
        image_url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Triển lãm',
        image_url: 'https://images.unsplash.com/photo-1531058020387-3be344554be6?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Lễ hội & EDM',
        image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Điện ảnh & Chiếu phim',
        image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Hài kịch & Stand-up',
        image_url: 'https://images.unsplash.com/photo-1585699324551-f6c309eed567?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Nghệ thuật & Workshop',
        image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Ẩm thực & Rượu vang',
        image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        name: 'Esports & Gaming',
        image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        is_active: true
      }
    ];

    for (const cat of categoriesData) {
      const existing = await prisma.category.findUnique({ where: { name: cat.name } });
      if (existing) {
        console.log(`✔️ Danh mục "${cat.name}" đã tồn tại. Đang đồng bộ ảnh HD...`);
        await prisma.category.update({
          where: { name: cat.name },
          data: { image_url: cat.image_url, is_active: true }
        });
      } else {
        console.log(`➕ Đang tạo mới danh mục: "${cat.name}"`);
        await prisma.category.create({ data: cat });
      }
    }

    console.log('🎉 Đã đồng bộ hoàn chỉnh 11 Danh mục Sự kiện với ảnh chất lượng cao trên Supabase!');
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ danh mục:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAllCategories();
