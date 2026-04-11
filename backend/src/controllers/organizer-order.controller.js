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
            const userId = req.user.userId;
            const { status, is_settled, event_id, search } = req.query;

            // 1. Tìm Organizer id
            const organizer = await prisma.organizer.findUnique({
                where: { user_id: userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
            }

            // 2. Xây dựng bộ lọc - Cải tiến: Chỉ thêm filter nếu có giá trị thực
            const whereClause = {
                event: { organizer_id: organizer.id }
            };

            if (status && status.trim() !== '') {
                whereClause.status = status;
            }
            
            if (is_settled !== undefined && is_settled !== '') {
                whereClause.is_settled = (is_settled === 'true');
            }
            
            if (event_id && event_id.trim() !== '') {
                whereClause.event_id = event_id;
            }

            // Tìm kiếm theo mã đơn hàng hoặc tên khách hàng
            if (search && search.trim() !== '') {
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
                    items: { include: { ticket_tier: true } },
                    merchandise_items: true
                },
                orderBy: { created_at: 'desc' }
            });

            res.status(200).json(orders);
        } catch (error) {
            console.error('--- GET ORGANIZER ORDERS ERROR ---');
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách đơn hàng.', detail: error.message });
        }
    },

    /**
     * Lấy chi tiết một đơn hàng (dành cho BTC)
     */
    getOrderDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const order = await prisma.order.findUnique({
                where: { id },
                include: {
                    customer: { 
                        select: { 
                            id: true, 
                            full_name: true, 
                            email: true, 
                            phone_number: true, 
                            avatar_url: true 
                        } 
                    },
                    event: { 
                        include: { 
                            organizer: true 
                        } 
                    },
                    items: { 
                        include: { 
                            ticket_tier: {
                                select: {
                                    tier_name: true,
                                    price: true
                                }
                            } 
                        } 
                    },
                    merchandise_items: { 
                        include: { 
                            merchandise: true 
                        } 
                    },
                    tickets: { 
                        include: { 
                            ticket_tier: {
                                select: {
                                    tier_name: true
                                }
                            }
                        } 
                    },
                    payments: { 
                        orderBy: { created_at: 'desc' },
                        take: 5
                    }
                }
            });

            if (!order || order.event.organizer.user_id !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });
            }

            res.status(200).json(order);
        } catch (error) {
            console.error('Get Order Detail Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy chi tiết đơn hàng.' });
        }
    }
};

module.exports = OrganizerOrderController;
