const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Đọc ABI và Bytecode từ Artifacts của Hardhat
const artifactPath = path.join(__dirname, '../../../smart-contracts/artifacts/contracts/BASTicketNFT.sol/BASTicketNFT.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const contractABI = artifact.abi;
const contractBytecode = artifact.bytecode;

class Web3Service {
    constructor() {
        if (!process.env.RPC_URL || !process.env.ADMIN_PRIVATE_KEY) {
            console.warn("⚠️ Web3Service: Thiếu cấu hình biến môi trường Web3 (RPC_URL hoặc ADMIN_PRIVATE_KEY)");
        }
        
        // Khởi tạo Provider từ RPC URL
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        // Khởi tạo Signer (Ví Admin/Platform) từ Private Key
        this.signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
        
        // Khởi tạo Smart Contract Instance (Dùng cho các hàm mint/lock chung nếu cần)
        if (process.env.CONTRACT_ADDRESS) {
            this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, this.signer);
        }
    }

    /**
     * @description Triển khai (Deploy) một Smart Contract NFT mới cho sự kiện
     * @param {string} initialOwner Địa chỉ ví BTC (hoặc Admin) sẽ sở hữu contract này
     * @returns {Promise<string>} Địa chỉ Smart Contract sau khi deploy thành công
     */
    async deployEventContract(initialOwner) {
        try {
            console.log('----------------------------------------------------');
            console.log(`📡 [Web3] Bắt đầu triển khai Smart Contract...`);
            console.log(`👤 Chủ sở hữu dự kiến: ${initialOwner}`);
            
            if (!ethers.isAddress(initialOwner)) {
                console.error(`❌ Lỗi: Địa chỉ ví không hợp lệ: ${initialOwner}`);
                throw new Error(`Invalid wallet address: ${initialOwner}`);
            }

            console.log(`🔗 Đang kết nối tới RPC: ${process.env.RPC_URL}`);
            const network = await this.provider.getNetwork();
            console.log(`✅ Đã kết nối tới mạng: ${network.name} (ChainID: ${network.chainId})`);

            const factory = new ethers.ContractFactory(contractABI, contractBytecode, this.signer);
            
            console.log(`⏳ Đang gửi giao dịch Deploy...`);
            const contract = await factory.deploy(initialOwner);
            
            console.log(`📜 Transaction Hash: ${contract.deploymentTransaction().hash}`);
            console.log(`⏳ Đang chờ xác nhận từ Blockchain (Mining)...`);
            
            await contract.waitForDeployment();
            
            const address = await contract.getAddress();
            console.log(`✅ Smart Contract đã được triển khai tại: ${address}`);
            console.log('----------------------------------------------------');
            return address;
        } catch (error) {
            console.error('❌ [Web3 Service Error]:', error);
            throw error;
        }
    }

    /**
     * @description Đúc (Mint) NFT vé và gửi về ví khách hàng
     * @param {string} contractAddress Địa chỉ contract của sự kiện
     * @param {string} toAddress Địa chỉ ví của khách hàng
     * @param {string} ticketURI Đường dẫn metadata của vé
     */
    async mintTicket(contractAddress, toAddress, ticketURI) {
        try {
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const tx = await eventContract.mintTicket(toAddress, ticketURI);
            const receipt = await tx.wait();
            
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
     * @param {string} contractAddress
     * @param {number|string} tokenId 
     */
    async lockTicket(contractAddress, tokenId) {
        try {
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const tx = await eventContract.lockTicket(tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error locking ticket:', error);
            throw error;
        }
    }

    /**
     * @description Mở khóa vé
     * @param {string} contractAddress
     * @param {number|string} tokenId 
     */
    async unlockTicket(contractAddress, tokenId) {
        try {
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const tx = await eventContract.unlockTicket(tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error unlocking ticket:', error);
            throw error;
        }
    }

    /**
     * @description Chuyển nhượng vé sang ví khác
     * @param {string} contractAddress
     * @param {string} fromAddress 
     * @param {string} toAddress 
     * @param {number|string} tokenId 
     */
    async transferTicket(contractAddress, fromAddress, toAddress, tokenId) {
        try {
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            // Sử dụng transferFrom để tránh lỗi ambiguous function resolution (giữa safeTransferFrom 3 params và 4 params)
            const tx = await eventContract.transferFrom(fromAddress, toAddress, tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error transferring ticket:', error);
            throw error;
        }
    }

    /**
     * @description Hủy vé (Burn)
     * @param {string} contractAddress
     * @param {number|string} tokenId 
     */
    async burnTicket(contractAddress, tokenId) {
        try {
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const tx = await eventContract.burn(tokenId);
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error burning ticket:', error);
            throw error;
        }
    }

    /**
     * @description Kiểm tra trạng thái khóa của vé
     * @param {string} contractAddress
     * @param {number|string} tokenId 
     */
    async isTicketLocked(contractAddress, tokenId) {
        try {
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const isLocked = await eventContract.isLocked(tokenId);
            return isLocked;
        } catch (error) {
            console.error('Error checking lock status:', error);
            throw error;
        }
    }
}

module.exports = new Web3Service();
