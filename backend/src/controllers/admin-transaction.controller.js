const prisma = require('../config/prisma');

// [UC_ADMIN_01] Lấy danh sách toàn bộ giao dịch (Primary + Marketplace)
const getTransactions = async (req, res) => {
  try {
    const { status, type, keyword, from, to, eventId, organizerId, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 1. Xây dựng câu query cho Orders
    const orderWhere = {
      AND: [
        status ? { status } : {},
        (type && type !== 'TICKET_PURCHASE' && type !== 'TICKET_TRANSFER') ? { id: 'none' } : (type ? { order_type: type } : {}),
        eventId ? { event_id: eventId } : {},
        organizerId ? { event: { organizer_id: organizerId } } : {},
        keyword ? {
          OR: [
            { order_number: { contains: keyword, mode: 'insensitive' } },
            { customer: { email: { contains: keyword, mode: 'insensitive' } } },
            { customer: { full_name: { contains: keyword, mode: 'insensitive' } } }
          ]
        } : {},
        from ? { created_at: { gte: new Date(from) } } : {},
        to ? { created_at: { lte: new Date(to) } } : {}
      ]
    };

    // 2. Xây dựng câu query cho Marketplace Transactions
    const marketplaceWhere = {
      AND: [
        status ? { status: status === 'paid' || status === 'success' || status === 'completed' ? 'completed' : status } : {},
        (type && type !== 'MARKETPLACE') ? { id: 'none' } : {},
        eventId ? { ticket: { event_id: eventId } } : {},
        organizerId ? { ticket: { event: { organizer_id: organizerId } } } : {},
        keyword ? {
          OR: [
            { id: { contains: keyword, mode: 'insensitive' } },
            { buyer: { email: { contains: keyword, mode: 'insensitive' } } },
            { seller: { email: { contains: keyword, mode: 'insensitive' } } }
          ]
        } : {},
        from ? { id: { gt: '0' } } : {}, 
      ]
    };

    // Fetch dữ liệu
    const [orders, marketplaceTrans] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        include: { 
          customer: { select: { email: true, full_name: true } }, 
          event: { select: { title: true } } 
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.marketplaceTransaction.findMany({
        where: marketplaceWhere,
        include: { 
          buyer: { select: { email: true, full_name: true } }, 
          listing: { include: { event: { select: { title: true } } } } 
        }
      })
    ]);

    // Format và Merge
    const formattedOrders = orders.map(o => ({
      id: o.id,
      transaction_id: o.order_number,
      customer: o.customer.full_name || o.customer.email,
      email: o.customer.email,
      amount: Number(o.total_amount),
      revenue: Number(o.total_amount), 
      status: o.status,
      type: o.order_type,
      created_at: o.created_at,
      description: `Sự kiện: ${o.event?.title || 'N/A'}`
    }));

    const formattedMarketplace = marketplaceTrans.map(m => ({
      id: m.id,
      transaction_id: `MT-${m.id.slice(0, 8)}`,
      customer: m.buyer.full_name || m.buyer.email,
      email: m.buyer.email,
      amount: Number(m.buyer_pay_amount),
      revenue: Number(m.platform_fee), 
      status: m.status,
      type: 'MARKETPLACE',
      created_at: new Date(), 
      description: `Sự kiện: ${m.listing.event?.title || 'N/A'} (Chợ)`
    }));

    const allTransactions = [...formattedOrders, ...formattedMarketplace]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const filteredRevenue = allTransactions.reduce((sum, item) => sum + item.revenue, 0);
    const paginatedData = allTransactions.slice(skip, skip + take);

    res.status(200).json({
      data: paginatedData,
      meta: {
        total: allTransactions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        filteredRevenue: filteredRevenue
      }
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách giao dịch:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_ADMIN_02] Thống kê tổng quan giao dịch
const getTransactionStats = async (req, res) => {
  try {
    const { eventId, organizerId } = req.query;

    const orderWhere = {
        AND: [
            { status: { in: ['success', 'completed', 'paid'] } },
            eventId ? { event_id: eventId } : {},
            organizerId ? { event: { organizer_id: organizerId } } : {}
        ]
    };

    const mktWhere = {
        AND: [
            { status: 'completed' },
            eventId ? { ticket: { event_id: eventId } } : {},
            organizerId ? { ticket: { event: { organizer_id: organizerId } } } : {}
        ]
    };

    // 1. Doanh thu từ Orders
    const orderRevenue = await prisma.order.aggregate({
      where: orderWhere,
      _sum: { total_amount: true }
    });

    // 2. Doanh thu từ Marketplace
    const marketplaceRevenue = await prisma.marketplaceTransaction.aggregate({
      where: mktWhere,
      _sum: { platform_fee: true }
    });

    const totalRevenue = Number(orderRevenue._sum.total_amount || 0) + Number(marketplaceRevenue._sum.platform_fee || 0);

    // Tổng số đơn hàng
    const totalOrdersCount = await prisma.order.count({ where: orderWhere });
    const totalMarketplaceCount = await prisma.marketplaceTransaction.count({ where: mktWhere });

    // Số đơn hàng thành công
    const successfulOrders = await prisma.order.count({
      where: { ...orderWhere, status: { in: ['success', 'completed', 'paid'] } }
    });
    const successfulMarketplace = await prisma.marketplaceTransaction.count({
      where: { ...mktWhere, status: 'completed' }
    });

    // Số đơn hàng thất bại
    const failedOrders = await prisma.order.count({
      where: {
        AND: [
            { status: { in: ['failed', 'cancelled'] } },
            eventId ? { event_id: eventId } : {},
            organizerId ? { event: { organizer_id: organizerId } } : {}
        ]
      }
    });

    // Biểu đồ (vẫn dùng Order làm source chính cho trend)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dailyOrderRevenue = await prisma.order.aggregate({
            where: {
                ...orderWhere,
                created_at: { gte: date, lt: nextDate }
            },
            _sum: { total_amount: true }
        });
        
        last7Days.push({
            date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            revenue: Number(dailyOrderRevenue._sum.total_amount || 0)
        });
    }

    res.status(200).json({
      data: {
        totalRevenue,
        totalOrders: totalOrdersCount + totalMarketplaceCount,
        successfulOrders: successfulOrders + successfulMarketplace,
        failedOrders,
        chartData: last7Days
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê giao dịch:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_ADMIN_03] Lấy chi tiết sâu của một giao dịch
const getTransactionDetail = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'MARKETPLACE') {
        const tx = await prisma.marketplaceTransaction.findUnique({
            where: { id },
            include: {
                buyer: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true } },
                seller: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true } },
                listing: {
                    include: {
                        event: { select: { id: true, title: true, image_url: true, location_address: true, event_date: true } }
                    }
                },
                ticket: {
                    include: {
                        ticket_tier: { select: { tier_name: true, price: true } }
                    }
                }
            }
        });

        if (!tx) return res.status(404).json({ error: 'Không tìm thấy giao dịch.' });

        return res.status(200).json({
            type: 'MARKETPLACE',
            data: tx
        });
    } else {
        // Mặc định coi là ORDER (Primary / Transfer)
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true } },
                event: { select: { id: true, title: true, image_url: true, location_address: true, event_date: true } },
                items: {
                    include: {
                        ticket_tier: { select: { tier_name: true, price: true } }
                    }
                },
                tickets: {
                    select: { id: true, ticket_number: true, nft_token_id: true, status: true, ticket_tier: { select: { tier_name: true } } }
                },
                payments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

        return res.status(200).json({
            type: 'ORDER',
            data: order
        });
    }
  } catch (error) {
    console.error('Lỗi lấy chi tiết giao dịch:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getTransactions,
  getTransactionStats,
  getTransactionDetail
};
