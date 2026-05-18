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
          customer: { select: { email: true, full_name: true, avatar_url: true } }, 
          event: { select: { title: true } } 
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.marketplaceTransaction.findMany({
        where: marketplaceWhere,
        include: { 
          buyer: { select: { email: true, full_name: true, avatar_url: true } }, 
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
      customer_avatar: o.customer.avatar_url,
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
      customer_avatar: m.buyer.avatar_url,
      amount: Number(m.buyer_pay_amount),
      revenue: Number(m.platform_fee), 
      status: m.status,
      type: 'MARKETPLACE',
      created_at: m.created_at, 
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
            { status: { in: ['completed', 'paid', 'success'] } },
            eventId ? { ticket: { event_id: eventId } } : {},
            organizerId ? { ticket: { event: { organizer_id: organizerId } } } : {}
        ]
    };

    // 1. Doanh thu và Hoa hồng từ Orders
    const orders = await prisma.order.findMany({ where: orderWhere });
    let ordersRevenue = 0;
    let ordersCommission = 0;
    orders.forEach(o => {
        ordersRevenue += Number(o.total_amount || 0);
        if (o.order_type === 'TICKET_TRANSFER') {
            ordersCommission += Number(o.total_amount || 0);
        } else {
            ordersCommission += Number(o.platform_fee || 0) + Number(o.commission_fee || 0) + Number(o.gas_fee || 0);
        }
    });

    // 2. Doanh thu và Hoa hồng từ Marketplace
    const mkts = await prisma.marketplaceTransaction.findMany({ where: mktWhere });
    let mktRevenue = 0;
    let mktCommission = 0;
    mkts.forEach(m => {
        mktRevenue += Number(m.buyer_pay_amount || 0);
        mktCommission += Number(m.platform_fee || 0) + Number(m.gas_fee || 0);
    });

    const totalRevenue = ordersRevenue + mktRevenue;
    const totalCommission = ordersCommission + mktCommission;

    // Tổng số đơn hàng
    const totalOrdersCount = await prisma.order.count({ where: orderWhere });
    const totalMarketplaceCount = await prisma.marketplaceTransaction.count({ where: mktWhere });

    // Số đơn hàng thành công
    const successfulOrders = await prisma.order.count({
      where: { ...orderWhere, status: { in: ['success', 'completed', 'paid'] } }
    });
    const successfulMarketplace = await prisma.marketplaceTransaction.count({
      where: { ...mktWhere, status: { in: ['completed', 'paid', 'success'] } }
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
        totalCommission,
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
                buyer: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true, avatar_url: true } },
                seller: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true, avatar_url: true } },
                listing: {
                    include: {
                        event: { 
                            select: { 
                                id: true, 
                                title: true, 
                                image_url: true, 
                                location_address: true, 
                                event_date: true,
                                royalty_fee_percent: true,
                                platform_fee_percent: true,
                                resale_platform_fee_percent: true
                            } 
                        }
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

        let financial_ledger_tx_hash = null;
        try {
            const blockchainService = require('../services/blockchain.service');
            const currentBlock = await blockchainService.provider.getBlockNumber();
            let fromBlock = currentBlock - 100;
            let toBlock = currentBlock;

            if (tx.nft_transfer_tx_hash) {
                try {
                    const chainTx = await blockchainService.provider.getTransaction(tx.nft_transfer_tx_hash);
                    if (chainTx && chainTx.blockNumber) {
                        fromBlock = chainTx.blockNumber - 50;
                        toBlock = chainTx.blockNumber + 50;
                    }
                } catch (txErr) {
                    console.warn(`[Admin TransactionDetail] Lỗi lấy block number của Marketplace Tx:`, txErr.message);
                }
            }

            const filter = blockchainService.contract.filters.FinancialLog(tx.transaction_number);
            
            // Quét theo từng chunk tối đa 90 blocks để tránh giới hạn cực kỳ nghiêm ngặt của RPC Amoy
            const chunkSize = 90;
            let currentFrom = fromBlock;
            let events = [];

            while (currentFrom < toBlock) {
                const currentTo = Math.min(currentFrom + chunkSize, toBlock);
                try {
                    const chunkEvents = await blockchainService.contract.queryFilter(filter, currentFrom, currentTo);
                    if (chunkEvents && chunkEvents.length > 0) {
                        events = chunkEvents;
                        break;
                    }
                } catch (chunkErr) {
                    console.warn(`[Admin TransactionDetail] Lỗi quét chunk [${currentFrom} - ${currentTo}]:`, chunkErr.message);
                }
                currentFrom = currentTo + 1;
            }

            if (events && events.length > 0) {
                financial_ledger_tx_hash = events[events.length - 1].transactionHash;
            }
        } catch (bcErr) {
            console.warn(`[Admin TransactionDetail] Không thể lấy financial ledger hash từ blockchain:`, bcErr.message);
        }

        return res.status(200).json({
            type: 'MARKETPLACE',
            data: {
                ...tx,
                financial_ledger_tx_hash
            }
        });
    } else {
        // Mặc định coi là ORDER (Primary / Transfer)
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true, avatar_url: true } },
                event: { 
                  select: { 
                    id: true, 
                    title: true, 
                    image_url: true, 
                    location_address: true, 
                    event_date: true,
                    platform_fee_percent: true,
                    commission_fee_percent: true,
                    royalty_fee_percent: true
                  } 
                },
                items: {
                    include: {
                        ticket_tier: { select: { tier_name: true, price: true } }
                    }
                },
                merchandise_items: {
                    include: {
                        merchandise: { select: { name: true, image_url: true, price: true } }
                    }
                },
                tickets: {
                    select: { 
                      id: true, 
                      ticket_number: true, 
                      nft_token_id: true, 
                      nft_mint_tx_hash: true,
                      status: true, 
                      ticket_tier: { select: { tier_name: true } } 
                    }
                },
                transfers: {
                    include: {
                        ticket: { select: { ticket_number: true, nft_token_id: true } },
                        receiver: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true, avatar_url: true } },
                        sender: { select: { id: true, email: true, full_name: true, phone_number: true, wallet_address: true, avatar_url: true } }
                    }
                },
                payments: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

        // Tìm mint hash từ vé nếu order không có trực tiếp
        let nft_mint_tx_hash = order.transaction_hash;
        if (!nft_mint_tx_hash && order.tickets && order.tickets.length > 0) {
            nft_mint_tx_hash = order.tickets.find(t => t.nft_mint_tx_hash)?.nft_mint_tx_hash;
        }

        let nft_transfer_tx_hash = order.transfers?.[0]?.nft_transfer_tx_hash || null;
        let receiver = order.transfers?.[0]?.receiver || null;

        const firstTicket = order.tickets?.find(t => t.nft_token_id) || order.transfers?.[0]?.ticket;
        const metadata_url = firstTicket?.nft_token_id ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/metadata/${firstTicket.nft_token_id}` : null;

        let financial_ledger_tx_hash = null;
        try {
            const blockchainService = require('../services/blockchain.service');
            const currentBlock = await blockchainService.provider.getBlockNumber();
            let fromBlock = currentBlock - 100;
            let toBlock = currentBlock;

            let reference_tx_hash = nft_mint_tx_hash || nft_transfer_tx_hash;
            if (reference_tx_hash) {
                try {
                    const chainTx = await blockchainService.provider.getTransaction(reference_tx_hash);
                    if (chainTx && chainTx.blockNumber) {
                        fromBlock = chainTx.blockNumber - 10;
                        toBlock = Math.min(chainTx.blockNumber + 300, currentBlock);
                    }
                } catch (txErr) {
                    console.warn(`[Admin TransactionDetail] Lỗi lấy block number của Order Tx:`, txErr.message);
                }
            }

            const filter = blockchainService.contract.filters.FinancialLog(order.order_number);
            
            // Quét theo từng chunk tối đa 90 blocks để tránh giới hạn cực kỳ nghiêm ngặt của RPC Amoy
            const chunkSize = 90;
            let currentFrom = fromBlock;
            let events = [];

            while (currentFrom < toBlock) {
                const currentTo = Math.min(currentFrom + chunkSize, toBlock);
                try {
                    const chunkEvents = await blockchainService.contract.queryFilter(filter, currentFrom, currentTo);
                    if (chunkEvents && chunkEvents.length > 0) {
                        events = chunkEvents;
                        break;
                    }
                } catch (chunkErr) {
                    console.warn(`[Admin TransactionDetail] Lỗi quét chunk [${currentFrom} - ${currentTo}]:`, chunkErr.message);
                }
                currentFrom = currentTo + 1;
            }

            if (events && events.length > 0) {
                financial_ledger_tx_hash = events[events.length - 1].transactionHash;
            }
        } catch (bcErr) {
            console.warn(`[Admin TransactionDetail] Không thể lấy financial ledger hash từ blockchain:`, bcErr.message);
        }

        return res.status(200).json({
            type: 'ORDER',
            data: {
              ...order,
              receiver,
              nft_mint_tx_hash,
              nft_transfer_tx_hash,
              metadata_url,
              financial_ledger_tx_hash
            }
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
