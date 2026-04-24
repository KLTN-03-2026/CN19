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
            
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    wallet_transactions: {
                        orderBy: { created_at: 'desc' },
                        take: 10
                    },
                    organizer_profile: true
                }
            });

            const organizer = user.organizer_profile;
            let pendingRevenue = 0;

            if (organizer) {
                // Tính toán doanh thu đang chờ xử lý (Pending) cho BTC
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

                pendingRevenue = pendingOrders.reduce((sum, order) => {
                    return sum + (Number(order.total_amount) - Number(order.platform_fee));
                }, 0);
            }

            // --- BỔ SUNG: Tính doanh thu chờ xử lý cho Khách hàng bán vé trên Marketplace ---
            const pendingMktSales = await prisma.marketplaceTransaction.findMany({
                where: {
                    seller_id: userId,
                    status: { in: ['paid', 'completed', 'success'] },
                    is_settled: false
                },
                select: {
                    seller_receive_amount: true
                }
            });

            const mktPendingRevenue = pendingMktSales.reduce((sum, tx) => {
                return sum + Number(tx.seller_receive_amount);
            }, 0);

            pendingRevenue += mktPendingRevenue;

            // Tính tổng tiền đã rút thành công
            const withdrawnTransactions = await prisma.walletTransaction.aggregate({
                where: {
                    user_id: user.id,
                    type: 'WITHDRAWAL',
                    status: 'completed'
                },
                _sum: { amount: true }
            });

            const totalWithdrawn = withdrawnTransactions._sum.amount || 0;

            res.status(200).json({
                balance: Number(user.balance),
                pendingRevenue: Number(pendingRevenue),
                totalWithdrawn: Number(totalWithdrawn),
                bankInfo: {
                    bank_name: user.bank_name,
                    account_number: user.account_number,
                    account_holder: user.account_holder
                },
                recentTransactions: user.wallet_transactions
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
            
            const transactions = await prisma.walletTransaction.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' }
            });

            const withdrawalRequests = await prisma.withdrawalRequest.findMany({
                where: { user_id: userId },
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

            // Kiểm tra thông tin ngân hàng & số dư
            const user = await prisma.user.findUnique({ where: { id: userId } });
            
            if (!user.bank_name || !user.account_number) {
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
            if (Number(user.balance) < withdrawAmount) {
                return res.status(400).json({ error: 'Số dư khả dụng không đủ.' });
            }

            // Thực hiện rút tiền trong một Transaction
            const result = await prisma.$transaction(async (tx) => {
                // 1. Trừ số dư User
                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: { balance: { decrement: withdrawAmount } }
                });

                // 2. Tạo yêu cầu rút tiền (trạng thái chờ duyệt)
                const request = await tx.withdrawalRequest.create({
                    data: {
                        user_id: userId,
                        amount: withdrawAmount,
                        bank_name: user.bank_name,
                        account_number: user.account_number,
                        account_holder: user.account_holder,
                        status: 'pending'
                    }
                });

                // 3. Tạo bản ghi giao dịch (với trạng thái pending?) 
                // Thường giao dịch ví sẽ ghi ngay để trừ tiền tạm giữ
                await tx.walletTransaction.create({
                    data: {
                        user_id: userId,
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
            res.status(500).json({ error: error.message || 'Lỗi khi gửi yêu cầu rút tiền.' });
        }
    },

    /**
     * Cập nhật thông tin ngân hàng
     */
    updateBankInfo: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { bank_name, account_number, account_holder } = req.body;

            await prisma.user.update({
                where: { id: userId },
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
     * Lấy danh sách đơn hàng đã bán trên chợ (Dành cho khách hàng)
     */
    getResaleOrders: async (req, res) => {
        try {
            const userId = req.user.userId;

            const sales = await prisma.marketplaceTransaction.findMany({
                where: { 
                    seller_id: userId,
                    status: { in: ['paid', 'completed', 'success'] }
                },
                include: {
                    ticket: {
                        include: {
                            event: {
                                select: { title: true, event_date: true, image_url: true }
                            },
                            ticket_tier: {
                                select: { tier_name: true }
                            }
                        }
                    },
                    buyer: {
                        select: { full_name: true, email: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            res.status(200).json({ data: sales });
        } catch (error) {
            console.error('Get Resale Orders Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng đã bán.' });
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
