const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uniqueImages = {
  // Âm nhạc
  'The Eras Tour Vietnam - Taylor Swift': 'https://images.unsplash.com/photo-1540039155732-d68f2c5c8a15?q=80&w=2070&auto=format&fit=crop',
  'Blackpink World Tour - Born Pink': 'https://images.unsplash.com/photo-1493225457124-a1a2c0fa0f5e?q=80&w=2070&auto=format&fit=crop',
  'Show của Đen 2026': 'https://images.unsplash.com/photo-1470229722913-7c092dbba2a4?q=80&w=2070&auto=format&fit=crop',
  'Sơn Tùng M-TP - Sky Tour Mới': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop',

  // Hội thảo
  'Hội thảo Công nghệ Trí tuệ Nhân tạo 2026': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop',
  'Blockchain Summit - Khám phá Web3': 'https://images.unsplash.com/photo-1639762681485-074b7f4ec651?q=80&w=2070&auto=format&fit=crop',
  'Khởi nghiệp tinh gọn - Startup Weekend': 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=2070&auto=format&fit=crop',

  // Thể thao
  'Marathon Quốc tế TP.HCM 2026': 'https://images.unsplash.com/photo-1530143311094-34d807799e8f?q=80&w=2069&auto=format&fit=crop',
  'Chung kết V-League - Đua tranh ngôi vương': 'https://images.unsplash.com/photo-1518605368461-1ee1345f8f87?q=80&w=2070&auto=format&fit=crop',
  'Giải quần vợt ATP Vietnam Open': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=2071&auto=format&fit=crop',

  // Kịch - Nghệ thuật
  'Kịch nói: Tiếng trống Mê Linh': 'https://images.unsplash.com/photo-1507676184212-d0330a15233c?q=80&w=2069&auto=format&fit=crop',
  'Vở múa Đương đại: Sương Sớm': 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?q=80&w=2070&auto=format&fit=crop',
  'Nhạc kịch: Những người khốn khổ': 'https://images.unsplash.com/photo-1514533454707-420112f49ef2?q=80&w=2070&auto=format&fit=crop',

  // eSports
  'Chung kết Thế giới LMHT - Viewing Party': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
  'Giải đấu Valorant VCT Pacific - Vòng loại': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop'
};

async function updateImages() {
  console.log('Bắt đầu cập nhật ảnh riêng biệt cho các sự kiện...');
  
  for (const [title, imgUrl] of Object.entries(uniqueImages)) {
    const events = await prisma.event.findMany({
      where: { title: title }
    });

    for (const event of events) {
      await prisma.event.update({
        where: { id: event.id },
        data: { image_url: imgUrl }
      });
      console.log(`Đã cập nhật ảnh cho sự kiện: ${title}`);
    }
  }

  console.log('Cập nhật hoàn tất!');
}

updateImages().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
