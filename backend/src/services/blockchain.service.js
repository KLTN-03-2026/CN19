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

  /**
   * Ghi lại thông tin tài chính siêu chi tiết lên Blockchain để đối soát
   * @param {string} orderId Mã đơn hàng
   * @param {number} totalAmount Tổng tiền thanh toán
   * @param {object} fees Đối tượng chứa các loại phí { ticketPlatformFee, ticketCommissionFee, merchPlatformFee, merchCommissionFee, gasFee, royaltyFee }
   * @param {string} type 'PRIMARY_PURCHASE', 'RESALE_PURCHASE', 'TRANSFER_FEE'
   * @param {string} payerAddress Địa chỉ ví người trả tiền
   */
  async logFinancialTransaction(orderId, totalAmount, fees = {}, type, payerAddress = ethers.ZeroAddress) {
    try {
      console.log(`[Web3] Logging granular financial transaction for Order: ${orderId}...`);
      
      const { 
        ticketPlatformFee = 0, 
        ticketCommissionFee = 0, 
        merchPlatformFee = 0, 
        merchCommissionFee = 0, 
        gasFee = 0, 
        royaltyFee = 0 
      } = fees;

      const tx = await this.contract.logFinancialTransaction(
        orderId, 
        BigInt(Math.round(totalAmount)), 
        BigInt(Math.round(ticketPlatformFee)), 
        BigInt(Math.round(ticketCommissionFee)), 
        BigInt(Math.round(merchPlatformFee)), 
        BigInt(Math.round(merchCommissionFee)), 
        BigInt(Math.round(gasFee)), 
        BigInt(Math.round(royaltyFee)), 
        type, 
        payerAddress
      );
      
      const receipt = await tx.wait();
      console.log(`[Web3] Granular financial transaction logged. TxHash: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('[Web3] Lỗi khi ghi log tài chính chi tiết lên Blockchain:', error);
      return null;
    }
  }

  /**
   * Truy vấn log tài chính chi tiết từ Blockchain theo OrderId
   */
  async getFinancialLog(orderId) {
    try {
      const filter = this.contract.filters.FinancialLog(orderId);
      const events = await this.contract.queryFilter(filter, 0, 'latest');
      
      if (events.length === 0) return null;
      
      const latestEvent = events[events.length - 1];
      const { 
        totalAmount, 
        ticketPlatformFee, 
        ticketCommissionFee, 
        merchPlatformFee, 
        merchCommissionFee, 
        gasFee, 
        royaltyFee, 
        transactionType, 
        payer, 
        timestamp 
      } = latestEvent.args;
      
      return {
        totalAmount: Number(totalAmount),
        ticketPlatformFee: Number(ticketPlatformFee),
        ticketCommissionFee: Number(ticketCommissionFee),
        merchPlatformFee: Number(merchPlatformFee),
        merchCommissionFee: Number(merchCommissionFee),
        gasFee: Number(gasFee),
        royaltyFee: Number(royaltyFee),
        transactionType,
        payer,
        timestamp: Number(timestamp)
      };
    } catch (error) {
      console.error('[Web3] Lỗi khi truy vấn log tài chính chi tiết:', error);
      return null;
    }
  }
}

module.exports = new BlockchainService();
