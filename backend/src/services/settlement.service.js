const prisma = require('../config/prisma');
const { subDays } = require('date-fns');
const blockchainService = require('./blockchain.service');

/**
 * Service xử lý đối soát tiền (Settlement)
 * Tự động chuyển doanh thu từ Pending sang Balance sau khi sự kiện kết thúc 3 ngày
 */
const SettlementService = {
    /**
     * Chạy quy trình đối soát
     * @param {boolean} ignoreDate - Nếu true, sẽ đối soát tất cả đơn hàng đã thanh toán bất kể thời gian sự kiện (Dùng cho Demo)
     */
    runSettlement: async (ignoreDate = false) => {
        try {
            console.log(`--- STARTING REVENUE SETTLEMENT PROCESS (IgnoreDate: ${ignoreDate}) ---`);
            
            // 1. Xác định mốc thời gian (3 ngày trước)
            const settlementThreshold = subDays(new Date(), 3);
            
            // 2. Tìm các sự kiện
            const whereClause = {
                status: { notIn: ['cancelled', 'draft'] }
            };

            if (!ignoreDate) {
                whereClause.OR = [
                    { end_date: { lte: settlementThreshold } },
                    { 
                        AND: [
                            { end_date: null },
                            { event_date: { lte: settlementThreshold } }
                        ]
                    }
                ];
            }
            
            const finishedEvents = await prisma.event.findMany({
                where: whereClause,
                select: { id: true, organizer_id: true, title: true }
            });

            console.log(`Found ${finishedEvents.length} events eligible for settlement.`);

            let settledCount = 0;
            let mktSettledCount = 0;

            for (const event of finishedEvents) {
                // 3. Tìm các Order chưa đối soát của sự kiện này (Mua từ BTC)
                const unsettledOrders = await prisma.order.findMany({
                    where: {
                        event_id: event.id,
                        status: 'paid',
                        is_settled: false
                    }
                });

                // 4. Tìm các MarketplaceTransaction chưa đối soát của sự kiện này (Mua từ người dùng khác)
                const unsettledMktTransactions = await prisma.marketplaceTransaction.findMany({
                    where: {
                        listing: { event_id: event.id },
                        status: { in: ['paid', 'completed', 'success'] },
                        is_settled: false
                    }
                });

                if (unsettledOrders.length === 0 && unsettledMktTransactions.length === 0) continue;

                // --- XỬ LÝ ĐỐI SOÁT ĐƠN HÀNG GỐC (ORGANIZER) ---
                if (unsettledOrders.length > 0) {
                    const verifiedOrders = [];
                    
                    for (const order of unsettledOrders) {
                        const bcLog = await blockchainService.getFinancialLog(order.order_number);
                        
                        if (!bcLog) {
                            console.error(`[AUDIT FAIL] Order ${order.order_number} không tìm thấy log trên Blockchain!`);
                            continue;
                        }

                        // [AUDIT] Đối soát siêu chi tiết từng loại phí
                        const isMatch = 
                            Math.abs(Number(order.total_amount) - bcLog.totalAmount) < 1 &&
                            Math.abs(Number(order.ticket_platform_fee || 0) - bcLog.ticketPlatformFee) < 1 &&
                            Math.abs(Number(order.ticket_commission_fee || 0) - bcLog.ticketCommissionFee) < 1 &&
                            Math.abs(Number(order.merchandise_platform_fee || 0) - bcLog.merchPlatformFee) < 1 &&
                            Math.abs(Number(order.merchandise_commission_fee || 0) - bcLog.merchCommissionFee) < 1 &&
                            Math.abs(Number(order.gas_fee || 0) - bcLog.gasFee) < 1;

                        if (isMatch) {
                            verifiedOrders.push(order);
                        } else {
                            console.error(`[AUDIT FAIL] Order ${order.order_number} sai lệch dữ liệu phí chi tiết!`, {
                                db: { 
                                    total: order.total_amount, 
                                    tPlat: order.ticket_platform_fee, 
                                    tComm: order.ticket_commission_fee, 
                                    mPlat: order.merchandise_platform_fee, 
                                    mComm: order.merchandise_commission_fee,
                                    gas: order.gas_fee 
                                },
                                bc: bcLog
                            });
                        }
                    }

                    if (verifiedOrders.length > 0) {
                        const eventRevenue = verifiedOrders.reduce((sum, order) => {
                            return sum + Number(order.organizer_revenue || 0);
                        }, 0);

                        await prisma.$transaction(async (tx) => {
                            // Cộng tiền vào số dư BTC
                            await tx.user.update({
                                where: { id: event.organizer_id },
                                data: { balance: { increment: eventRevenue } }
                            });

                            // Ghi lịch sử giao dịch ví
                            await tx.walletTransaction.create({
                                data: {
                                  user_id: event.organizer_id,
                                  amount: eventRevenue,
                                  type: 'REVENUE',
                                  description: `Doanh thu Sự kiện: ${event.title} (Đã qua đối soát Blockchain chi tiết)`,
                                  status: 'completed'
                                }
                            });

                            // Tạo bản ghi đối soát tổng hợp
                            await tx.escrowPayout.create({
                                data: {
                                    event_id: event.id,
                                    total_revenue: verifiedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
                                    platform_fee: verifiedOrders.reduce((sum, o) => sum + Number(o.platform_fee || 0), 0),
                                    commission_fee: verifiedOrders.reduce((sum, o) => sum + Number(o.commission_fee || 0), 0),
                                    gas_fee: verifiedOrders.reduce((sum, o) => sum + Number(o.gas_fee || 0), 0),
                                    net_payout: eventRevenue,
                                    status: 'settled',
                                    processed_at: new Date(),
                                    admin_notes: `Đối soát tự động Blockchain (${verifiedOrders.length}/${unsettledOrders.length} đơn hợp lệ)`,
                                    payout_trans_id: 'AUDIT-' + Date.now()
                                }
                            });

                            // Đánh dấu đơn hàng đã đối soát xong
                            await tx.order.updateMany({
                                where: { id: { in: verifiedOrders.map(o => o.id) } },
                                data: { is_settled: true }
                            });
                        });
                        settledCount += verifiedOrders.length;
                        console.log(`[AUDIT OK] Settled ${verifiedOrders.length} orders for event "${event.title}". Total: ${eventRevenue.toLocaleString()}đ`);
                    }
                }

                // --- XỬ LÝ ĐỐI SOÁT GIAO DỊCH CHỢ (MARKETPLACE SELLERS & ORGANIZER ROYALTIES) ---
                if (unsettledMktTransactions.length > 0) {
                    for (const mktTx of unsettledMktTransactions) {
                        // Đối soát Blockchain cho giao dịch chợ
                        const bcLog = await blockchainService.getFinancialLog(mktTx.transaction_number);
                        
                        if (!bcLog) {
                            console.error(`[AUDIT FAIL] Mkt Transaction ${mktTx.transaction_number} không tìm thấy log trên Blockchain!`);
                            continue;
                        }

                        const isMatch = 
                            Math.abs(Number(mktTx.buyer_pay_amount) - bcLog.totalAmount) < 1 &&
                            Math.abs(Number(mktTx.platform_fee || 0) - bcLog.ticketPlatformFee) < 1 &&
                            Math.abs(Number(mktTx.commission_fee || 0) - bcLog.ticketCommissionFee) < 1 &&
                            Math.abs(Number(mktTx.gas_fee || 0) - bcLog.gasFee) < 1 &&
                            Math.abs(Number(mktTx.organizer_royalty || 0) - bcLog.royaltyFee) < 1;

                        if (!isMatch) {
                            console.error(`[AUDIT FAIL] Mkt Transaction ${mktTx.transaction_number} sai lệch dữ liệu Marketplace!`, {
                                db: { total: mktTx.buyer_pay_amount, platform: mktTx.platform_fee, comm: mktTx.commission_fee, gas: mktTx.gas_fee, royalty: mktTx.organizer_royalty },
                                bc: bcLog
                            });
                            continue;
                        }

                        const sellerAmount = Number(mktTx.seller_receive_amount);
                        const royaltyAmount = Number(mktTx.organizer_royalty || 0);
                        
                        await prisma.$transaction(async (tx) => {
                            // 1. Cộng tiền cho người bán lại (User)
                            await tx.user.update({
                                where: { id: mktTx.seller_id },
                                data: { balance: { increment: sellerAmount } }
                            });

                            await tx.walletTransaction.create({
                                data: {
                                    user_id: mktTx.seller_id,
                                    amount: sellerAmount,
                                    type: 'RESELL_REVENUE',
                                    description: `Tiền bán vé trên Chợ: ${event.title} (Đã đối soát Blockchain)`,
                                    status: 'completed'
                                }
                            });

                            // 2. Cộng tiền HOA HỒNG BẢN QUYỀN cho Ban tổ chức (Organizer)
                            if (royaltyAmount > 0) {
                                await tx.user.update({
                                    where: { id: event.organizer_id },
                                    data: { balance: { increment: royaltyAmount } }
                                });

                                await tx.walletTransaction.create({
                                    data: {
                                        user_id: event.organizer_id,
                                        amount: royaltyAmount,
                                        type: 'REVENUE',
                                        description: `Hoa hồng bản quyền (Royalty) từ bán lại vé: ${event.title}`,
                                        status: 'completed'
                                    }
                                });
                            }

                            // 3. Đánh dấu giao dịch đã đối soát
                            await tx.marketplaceTransaction.update({
                                where: { id: mktTx.id },
                                data: { is_settled: true }
                            });
                        });
                        mktSettledCount++;
                    }
                    console.log(`[AUDIT OK] Settled marketplace transactions for event "${event.title}".`);
                }
            }

            console.log(`--- SETTLEMENT COMPLETED: ${settledCount} orders & ${mktSettledCount} marketplace tx processed ---`);
            return settledCount + mktSettledCount;
        } catch (error) {
            console.error('Settlement Process Error:', error);
            throw error;
        }
    }
};

module.exports = SettlementService;
