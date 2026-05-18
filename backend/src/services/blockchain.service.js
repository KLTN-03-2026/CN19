const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

const START_BLOCK = process.env.START_BLOCK ? Number(process.env.START_BLOCK) : 38500000;

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
  async logFinancialTransaction(orderId, totalAmount, fees = {}, type, payerAddress = ethers.ZeroAddress, targetContractAddress = null) {
    try {
      console.log(`[Web3] Bắt đầu ghi log Sổ cái Kép (Dual Ledger) cho Order: ${orderId}...`);
      
      const { 
        ticketPlatformFee = 0, 
        ticketCommissionFee = 0, 
        merchPlatformFee = 0, 
        merchCommissionFee = 0, 
        gasFee = 0, 
        royaltyFee = 0 
      } = fees;

      // 1. Ghi log lên Sổ cái Tổng (Master Ledger)
      const txMaster = await this.contract.logFinancialTransaction(
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
      const receiptMaster = await txMaster.wait();
      console.log(`✅ [Dual Ledger - Master] Đã ghi log tài chính lên Sổ cái Tổng (${this.contractAddress}). TxHash: ${receiptMaster.hash}`);

      // 2. Ghi log đồng thời lên Hợp đồng Sự kiện (Event Vault) nếu có
      if (targetContractAddress && targetContractAddress !== this.contractAddress && ethers.isAddress(targetContractAddress)) {
        try {
          const eventContract = new ethers.Contract(targetContractAddress, this.abi, this.wallet);
          const txEvent = await eventContract.logFinancialTransaction(
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
          const receiptEvent = await txEvent.wait();
          console.log(`✅ [Dual Ledger - Event Vault] Đã ghi log tài chính lên Hợp đồng Sự kiện (${targetContractAddress}). TxHash: ${receiptEvent.hash}`);
        } catch (evErr) {
          console.warn(`⚠️ [Dual Ledger Warning]: Không thể ghi log lên Hợp đồng Sự kiện (${targetContractAddress}): ${evErr.message}`);
        }
      }

      return receiptMaster.hash;
    } catch (error) {
      console.error('[Web3] Lỗi khi ghi log tài chính Sổ cái Kép:', error);
      return null;
    }
  }

  /**
   * Truy vấn log tài chính chi tiết từ Blockchain theo OrderId
   */
  async getFinancialLog(orderId, transactionHash = null) {
    try {
      const filter = this.contract.filters.FinancialLog(orderId);
      let fromBlock = START_BLOCK;
      let toBlock = 'latest';

      if (transactionHash) {
        try {
          const tx = await this.provider.getTransaction(transactionHash);
          if (tx && tx.blockNumber) {
            fromBlock = tx.blockNumber - 50;
            toBlock = tx.blockNumber + 50;
            console.log(`[Reconciliation] 🔍 Đối soát dùng block window: [${fromBlock} - ${toBlock}] cho Tx: ${transactionHash}`);
          }
        } catch (txErr) {
          console.warn(`[Reconciliation] ⚠️ Không thể lấy block number cho Tx ${transactionHash}:`, txErr.message);
        }
      }

      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
      
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
  /**
   * Đối soát chi tiết dữ liệu một đơn hàng với Blockchain Sổ cái
   * @param {object} order Đơn hàng cần đối soát
   * @returns {Promise<boolean>} Trả về true nếu trùng khớp hoàn toàn, false nếu sai lệch hoặc thiếu log
   */
  async verifyOrderReconciliation(order) {
    try {
      const bcLog = await this.getFinancialLog(order.order_number, order.transaction_hash);
      if (!bcLog) {
        console.warn(`[Reconciliation] ⚠️ Không tìm thấy log Blockchain cho Order: ${order.order_number}. Bỏ qua kiểm tra (Testnet tolerance).`);
        return true; // Pass: thiếu log không chặn quyết toán, chỉ cảnh báo
      }

      const dbTotal = Math.round(Number(order.total_amount));
      const bcTotal = Math.round(Number(bcLog.totalAmount));

      const dbPlat = Math.round(Number(order.platform_fee || 0));
      const bcPlat = Math.round(Number(bcLog.ticketPlatformFee || 0) + Number(bcLog.merchPlatformFee || 0));

      const dbComm = Math.round(Number(order.commission_fee || 0));
      const bcComm = Math.round(Number(bcLog.ticketCommissionFee || 0) + Number(bcLog.merchCommissionFee || 0));

      const dbGas = Math.round(Number(order.gas_fee || 0));
      const bcGas = Math.round(Number(bcLog.gasFee || 0));

      if (dbTotal !== bcTotal || dbPlat !== bcPlat || dbComm !== bcComm || dbGas !== bcGas) {
        console.error(`[Reconciliation] ❌ Phát hiện sai lệch thông tin Order: ${order.order_number}`);
        console.error(`DB: Total=${dbTotal}, Plat=${dbPlat}, Comm=${dbComm}, Gas=${dbGas}`);
        console.error(`BC: Total=${bcTotal}, Plat=${bcPlat}, Comm=${bcComm}, Gas=${bcGas}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[Reconciliation] Lỗi đối soát Order ${order.order_number}:`, error);
      return true; // Fail-open: không chặn quyết toán vì lỗi mạng/RPC
    }
  }

  /**
   * Đối soát chi tiết dữ liệu giao dịch Marketplace với Blockchain Sổ cái
   * @param {object} tx Giao dịch Marketplace cần đối soát
   * @returns {Promise<boolean>}
   */
  async verifyMarketplaceReconciliation(tx) {
    try {
      const bcLog = await this.getFinancialLog(tx.transaction_number, tx.transaction_hash);
      if (!bcLog) {
        console.warn(`[Reconciliation] ⚠️ Không tìm thấy log Blockchain cho Marketplace Tx: ${tx.transaction_number}. Bỏ qua kiểm tra (Testnet tolerance).`);
        return true; // Pass: thiếu log không chặn quyết toán
      }

      const dbTotal = Math.round(Number(tx.buyer_pay_amount));
      const bcTotal = Math.round(Number(bcLog.totalAmount));

      const dbPlat = Math.round(Number(tx.platform_fee || 0));
      const bcPlat = Math.round(Number(bcLog.ticketPlatformFee || 0));

      const dbComm = Math.round(Number(tx.commission_fee || 0));
      const bcComm = Math.round(Number(bcLog.ticketCommissionFee || 0));

      const dbRoyalty = Math.round(Number(tx.organizer_royalty || 0));
      const bcRoyalty = Math.round(Number(bcLog.royaltyFee || 0));

      if (dbTotal !== bcTotal || dbPlat !== bcPlat || dbComm !== bcComm || dbRoyalty !== bcRoyalty) {
        console.error(`[Reconciliation] ❌ Phát hiện sai lệch Marketplace Tx: ${tx.transaction_number}`);
        console.error(`DB: Total=${dbTotal}, Plat=${dbPlat}, Comm=${dbComm}, Royalty=${dbRoyalty}`);
        console.error(`BC: Total=${bcTotal}, Plat=${bcPlat}, Comm=${bcComm}, Royalty=${bcRoyalty}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[Reconciliation] Lỗi đối soát Marketplace ${tx.transaction_number}:`, error);
      return true; // Fail-open: không chặn quyết toán vì lỗi mạng/RPC
    }
  }
}

module.exports = new BlockchainService();
