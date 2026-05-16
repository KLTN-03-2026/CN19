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
                status: { in: ['paid', 'completed', 'cancelled'] },
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
                            event: { select: { title: true, id: true, status: true } }
                        } 
                    },
                    listing: { 
                        include: { 
                            merchandise_items: {
                                include: {
                                    merchandise: {
                                        select: { name: true, image_url: true }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            // 3. Map dữ liệu để trả về frontend gọn gàng
            const mappedData = transactions.map(tx => {
                const isCancelled = tx.status === 'cancelled' || ['cancelled', 'pending_cancellation_fee'].includes(tx.ticket?.event?.status);
                return {
                    id: tx.id,
                    transaction_number: tx.transaction_number || tx.listing?.listing_number || 'MKT-TX',
                    event_title: tx.ticket?.event?.title,
                    tier_name: tx.ticket?.ticket_tier?.tier_name,
                    original_price: tx.ticket?.ticket_tier?.price,
                    resale_price: tx.buyer_pay_amount,
                    royalty_amount: tx.organizer_royalty,
                    platform_fee: tx.platform_fee,
                    status: isCancelled ? 'cancelled' : tx.status,
                    created_at: tx.created_at,
                    buyer: tx.buyer,
                    seller: tx.seller,
                    ticket_number: tx.ticket?.ticket_number,
                    merchandise_items: [
                        ...(tx.listing?.merchandise_items || []),
                        ...(tx.listing?.metadata?.selected_merchandise || [])
                    ],
                    nft_transfer_tx_hash: tx.nft_transfer_tx_hash
                };
            });

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

            // 2. If not found in Order table, or if it is a resale order, try finding in MarketplaceTransaction table
            // Marketplace transactions can sometimes be found in both tables, but the Transaction table has the listing/royalty info
            let mktTx = await prisma.marketplaceTransaction.findUnique({
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
                    listing: {
                        include: {
                            merchandise_items: {
                                include: {
                                    merchandise: {
                                        select: { name: true, image_url: true }
                                    }
                                }
                            }
                        }
                    },
                    payments: { orderBy: { created_at: 'desc' }, take: 1 }
                }
            });

            // If found in marketplace transaction table, use that as it's more complete for resale
            if (mktTx) {
                const isCancelled = mktTx.status === 'cancelled' || ['cancelled', 'pending_cancellation_fee'].includes(mktTx.ticket?.event?.status);
                order = {
                    id: mktTx.id,
                    transaction_number: mktTx.transaction_number || mktTx.listing?.listing_number || 'RESALE',
                    order_number: mktTx.listing?.listing_number || 'RESALE',
                    status: isCancelled ? 'cancelled' : (mktTx.status === 'completed' ? 'paid' : mktTx.status),
                    total_amount: mktTx.buyer_pay_amount,
                    payment_method: mktTx.payment_method || 'marketplace',
                    created_at: mktTx.created_at,
                    customer: mktTx.buyer,
                    buyer: mktTx.buyer,
                    seller: mktTx.seller,
                    event: mktTx.ticket?.event,
                    event_title: mktTx.ticket?.event?.title,
                    order_type: 'TICKET_RESALE',
                    tickets: [mktTx.ticket],
                    ticket_number: mktTx.ticket?.ticket_number,
                    tier_name: mktTx.ticket?.ticket_tier?.tier_name,
                    original_price: mktTx.ticket?.ticket_tier?.price,
                    resale_price: mktTx.buyer_pay_amount,
                    royalty_amount: mktTx.organizer_royalty,
                    platform_fee: mktTx.platform_fee,
                    payment_method: (mktTx.payments?.[0]?.method || 'VNPAY').toUpperCase(),
                    merchandise_total: mktTx.listing?.metadata?.merchandise_total || 0,
                    original_ticket_price: mktTx.listing?.metadata?.ticket_price || mktTx.ticket?.ticket_tier?.price,
                    merchandise_items: [
                        ...(mktTx.listing?.merchandise_items || []),
                        ...(mktTx.listing?.metadata?.selected_merchandise || [])
                    ],
                    nft_transfer_tx_hash: mktTx.nft_transfer_tx_hash,
                    is_resale: true
                };
            } else if (order && order.order_type === 'TICKET_RESALE') {
                // If it's in Order table as TICKET_RESALE but mktTx findUnique failed by ID, 
                // it might be using the Order ID. Try to find the mktTx by ticket_id or similar?
                // Actually, for consistency, marketplace details should use the Transaction ID.
                const relatedTx = await prisma.marketplaceTransaction.findFirst({
                    where: { 
                        listing: { ticket_id: order.items?.[0]?.ticket_id },
                        buyer_id: order.customer_id,
                        status: { in: ['paid', 'completed', 'success'] }
                    },
                    include: {
                        listing: { include: { merchandise_items: { include: { merchandise: true } } } },
                        seller: { select: { id: true, full_name: true, email: true, avatar_url: true } },
                        ticket: { include: { ticket_tier: true } },
                        payments: { orderBy: { created_at: 'desc' }, take: 1 }
                    }
                });

                if (relatedTx) {
                    order = {
                        ...order,
                        resale_price: relatedTx.buyer_pay_amount,
                        royalty_amount: relatedTx.organizer_royalty,
                        platform_fee: relatedTx.platform_fee,
                        payment_method: (relatedTx.payments?.[0]?.method || 'VNPAY').toUpperCase(),
                        merchandise_total: relatedTx.listing?.metadata?.merchandise_total || 0,
                        original_ticket_price: relatedTx.listing?.metadata?.ticket_price || relatedTx.ticket?.ticket_tier?.price,
                        merchandise_items: [
                            ...(relatedTx.listing?.merchandise_items || []),
                            ...(relatedTx.listing?.metadata?.selected_merchandise || [])
                        ],
                        nft_transfer_tx_hash: relatedTx.nft_transfer_tx_hash,
                        is_resale: true,
                        seller: relatedTx.seller,
                        transaction_number: relatedTx.transaction_number || order.order_number
                    };
                }
            }

            if (!order || order.event?.organizer?.user_id !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });
            }

            // 3. Post-process for TICKET_TRANSFER to match the structure expected by MarketplaceDetail.jsx
            if (order.order_type === 'TICKET_TRANSFER') {
                const metadata = order.metadata || {};
                const ticketId = metadata.ticket_id;
                const receiverEmail = metadata.receiver_email;
                const merchandiseIds = metadata.merchandise_item_ids || [];

                let ticket = null;
                let receiver = { full_name: 'N/A', email: receiverEmail || 'N/A', avatar_url: null };
                let merchandiseItems = [];

                if (ticketId) {
                    ticket = await prisma.ticket.findUnique({
                        where: { id: ticketId },
                        include: { ticket_tier: { select: { tier_name: true } } }
                    });
                }

                if (receiverEmail) {
                    const receiverUser = await prisma.user.findUnique({
                        where: { email: receiverEmail },
                        select: { full_name: true, email: true, avatar_url: true }
                    });
                    if (receiverUser) receiver = receiverUser;
                }

                if (merchandiseIds.length > 0) {
                    merchandiseItems = await prisma.merchandiseOrderItem.findMany({
                        where: { id: { in: merchandiseIds } },
                        include: { merchandise: { select: { name: true, image_url: true } } }
                    });
                }

                // Lấy thông tin TicketTransfer để lấy NFT tx hash
                let nft_transfer_tx_hash = null;
                if (ticketId && order.customer) {
                    const transferRecord = await prisma.ticketTransfer.findFirst({
                        where: {
                            ticket_id: ticketId,
                            from_user_id: order.customer.id
                        },
                        orderBy: { completed_at: 'desc' }
                    });
                    if (transferRecord) {
                        nft_transfer_tx_hash = transferRecord.nft_transfer_tx_hash;
                    }
                }

                const isTransferCancelled = ['refund_pending', 'cancelled'].includes(order.status) || ['cancelled', 'pending_cancellation_fee'].includes(order.event?.status);
                // Override order object with mapped fields for MarketplaceDetail.jsx
                order = {
                    ...order,
                    transaction_number: order.order_number,
                    event_title: order.event?.title,
                    tier_name: ticket?.ticket_tier?.tier_name || 'N/A',
                    ticket_number: ticket?.ticket_number || 'N/A',
                    sender: order.customer,
                    receiver: receiver,
                    status: isTransferCancelled ? 'cancelled' : (order.status === 'paid' ? 'completed' : order.status),
                    fee_amount: Number(order.total_amount),
                    merchandise_items: merchandiseItems,
                    nft_transfer_tx_hash: nft_transfer_tx_hash
                };
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
                order_type: 'TICKET_TRANSFER',
                status: { in: ['paid', 'completed', 'refund_pending', 'cancelled'] }
            };

            if (event_id && event_id.trim() !== '') {
                whereClause.event_id = event_id;
            }

            const transfers = await prisma.order.findMany({
                where: whereClause,
                include: {
                    customer: { select: { id: true, full_name: true, email: true, avatar_url: true } },
                    event: { select: { title: true, status: true } }
                },
                orderBy: { created_at: 'desc' }
            });

            // 3. Post-process to get Ticket and Receiver details from metadata
            const mappedData = await Promise.all(transfers.map(async (t) => {
                const metadata = t.metadata || {};
                const ticketId = metadata.ticket_id;
                const receiverEmail = metadata.receiver_email;

                const merchandiseIds = metadata.merchandise_item_ids || [];
                let merchandiseItems = [];

                let ticket = null;
                let receiver = { full_name: 'N/A', email: receiverEmail || 'N/A', avatar_url: null };

                if (ticketId) {
                    ticket = await prisma.ticket.findUnique({
                        where: { id: ticketId },
                        include: { ticket_tier: { select: { tier_name: true } } }
                    });
                }

                if (receiverEmail) {
                    const receiverUser = await prisma.user.findUnique({
                        where: { email: receiverEmail },
                        select: { full_name: true, email: true, avatar_url: true }
                    });
                    if (receiverUser) receiver = receiverUser;
                }

                if (merchandiseIds.length > 0) {
                    merchandiseItems = await prisma.merchandiseOrderItem.findMany({
                        where: { id: { in: merchandiseIds } },
                        include: { merchandise: { select: { name: true, image_url: true } } }
                    });
                }

                // Lấy thông tin TicketTransfer để lấy NFT tx hash
                let nft_transfer_tx_hash = null;
                if (ticketId && t.customer) {
                    const transferRecord = await prisma.ticketTransfer.findFirst({
                        where: {
                            ticket_id: ticketId,
                            from_user_id: t.customer.id
                        },
                        orderBy: { completed_at: 'desc' }
                    });
                    if (transferRecord) {
                        nft_transfer_tx_hash = transferRecord.nft_transfer_tx_hash;
                    }
                }

                const isCancelled = ['refund_pending', 'cancelled'].includes(t.status) || ['cancelled', 'pending_cancellation_fee'].includes(t.event?.status);

                return {
                    id: t.id,
                    transaction_number: t.order_number,
                    event_title: t.event?.title,
                    tier_name: ticket?.ticket_tier?.tier_name || 'N/A',
                    ticket_number: ticket?.ticket_number || 'N/A',
                    sender: t.customer, // Người tạo đơn chuyển nhượng là người gửi
                    receiver: receiver, // Người thụ hưởng vé
                    status: isCancelled ? 'cancelled' : (t.status === 'paid' ? 'completed' : t.status),
                    created_at: t.created_at,
                    fee_amount: Number(t.total_amount),
                    merchandise_items: merchandiseItems,
                    nft_transfer_tx_hash: nft_transfer_tx_hash
                };
            }));

            res.status(200).json(mappedData);
        } catch (error) {
            console.error('Get Ticket Transfers Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách chuyển nhượng trực tiếp.' });
        }
    }
};

module.exports = OrganizerOrderController;
