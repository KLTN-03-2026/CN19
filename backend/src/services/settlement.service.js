const prisma = require('../config/prisma');
const { subDays } = require('date-fns');

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
                    const eventRevenue = unsettledOrders.reduce((sum, order) => {
                        return sum + (Number(order.total_amount) - Number(order.platform_fee));
                    }, 0);

                    if (eventRevenue > 0) {
                        await prisma.$transaction(async (tx) => {
                            await tx.user.update({
                                where: { id: event.organizer_id },
                                data: { balance: { increment: eventRevenue } }
                            });

                            await tx.walletTransaction.create({
                                data: {
                                    user_id: event.organizer_id,
                                    amount: eventRevenue,
                                    type: 'REVENUE',
                                    description: `Doanh thu từ sự kiện: ${event.title}`,
                                    status: 'completed'
                                }
                            });

                            await tx.escrowPayout.create({
                                data: {
                                    event_id: event.id,
                                    total_revenue: unsettledOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
                                    platform_fee: unsettledOrders.reduce((sum, o) => sum + Number(o.platform_fee), 0),
                                    net_payout: eventRevenue,
                                    status: 'settled',
                                    processed_at: new Date(),
                                    admin_notes: 'Đối soát tự động (Hệ thống)',
                                    payout_trans_id: 'AUTO-' + Date.now()
                                }
                            });

                            await tx.order.updateMany({
                                where: { id: { in: unsettledOrders.map(o => o.id) } },
                                data: { is_settled: true }
                            });
                        });
                        settledCount += unsettledOrders.length;
                        console.log(`Settled ${unsettledOrders.length} orders for event "${event.title}". Total: ${eventRevenue.toLocaleString()}đ`);
                    }
                }

                // --- XỬ LÝ ĐỐI SOÁT GIAO DỊCH CHỢ (MARKETPLACE SELLERS) ---
                if (unsettledMktTransactions.length > 0) {
                    for (const mktTx of unsettledMktTransactions) {
                        const sellerAmount = Number(mktTx.seller_receive_amount);
                        
                        await prisma.$transaction(async (tx) => {
                            // Cộng tiền cho người bán (Seller là User/Customer)
                            await tx.user.update({
                                where: { id: mktTx.seller_id },
                                data: { balance: { increment: sellerAmount } }
                            });

                            // Ghi lịch sử giao dịch ví cho người bán
                            await tx.walletTransaction.create({
                                data: {
                                    user_id: mktTx.seller_id,
                                    amount: sellerAmount,
                                    type: 'RESELL_REVENUE',
                                    description: `Doanh thu bán lại vé sự kiện: ${event.title}`,
                                    status: 'completed'
                                }
                            });

                            // Đánh dấu giao dịch đã đối soát
                            await tx.marketplaceTransaction.update({
                                where: { id: mktTx.id },
                                data: { is_settled: true }
                            });
                        });
                        mktSettledCount++;
                    }
                    console.log(`Settled ${unsettledMktTransactions.length} marketplace transactions for event "${event.title}".`);
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
