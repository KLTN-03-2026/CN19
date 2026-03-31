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
    await prisma.scanHistory.deleteMany({});
    await prisma.dynamicQRToken.deleteMany({});
    await prisma.ticketTransfer.deleteMany({});
    await prisma.marketplaceTransaction.deleteMany({});
    await prisma.marketplaceListing.deleteMany({});
    await prisma.refundRequest.deleteMany({});
    await prisma.escrowPayout.deleteMany({});
    await prisma.emergencyRequest.deleteMany({});
    await prisma.orderItem.deleteMany({});
    
    // Clear tickets and orders
    await prisma.ticket.deleteMany({});
    await prisma.order.deleteMany({});
    
    // Clear staff assignments
    await prisma.eventStaffAssignment.deleteMany({});

    // Clear Ticket Tiers (Foreign Key to Event)
    await prisma.ticketTier.deleteMany({});
    
    // Clear events
    await prisma.event.deleteMany({});
    
    // Clear organizers (keeping the admin relationship safe if they are also organizers, though usually they aren't)
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

    // 4. Clear categories (Optional, but user said "wipe EVERYTHING")
    // If you want to keep categories, comment this out.
    await prisma.category.deleteMany({});
    console.log('Removed all event categories.');

    console.log('--- Database Wipe Operation Completed Successfully ---');
    console.log('Status: Only Admin accounts remain.');
  } catch (error) {
    console.error('Critical Error during wipe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
