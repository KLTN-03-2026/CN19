const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Wiping all events and related records...");
  await prisma.scanHistory.deleteMany();
  await prisma.dynamicQRToken.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.marketplaceTransaction.deleteMany();
  await prisma.marketplaceListing.deleteMany();
  await prisma.ticketTransfer.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.botDetectionLog.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ticketTier.deleteMany();
  await prisma.emergencyRequest.deleteMany();
  await prisma.eventStaffAssignment.deleteMany();
  await prisma.escrowPayout.deleteMany();
  await prisma.event.deleteMany();
  console.log("Success wiping events!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
