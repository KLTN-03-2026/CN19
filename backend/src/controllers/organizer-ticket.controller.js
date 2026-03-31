const prisma = require('../config/prisma');

// [UC_xx] Thống kê vé cho Ban tổ chức
const getOrganizerTicketStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Tìm Organizer của user này
    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy tài khoản BTC.' });

    // Lấy tất cả sự kiện của organizer
    const events = await prisma.event.findMany({
      where: { organizer_id: organizer.id },
      select: { id: true }
    });
    const eventIds = events.map(e => e.id);

    // 1. Tổng doanh thu (Từ các Order đã hoàn thành của các sự kiện này)
    const totalRevenue = await prisma.order.aggregate({
      where: { event_id: { in: eventIds }, status: 'completed' },
      _sum: { total_amount: true }
    });

    // 2. Tổng vé đã bán (Tickets status là 'minted' hoặc 'used')
    const totalSold = await prisma.ticket.count({
      where: { event_id: { in: eventIds }, status: { in: ['minted', 'used'] } }
    });

    // 3. Tổng lượt tham gia (Tickets is_used = true)
    const totalCheckins = await prisma.ticket.count({
      where: { event_id: { in: eventIds }, is_used: true }
    });

    // 4. Thống kê theo từng loại vé (Tier)
    const tiers = await prisma.ticketTier.findMany({
      where: { event_id: { in: eventIds } },
      select: {
        id: true,
        tier_name: true,
        price: true,
        quantity_total: true,
        _count: {
          select: { tickets: { where: { status: { in: ['minted', 'used'] } } } }
        }
      }
    });

    res.status(200).json({
      data: {
        total_revenue: totalRevenue._sum.total_amount || 0,
        total_sold: totalSold,
        total_checkins: totalCheckins,
        checkin_rate: totalSold > 0 ? ((totalCheckins / totalSold) * 100).toFixed(1) : 0,
        tiers: tiers.map(t => ({
          ...t,
          sold_count: t._count.tickets,
          remaining: t.quantity_total - t._count.tickets
        }))
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
    const { event_id, status, search, page = 1, limit = 10 } = req.query;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy tài khoản BTC.' });

    // Lọc theo các sự kiện của organizer
    const where = {
      event: { organizer_id: organizer.id }
    };

    if (event_id) where.event_id = event_id;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { ticket_number: { contains: search, mode: 'insensitive' } },
        { current_owner: { full_name: { contains: search, mode: 'insensitive' } } },
        { current_owner: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          event: { select: { title: true } },
          ticket_tier: { select: { tier_name: true, price: true } },
          current_owner: { select: { full_name: true, email: true } }
        },
        orderBy: { created_at: 'desc' },
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

module.exports = {
  getOrganizerTicketStats,
  getOrganizerTickets
};
