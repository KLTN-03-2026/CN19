const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

/**
 * Service để tương tác với Smart Contract BASTicketNFT trên Blockchain
 * Hệ thống sẽ tự trả phí Gas để Mint vé cho khách hàng
 */
class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
    this.wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Load ABI từ thư mục smart-contracts
    const abiPath = path.join(__dirname, '../../../smart-contracts/artifacts/contracts/BASTicketNFT.sol/BASTicketNFT.json');
    if (!fs.existsSync(abiPath)) {
        console.error('❌ ABI not found at:', abiPath);
        return;
    }
    const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    this.abi = artifact.abi;
    
    this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallet);
  }

  /**
   * Đúc vé NFT mới cho khách hàng
   * @param {string} toAddress Địa chỉ ví của khách hàng
   * @param {string} tokenURI Link metadata của vé (IPFS hoặc Pinata)
   * @returns {Promise<object>} { tokenId, txHash }
   */
  async mintTicket(toAddress, tokenURI) {
    try {
      console.log(`[Web3] Bắt đầu mint vé cho ví: ${toAddress}...`);
      
      const tx = await this.contract.mintTicket(toAddress, tokenURI);
      const receipt = await tx.wait();
      
      // Parse event từ receipt để lấy TokenId
      // Sự kiện: TicketMinted(address indexed to, uint256 indexed tokenId, string uri)
      const event = receipt.logs.find(log => {
          try {
              const decoded = this.contract.interface.parseLog(log);
              return decoded.name === 'TicketMinted';
          } catch (e) { return false; }
      });
      
      const decodedEvent = this.contract.interface.parseLog(event);
      const tokenId = decodedEvent.args.tokenId.toString();

      console.log(`[Web3] Mint vé thành công! TokenId: ${tokenId}, TxHash: ${receipt.hash}`);
      
      return {
        tokenId,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('[Web3] Lỗi khi Mint vé:', error);
      throw new Error('Không thể đúc vé NFT lên Blockchain.');
    }
  }
}

module.exports = new BlockchainService();
