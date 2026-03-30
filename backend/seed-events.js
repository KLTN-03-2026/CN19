const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');

async function main() {
  console.log('Seeding Database with sample events...');

  // 1. Create Categories if not exist
  const categoriesData = ['Âm Nhạc', 'Công Nghệ', 'Nghệ Thuật', 'Thể Thao'];
  const categories = {};
  for (const name of categoriesData) {
    let cat = await prisma.category.findUnique({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name, is_active: true }
      });
    }
    categories[name] = cat.id;
  }

  // 2. Create an Organizer User if not exists
  let orgUser = await prisma.user.findUnique({ where: { email: 'organizer@basticket.com' }, include: { organizer_profile: true } });
  if (!orgUser) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    const wallet = ethers.Wallet.createRandom();

    orgUser = await prisma.user.create({
      data: {
        email: 'organizer@basticket.com',
        full_name: 'Metastage Entertaiment',
        phone_number: '0988' + Math.floor(100000 + Math.random() * 900000).toString(),
        password_hash: hash,
        role: 'organizer', // Giả định đã được verify role organizer
        status: 'active',
        wallet_address: wallet.address,
        wallet_private_key: wallet.privateKey,
        avatar_url: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?q=80&w=250&auto=format&fit=crop',
        organizer_profile: {
          create: {
            organization_name: 'Metastage Entertaiment',
            kyc_status: 'verified',
            is_verified: true,
            description: 'Đơn vị tổ chức các sự kiện âm nhạc và giải trí hàng đầu khu vực.'
          }
        }
      },
      include: { organizer_profile: true }
    });
  } else if (!orgUser.organizer_profile) {
     // fallback if old user
     await prisma.organizer.create({
       data: {
         user_id: orgUser.id,
         organization_name: 'Metastage Entertaiment',
         kyc_status: 'verified',
         is_verified: true,
       }
     });
  }
  
  const orgProfile = await prisma.organizer.findUnique({
    where: { user_id: orgUser.id }
  });

  // 3. Create Seed Events
  const events = [
    {
      title: 'Đêm Nhạc Giao Thừa 2026',
      category_id: categories['Âm Nhạc'],
      event_date: new Date('2025-12-31T20:00:00Z'),
      event_time: '20:00',
      location_address: 'Quảng trường Lâm Viên, Đà Lạt',
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1470229722913-7c090be5a524?q=80&w=800&auto=format&fit=crop',
      description: `
        <h2>Chào đón năm mới rực rỡ cùng Đêm Nhạc Giao Thừa 2026</h2>
        <p>Hòa mình vào không khí sục sôi của khoảnh khắc chuyển giao giữa năm cũ và năm mới với dàn Lineup hàng đầu Việt Nam.</p>
        <br/>
        <h3>🎶 Lịch trình chương trình:</h3>
        <ul>
          <li><b>19:00:</b> Mở cửa đón khách & Nhạc nhẹ</li>
          <li><b>20:00:</b> Mở màn ấn tượng với DJ <b>Tiesto</b></li>
          <li><b>21:30:</b> Khách mời đặc biệt: <b>Sơn Tùng M-TP, Soobin Hoàng Sơn</b></li>
          <li><b>23:55:</b> Countdown đếm ngược</li>
          <li><b>00:00:</b> Pháo hoa rực rỡ & EDM bùng nổ</li>
        </ul>
        <br/>
        <p>Toàn bộ vé sẽ được mã hóa NFT 100% trên nền tảng BASTICKET, mua sớm để nhận những ưu đãi đặc biệt!</p>
      `,
      seating_charts: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200',
        'https://images.unsplash.com/photo-1540039155732-680f4f913d35?q=80&w=1200'
      ],
      latitude: 11.9404,
      longitude: 108.4583,
      tiers: [
        { name: 'GA - Đứng', price: 0, qty: 500 },
        { name: 'VIP - Ngồi', price: 500000, qty: 100 },
      ]
    },
    {
      title: 'Blockchain & AI Summit 2026',
      category_id: categories['Công Nghệ'],
      event_date: new Date('2026-05-15T09:00:00Z'),
      event_time: '09:00',
      location_address: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?q=80&w=800&auto=format&fit=crop',
      description: `
        <h2>Dẫn đầu kỷ nguyên Web3 và Trí tuệ Nhân tạo</h2>
        <p>Sự kiện đánh dấu cột mốc quan trọng trong sự phát triển của công nghệ tại Việt Nam.</p>
        <br/>
        <h3>🚀 Diễn giả nổi bật:</h3>
        <ul>
          <li><b>Ông Nguyễn Văn A:</b> Sáng lập Kyber Network</li>
          <li><b>Bà Trần Thị B:</b> Giảng viên AI Đại học Stanford</li>
          <li><b>Chuyên gia C:</b> Từ Google Brain</li>
        </ul>
        <br/>
        <p><i>Lưu ý:</i> Sự kiện sẽ bao gồm các phòng thảo luận (Breakout rooms) xuyên suốt buổi chiều.</p>
      `,
      tiers: [
        { name: 'Standard Pass', price: 990000, qty: 300 },
        { name: 'VIP Pass (Includes Dinner)', price: 2500000, qty: 50 },
      ]
    },
    {
      title: 'Workshop Nghệ Thuật Ánh Sáng',
      category_id: categories['Nghệ Thuật'],
      event_date: new Date('2026-06-20T14:00:00Z'),
      event_time: '14:00',
      location_address: 'Bảo tàng Mỹ Thuật TP.HCM',
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1510525009512-ad7fc13eef49?q=80&w=800&auto=format&fit=crop',
      description: `
        <h2>Khám phá nghệ thuật nhiếp ảnh với ánh sáng</h2>
        <p>Buổi workshop dành riêng cho những nhà sáng tạo nội dung và nhiếp ảnh gia đam mê ánh sáng tự nhiên và nhân tạo.</p>
        <p>Tham gia buổi workshop này, bạn sẽ học được cách Setup đèn Studio chuẩn Cinematic, cách tận dụng bóng đổ và quy tắc phối màu tương phản.</p>
      `,
      tiers: [
        { name: 'Miễn phí cho sinh viên', price: 0, qty: 50 },
        { name: 'Khách vãng lai', price: 150000, qty: 150 },
      ]
    },
    {
      title: 'Mê Cung Lễ Hội Mùa Hè',
      category_id: categories['Âm Nhạc'],
      event_date: new Date('2026-07-10T15:00:00Z'),
      event_time: '15:00',
      location_address: 'Công viên Biển Đông, Đà Nẵng',
      status: 'active',
      image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
      description: `
        <h2>Lễ hội mùa hè lớn nhất miền Trung</h2>
        <p>Cùng hòa mình cùng nước, bọt tuyết và âm nhạc xập xình trên bãi biển.</p>
        <p>Quy mô lên đến 10,000 khán giả với dàn âm thanh ánh sáng nhập khẩu 100% từ Đức.</p>
        <p><b>Dresscode:</b> Đồ bơi / Đồ đi biển.</p>
      `,
      tiers: [
        { name: 'Early Bird', price: 299000, qty: 1000 },
      ]
    }
  ];

  for (const ev of events) {
    const existing = await prisma.event.findFirst({ where: { title: ev.title } });
    if (!existing) {
      console.log(`Creating event: ${ev.title}`);
      await prisma.event.create({
        data: {
          title: ev.title,
          category_id: ev.category_id,
          organizer_id: orgProfile.id,
          event_date: ev.event_date,
          event_time: ev.event_time,
          location_address: ev.location_address,
          status: ev.status,
          image_url: ev.image_url,
          description: ev.description,
          seating_charts: ev.seating_charts || [],
          latitude: ev.latitude || null,
          longitude: ev.longitude || null,
          ticket_tiers: {
            create: ev.tiers.map(t => ({
              tier_name: t.name,
              price: t.price,
              quantity_total: t.qty,
              quantity_available: t.qty
            }))
          }
        }
      });
    } else {
      console.log(`Event ${ev.title} already exists. Skipping.`);
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
