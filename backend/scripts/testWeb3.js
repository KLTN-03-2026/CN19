require('dotenv').config();
const web3Service = require('../src/services/web3.service');

async function test() {
    console.log('Testing Web3Service...');
    try {
        console.log('Minting ticket 1...');
        const toAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat Account #1
        const { tokenId, transactionHash } = await web3Service.mintTicket(toAddress, 'ipfs://test-uri');
        console.log('✅ Minted Token ID:', tokenId);
        console.log('✅ Tx Hash:', transactionHash);
        
        console.log('Checking lock status...');
        const locked = await web3Service.isTicketLocked(tokenId);
        console.log('Lock status:', locked);

        console.log('Done!');
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
