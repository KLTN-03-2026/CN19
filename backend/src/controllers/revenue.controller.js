const prisma = require('../config/prisma');

/**
 * Controller xử lý Doanh thu và Rút tiền cho Organizer
 */
const RevenueController = {
    /**
     * Lấy thống kê doanh thu và số dư
     */
    getRevenueSummary: async (req, res) => {
        try {
            const userId = req.user.userId;
            
            // Tìm Organizer dựa trên userId
            const organizer = await prisma.organizer.findUnique({
                where: { user_id: userId },
                include: {
                    wallet_transactions: {
                        orderBy: { created_at: 'desc' },
                        take: 10
                    }
                }
            });

            if (!organizer) {
                return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
            }

            // Tính toán doanh thu đang chờ xử lý (Pending)
            // Là các Order đã thanh toán (paid) nhưng chưa được đối soát (is_settled = false)
            const pendingOrders = await prisma.order.findMany({
                where: {
                    event: { organizer_id: organizer.id },
                    status: 'paid',
                    is_settled: false
                },
                select: {
                    total_amount: true,
                    platform_fee: true
                }
            });

            const pendingRevenue = pendingOrders.reduce((sum, order) => {
                return sum + (Number(order.total_amount) - Number(order.platform_fee));
            }, 0);

            // Tính tổng tiền đã rút thành công
            const withdrawnTransactions = await prisma.walletTransaction.aggregate({
                where: {
                    organizer_id: organizer.id,
                    type: 'WITHDRAWAL',
                    status: 'completed'
                },
                _sum: { amount: true }
            });

            const totalWithdrawn = withdrawnTransactions._sum.amount || 0;

            res.status(200).json({
                balance: Number(organizer.balance),
                pendingRevenue: Number(pendingRevenue),
                totalWithdrawn: Number(totalWithdrawn),
                bankInfo: {
                    bank_name: organizer.bank_name,
                    account_number: organizer.account_number,
                    account_holder: organizer.account_holder
                },
                recentTransactions: organizer.wallet_transactions
            });
        } catch (error) {
            console.error('Get Revenue Summary Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy thông tin doanh thu.' });
        }
    },

    /**
     * Lấy toàn bộ lịch sử giao dịch
     */
    getTransactionHistory: async (req, res) => {
        try {
            const userId = req.user.userId;
            const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
            
            const transactions = await prisma.walletTransaction.findMany({
                where: { organizer_id: organizer.id },
                orderBy: { created_at: 'desc' }
            });

            const withdrawalRequests = await prisma.withdrawalRequest.findMany({
                where: { organizer_id: organizer.id },
                orderBy: { created_at: 'desc' }
            });

            res.status(200).json({ transactions, withdrawalRequests });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi lấy lịch sử giao dịch.' });
        }
    },

    /**
     * Yêu cầu rút tiền
     */
    requestWithdrawal: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { amount } = req.body;
            const withdrawAmount = Number(amount);

            const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });

            // Kiểm tra thông tin ngân hàng
            if (!organizer.bank_name || !organizer.account_number) {
                return res.status(400).json({ error: 'Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền.' });
            }

            // Kiểm tra hạn mức (100k - 100m)
            if (withdrawAmount < 100000) {
                return res.status(400).json({ error: 'Số tiền rút tối thiểu là 100,000đ.' });
            }
            if (withdrawAmount > 100000000) {
                return res.status(400).json({ error: 'Số tiền rút tối đa cho mỗi giao dịch là 100,000,000đ.' });
            }

            // Kiểm tra số dư
            if (Number(organizer.balance) < withdrawAmount) {
                return res.status(400).json({ error: 'Số dư khả dụng không đủ.' });
            }

            // Thực hiện rút tiền trong một Transaction
            const result = await prisma.$transaction(async (tx) => {
                // 1. Trừ số dư Organizer
                const updatedOrganizer = await tx.organizer.update({
                    where: { id: organizer.id },
                    data: { balance: { decrement: withdrawAmount } }
                });

                // 2. Tạo yêu cầu rút tiền (trạng thái chờ duyệt)
                const request = await tx.withdrawalRequest.create({
                    data: {
                        organizer_id: organizer.id,
                        amount: withdrawAmount,
                        bank_name: organizer.bank_name,
                        account_number: organizer.account_number,
                        account_holder: organizer.account_holder,
                        status: 'pending'
                    }
                });

                // 3. Tạo bản ghi giao dịch (với trạng thái pending?) 
                // Thường giao dịch ví sẽ ghi ngay để trừ tiền tạm giữ
                await tx.walletTransaction.create({
                    data: {
                        organizer_id: organizer.id,
                        amount: -withdrawAmount,
                        type: 'WITHDRAWAL',
                        description: `Yêu cầu rút tiền: ${withdrawAmount.toLocaleString()}đ`,
                        status: 'pending'
                    }
                });

                return request;
            });

            res.status(200).json({ message: 'Yêu cầu rút tiền đã được gửi thành công.', request: result });
        } catch (error) {
            console.error('Request Withdrawal Error:', error);
            res.status(500).json({ error: 'Lỗi khi gửi yêu cầu rút tiền.' });
        }
    },

    /**
     * Cập nhật thông tin ngân hàng
     */
    updateBankInfo: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { bank_name, account_number, account_holder } = req.body;

            await prisma.organizer.update({
                where: { user_id: userId },
                data: {
                    bank_name,
                    account_number,
                    account_holder
                }
            });

            res.status(200).json({ message: 'Cập nhật thông tin ngân hàng thành công.' });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi cập nhật thông tin ngân hàng.' });
        }
    },

    /**
     * Kích hoạt đối soát thủ công (Cho Demo/Testing)
     */
    runSettlementTest: async (req, res) => {
        try {
            const settlementService = require('../services/settlement.service');
            const processedCount = await settlementService.runSettlement(true);
            res.status(200).json({ message: `Đối soát thành công. Đã xử lý ${processedCount} đơn hàng.` });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi chạy đối soát.' });
        }
    }
};

module.exports = RevenueController;
