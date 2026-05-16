const prisma = require('../src/config/prisma');

async function main() {
  const configs = [
    { key: 'smart_contract_address', value: process.env.CONTRACT_ADDRESS || '0x9711005b6f9AC6953c41A5Bb3d86a7549a9084EE' },
    { key: 'rpc_url', value: process.env.RPC_URL || 'https://rpc-amoy.polygon.technology/' },
    { key: 'site_name', value: 'BASTICKET' },
    { key: 'support_email', value: 'support@basticket.com' }
  ];

  for (const config of configs) {
    await prisma.systemSetting.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value }
    });
  }
  
  console.log('Successfully synced system settings from .env');
  await prisma.$disconnect();
}

main();
