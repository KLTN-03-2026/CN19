const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Deep Check for "user.jpg" in Database ---');
  
  const models = ['User', 'Organizer', 'Category', 'Event', 'TicketTier', 'Order', 'OrderItem', 'Ticket', 'MarketplaceListing', 'MarketplaceTransaction', 'TicketTransfer', 'BotDetectionLog', 'ScanHistory', 'RefundRequest', 'EscrowPayout', 'DynamicQRToken', 'AdminActionLog', 'Notification'];

  for (const modelName of models) {
    const model = prisma[modelName.toLowerCase()];
    if (!model) continue;

    const records = await model.findMany();
    for (const record of records) {
      const recordStr = JSON.stringify(record);
      if (recordStr.includes('user.jpg')) {
        console.log(`Match found in ${modelName}:`, record);
      }
    }
  }
  console.log('--- Check Complete ---');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
