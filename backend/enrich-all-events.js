const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enrichEvents() {
  console.log('🔄 BẮT ĐẦU BỔ SUNG ĐẦY ĐỦ THÔNG TIN CÒN THIẾU CHO 9 SỰ KIỆN (Ngày kết thúc, Tọa độ bản đồ, Sơ đồ chỗ ngồi, Smart Contract, Video Trailer)...');

  try {
    const events = await prisma.event.findMany({
      include: { organizer: { select: { organization_name: true } } }
    });

    // Danh sách dữ liệu mẫu chuẩn HD để bổ sung
    const enrichDataMap = {
      'All-Star Concert The Masked Singer Vietnam 2026': {
        end_date: new Date('2026-11-15T23:30:00Z'),
        end_time: '23:30',
        latitude: 10.771521,
        longitude: 106.657531, // SVĐ Phú Thọ
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540039155732-680f4f913d35?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        is_featured: true,
        refund_deadline_days: 5,
        price_ceiling: 10000000,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true
      },
      'Live Concert Rap Việt Mùa 5 - Bứt Phá Giới Hạn': {
        end_date: new Date('2026-10-25T23:00:00Z'),
        end_time: '23:00',
        latitude: 10.732541,
        longitude: 106.719812, // SECC
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x1111511874e0d4E98956B2c3B9139ab6b9C78921',
        is_featured: true,
        refund_deadline_days: 3,
        price_ceiling: 25000000,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true
      },
      'Fan Meeting & Giao Lưu Anh Trai Say Hi 2026': {
        end_date: new Date('2026-09-18T22:00:00Z'),
        end_time: '22:00',
        latitude: 10.776111,
        longitude: 106.691421, // Nguyễn Du
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x9999990874e0d4E98956B2c3B9139ab6b9C79999',
        is_featured: false,
        refund_deadline_days: 7,
        price_ceiling: 5000000,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true
      },
      'Công Chiếu Đặc Biệt & Red Carpet Phim Điện Ảnh Lật Mặt 8': {
        end_date: new Date('2026-08-30T21:30:00Z'),
        end_time: '21:30',
        latitude: 10.795211,
        longitude: 106.721831, // Landmark 81
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x8888880874e0d4E98956B2c3B9139ab6b9C88888',
        is_featured: false,
        refund_deadline_days: 2,
        price_ceiling: 1000000,
        allow_resale: false,
        allow_transfer: true,
        allow_refund: false
      },
      'Đại Nhạc Hội Giao Thừa BASTICKET Countdown 2026': {
        end_date: new Date('2027-01-01T00:30:00Z'),
        end_time: '00:30',
        latitude: 21.031812,
        longitude: 105.852531, // Hoàn Kiếm
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1470229722913-7c090be5a524?w=1200&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540039155732-680f4f913d35?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
        is_featured: true,
        refund_deadline_days: 5,
        price_ceiling: 5000000,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true
      },
      'Lễ Hội Âm Nhạc Điện Tử EDM WaterWorld 2026': {
        end_date: new Date('2026-07-20T23:30:00Z'),
        end_time: '23:30',
        latitude: 16.068321,
        longitude: 108.245112, // Công viên Biển Đông Đà Nẵng
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x1234567890123456789012345678901234567890',
        is_featured: true,
        refund_deadline_days: 7,
        price_ceiling: 20000000,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true
      },
      'Hội Nghị Công Nghệ Blockchain & Trí Tuệ Nhân Tạo 2026': {
        end_date: new Date('2026-08-15T17:30:00Z'),
        end_time: '17:30',
        latitude: 21.006921,
        longitude: 105.786512, // NCC Hà Nội
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x3333333333333333333333333333333333333333',
        is_featured: false,
        refund_deadline_days: 10,
        price_ceiling: 10000000,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true
      },
      'Giải Chạy Bộ Marathon Vượt Núi Basticket Trail 2026': {
        end_date: new Date('2026-09-10T15:00:00Z'),
        end_time: '15:00',
        latitude: 11.956821,
        longitude: 108.452931, // Đà Lạt
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x4444444444444444444444444444444444444444',
        is_featured: false,
        refund_deadline_days: 14,
        price_ceiling: 3000000,
        allow_resale: false,
        allow_transfer: true,
        allow_refund: true
      },
      'Triển Lãm Nghệ Thuật Đương Đại & Ánh Sáng 3D': {
        end_date: new Date('2026-10-05T21:00:00Z'),
        end_time: '21:00',
        latitude: 10.768912,
        longitude: 106.698521, // Bảo tàng Mỹ thuật Q1
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [
          'https://images.unsplash.com/photo-1531058020387-3be344554be6?w=1200&auto=format&fit=crop&q=80'
        ],
        smart_contract_address: '0x5555555555555555555555555555555555555555',
        is_featured: false,
        refund_deadline_days: 1,
        price_ceiling: 500000,
        allow_resale: true,
        allow_transfer: true,
        allow_refund: true
      }
    };

    let updatedCount = 0;
    for (const ev of events) {
      const dataToMerge = enrichDataMap[ev.title] || {
        end_date: new Date(new Date(ev.event_date).getTime() + 4 * 3600 * 1000), // Mặc định +4 tiếng
        end_time: '23:00',
        latitude: 10.776,
        longitude: 106.701,
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        seating_charts: [ev.image_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819'],
        smart_contract_address: '0x9999999999999999999999999999999999999999',
        refund_deadline_days: 5,
        price_ceiling: 5000000
      };

      await prisma.event.update({
        where: { id: ev.id },
        data: dataToMerge
      });
      console.log(`✔️ Đã bổ sung thông tin cho: "${ev.title}"`);
      updatedCount++;
    }

    console.log('--------------------------------------------------');
    console.log(`🎉 ĐÃ BỔ SUNG THÀNH CÔNG THÔNG TIN CAO CẤP CHO TOÀN BỘ ${updatedCount} SỰ KIỆN!`);
    console.log('Tọa độ Google Maps, Sơ đồ khán đài, Hạn hoàn vé, Smart contract và Video đều đã hoàn chỉnh.');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Lỗi khi bổ sung thông tin sự kiện:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enrichEvents();
