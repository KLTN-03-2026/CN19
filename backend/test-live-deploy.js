require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, '../smart-contracts/artifacts/contracts/BASTicketNFT.sol/BASTicketNFT.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const contractABI = artifact.abi;
const contractBytecode = artifact.bytecode;

async function testLiveDeploy() {
  console.log('📡 Đang kết nối trực tiếp tới Polygon Amoy mà không qua Fallback...');
  const rpcUrl = process.env.RPC_URL;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  console.log('Ví Relayer/Admin:', signer.address);

  try {
    const balance = await provider.getBalance(signer.address);
    console.log(`💰 Số dư POL: ${ethers.formatEther(balance)} POL`);

    if (balance === 0n) {
      console.log('❌ Lỗi: Ví Admin hết sạch POL gas trên mạng Amoy!');
      return;
    }

    const feeData = await provider.getFeeData();
    console.log(`⛽ Phí Gas: Base = ${ethers.formatUnits(feeData.gasPrice || 0n, 'gwei')} gwei`);

    const factory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
    console.log('⏳ Đang gửi giao dịch Deploy Hợp đồng thật...');
    
    const initialOwner = '0x3078b443A7eC4C8bE695A2dF7a03F9629501E238';
    const contract = await factory.deploy(initialOwner);
    
    console.log(`📜 Transaction Hash: ${contract.deploymentTransaction().hash}`);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`✅ Thành công! Địa chỉ Hợp đồng thật: ${address}`);
  } catch (err) {
    console.error('❌ Lỗi chi tiết khi deploy hợp đồng thật:', err);
  }
}

testLiveDeploy();
