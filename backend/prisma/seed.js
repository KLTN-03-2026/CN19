const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Đang bắt đầu làm sạch và sinh dữ liệu mẫu (Seed Data)...');

  // 1. Clear dữ liệu cũ (Chú ý thứ tự khóa ngoại)
  console.log('Xóa dữ liệu cũ...');
  await prisma.orderItem.deleteMany();
  await prisma.marketplaceTransaction.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.ticketTransfer.deleteMany();
  await prisma.scanHistory.deleteMany();
  await prisma.dynamicQRToken.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticketTier.deleteMany();
  await prisma.eventStaffAssignment.deleteMany();
  await prisma.escrowPayout.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.organizer.deleteMany();
  await prisma.adminActionLog.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);

  // 2. Phân quyền và Tạo User Admin
  console.log('Tạo Users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@basticket.com',
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      phone_number: '0901234567'
    }
  });

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@gmail.com',
      password_hash: passwordHash,
      role: 'customer',
      status: 'active',
      wallet_address: '0xabc123456789customerwallet',
      phone_number: '0987654321',
      date_of_birth: new Date('1998-05-15')
    }
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff1@basticket.com',
      password_hash: passwordHash,
      role: 'staff',
      status: 'active',
      phone_number: '0912345678'
    }
  });

  // 3. Tạo Organizer
  const organizerUser = await prisma.user.create({
    data: {
      email: 'organizer@congty.com',
      password_hash: passwordHash,
      role: 'organizer',
      status: 'active',
      phone_number: '0922222222'
    }
  });

  const organizerProfile = await prisma.organizer.create({
    data: {
      user_id: organizerUser.id,
      organization_name: 'Công ty Tổ chức Sự kiện BAS',
      kyc_status: 'approved',
      is_verified: true
    }
  });

  // 4. Tạo Danh mục Sự kiện
  console.log('Tạo Danh mục...');
  const catMusic = await prisma.category.create({ data: { name: 'Âm nhạc' } });
  const catSport = await prisma.category.create({ data: { name: 'Thể thao' } });
  const catTech = await prisma.category.create({ data: { name: 'Công nghệ' } });

  // 5. Tạo Sự kiện mẫu
  console.log('Tạo Sự kiện...');
  const event1 = await prisma.event.create({
    data: {
      organizer_id: organizerProfile.id,
      category_id: catMusic.id,
      title: 'Đêm Nhạc Giao Thừa 2026',
      event_date: new Date('2026-12-31T19:00:00Z'),
      event_time: '19:00',
      status: 'active',
      allow_resale: true,
      allow_transfer: true,
      allow_refund: true,
      price_ceiling: 5000000,
      royalty_fee_percent: 5.0,
      smart_contract_address: '0xmocksmartcontractevent1'
    }
  });

  const event2 = await prisma.event.create({
    data: {
      organizer_id: organizerProfile.id,
      category_id: catTech.id,
      title: 'Hội nghị AI Việt Nam',
      event_date: new Date('2027-04-20T08:00:00Z'),
      event_time: '08:00',
      status: 'active',
      allow_resale: false,
      allow_transfer: false,
      allow_refund: true,
      royalty_fee_percent: 0.0
    }
  });

  // 6. Tạo Vé (Ticket Tiers) cho Sự kiện 1
  console.log('Tạo Hạng vé...');
  await prisma.ticketTier.createMany({
    data: [
      {
        event_id: event1.id,
        tier_name: 'V.I.P',
        section_name: 'Khu V',
        benefits: 'Đồ uống miễn phí, Lối đi riêng, Giao lưu CS',
        price: 2500000,
        quantity_total: 100,
        quantity_available: 100
      },
      {
        event_id: event1.id,
        tier_name: 'Standard',
        section_name: 'Khu A',
        benefits: 'Vé phổ thông',
        price: 800000,
        quantity_total: 1000,
        quantity_available: 1000
      }
    ]
  });

  // Tạo Vé cho Sự kiện 2
  await prisma.ticketTier.create({
    data: {
      event_id: event2.id,
      tier_name: 'Early Bird',
      price: 350000,
      quantity_total: 50,
      quantity_available: 50
    }
  });

  console.log('✅ Seed Database thành công!');
  console.log('-------------------------------');
  console.log('Tài khoản test (Mật khẩu: 123456):');
  console.log('- Admin: admin@basticket.com');
  console.log('- Customer: customer1@gmail.com');
  console.log('- Organizer: organizer@congty.com');
  console.log('- Staff: staff1@basticket.com');
}

main()
  .catch((e) => {
    console.error('Lỗi khi Seed DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
