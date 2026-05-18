require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const web3Service = require('./src/services/web3.service');

async function testMintOrder() {
  console.log('🔄 Đang kiểm tra và đúc lại vé cho đơn hàng 99b96c2b...');

  try {
    const order = await prisma.order.findUnique({
      where: { id: '99b96c2b-343f-4f75-a30b-75620d6208c7' },
      include: { 
        event: true, 
        tickets: true,
        customer: true 
      }
    });

    if (!order) {
      console.log('❌ Không tìm thấy đơn hàng!');
      return;
    }

    const toWallet = order.customer.wallet_address || '0x3078b443A7eC4C8bE695A2dF7a03F9629501E238';
    const contractAddress = order.event.smart_contract_address || process.env.CONTRACT_ADDRESS;

    console.log(`📌 Đơn hàng ${order.order_number}: Khách hàng ${order.customer.email} (Ví: ${toWallet})`);
    console.log(`📌 Smart Contract: ${contractAddress}`);

    for (const ticket of order.tickets) {
      console.log(`\n⏳ Đang tiến hành đúc vé ${ticket.ticket_number} (ID: ${ticket.id})...`);
      const tokenURI = `https://api.basticket.site/metadata/${ticket.id}`;

      try {
        const res = await web3Service.mintTicket(contractAddress, toWallet, tokenURI);
        console.log(`✅ Đúc thành công! TokenId = ${res.tokenId}, TxHash = ${res.transactionHash}`);

        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            nft_token_id: String(res.tokenId),
            nft_mint_tx_hash: res.transactionHash,
            nft_token_uri: tokenURI,
            status: 'minted'
          }
        });
        console.log(`✔️ Đã cập nhật Database thành công cho vé ${ticket.ticket_number}`);
      } catch (err) {
        console.error(`❌ Lỗi khi đúc vé ${ticket.ticket_number}:`, err.message);
      }
    }

    console.log('\n🎉 Hoàn tất kiểm tra và đúc vé!');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testMintOrder();
