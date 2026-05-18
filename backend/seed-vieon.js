const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');

async function seedVieON() {
  console.log('🚀 BẮT ĐẦU TẠO DỮ LIỆU ĐỐI TÁC VIEON (4 Sự kiện đã Smart Contract, 4 Sản phẩm, 2 Blog)...');

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    const orgWallet = ethers.Wallet.createRandom();

    // 1. Kiểm tra/Tạo danh mục
    const catNames = ['Âm nhạc', 'Sân khấu', 'Điện ảnh & Chiếu phim', 'Hài kịch & Stand-up'];
    const categories = {};
    for (const name of catNames) {
      let cat = await prisma.category.findUnique({ where: { name } });
      if (!cat) {
        cat = await prisma.category.create({ data: { name, is_active: true } });
      }
      categories[name] = cat.id;
    }

    // 2. Tạo tài khoản VieON
    let vieonUser = await prisma.user.findUnique({ where: { email: 'vieon@basticket.com' } });
    if (!vieonUser) {
      console.log('➕ Đang tạo tài khoản BTC: vieon@basticket.com');
      vieonUser = await prisma.user.create({
        data: {
          email: 'vieon@basticket.com',
          full_name: 'VieON Entertainment JSC',
          phone_number: '0909888999',
          password_hash: hash,
          role: 'organizer',
          status: 'active',
          wallet_address: orgWallet.address,
          wallet_private_key: orgWallet.privateKey,
          avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
          organizer_profile: {
            create: {
              organization_name: 'VieON Entertainment',
              kyc_status: 'verified',
              is_verified: true,
              description: 'Hệ sinh thái giải trí siêu ứng dụng VieON - Nơi sản xuất và phát hành các show truyền hình thực tế hàng đầu Việt Nam như Rap Việt, Ca Sĩ Mặt Nạ (The Masked Singer), Anh Trai Say Hi.'
            }
          }
        }
      });
    }

    const orgProfile = await prisma.organizer.findUnique({
      where: { user_id: vieonUser.id }
    });

    // 3. Tạo 4 Sự kiện VieON (Đã thực thi Smart Contract)
    console.log('🎪 Đang tạo 4 Sự kiện siêu khủng của VieON (Đã có Smart Contract)...');
    const eventsData = [
      {
        title: 'All-Star Concert The Masked Singer Vietnam 2026',
        category_id: categories['Âm nhạc'],
        event_date: new Date('2026-11-15T19:30:00Z'),
        event_time: '19:30',
        location_address: 'Sân vận động Phú Thọ, 219 Lý Thường Kiệt, Quận 11, TP.HCM',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
        description: 'Đại nhạc hội hội tụ toàn bộ 18 linh vật mascot đình đám với dàn nhạc giao hưởng trực tiếp và hệ thống âm thanh ánh sáng đỉnh cao quốc tế.',
        smart_contract: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        tiers: [
          { name: 'VVIP - Ghế Sofa sát sân khấu', price: 4000000, qty: 200 },
          { name: 'VIP - Khu vực trung tâm', price: 2500000, qty: 800 },
          { name: 'GA - Khán đài tự do', price: 1000000, qty: 2000 }
        ]
      },
      {
        title: 'Live Concert Rap Việt Mùa 5 - Bứt Phá Giới Hạn',
        category_id: categories['Âm nhạc'],
        event_date: new Date('2026-10-25T19:00:00Z'),
        event_time: '19:00',
        location_address: 'Trung tâm Hội nghị và Triển lãm SECC, Quận 7, TP.HCM',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
        description: 'Đêm nhạc bùng nổ cùng 4 Huấn luyện viên, 3 Giám khảo và top 16 thí sinh xuất sắc nhất Rap Việt mùa 5.',
        smart_contract: '0x1111511874e0d4E98956B2c3B9139ab6b9C78921',
        tiers: [
          { name: 'President Table (Bàn 6 người + Rượu)', price: 18000000, qty: 30 },
          { name: 'Fanzone Sát Sân Khấu', price: 1800000, qty: 1000 },
          { name: 'GA Khán Đài B', price: 800000, qty: 1500 }
        ]
      },
      {
        title: 'Fan Meeting & Giao Lưu Anh Trai Say Hi 2026',
        category_id: categories['Sân khấu'],
        event_date: new Date('2026-09-18T18:00:00Z'),
        event_time: '18:00',
        location_address: 'Nhà thi đấu Nguyễn Du, Quận 1, TP.HCM',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80',
        description: 'Sự kiện giao lưu độc quyền, tham gia minigame và chụp ảnh 1-1 cùng 30 "Anh Trai" hot nhất mạng xã hội.',
        smart_contract: '0x9999990874e0d4E98956B2c3B9139ab6b9C79999',
        tiers: [
          { name: 'VIP Meet & Greet (Chụp ảnh riêng)', price: 2500000, qty: 300 },
          { name: 'GA Thường', price: 600000, qty: 1200 }
        ]
      },
      {
        title: 'Công Chiếu Đặc Biệt & Red Carpet Phim Điện Ảnh Lật Mặt 8',
        category_id: categories['Điện ảnh & Chiếu phim'],
        event_date: new Date('2026-08-30T17:30:00Z'),
        event_time: '17:30',
        location_address: 'Vincom Landmark 81, Bình Thạnh, TP.HCM',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
        description: 'Tham dự sự kiện thảm đỏ ra mắt siêu phẩm hành động Lật Mặt 8 cùng đạo diễn Lý Hải và dàn diễn viên chính.',
        smart_contract: '0x8888880874e0d4E98956B2c3B9139ab6b9C88888',
        tiers: [
          { name: 'Red Carpet Premiere Pass', price: 350000, qty: 500 }
        ]
      }
    ];

    const createdEvents = [];
    for (const ev of eventsData) {
      let existingEvent = await prisma.event.findFirst({ where: { title: ev.title } });
      if (!existingEvent) {
        existingEvent = await prisma.event.create({
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
            smart_contract_address: ev.smart_contract,
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
        console.log(`✔️ Đã tạo sự kiện Smart Contract: "${ev.title}"`);
      }
      createdEvents.push(existingEvent);
    }

    // 4. Tạo 4 Sản phẩm Merchandise
    console.log('🛍️ Đang tạo 4 vật phẩm thương mại độc quyền của VieON...');
    const merchData = [
      {
        organizer_id: orgProfile.id,
        event_id: createdEvents[0].id, // Ca Sĩ Mặt Nạ
        name: 'Set Thẻ Bo Góc (Photocard) Độc Quyền Ca Sĩ Mặt Nạ',
        description: 'Bộ sưu tập 18 thẻ photocard tráng gương lấp lánh in hình các linh vật mascot có chữ ký tay.',
        price: 120000,
        stock: 1000,
        image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        organizer_id: orgProfile.id,
        event_id: createdEvents[1].id, // Rap Việt
        name: 'Áo Hoodie Oversize Rap Việt Official Mùa 5',
        description: 'Áo nỉ ngoại cao cấp form rộng in họa tiết Graffiti đường phố chuẩn hiphop mùa 5.',
        price: 650000,
        stock: 400,
        image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        organizer_id: orgProfile.id,
        event_id: createdEvents[2].id, // Anh Trai Say Hi
        name: 'Bình Giữ Nhiệt Khắc Laser Logo Anh Trai Say Hi',
        description: 'Bình thép không gỉ 304 dung tích 750ml hiển thị nhiệt độ cảm ứng trên nắp bình.',
        price: 250000,
        stock: 600,
        image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        organizer_id: orgProfile.id,
        event_id: null, // Sản phẩm chung
        name: 'Túi Tote Canvas VieON VIP Member Premium',
        description: 'Túi vải canvas dày dặn, thân thiện môi trường dành riêng cho hội viên VIP của ứng dụng VieON.',
        price: 150000,
        stock: 500,
        image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
        is_active: true
      }
    ];

    for (const m of merchData) {
      const existing = await prisma.merchandise.findFirst({ where: { name: m.name } });
      if (!existing) {
        await prisma.merchandise.create({ data: m });
        console.log(`✔️ Đã tạo Vật phẩm: "${m.name}"`);
      }
    }

    // 5. Tạo 2 bài Blog VieON
    console.log('📰 Đang tạo 2 bài Blog tin tức của VieON...');
    const blogsData = [
      {
        author_id: vieonUser.id,
        event_id: createdEvents[0].id,
        title: 'VieON chính thức công bố bán vé All-Star Concert The Masked Singer trên nền tảng NFT BASTICKET',
        slug: 'vieon-cong-bo-ban-ve-allstar-concert-nft-basticket',
        type: 'ORGANIZER_NEWS',
        status: 'published',
        views: 1250,
        image_url: createdEvents[0].image_url,
        content: `
<h2>1. Sự hợp tác bùng nổ giữa VieON và BASTICKET</h2>
<p>VieON chính thức áp dụng giải pháp phát hành vé NFT và hợp đồng thông minh (Smart Contract) cho toàn bộ khán giả mua vé All-Star Concert nhằm xóa sổ hoàn toàn nạn vé giả và phe vé chợ đen.</p>
<h2>2. Quyền lợi đặc quyền cho chủ sở hữu vé NFT</h2>
<p>Mỗi vé không chỉ là thẻ vào cổng mà còn là một tài sản số duy nhất mang giá trị sưu tầm lâu dài.</p>
        `
      },
      {
        author_id: vieonUser.id,
        event_id: createdEvents[1].id,
        title: 'Hé lộ sơ đồ sân khấu 360 độ cực khủng của Live Concert Rap Việt Mùa 5',
        slug: 'he-lo-so-do-san-khau-360-rap-viet-mua-5',
        type: 'ORGANIZER_NEWS',
        status: 'published',
        views: 940,
        image_url: createdEvents[1].image_url,
        content: `
<h2>1. Thiết kế sân khấu trung tâm đẳng cấp quốc tế</h2>
<p>Lần đầu tiên tại Việt Nam, một đêm nhạc Rap được dàn dựng với sân khấu xoay 360 độ, đảm bảo mọi vị trí khán đài đều có tầm nhìn hoàn hảo.</p>
<h2>2. Sơ đồ các khu vực vé</h2>
<p>Khán giả khu vực President Table và Fanzone sẽ được trải nghiệm trọn vẹn sức nóng và hiệu ứng khói lửa ngay sát sân khấu.</p>
        `
      }
    ];

    for (const b of blogsData) {
      const existing = await prisma.blog.findUnique({ where: { slug: b.slug } });
      if (!existing) {
        await prisma.blog.create({ data: b });
        console.log(`✔️ Đã tạo Blog: "${b.title}"`);
      }
    }

    console.log('--------------------------------------------------');
    console.log('🎉 TOÀN BỘ DỮ LIỆU ĐỐI TÁC VIEON ĐÃ ĐƯỢC KHỞI TẠO THÀNH CÔNG!');
    console.log('👉 Tài khoản VieON: vieon@basticket.com / 123456');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo dữ liệu VieON:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedVieON();
