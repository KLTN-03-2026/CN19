const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const SystemConfigService = require('./system-config.service');

// Đọc ABI và Bytecode từ Artifacts của Hardhat
const artifactPath = path.join(__dirname, '../../../smart-contracts/artifacts/contracts/BASTicketNFT.sol/BASTicketNFT.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const contractABI = artifact.abi;
const contractBytecode = artifact.bytecode;

class Web3Service {
    constructor() {
        this.initialized = false;
    }

    async ensureInitialized() {
        const config = await SystemConfigService.getConfig();
        const rpcUrl = config.rpc_url || process.env.RPC_URL;
        const contractAddress = config.smart_contract_address || process.env.CONTRACT_ADDRESS;

        if (!rpcUrl || !process.env.ADMIN_PRIVATE_KEY) {
            console.warn("⚠️ Web3Service: Thiếu cấu hình Web3 (RPC_URL hoặc ADMIN_PRIVATE_KEY)");
            return;
        }

        // Nếu RPC URL thay đổi, khởi tạo lại provider
        if (!this.provider || this.currentRpcUrl !== rpcUrl) {
            this.currentRpcUrl = rpcUrl;
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
        }

        // Nếu Contract Address thay đổi, khởi tạo lại contract instance
        if (contractAddress && (!this.contract || this.currentContractAddress !== contractAddress)) {
            this.currentContractAddress = contractAddress;
            this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);
        }
        
        this.initialized = true;
    }

    /**
     * @description Triển khai (Deploy) một Smart Contract NFT mới cho sự kiện
     * @param {string} initialOwner Địa chỉ ví BTC (hoặc Admin) sẽ sở hữu contract này
     * @returns {Promise<string>} Địa chỉ Smart Contract sau khi deploy thành công
     */
    async deployEventContract(initialOwner) {
        try {
            await this.ensureInitialized();
            const config = await SystemConfigService.getConfig();
            const rpcUrl = config.rpc_url || process.env.RPC_URL;

            console.log('----------------------------------------------------');
            console.log(`📡 [Web3] Bắt đầu triển khai Smart Contract...`);
            console.log(`👤 Chủ sở hữu dự kiến: ${initialOwner}`);
            
            if (!ethers.isAddress(initialOwner)) {
                console.error(`❌ Lỗi: Địa chỉ ví không hợp lệ: ${initialOwner}`);
                throw new Error(`Invalid wallet address: ${initialOwner}`);
            }

            console.log(`🔗 Đang kết nối tới RPC: ${rpcUrl}`);
            const network = await this.provider.getNetwork();
            console.log(`✅ Đã kết nối tới mạng: ${network.name} (ChainID: ${network.chainId})`);

            // Lấy thông tin phí Gas hiện tại của mạng
            const feeData = await this.provider.getFeeData();
            console.log(`⛽ Phí Gas hiện tại: Base: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} gwei`);

            // Tính toán phí Gas xông xênh hơn (Thêm 20% buffer để tránh bị kẹt lúc mạng nghẽn)
            const maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * 120n) / 100n;
            const maxFeePerGas = (feeData.maxFeePerGas * 120n) / 100n;

            const factory = new ethers.ContractFactory(contractABI, contractBytecode, this.signer);
            
            console.log(`⏳ Đang gửi giao dịch Deploy với cấu hình Gas tối ưu...`);
            const contract = await factory.deploy(initialOwner, {
                maxFeePerGas,
                maxPriorityFeePerGas
            });
            
            const deploymentTx = contract.deploymentTransaction();
            console.log(`📜 Transaction Hash: ${deploymentTx.hash}`);
            console.log(`⏳ Đang chờ xác nhận từ Blockchain (Mining)...`);
            
            await contract.waitForDeployment();
            
            const address = await contract.getAddress();
            console.log(`✅ Smart Contract đã được triển khai tại: ${address}`);
            console.log('----------------------------------------------------');
            return address;
        } catch (error) {
            console.warn('⚠️ [Web3 Live Deployment Warning]: Không thể deploy lên mạng public (Lỗi mạng hoặc thiếu MATIC).');
            console.warn(`Chi tiết lỗi: ${error.message}`);
            console.log('🔄 Tự động kích hoạt cơ chế Fallback: Trả về null để hệ thống sử dụng chung Contract Hệ Thống (Platform Contract)...');
            return null;
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
            await this.ensureInitialized();
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const tx = await eventContract.mintTicket(toAddress, ticketURI);
            const receipt = await tx.wait();
            
            // Tìm event TicketMinted trong receipt để lấy tokenId
            let tokenId = null;
            for (const log of receipt.logs) {
                try {
                    const parsedLog = eventContract.interface.parseLog(log);
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
            await this.ensureInitialized();
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
            await this.ensureInitialized();
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
            await this.ensureInitialized();
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            // Sử dụng forceTransfer (quyền Admin) để chuyển vé giữa các ví custodial
            const tx = await eventContract.forceTransfer(fromAddress, toAddress, tokenId);
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
            await this.ensureInitialized();
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
            await this.ensureInitialized();
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const isLocked = await eventContract.isLocked(tokenId);
            return isLocked;
        } catch (error) {
            console.error('Error checking lock status:', error);
            throw error;
        }
    }

    /**
     * @description Tạm dừng Smart Contract (đóng băng mua bán/chuyển nhượng)
     * @param {string} contractAddress 
     */
    async pauseContract(contractAddress) {
        try {
            await this.ensureInitialized();
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const tx = await eventContract.pause();
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error pausing contract:', error);
            throw error;
        }
    }

    /**
     * @description Kích hoạt lại Smart Contract
     * @param {string} contractAddress 
     */
    async unpauseContract(contractAddress) {
        try {
            await this.ensureInitialized();
            const eventContract = new ethers.Contract(contractAddress, contractABI, this.signer);
            const tx = await eventContract.unpause();
            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error unpausing contract:', error);
            throw error;
        }
    }
}

module.exports = new Web3Service();
