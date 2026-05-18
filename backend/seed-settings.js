require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSystemSettings() {
  console.log('🔄 Đang đồng bộ hóa toàn bộ Cấu hình Hệ thống (System Settings) vào Supabase Cloud...');

  const defaultSettings = [
    { key: 'site_name', value: 'BASTICKET' },
    { key: 'support_email', value: 'support@basticket.com' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'event_platform_fee_percent', value: '5' },
    { key: 'event_transaction_fee_percent', value: '3' },
    { key: 'product_platform_fee_percent', value: '5' },
    { key: 'product_transaction_fee_percent', value: '3' },
    { key: 'resale_price_cap_percent', value: '8' },
    { key: 'resale_transaction_fee_percent', value: '1' },
    { key: 'withdrawal_fee_percent', value: '2' },
    { key: 'min_withdrawal_amount', value: '50000' },
    { key: 'default_royalty_percent', value: '3' },
    { key: 'system_gas_fee', value: '10000' },
    { key: 'bot_risk_threshold', value: '0.7' },
    { key: 'smart_contract_address', value: process.env.CONTRACT_ADDRESS || '0x9711005b6f9AC6953c41A5Bb3d86a7549a9084EE' },
    { key: 'rpc_url', value: process.env.RPC_URL || 'https://rpc-amoy.polygon.technology/' }
  ];

  try {
    for (const item of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value }
      });
      console.log(`✔️ Đã đồng bộ cấu hình: [${item.key}] -> ${item.value}`);
    }
    console.log('🎉 Toàn bộ cấu hình hệ thống & thông số Blockchain đã được đồng bộ hoàn chỉnh trên Supabase!');
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ cấu hình hệ thống:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSystemSettings();
