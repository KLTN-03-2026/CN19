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

            for (const event of finishedEvents) {
                // 3. Tìm các Order chưa đối soát của sự kiện này
                const unsettledOrders = await prisma.order.findMany({
                    where: {
                        event_id: event.id,
                        status: 'paid',
                        is_settled: false
                    }
                });

                if (unsettledOrders.length === 0) continue;

                // 4. Tính toán tổng tiền thực nhận cho sự kiện này
                const eventRevenue = unsettledOrders.reduce((sum, order) => {
                    return sum + (Number(order.total_amount) - Number(order.platform_fee));
                }, 0);

                if (eventRevenue <= 0) continue;

                // 5. Cập nhật Balance và ghi chú bằng Transaction
                await prisma.$transaction(async (tx) => {
                    // Cộng tiền vào tài khoản Organizer
                    await tx.organizer.update({
                        where: { id: event.organizer_id },
                        data: { balance: { increment: eventRevenue } }
                    });

                    // Ghi lại lịch sử giao dịch
                    await tx.walletTransaction.create({
                        data: {
                            organizer_id: event.organizer_id,
                            amount: eventRevenue,
                            type: 'REVENUE',
                            description: `Doanh thu từ sự kiện: ${event.title}`,
                            status: 'completed'
                        }
                    });

                    // Đánh dấu các đơn hàng đã đối soát xong
                    await tx.order.updateMany({
                        where: {
                            id: { in: unsettledOrders.map(o => o.id) }
                        },
                        data: { is_settled: true }
                    });
                });

                settledCount += unsettledOrders.length;
                console.log(`Settled ${unsettledOrders.length} orders for event "${event.title}". Total: ${eventRevenue.toLocaleString()}đ`);
            }

            console.log(`--- SETTLEMENT COMPLETED: ${settledCount} orders processed ---`);
            return settledCount;
        } catch (error) {
            console.error('Settlement Process Error:', error);
            throw error;
        }
    }
};

module.exports = SettlementService;
