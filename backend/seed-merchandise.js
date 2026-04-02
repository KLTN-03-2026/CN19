const prisma = require('./src/config/prisma');

async function seedMerchandise() {
  try {
    // Tìm organizer đầu tiên
    const organizer = await prisma.organizer.findFirst();
    if (!organizer) {
      console.log('❌ Không tìm thấy Organizer. Hãy tạo tài khoản BTC trước.');
      return;
    }
    console.log(`✅ Organizer: ${organizer.organization_name} (${organizer.id})`);

    // Tìm event đầu tiên của organizer này
    const event = await prisma.event.findFirst({ where: { organizer_id: organizer.id } });
    if (event) {
      console.log(`✅ Event: ${event.title} (${event.id})`);
    } else {
      console.log('⚠️ Không tìm thấy Event — sẽ tạo tất cả sản phẩm dạng "bán chung".');
    }

    // Xóa merchandise cũ (nếu có)
    await prisma.merchandise.deleteMany({ where: { organizer_id: organizer.id } });
    console.log('🗑️  Đã xóa merchandise cũ.');

    // Tạo 3 sản phẩm
    const products = [
      {
        organizer_id: organizer.id,
        event_id: null, // Bán chung
        name: 'Combo Bắp Nước',
        description: 'Combo 1 bắp rang bơ lớn + 1 nước ngọt Coca-Cola 500ml. Nhận tại quầy sự kiện.',
        price: 89000,
        stock: 200,
        image_url: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400',
        is_active: true
      },
      {
        organizer_id: organizer.id,
        event_id: event?.id || null, // Gắn sự kiện cụ thể (nếu có)
        name: 'Lightstick Official',
        description: 'Lightstick chính thức phiên bản giới hạn. Có thể kết nối Bluetooth để đồng bộ hiệu ứng ánh sáng trong concert.',
        price: 450000,
        stock: 50,
        image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
        is_active: true
      },
      {
        organizer_id: organizer.id,
        event_id: event?.id || null, // Gắn sự kiện cụ thể (nếu có)
        name: 'Photocard Set Limited',
        description: 'Bộ 5 photocard phiên bản giới hạn, in chất lượng cao trên giấy glossy. Mỗi set ngẫu nhiên.',
        price: 150000,
        stock: 100,
        image_url: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400',
        is_active: true
      }
    ];

    for (const p of products) {
      const created = await prisma.merchandise.create({ data: p });
      const scope = p.event_id ? `🎯 Sự kiện: ${event?.title}` : '🌐 Bán chung';
      console.log(`  ✅ ${created.name} — ${p.price.toLocaleString()}đ — ${scope}`);
    }

    console.log('\n🎉 Seed merchandise hoàn tất! Có 3 sản phẩm.');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedMerchandise();
