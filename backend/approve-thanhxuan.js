require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const web3Service = require('./src/services/web3.service');

async function approveEvent() {
  console.log('🔄 Đang tiến hành phê duyệt sự kiện "Hành Trình Thanh Xuân 2026" và triển khai Smart Contract...');

  try {
    const event = await prisma.event.findUnique({
      where: { id: 'a4152c17-f845-4b06-a72e-9b67f5ef1645' },
      include: { organizer: true }
    });

    if (!event) {
      console.log('❌ Không tìm thấy sự kiện!');
      return;
    }

    if (event.status === 'active' && event.smart_contract_address) {
      console.log(`✔️ Sự kiện đã được duyệt với Hợp đồng: ${event.smart_contract_address}`);
      return;
    }

    const ownerWallet = '0x3078b443A7eC4C8bE695A2dF7a03F9629501E238'; // Admin/Relayer wallet
    console.log(`⏳ Đang gọi Web3 Service để deploy lên chuỗi khối Polygon Amoy (Owner: ${ownerWallet})...`);

    const contractAddress = await web3Service.deployEventContract(ownerWallet);
    console.log(`✅ Triển khai thành công! Địa chỉ Contract: ${contractAddress}`);

    await prisma.event.update({
      where: { id: event.id },
      data: {
        status: 'active',
        smart_contract_address: contractAddress,
        updated_at: new Date()
      }
    });

    console.log(`🎉 Đã cập nhật trạng thái 'active' và gắn Contract vào Database thành công!`);
  } catch (err) {
    console.error('❌ Lỗi khi phê duyệt:', err);
  } finally {
    await prisma.$disconnect();
  }
}

approveEvent();
