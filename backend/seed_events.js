const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const web3Service = require('./src/services/web3.service');

const categories = [
  { name: 'Âm nhạc', image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Hội thảo', image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Thể thao', image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Kịch - Nghệ thuật', image_url: 'https://images.unsplash.com/photo-1507676184212-d0330a15233c?q=80&w=2069&auto=format&fit=crop' },
  { name: 'eSports', image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop' },
];

const mockEvents = [
  { title: 'The Eras Tour Vietnam - Taylor Swift', catIdx: 0, price: 1500000 },
  { title: 'Blackpink World Tour - Born Pink', catIdx: 0, price: 2000000 },
  { title: 'Show của Đen 2026', catIdx: 0, price: 800000 },
  { title: 'Sơn Tùng M-TP - Sky Tour Mới', catIdx: 0, price: 1200000 },
  { title: 'Hội thảo Công nghệ Trí tuệ Nhân tạo 2026', catIdx: 1, price: 200000 },
  { title: 'Blockchain Summit - Khám phá Web3', catIdx: 1, price: 300000 },
  { title: 'Khởi nghiệp tinh gọn - Startup Weekend', catIdx: 1, price: 150000 },
  { title: 'Marathon Quốc tế TP.HCM 2026', catIdx: 2, price: 500000 },
  { title: 'Chung kết V-League - Đua tranh ngôi vương', catIdx: 2, price: 300000 },
  { title: 'Giải quần vợt ATP Vietnam Open', catIdx: 2, price: 1000000 },
  { title: 'Kịch nói: Tiếng trống Mê Linh', catIdx: 3, price: 250000 },
  { title: 'Vở múa Đương đại: Sương Sớm', catIdx: 3, price: 300000 },
  { title: 'Nhạc kịch: Những người khốn khổ', catIdx: 3, price: 500000 },
  { title: 'Chung kết Thế giới LMHT - Viewing Party', catIdx: 4, price: 150000 },
  { title: 'Giải đấu Valorant VCT Pacific - Vòng loại', catIdx: 4, price: 200000 }
];

async function seed() {
  console.log('Bắt đầu seed dữ liệu...');

  // 1. Tạo/Lấy các categories
  const dbCategories = [];
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, image_url: c.image_url, is_active: true }
    });
    dbCategories.push(cat);
  }

  // 2. Lấy một organizer
  let organizer = await prisma.organizer.findFirst({
    include: { user: true }
  });

  if (!organizer) {
    console.log('Không tìm thấy organizer, tạo mới...');
    const user = await prisma.user.create({
      data: {
        email: 'organizer_mock@basticket.vn',
        password_hash: 'mock_hash', // Không dùng thật
        role: 'organizer',
        status: 'active',
        wallet_address: '0x1234567890123456789012345678901234567890'
      }
    });
    organizer = await prisma.organizer.create({
      data: {
        user_id: user.id,
        organization_name: 'BASTicket Mock Organizer',
        is_verified: true,
        kyc_status: 'approved'
      },
      include: { user: true }
    });
  }

  const wallet = organizer.user.wallet_address || '0x1234567890123456789012345678901234567890';

  console.log('Sử dụng organizer:', organizer.organization_name);

  // 3. Tạo 15 sự kiện
  for (let i = 0; i < mockEvents.length; i++) {
    const ev = mockEvents[i];
    const category = dbCategories[ev.catIdx];

    // Ngày bắt đầu: Tương lai 30-60 ngày
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30 + i);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    console.log(`Đang xử lý sự kiện: ${ev.title}`);
    
    let contractAddress = null;
    try {
        console.log(`- Đang tạo Smart Contract...`);
        contractAddress = await web3Service.deployEventContract(wallet);
        console.log(`- Contract tạo thành công: ${contractAddress}`);
    } catch (err) {
        console.log(`- Lỗi khi tạo contract (dùng fallback mock address):`, err.message);
        contractAddress = '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0');
    }

    const createdEvent = await prisma.event.create({
      data: {
        title: ev.title,
        description: 'Mô tả chi tiết cho ' + ev.title + ' với nhiều hoạt động hấp dẫn.',
        image_url: category.image_url,
        category_id: category.id,
        organizer_id: organizer.id,
        event_date: startDate,
        event_time: '19:00',
        end_date: endDate,
        end_time: '23:00',
        location_address: 'Trung tâm Triển lãm SECC, TP.HCM',
        status: 'active',
        smart_contract_address: contractAddress,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true,
        ticket_tiers: {
          create: [
            {
              tier_name: 'VVIP',
              price: ev.price * 2,
              quantity_total: 100,
              quantity_available: 100,
              benefits: 'Gặp gỡ nghệ sĩ, quà tặng'
            },
            {
              tier_name: 'VIP',
              price: ev.price * 1.5,
              quantity_total: 500,
              quantity_available: 500
            },
            {
              tier_name: 'Phổ thông',
              price: ev.price,
              quantity_total: 1000,
              quantity_available: 1000
            }
          ]
        }
      }
    });

    console.log(`- Lưu thành công sự kiện: ${createdEvent.id}\n`);
  }

  console.log('Hoàn thành seed 15 sự kiện thành công!');
}

seed().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
