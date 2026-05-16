const prisma = require('../config/prisma');
const NotificationService = require('../services/notification.service');

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
                // 1. Tính từ Orders của BTC (Chưa đối soát)
                const pendingOrders = await prisma.order.findMany({
                    where: {
                        event: { organizer_id: organizer.id },
                        status: 'paid',
                        is_settled: false,
                        order_type: { in: ['TICKET_PURCHASE', 'MERCHANDISE_PURCHASE'] }
                    },
                    select: { organizer_revenue: true }
                });

                const ordersRevenue = pendingOrders.reduce((sum, order) => {
                    return sum + Number(order.organizer_revenue || 0);
                }, 0);

                // 2. Tính từ Marketplace Royalties của BTC (Chưa đối soát)
                const pendingRoyalties = await prisma.marketplaceTransaction.findMany({
                    where: {
                        ticket: { event: { organizer_id: organizer.id } },
                        status: 'paid',
                        is_settled: false
                    },
                    select: { organizer_royalty: true }
                });

                const royaltiesRevenue = pendingRoyalties.reduce((sum, tx) => {
                    return sum + Number(tx.organizer_royalty || 0);
                }, 0);

                // 3. Tính doanh thu từ Merchandise (Vật phẩm) chưa đối soát
                // Lưu ý: Nếu có merch, cần cộng thêm ở đây. Hiện tại giả định nằm trong order.total_amount
                
                pendingRevenue = ordersRevenue + royaltiesRevenue;
            }

            // 4. Tính doanh thu chờ xử lý cho User này nếu họ cũng là người bán vé (Seller) trên Marketplace
            const pendingMktSales = await prisma.marketplaceTransaction.findMany({
                where: {
                    seller_id: userId,
                    status: { in: ['paid', 'completed', 'success'] },
                    is_settled: false,
                    ticket: {
                        event: { status: { not: 'cancelled' } }
                    }
                },
                select: { seller_receive_amount: true }
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

            // 5. Lấy cấu hình rút tiền từ hệ thống
            const settings = await prisma.systemSetting.findMany({
                where: {
                    key: { in: ['withdrawal_fee_percent', 'min_withdrawal_amount'] }
                }
            });

            const feePercent = Number(settings.find(s => s.key === 'withdrawal_fee_percent')?.value || 2);
            const minWithdrawal = Number(settings.find(s => s.key === 'min_withdrawal_amount')?.value || 100000);

            res.status(200).json({
                balance: Number(user.balance),
                pendingRevenue: Number(pendingRevenue),
                totalWithdrawn: Number(totalWithdrawn),
                bankInfo: {
                    bank_name: user.bank_name,
                    account_number: user.account_number,
                    account_holder: user.account_holder
                },
                systemSettings: {
                    withdrawal_fee_percent: feePercent,
                    min_withdrawal_amount: minWithdrawal
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

    requestWithdrawal: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { amount } = req.body;
            const withdrawAmount = Number(amount);

            // 1. Lấy cấu hình hệ thống từ DB
            const settings = await prisma.systemSetting.findMany({
                where: {
                    key: { in: ['withdrawal_fee_percent', 'min_withdrawal_amount'] }
                }
            });

            const feePercent = Number(settings.find(s => s.key === 'withdrawal_fee_percent')?.value || 2);
            const minWithdrawal = Number(settings.find(s => s.key === 'min_withdrawal_amount')?.value || 100000);

            // 2. Kiểm tra thông tin ngân hàng & số dư
            const user = await prisma.user.findUnique({ where: { id: userId } });
            
            if (!user.bank_name || !user.account_number) {
                return res.status(400).json({ error: 'Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền.' });
            }

            // 3. Kiểm tra hạn mức tối thiểu từ DB
            if (withdrawAmount < minWithdrawal) {
                return res.status(400).json({ error: `Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString()}đ.` });
            }

            // 4. Kiểm tra số dư
            if (Number(user.balance) < withdrawAmount) {
                return res.status(400).json({ error: 'Số dư khả dụng không đủ.' });
            }

            // 5. Tính toán phí
            const feeAmount = (withdrawAmount * feePercent) / 100;
            const netAmount = withdrawAmount - feeAmount;

            // 6. Thực hiện rút tiền trong một Transaction
            const result = await prisma.$transaction(async (tx) => {
                // a. Trừ số dư User (Trừ toàn bộ số tiền rút)
                await tx.user.update({
                    where: { id: userId },
                    data: { balance: { decrement: withdrawAmount } }
                });

                // b. Tạo yêu cầu rút tiền
                const request = await tx.withdrawalRequest.create({
                    data: {
                        user_id: userId,
                        amount: withdrawAmount,
                        fee_amount: feeAmount,
                        net_amount: netAmount,
                        bank_name: user.bank_name,
                        account_number: user.account_number,
                        account_holder: user.account_holder,
                        status: 'pending'
                    }
                });

                // c. Tạo bản ghi giao dịch ví
                await tx.walletTransaction.create({
                    data: {
                        user_id: userId,
                        amount: -withdrawAmount,
                        type: 'WITHDRAWAL',
                        description: `Rút tiền: -${withdrawAmount.toLocaleString()}đ (Phí ${feePercent}%: ${feeAmount.toLocaleString()}đ)`,
                        status: 'pending'
                    }
                });

                return request;
            });

            res.status(200).json({ 
                message: 'Yêu cầu rút tiền đã được gửi thành công.', 
                data: {
                    requestId: result.id,
                    amount: withdrawAmount,
                    fee: feeAmount,
                    netAmount: netAmount
                } 
            });

            // 7. Thông báo cho Admin
            NotificationService.notifyAdmins({
                type: 'WITHDRAWAL_REQUEST',
                title: 'Yêu cầu rút tiền mới',
                message: `Người dùng "${user.full_name || user.email}" vừa yêu cầu rút ${withdrawAmount.toLocaleString()}đ.`,
                target_id: result.id
            });
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
                    status: { in: ['paid', 'completed', 'success', 'cancelled'] }
                },
                include: {
                    ticket: {
                        include: {
                            event: {
                                select: { title: true, event_date: true, image_url: true, status: true }
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
