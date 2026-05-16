const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log('--- Database Wipe Operation Started ---');

  try {
    // 1. Identify Admin Users to keep
    const admins = await prisma.user.findMany({
      where: { role: 'admin' }
    });
    const adminIds = admins.map(a => a.id);
    console.log(`Found ${admins.length} Admin account(s) to keep:`, admins.map(a => a.email).join(', '));

    // 2. Clear transactional/child data first (Bottom-up)
    console.log('Clearing transactional data...');
    await prisma.merchandiseScanHistory.deleteMany({});
    await prisma.merchandiseOrderItem.deleteMany({});
    await prisma.scanHistory.deleteMany({});
    await prisma.dynamicQRToken.deleteMany({});
    await prisma.ticketTransfer.deleteMany({});
    await prisma.marketplaceTransaction.deleteMany({});
    await prisma.marketplaceListing.deleteMany({});
    await prisma.refundRequest.deleteMany({});
    await prisma.escrowPayout.deleteMany({});
    await prisma.emergencyRequest.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.withdrawalRequest.deleteMany({});
    await prisma.walletTransaction.deleteMany({});
    
    // Clear blogs and social interactions
    await prisma.like.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.blogReport.deleteMany({});
    await prisma.blog.deleteMany({});

    // Clear tickets and orders
    await prisma.ticket.deleteMany({});
    await prisma.order.deleteMany({});
    
    // Clear staff assignments
    await prisma.eventStaffAssignment.deleteMany({});

    // Clear Ticket Tiers (Foreign Key to Event)
    await prisma.ticketTier.deleteMany({});
    
    // Clear merchandise and events
    await prisma.merchandise.deleteMany({});
    await prisma.event.deleteMany({});
    
    // Clear organizers
    await prisma.organizer.deleteMany({});
    
    // Clear logs and notifications
    await prisma.notification.deleteMany({});
    await prisma.adminActionLog.deleteMany({});
    await prisma.botDetectionLog.deleteMany({});
    
    // 3. Clear non-admin users
    console.log('Removing non-admin users...');
    const deleteUsersResult = await prisma.user.deleteMany({
      where: {
        id: { notIn: adminIds }
      }
    });
    console.log(`Removed ${deleteUsersResult.count} non-admin user accounts.`);

    // 4. Clear categories
    await prisma.category.deleteMany({});
    console.log('Removed all event categories.');

    // 5. Re-seed essential categories so Organizer UI works when testing
    const catNames = ['Âm nhạc', 'Workshop', 'Thể thao', 'Công nghệ'];
    for (const name of catNames) {
      await prisma.category.create({ data: { name, is_active: true } });
    }
    console.log('✅ Re-seeded 4 essential categories for event creation testing.');

    console.log('--- Database Wipe Operation Completed Successfully ---');
    console.log('Status: Only Admin accounts remain.');
  } catch (error) {
    console.error('Critical Error during wipe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
