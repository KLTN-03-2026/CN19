const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');

async function seedOrganizerFull() {
  console.log('🚀 BẮT ĐẦU TẠO TÀI KHOẢN BTC, NHÂN VIÊN VÀ DỮ LIỆU ĐẦY ĐỦ (5 Sự kiện, 2 Blog, 3 Sản phẩm)...');

  try {
    // 1. Chuẩn bị mã hóa mật khẩu & ví
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    const orgWallet = ethers.Wallet.createRandom();
    const staffWallet = ethers.Wallet.createRandom();

    // 2. Lấy hoặc tạo danh mục
    const catNames = ['Âm nhạc', 'Lễ hội & EDM', 'Hội thảo', 'Thể thao', 'Triển lãm'];
    const categories = {};
    for (const name of catNames) {
      let cat = await prisma.category.findUnique({ where: { name } });
      if (!cat) {
        cat = await prisma.category.create({ data: { name, is_active: true } });
      }
      categories[name] = cat.id;
    }

    // 3. Tạo tài khoản Ban tổ chức
    let orgUser = await prisma.user.findUnique({ where: { email: 'organizer@basticket.com' } });
    if (!orgUser) {
      console.log('➕ Đang tạo tài khoản BTC: organizer@basticket.com');
      orgUser = await prisma.user.create({
        data: {
          email: 'organizer@basticket.com',
          full_name: 'Công ty Giải trí BASTICKET Live',
          phone_number: '0901234567',
          password_hash: hash,
          role: 'organizer',
          status: 'active',
          wallet_address: orgWallet.address,
          wallet_private_key: orgWallet.privateKey,
          avatar_url: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=400&auto=format&fit=crop&q=80',
          organizer_profile: {
            create: {
              organization_name: 'BASTICKET Live Entertainment',
              kyc_status: 'verified',
              is_verified: true,
              description: 'Đơn vị tổ chức sự kiện biểu diễn, lễ hội âm nhạc và hội nghị công nghệ chuyên nghiệp hàng đầu châu Á.'
            }
          }
        }
      });
    }

    const orgProfile = await prisma.organizer.findUnique({
      where: { user_id: orgUser.id }
    });

    // 4. Tạo tài khoản Nhân viên (Staff)
    let staffUser = await prisma.user.findUnique({ where: { email: 'staff@basticket.com' } });
    if (!staffUser) {
      console.log('➕ Đang tạo tài khoản Nhân viên: staff@basticket.com');
      staffUser = await prisma.user.create({
        data: {
          email: 'staff@basticket.com',
          full_name: 'Nhân viên Kiểm soát Cổng 1',
          phone_number: '0912345678',
          password_hash: hash,
          role: 'staff',
          status: 'active',
          wallet_address: staffWallet.address,
          wallet_private_key: staffWallet.privateKey,
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
        }
      });
    }

    // 5. Tạo 5 Sự kiện hoành tráng
    console.log('🎪 Đang tạo 5 Sự kiện cao cấp cho Ban tổ chức...');
    const eventsData = [
      {
        title: 'Đại Nhạc Hội Giao Thừa BASTICKET Countdown 2026',
        category_id: categories['Âm nhạc'],
        event_date: new Date('2026-12-31T19:00:00Z'),
        event_time: '19:00',
        location_address: 'Quảng trường Đông Kinh Nghĩa Thục, Hoàn Kiếm, Hà Nội',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1470229722913-7c090be5a524?w=1200&auto=format&fit=crop&q=80',
        description: 'Đêm nhạc đếm ngược chào năm mới lớn nhất Việt Nam với dàn ca sĩ hạng A và hiệu ứng ánh sáng Laser đỉnh cao.',
        tiers: [{ name: 'GA - Đứng', price: 500000, qty: 1000 }, { name: 'VIP - Ngồi gần sân khấu', price: 1500000, qty: 300 }]
      },
      {
        title: 'Lễ Hội Âm Nhạc Điện Tử EDM WaterWorld 2026',
        category_id: categories['Lễ hội & EDM'],
        event_date: new Date('2026-07-20T16:00:00Z'),
        event_time: '16:00',
        location_address: 'Công viên Biển Đông, TP. Đà Nẵng',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
        description: 'Đại tiệc âm thanh và bọt nước mùa hè với sự góp mặt của Top 10 DJ thế giới cùng 20,000 ravers.',
        tiers: [{ name: 'Early Bird GA', price: 650000, qty: 800 }, { name: 'VVIP Table 6 người', price: 12000000, qty: 50 }]
      },
      {
        title: 'Hội Nghị Công Nghệ Blockchain & Trí Tuệ Nhân Tạo 2026',
        category_id: categories['Hội thảo'],
        event_date: new Date('2026-08-15T08:30:00Z'),
        event_time: '08:30',
        location_address: 'Trung tâm Hội nghị Quốc gia, Nam Từ Liêm, Hà Nội',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        description: 'Diễn đàn cấp cao thảo luận về tương lai của Web3, Hợp đồng thông minh và ứng dụng AI sinh học trong tài chính.',
        tiers: [{ name: 'Standard Delegate Pass', price: 1200000, qty: 500 }, { name: 'VIP Executive Pass', price: 3500000, qty: 100 }]
      },
      {
        title: 'Giải Chạy Bộ Marathon Vượt Núi Basticket Trail 2026',
        category_id: categories['Thể thao'],
        event_date: new Date('2026-09-10T05:00:00Z'),
        event_time: '05:00',
        location_address: 'Thung lũng tình yêu, TP. Đà Lạt, Lâm Đồng',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
        description: 'Thử thách băng qua các rừng thông và đồi chè tuyệt đẹp với các cự ly 10KM, 21KM, 42KM và 70KM Siêu Marathon.',
        tiers: [{ name: 'Bib 21KM Half Marathon', price: 850000, qty: 600 }, { name: 'Bib 42KM Full Marathon', price: 1250000, qty: 400 }]
      },
      {
        title: 'Triển Lãm Nghệ Thuật Đương Đại & Ánh Sáng 3D',
        category_id: categories['Triển lãm'],
        event_date: new Date('2026-10-05T09:00:00Z'),
        event_time: '09:00',
        location_address: 'Bảo tàng Mỹ thuật Thành phố, Quận 1, TP.HCM',
        status: 'approved',
        image_url: 'https://images.unsplash.com/photo-1531058020387-3be344554be6?w=1200&auto=format&fit=crop&q=80',
        description: 'Không gian sắp đặt tương tác kết hợp nghệ thuật thị giác và công nghệ chiếu hình Mapping 360 độ.',
        tiers: [{ name: 'Vé vào cổng duy nhất', price: 200000, qty: 1500 }]
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
        console.log(`✔️ Đã tạo sự kiện: "${ev.title}"`);
      }
      createdEvents.push(existingEvent);
    }

    // 6. Phân công nhân viên cho 2 sự kiện đầu
    console.log('👥 Đang phân công nhân viên kiểm soát cổng...');
    for (let i = 0; i < 2; i++) {
      const ev = createdEvents[i];
      const existingAssign = await prisma.eventStaffAssignment.findFirst({
        where: { event_id: ev.id, staff_id: staffUser.id }
      });
      if (!existingAssign) {
        await prisma.eventStaffAssignment.create({
          data: { event_id: ev.id, staff_id: staffUser.id, creator_id: orgUser.id }
        });
      }
    }

    // 7. Tạo 2 bài Blog của Ban tổ chức
    console.log('📰 Đang tạo 2 bài Blog tin tức của Ban tổ chức...');
    const blogsData = [
      {
        author_id: orgUser.id,
        event_id: createdEvents[0].id,
        title: 'BASTICKET Live công bố chuỗi 5 siêu sự kiện hoành tráng nửa cuối năm 2026',
        slug: 'basticket-live-cong-bo-chuoi-5-sieu-su-kien-2026',
        type: 'ORGANIZER_NEWS',
        status: 'published',
        views: 450,
        image_url: createdEvents[0].image_url,
        content: `
<h2>1. Khởi động nửa cuối năm bùng nổ cùng BASTICKET Live</h2>
<p>Công ty Giải trí BASTICKET Live trân trọng giới thiệu chuỗi 5 dự án lễ hội, hội nghị và thể thao đẳng cấp nhất Đông Nam Á, được áp dụng toàn bộ công nghệ vé NFT và check-in sinh trắc học AI.</p>
<h2>2. Tâm điểm Countdown Giao Thừa 2026</h2>
<p>Sự kiện hứa hẹn mang lại những màn trình diễn pháo hoa rực rỡ và sân khấu hoành tráng chưa từng có. Hãy đặt vé ngay hôm nay để nhận quyền lợi ưu tiên check-in VIP!</p>
        `
      },
      {
        author_id: orgUser.id,
        event_id: createdEvents[3].id,
        title: 'Bí quyết chuẩn bị thể lực cho giải chạy bộ Basticket Mountain Trail 2026',
        slug: 'bi-quyet-chuan-bi-the-luc-marathon-trail-2026',
        type: 'ORGANIZER_NEWS',
        status: 'published',
        views: 680,
        image_url: createdEvents[3].image_url,
        content: `
<h2>1. Chinh phục địa hình đồi núi Đà Lạt</h2>
<p>Giải chạy bộ địa hình đòi hỏi vận động viên phải có sự tích lũy về sức bền và kỹ năng leo dốc. Bài viết này sẽ hướng dẫn các bạn cách phân phối sức lực và lựa chọn giày chạy trail phù hợp nhất.</p>
<h2>2. Dinh dưỡng và nước uống trên đường chạy</h2>
<p>Hãy đảm bảo mang đủ nước điện giải và gel năng lượng tại các trạm tiếp nước (Check-point) của Ban tổ chức.</p>
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

    // 8. Tạo 3 Sản phẩm (Merchandise)
    console.log('🛍️ Đang tạo 3 vật phẩm thương mại (Merchandise)...');
    const merchData = [
      {
        organizer_id: orgProfile.id,
        event_id: null, // Sản phẩm chung
        name: 'Áo Thun BASTICKET Live Phiên Bản Giới Hạn 2026',
        description: 'Áo thun cotton 100% cao cấp in logo phản quang BASTICKET Live cực chất dành cho fan hâm mộ.',
        price: 250000,
        stock: 500,
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        organizer_id: orgProfile.id,
        event_id: createdEvents[0].id, // Gắn sự kiện 1
        name: 'Gậy Cổ Vũ (Lightstick) Đêm Nhạc Countdown 2026',
        description: 'Lightstick đổi màu theo điệu nhạc được đồng bộ không dây với hệ thống ánh sáng tổng của sân khấu.',
        price: 150000,
        stock: 1000,
        image_url: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&auto=format&fit=crop&q=80',
        is_active: true
      },
      {
        organizer_id: orgProfile.id,
        event_id: createdEvents[3].id, // Gắn sự kiện 4
        name: 'Mũ Thể Thao Chạy Bộ Basticket Trail Runner',
        description: 'Mũ lưỡi trai siêu nhẹ, chống tia UV và thoát mồ hôi cực nhanh dành cho các runner chinh phục cự ly Ultra.',
        price: 180000,
        stock: 300,
        image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80',
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

    console.log('--------------------------------------------------');
    console.log('🎉 TOÀN BỘ DỮ LIỆU BAN TỔ CHỨC ĐÃ ĐƯỢC KHỞI TẠO HOÀN HẢO!');
    console.log('👉 Tài khoản BTC: organizer@basticket.com / 123456');
    console.log('👉 Tài khoản Nhân viên: staff@basticket.com / 123456');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo dữ liệu Ban tổ chức:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOrganizerFull();
