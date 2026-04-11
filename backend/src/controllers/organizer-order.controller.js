const prisma = require('../config/prisma');

/**
 * Controller quản lý đơn hàng chuyên sâu cho Organizer
 */
const OrganizerOrderController = {
    /**
     * Lấy danh sách đơn hàng của tất cả sự kiện thuộc BTC
     */
    getOrganizerOrders: async (req, res) => {
        try {
            const userId = req.user.id;
            const { status, is_settled, event_id, search } = req.query;

            // 1. Tìm Organizer id
            const organizer = await prisma.organizer.findUnique({
                where: { user_id: userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
            }

            // 2. Xây dựng bộ lọc
            const whereClause = {
                event: { organizer_id: organizer.id }
            };

            if (status) whereClause.status = status;
            if (is_settled !== undefined) whereClause.is_settled = (is_settled === 'true');
            if (event_id) whereClause.event_id = event_id;

            // Tìm kiếm theo mã đơn hàng hoặc tên khách hàng
            if (search) {
                whereClause.OR = [
                    { order_number: { contains: search, mode: 'insensitive' } },
                    { customer: { full_name: { contains: search, mode: 'insensitive' } } }
                ];
            }

            // 3. Thực hiện truy vấn
            const orders = await prisma.order.findMany({
                where: whereClause,
                include: {
                    customer: { select: { full_name: true, email: true, avatar_url: true } },
                    event: { select: { title: true, event_date: true } },
                    items: { include: { ticket_tier: true } }
                },
                orderBy: { created_at: 'desc' }
            });

            res.status(200).json(orders);
        } catch (error) {
            console.error('Get Organizer Orders Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng.' });
        }
    },

    /**
     * Lấy chi tiết một đơn hàng (dành cho BTC)
     */
    getOrderDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const order = await prisma.order.findUnique({
                where: { id },
                include: {
                    customer: true,
                    event: { include: { organizer: true } },
                    items: { include: { ticket_tier: true } },
                    payment: true
                }
            });

            if (!order || order.event.organizer.user_id !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });
            }

            res.status(200).json(order);
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi lấy chi tiết đơn hàng.' });
        }
    }
};

module.exports = OrganizerOrderController;
