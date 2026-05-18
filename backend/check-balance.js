require('dotenv').config();
const { ethers } = require('ethers');

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = '0x3078b443A7eC4C8bE695A2dF7a03F9629501E238';
  try {
    const balance = await provider.getBalance(wallet);
    console.log(`💰 Số dư hiện tại của ví Relayer (${wallet}): ${ethers.formatEther(balance)} POL`);
  } catch (err) {
    console.error('❌ Lỗi:', err);
  }
}
checkBalance();
