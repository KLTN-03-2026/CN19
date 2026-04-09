const prisma = require('../config/prisma');

/**
 * Service xử lý các logic liên quan đến Đơn hàng & Tồn kho vé
 */
const OrderService = {
    /**
     * Tự động giải phóng tồn kho cho các đơn hàng PENDING đã quá hạn 10 phút.
     * Ticket sẽ được trả về trạng thái "Chưa đặt" (quantity_available tăng lại).
     */
    releaseExpiredOrders: async () => {
        try {
            const now = new Date();
            
            // 1. Tìm các đơn hàng PENDING đã quá hạn
            // expires_at trong DB đã được set = created_at + 10 mins
            const expiredOrders = await prisma.order.findMany({
                where: {
                    status: 'pending',
                    expires_at: { lt: now }
                },
                include: {
                    items: true
                }
            });

            if (expiredOrders.length === 0) return { releasedCount: 0 };

            console.log(`[Inventory] Phát hiện ${expiredOrders.length} đơn hàng quá hạn. Đang xử lý hoàn vé...`);

            // 2. Sử dụng Transaction để đảm bảo tính nhất quán
            await prisma.$transaction(async (tx) => {
                for (const order of expiredOrders) {
                    // Cập nhật trạng thái Đơn hàng sang CANCELLED
                    await tx.order.update({
                        where: { id: order.id },
                        data: { status: 'cancelled' }
                    });

                    // Hoàn lại số lượng vé cho từng hạng vé trong đơn hàng
                    for (const item of order.items) {
                        await tx.ticketTier.update({
                            where: { id: item.ticket_tier_id },
                            data: {
                                quantity_available: { increment: item.quantity }
                            }
                        });
                    }
                }
            });

            console.log(`[Inventory] Đã giải phóng thành công ${expiredOrders.length} đơn hàng.`);
            return { releasedCount: expiredOrders.length };
        } catch (error) {
            console.error('[Inventory Error] Không thể giải phóng vé quá hạn:', error);
            throw error;
        }
    }
};

module.exports = OrderService;
