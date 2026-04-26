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

            // 2. Xây dựng bộ lọc - Chỉ lấy đơn hàng mua vé/vật phẩm gốc, không lấy chuyển nhượng
            const whereClause = {
                event: { organizer_id: organizer.id },
                order_type: { in: ['TICKET_PURCHASE', 'MERCHANDISE_PURCHASE'] }
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
     * Lấy danh sách giao dịch Marketplace (Chuyển nhượng vé)
     */
    getMarketplaceTransactions: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { event_id } = req.query;

            // 1. Tìm Organizer id
            const organizer = await prisma.organizer.findUnique({
                where: { user_id: userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
            }

            // 2. Tìm các giao dịch Marketplace liên quan đến sự kiện của BTC này
            const whereClause = {
                ticket: {
                    event: {
                        organizer_id: organizer.id
                    }
                }
            };

            if (event_id && event_id.trim() !== '') {
                whereClause.ticket.event_id = event_id;
            }

            const transactions = await prisma.marketplaceTransaction.findMany({
                where: whereClause,
                include: {
                    buyer: { select: { full_name: true, email: true, avatar_url: true } },
                    seller: { select: { full_name: true, email: true, avatar_url: true } },
                    ticket: { 
                        include: { 
                            ticket_tier: { select: { tier_name: true, price: true } },
                            event: { select: { title: true, id: true } }
                        } 
                    },
                    listing: { select: { listing_number: true, asking_price: true } }
                },
                orderBy: { created_at: 'desc' }
            });

            // 3. Map dữ liệu để trả về frontend gọn gàng
            const mappedData = transactions.map(tx => ({
                id: tx.id,
                transaction_number: tx.transaction_number || tx.listing?.listing_number || 'MKT-TX',
                event_title: tx.ticket?.event?.title,
                tier_name: tx.ticket?.ticket_tier?.tier_name,
                original_price: tx.ticket?.ticket_tier?.price,
                resale_price: tx.buyer_pay_amount,
                royalty_amount: tx.organizer_royalty,
                platform_fee: tx.platform_fee,
                status: tx.status,
                created_at: tx.created_at,
                buyer: tx.buyer,
                seller: tx.seller,
                ticket_number: tx.ticket?.ticket_number
            }));

            res.status(200).json(mappedData);
        } catch (error) {
            console.error('Get Marketplace Transactions Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách giao dịch Marketplace.' });
        }
    },

    /**
     * Lấy chi tiết một đơn hàng (dành cho BTC)
     */
    getOrderDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            // 1. Try finding in Order table
            let order = await prisma.order.findUnique({
                where: { id },
                include: {
                    customer: { 
                        select: { id: true, full_name: true, email: true, phone_number: true, avatar_url: true } 
                    },
                    event: { include: { organizer: true } },
                    items: { include: { ticket_tier: { select: { tier_name: true, price: true } } } },
                    merchandise_items: { include: { merchandise: true } },
                    tickets: { include: { ticket_tier: { select: { tier_name: true } } } },
                    payments: { orderBy: { created_at: 'desc' }, take: 5 }
                }
            });

            // 2. If not found, try finding in MarketplaceTransaction table
            if (!order) {
                const mktTx = await prisma.marketplaceTransaction.findUnique({
                    where: { id },
                    include: {
                        buyer: { select: { id: true, full_name: true, email: true, avatar_url: true } },
                        seller: { select: { id: true, full_name: true, email: true, avatar_url: true } },
                        ticket: { 
                            include: { 
                                ticket_tier: { select: { tier_name: true, price: true } },
                                event: { include: { organizer: true } }
                            } 
                        },
                        listing: true
                    }
                });

                if (mktTx) {
                    // Map MarketplaceTransaction to Order-like structure for the frontend
                    order = {
                        id: mktTx.id,
                        order_number: mktTx.listing?.listing_number || 'RESALE',
                        status: mktTx.status === 'completed' ? 'paid' : mktTx.status,
                        total_amount: mktTx.buyer_pay_amount,
                        payment_method: 'marketplace',
                        created_at: mktTx.created_at,
                        customer: mktTx.buyer,
                        event: mktTx.ticket?.event,
                        order_type: 'TICKET_RESALE',
                        tickets: [mktTx.ticket],
                        // Additional info for resale
                        seller: mktTx.seller,
                        is_resale: true
                    };
                }
            }

            if (!order || order.event?.organizer?.user_id !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });
            }

            res.status(200).json(order);
        } catch (error) {
            console.error('Get Order Detail Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy chi tiết đơn hàng.' });
        }
    },

    /**
     * Lấy danh sách chuyển nhượng trực tiếp (Tặng vé)
     */
    getTicketTransfers: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { event_id } = req.query;

            const organizer = await prisma.organizer.findUnique({
                where: { user_id: userId }
            });

            if (!organizer) {
                return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
            }

            // 2. Tìm các đơn hàng loại chuyển nhượng (TICKET_TRANSFER)
            const whereClause = {
                event: { organizer_id: organizer.id },
                order_type: 'TICKET_TRANSFER'
            };

            if (event_id && event_id.trim() !== '') {
                whereClause.event_id = event_id;
            }

            const transfers = await prisma.order.findMany({
                where: whereClause,
                include: {
                    customer: { select: { full_name: true, email: true, avatar_url: true } },
                    event: { select: { title: true } },
                    tickets: { 
                        include: { 
                            ticket_tier: { select: { tier_name: true } },
                            original_tickets: { select: { full_name: true, email: true, avatar_url: true } } // Giả sử sender là original owner
                        } 
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            const mappedData = transfers.map(t => ({
                id: t.id,
                transaction_number: t.order_number,
                event_title: t.event?.title,
                tier_name: t.tickets[0]?.ticket_tier?.tier_name,
                ticket_number: t.tickets[0]?.ticket_number,
                sender: { full_name: '---', email: 'Người dùng cũ' }, // Cần logic chính xác hơn tùy database của bạn
                receiver: t.customer,
                status: t.status === 'paid' ? 'completed' : t.status,
                created_at: t.created_at,
                fee_amount: Number(t.total_amount)
            }));

            res.status(200).json(mappedData);
        } catch (error) {
            console.error('Get Ticket Transfers Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách chuyển nhượng trực tiếp.' });
        }
    }
};

module.exports = OrganizerOrderController;
