const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Đang bắt đầu làm sạch và sinh dữ liệu mẫu TOÀN DIỆN (Comprehensive Seed Data)...');

  // 1. Clear dữ liệu cũ theo thứ tự khóa ngoại ngược (Dependency order)
  console.log('Xóa dữ liệu cũ...');
  const deleteOrder = [
    'ScanHistory', 'DynamicQRToken', 'MarketplaceTransaction', 'MarketplaceListing', 
    'TicketTransfer', 'RefundRequest', 'OrderItem', 'Ticket', 'Order', 'TicketTier', 
    'EventStaffAssignment', 'EscrowPayout', 'EmergencyRequest', 'Event', 'Category', 
    'Organizer', 'AdminActionLog', 'Notification', 'BotDetectionLog', 'User'
  ];

  for (const table of deleteOrder) {
    try {
      process.stdout.write(`  - Xóa ${table}... `);
      await prisma[table[0].toLowerCase() + table.slice(1)].deleteMany();
      console.log('✅');
    } catch (e) {
      console.log(`❌ Bỏ qua (${e.message})`);
    }
  }

  console.log('---');
  const passwordHash = await bcrypt.hash('123456', 10);
  console.log('Đã hash xong mật khẩu.');

  // 2. Tạo Users (Đầy đủ các role)
  console.log('Tạo người dùng mẫu...');
  const usersData = [
    { email: 'admin@basticket.com', role: 'admin', full_name: 'Hệ Thống BASTICKET' },
    { email: 'organizer@congty.com', role: 'organizer', full_name: 'Nguyễn Văn BTC' },
    { email: 'staff1@basticket.com', role: 'staff', full_name: 'Trần Văn Soát Vé 1' },
    { email: 'staff2@basticket.com', role: 'staff', full_name: 'Lê Thị Kiểm Soát 2' },
    { email: 'customer1@gmail.com', role: 'customer', full_name: 'Phạm Minh Khách 1' },
    { email: 'customer2@gmail.com', role: 'customer', full_name: 'Hoàng Ánh Khách 2' },
  ];

  const users = {};
  for (const u of usersData) {
    const created = await prisma.user.create({
      data: {
        ...u,
        password_hash: passwordHash,
        status: 'active',
        phone_number: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        wallet_address: `0x${Math.random().toString(16).slice(2, 42)}`
      }
    });
    users[u.email] = created;
  }

  // 3. Tạo Organizer Profile
  console.log('Tạo hồ sơ Ban tổ chức...');
  const organizerProfile = await prisma.organizer.create({
    data: {
      user_id: users['organizer@congty.com'].id,
      organization_name: 'Công ty Tổ chức Sự kiện BAS (BAS Events)',
      kyc_status: 'approved',
      is_verified: true,
      description: 'Chuyên tổ chức các sự kiện âm nhạc và công nghệ quy mô lớn.'
    }
  });

  // 4. Tạo Danh mục
  console.log('Tạo danh mục sự kiện...');
  const categories = {};
  const catNames = ['Âm nhạc', 'Workshop', 'Thể thao', 'Công nghệ'];
  for (const name of catNames) {
    const created = await prisma.category.create({ data: { name } });
    categories[name] = created;
  }

  // 5. Tạo Sự kiện mẫu (Vòng đời sự kiện)
  console.log('Tạo sự kiện mẫu...');
  const event1 = await prisma.event.create({
    data: {
      organizer_id: organizerProfile.id,
      category_id: categories['Âm nhạc'].id,
      title: 'Đêm Nhạc Giao Thừa 2026',
      event_date: new Date('2026-12-31T19:00:00Z'),
      status: 'active',
      allow_resale: true,
      allow_transfer: true,
      allow_refund: true,
      royalty_fee_percent: 5.0,
      smart_contract_address: '0xevent1contractaddressmock'
    }
  });
  console.log('Đã tạo sự kiện 1.');

  const event2 = await prisma.event.create({
    data: {
      organizer_id: organizerProfile.id,
      category_id: categories['Công nghệ'].id,
      title: 'Hội nghị Web3 & Blockchain',
      event_date: new Date('2027-01-15T08:00:00Z'),
      status: 'active',
      allow_resale: true,
      allow_transfer: true
    }
  });

  const eventDraft = await prisma.event.create({
    data: {
      organizer_id: organizerProfile.id,
      category_id: categories['Workshop'].id,
      title: 'Hướng dẫn đúc NFT cho nghệ sĩ',
      event_date: new Date('2026-06-01T14:00:00Z'),
      status: 'draft'
    }
  });

  // 6. Phân công nhân sự
  console.log('Phân công nhân viên...');
  await prisma.eventStaffAssignment.createMany({
    data: [
      { staff_id: users['staff1@basticket.com'].id, event_id: event1.id, creator_id: users['organizer@congty.com'].id },
      { staff_id: users['staff1@basticket.com'].id, event_id: event2.id, creator_id: users['organizer@congty.com'].id },
      { staff_id: users['staff2@basticket.com'].id, event_id: event1.id, creator_id: users['organizer@congty.com'].id }
    ]
  });

  // 7. Tạo Hạng vé
  console.log('Tạo hạng vé...');
  const tierVip = await prisma.ticketTier.create({
    data: {
      event_id: event1.id,
      tier_name: 'S-VIP (Gần sân khấu)',
      section_name: 'ZONE-A',
      price: 3500000,
      quantity_total: 50,
      quantity_available: 50
    }
  });
  console.log('Đã tạo hạng vé VIP.');

  const tierStd = await prisma.ticketTier.create({
    data: {
      event_id: event1.id,
      tier_name: 'Standard (Khán đài)',
      section_name: 'ZONE-B',
      price: 850000,
      quantity_total: 500,
      quantity_available: 500
    }
  });

  // 8. GIẢ LẬP VÒNG ĐỜI VÉ (Vô cùng quan trọng cho testing)
  console.log('Giả lập vòng đời vé (Orders, Tickets, History)...');

  // a. Khách 1 mua vé trực tiếp
  const order1 = await prisma.order.create({
    data: {
      customer_id: users['customer1@gmail.com'].id,
      event_id: event1.id,
      order_number: 'ORD-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      status: 'completed',
      subtotal: 4350000,
      platform_fee: 50000,
      total_amount: 4400000,
      payment_method: 'VNPay',
      transaction_id: 'TXN-123456',
      total_amount: 4400000,
      expires_at: new Date(Date.now() + 86400000)
    }
  });

  // b. Tạo 2 vé NFT tương ứng
  const ticket1 = await prisma.ticket.create({
    data: {
      order_id: order1.id,
      event_id: event1.id,
      ticket_tier_id: tierVip.id,
      ticket_number: 'TKT-' + Math.random().toString(16).substring(2, 10).toUpperCase(),
      nft_token_id: '1',
      nft_mint_tx_hash: '0xminttxhash1',
      status: 'minted',
      current_owner_id: users['customer1@gmail.com'].id,
      original_buyer_id: users['customer1@gmail.com'].id
    }
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      order_id: order1.id,
      event_id: event1.id,
      ticket_tier_id: tierStd.id,
      ticket_number: 'TKT-' + Math.random().toString(16).substring(2, 10).toUpperCase(),
      nft_token_id: '2',
      nft_mint_tx_hash: '0xminttxhash2',
      status: 'used', // GIẢ LẬP LÀ ĐÃ SỬ DỤNG
      is_used: true,
      checked_in_at: new Date(),
      current_owner_id: users['customer1@gmail.com'].id,
      original_buyer_id: users['customer1@gmail.com'].id
    }
  });

  // c. GIẢ LẬP CHUYỂN NHƯỢNG: Customer 1 chuyển vé 1 sang Customer 2
  await prisma.ticketTransfer.create({
    data: {
      ticket_id: ticket1.id,
      from_user_id: users['customer1@gmail.com'].id,
      to_user_id: users['customer2@gmail.com'].id,
      event_id: event1.id,
      transfer_method: 'direct',
      status: 'completed',
      nft_transfer_tx_hash: '0xtransfertxhash1',
      completed_at: new Date()
    }
  });

  // Cập nhật chủ sở hữu vé 1
  await prisma.ticket.update({
    where: { id: ticket1.id },
    data: { 
      current_owner_id: users['customer2@gmail.com'].id,
      is_transferred: true 
    }
  });

  // d. GIẢ LẬP MUA BÁN LẠI: Customer 2 rao bán vé 1 và Customer 1 mua lại (vòng lặp sở hữu)
  const listing = await prisma.marketplaceListing.create({
    data: {
      ticket_id: ticket1.id,
      seller_id: users['customer2@gmail.com'].id,
      event_id: event1.id,
      listing_number: 'LST-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      asking_price: 3800000,
      status: 'sold',
      sold_at: new Date()
    }
  });

  await prisma.marketplaceTransaction.create({
    data: {
      listing_id: listing.id,
      ticket_id: ticket1.id,
      seller_id: users['customer2@gmail.com'].id,
      buyer_id: users['customer1@gmail.com'].id,
      seller_receive_amount: 3610000,
      platform_fee: 190000,
      buyer_pay_amount: 3800000,
      status: 'completed',
      nft_transfer_tx_hash: '0xresaletxhash1'
    }
  });

  // Cập nhật lại chủ sở hữu cho Customer 1
  await prisma.ticket.update({
    where: { id: ticket1.id },
    data: { 
      current_owner_id: users['customer1@gmail.com'].id,
      status: 'minted' 
    }
  });

  // e. GIẢ LẬP YÊU CẦU HOÀN TIỀN
  await prisma.refundRequest.create({
    data: {
      ticket_id: ticket1.id,
      customer_id: users['customer1@gmail.com'].id,
      status: 'pending',
      refund_amount: 3300000
    }
  });

  // 9. Thống kê vé cuối cùng cho Tiers
  await prisma.ticketTier.update({ where: { id: tierVip.id }, data: { quantity_available: 49 } });
  await prisma.ticketTier.update({ where: { id: tierStd.id }, data: { quantity_available: 499 } });

  console.log('✅ Seed Database thành công HẬU CẦN TOÀN DIỆN!');
  console.log('--------------------------------------------------');
  console.log('Dữ liệu đã đầy đủ mọi bảng: Staff, Orders, Tickets, History, Marketplace, Refunds.');
  console.log('Bạn có thể đăng nhập BTC: organizer@congty.com / 123456');
}

main()
  .catch((e) => {
    console.error('Lỗi khi Seed DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
