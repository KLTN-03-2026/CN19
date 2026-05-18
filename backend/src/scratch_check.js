require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const blockchainService = require('./services/blockchain.service');

async function testQuery() {
  const id = 'd3863b37-b42d-45ec-87d6-8861247137d9';
  const order = await prisma.order.findUnique({
      where: { id },
      include: { tickets: true }
  });

  const mintHash = '0xebac52941f28ca1ca2decc4b8d32b7c1c972f59c129565aad53f5c266033ae84';
  const mintTx = await blockchainService.provider.getTransaction(mintHash);
  
  const fromBlock = mintTx.blockNumber - 10;
  const toBlock = mintTx.blockNumber + 200; // range 210

  console.log('Filtering logs with CHUNKS:');
  console.log('- fromBlock:', fromBlock);
  console.log('- toBlock:', toBlock);

  const filter = blockchainService.contract.filters.FinancialLog(order.order_number);
  
  const chunkSize = 90;
  let currentFrom = fromBlock;
  let events = [];

  while (currentFrom < toBlock) {
      const currentTo = Math.min(currentFrom + chunkSize, toBlock);
      console.log(`Scanning block chunk: [${currentFrom} - ${currentTo}]`);
      try {
          const chunkEvents = await blockchainService.contract.queryFilter(filter, currentFrom, currentTo);
          if (chunkEvents && chunkEvents.length > 0) {
              events = chunkEvents;
              console.log(`✅ Found events in chunk!`);
              break;
          }
      } catch (chunkErr) {
          console.warn(`Lỗi quét chunk [${currentFrom} - ${currentTo}]:`, chunkErr.message);
      }
      currentFrom = currentTo + 1;
  }

  console.log('Events length:', events.length);
  if (events && events.length > 0) {
      console.log('SUCCESS! EVENT transactionHash:', events[events.length - 1].transactionHash);
  } else {
      console.log('No events found!');
  }
}

testQuery().catch(console.error).finally(() => prisma.$disconnect());
