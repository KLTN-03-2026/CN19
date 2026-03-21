const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Đọc ABI
const abiPath = path.join(__dirname, '../../config/abi.json');
const contractABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

class Web3Service {
    constructor() {
        if (!process.env.RPC_URL || !process.env.ADMIN_PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
            console.warn("⚠️ Web3Service: Thiếu cấu hình biến môi trường Web3 (.env)");
        }
        
        // Khởi tạo Provider từ RPC URL
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        // Khởi tạo Signer (Ví Admin/Platform) từ Private Key
        this.signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
        
        // Khởi tạo Smart Contract Instance
        this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, this.signer);
    }

    /**
     * @description Đúc (Mint) NFT vé và gửi về ví khách hàng
     * @param {string} toAddress Địa chỉ ví của khách hàng
     * @param {string} ticketURI Đường dẫn metadata của vé (IPFS URL hoặc Backend URL)
     * @returns {Promise<Object>} tokenId và transactionHash
     */
    async mintTicket(toAddress, ticketURI) {
        try {
            const tx = await this.contract.mintTicket(toAddress, ticketURI);
            const receipt = await tx.wait(); // Chờ giao dịch xác nhận
            
            // Tìm event TicketMinted trong receipt để lấy tokenId
            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = this.contract.interface.parseLog(log);
                    if (parsedLog && parsedLog.name === 'TicketMinted') {
                        tokenId = Number(parsedLog.args[1]); // args: [to, tokenId, uri]
                        break;
                    }
                } catch (e) {
                    continue; // Skip log không thuộc contract này
                }
            }
            return {
                tokenId,
                transactionHash: tx.hash
            };
        } catch (error) {
            console.error('Error minting ticket:', error);
            throw error;
        }
    }

    /**
     * @description Khóa vé (khi listing lên Marketplace hoặc check-in)
     * @param {number|string} tokenId 
     */
    async lockTicket(tokenId) {
        try {
            const tx = await this.contract.lockTicket(tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error locking ticket:', error);
            throw error;
        }
    }

    /**
     * @description Mở khóa vé
     * @param {number|string} tokenId 
     */
    async unlockTicket(tokenId) {
        try {
            const tx = await this.contract.unlockTicket(tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error unlocking ticket:', error);
            throw error;
        }
    }

    /**
     * @description Chuyển nhượng vé sang ví khác
     * @param {string} fromAddress 
     * @param {string} toAddress 
     * @param {number|string} tokenId 
     */
    async transferTicket(fromAddress, toAddress, tokenId) {
        try {
            // Sử dụng transferFrom để tránh lỗi ambiguous function resolution (giữa safeTransferFrom 3 params và 4 params)
            const tx = await this.contract.transferFrom(fromAddress, toAddress, tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error transferring ticket:', error);
            throw error;
        }
    }

    /**
     * @description Hủy vé (Burn)
     * @param {number|string} tokenId 
     */
    async burnTicket(tokenId) {
        try {
            const tx = await this.contract.burn(tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error burning ticket:', error);
            throw error;
        }
    }

    /**
     * @description Kiểm tra trạng thái khóa của vé
     * @param {number|string} tokenId 
     */
    async isTicketLocked(tokenId) {
        try {
            const isLocked = await this.contract.isLocked(tokenId);
            return isLocked;
        } catch (error) {
            console.error('Error checking lock status:', error);
            throw error;
        }
    }
}

module.exports = new Web3Service();
