const prisma = require('../config/prisma');

// [UC_xx] Thống kê vé cho Ban tổ chức
const getOrganizerTicketStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { event_id } = req.query;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy tài khoản BTC.' });

    let eventIds;
    if (event_id) {
      const event = await prisma.event.findFirst({
        where: { id: event_id, organizer_id: organizer.id },
        select: { id: true }
      });
      if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện hoặc bạn không có quyền.' });
      eventIds = [event_id];
    } else {
      const events = await prisma.event.findMany({
        where: { organizer_id: organizer.id },
        select: { id: true }
      });
      eventIds = events.map(e => e.id);
    }

    // 1. Doanh thu
    const primaryOrders = await prisma.order.findMany({
      where: { event_id: { in: eventIds }, status: 'paid' },
      select: {
        id: true,
        organizer_revenue: true,
        merchandise_items: { select: { subtotal: true } }
      }
    });

    let totalPrimaryRevenue = 0;
    let totalTicketRevenue = 0;
    let totalMerchandiseRevenue = 0;

    primaryOrders.forEach(order => {
      const orderMerchRevenue = order.merchandise_items.reduce((sum, item) => sum + Number(item.subtotal), 0);
      totalPrimaryRevenue += Number(order.organizer_revenue || 0);
      totalMerchandiseRevenue += orderMerchRevenue;
      totalTicketRevenue += (Number(order.organizer_revenue || 0) - orderMerchRevenue);
    });

    const royaltyStats = await prisma.marketplaceTransaction.aggregate({
      where: { 
        listing: { event_id: { in: eventIds } }, 
        status: { in: ['paid', 'completed', 'success'] } 
      },
      _sum: { organizer_royalty: true }
    });
    const totalRoyaltyRevenue = Number(royaltyStats._sum.organizer_royalty || 0);
    const totalRevenue = totalPrimaryRevenue + totalRoyaltyRevenue;

    // 2. Tổng vé & Check-ins
    const [totalSold, totalCheckins] = await Promise.all([
      prisma.ticket.count({
        where: { event_id: { in: eventIds }, status: { in: ['valid', 'minted', 'used', 'reselling'] } }
      }),
      prisma.ticket.count({
        where: { event_id: { in: eventIds }, is_used: true }
      })
    ]);

    // 3. Đếm số vé đang rao bán (Dựa trên MarketplaceListing đang active)
    const totalReselling = await prisma.ticket.count({
      where: { 
        event_id: { in: eventIds },
        marketplace_listings: { some: { status: 'active' } }
      }
    });

    // 4. Thống kê theo Tiers
    const tiers = await prisma.ticketTier.findMany({
      where: { event_id: { in: eventIds } },
      select: {
        id: true,
        tier_name: true,
        price: true,
        quantity_total: true,
        _count: {
          select: { 
            tickets: { where: { status: { in: ['valid', 'minted', 'used', 'reselling'] } } }
          }
        }
      }
    });

    // Đếm số vé reselling cho từng tier dựa trên active listings
    const resellingByTier = await prisma.ticket.groupBy({
      by: ['ticket_tier_id'],
      where: { 
        event_id: { in: eventIds },
        marketplace_listings: { some: { status: 'active' } }
      },
      _count: { id: true }
    });

    const tierData = tiers.map(t => {
      const reselling = resellingByTier.find(r => r.ticket_tier_id === t.id)?._count.id || 0;
      return {
        ...t,
        sold_count: t._count.tickets,
        reselling_count: reselling,
        remaining: t.quantity_total - t._count.tickets
      };
    });

    const totalCapacity = tiers.reduce((sum, t) => sum + t.quantity_total, 0);
    const soldRate = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
    const resaleRate = totalSold > 0 ? (totalReselling / totalSold) * 100 : 0;

    let demandLabel = "Trung bình";
    if (soldRate > 90 || resaleRate > 15) demandLabel = "Rất cao";
    else if (soldRate > 70) demandLabel = "Cao";
    else if (soldRate < 40) demandLabel = "Thấp";

    res.status(200).json({
      data: {
        total_revenue: totalRevenue,
        ticket_revenue: totalTicketRevenue,
        royalty_revenue: totalRoyaltyRevenue,
        merchandise_revenue: totalMerchandiseRevenue,
        total_sold: totalSold,
        total_checkins: totalCheckins,
        total_reselling: totalReselling,
        total_capacity: totalCapacity,
        checkin_rate: totalSold > 0 ? ((totalCheckins / totalSold) * 100).toFixed(1) : 0,
        market_demand: {
          label: demandLabel,
          resale_rate: resaleRate.toFixed(1)
        },
        tiers: tierData
      }
    });
  } catch (error) {
    console.error('Get Organizer Stats Error:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê.' });
  }
};

// [UC_xx] Lấy danh sách vé đã bán cho BTC
const getOrganizerTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { event_id, ticket_tier_id, status, search, page = 1, limit = 10 } = req.query;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy tài khoản BTC.' });

    const where = {
      event: { organizer_id: organizer.id }
    };

    if (event_id) where.event_id = event_id;
    if (ticket_tier_id) where.ticket_tier_id = ticket_tier_id;
    
    // Nếu filter là 'reselling', ưu tiên tìm theo active listings
    if (status === 'reselling') {
      where.OR = [
        { status: 'reselling' },
        { marketplace_listings: { some: { status: 'active' } } }
      ];
    } else if (status) {
      where.status = status;
    }

    if (search) {
      const searchCondition = {
        OR: [
          { ticket_number: { contains: search, mode: 'insensitive' } },
          { current_owner: { full_name: { contains: search, mode: 'insensitive' } } },
          { current_owner: { email: { contains: search, mode: 'insensitive' } } }
        ]
      };
      
      // Merge search into existing where
      if (where.OR) {
        // If we already have an OR (from reselling), we need to wrap both in an AND
        const originalOR = where.OR;
        delete where.OR;
        where.AND = [
          { OR: originalOR },
          searchCondition
        ];
      } else {
        where.OR = searchCondition.OR;
      }
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          event: { 
            select: { 
              title: true,
              resale_gas_fee: true,
              resale_platform_fee_percent: true
            } 
          },
          ticket_tier: { select: { tier_name: true, price: true } },
          current_owner: { select: { full_name: true, email: true, avatar_url: true } },
          marketplace_listings: { 
            where: { status: 'active' },
            select: { asking_price: true, metadata: true }
          }
        },
        orderBy: { id: 'desc' },
        skip: Number(skip),
        take: Number(limit)
      }),
      prisma.ticket.count({ where })
    ]);

    res.status(200).json({
      data: tickets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Organizer Tickets Error:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách vé.' });
  }
};

// [GET] /api/organizer/tickets/export
const exportOrganizerTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { event_id, ticket_tier_id, status, search } = req.query;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy tài khoản BTC.' });

    const where = {
      event: { organizer_id: organizer.id }
    };

    if (event_id) where.event_id = event_id;
    if (ticket_tier_id) where.ticket_tier_id = ticket_tier_id;
    if (status === 'reselling') {
      where.OR = [
        { status: 'reselling' },
        { marketplace_listings: { some: { status: 'active' } } }
      ];
    } else if (status) {
      where.status = status;
    }

    if (search) {
      const searchCondition = {
        OR: [
          { ticket_number: { contains: search, mode: 'insensitive' } },
          { current_owner: { full_name: { contains: search, mode: 'insensitive' } } },
          { current_owner: { email: { contains: search, mode: 'insensitive' } } }
        ]
      };
      if (where.OR) {
        const originalOR = where.OR;
        delete where.OR;
        where.AND = [{ OR: originalOR }, searchCondition];
      } else {
        where.OR = searchCondition.OR;
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticket_number: true,
        nft_token_id: true,
        nft_mint_tx_hash: true,
        status: true,
        event: { select: { title: true } },
        ticket_tier: { select: { tier_name: true, price: true } },
        current_owner: { select: { full_name: true, email: true } },
        order: { select: { created_at: true } },
        marketplace_listings: { 
          where: { status: 'active' },
          select: { asking_price: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.status(200).json({ data: tickets });
  } catch (error) {
    console.error('Export Organizer Tickets Error:', error);
    res.status(500).json({ error: 'Lỗi server khi xuất danh sách vé.' });
  }
};

module.exports = {
  getOrganizerTicketStats,
  getOrganizerTickets,
  exportOrganizerTickets
};
