const prisma = require('../config/prisma');

// [UC_20] Thống kê Dashboard cho Ban tổ chức
const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    
    if (!organizer) {
      return res.status(403).json({ error: 'Tài khoản không phải Ban tổ chức.' });
    }

    // 1. Fetch all events for the organizer
    const events = await prisma.event.findMany({
      where: { organizer_id: organizer.id },
      include: {
        _count: { select: { tickets: true } },
        ticket_tiers: { select: { quantity_total: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const totalEvents = events.length;
    
    let totalTicketsSold = 0;
    let totalCapacity = 0;
    let upcomingEventsCount = 0;

    const myEvents = events.map(event => {
      const sold = event._count.tickets;
      const total = event.ticket_tiers.reduce((sum, tier) => sum + tier.quantity_total, 0);
      
      totalTicketsSold += sold;
      totalCapacity += total;
      if (['active', 'published', 'pending'].includes(event.status)) upcomingEventsCount++;

      return {
        id: event.id,
        name: event.title,
        date: event.event_date ? event.event_date.toISOString().split('T')[0] : 'N/A',
        sold,
        total,
        status: event.status
      };
    });

    const fillRate = totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0;

    // 2. Fetch Total Revenue (Sum of organizer_revenue from all paid orders)
    const revenueSum = await prisma.order.aggregate({
      where: { 
        event: { organizer_id: organizer.id },
        status: { in: ['paid', 'completed', 'success'] }
      },
      _sum: {
        organizer_revenue: true
      }
    });
    const totalRevenue = Number(revenueSum._sum.organizer_revenue || 0);

    // 3. Fetch Recent Notifications (Orders / Alerts)
    const recentOrders = await prisma.order.findMany({
      where: { event: { organizer_id: organizer.id }, status: 'paid' },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { 
        event: { select: { title: true } } 
      }
    });

    const notifications = recentOrders.map(order => ({
      label: `Đơn hàng mới - ${order.order_number}`,
      time: order.created_at,
      type: 'order'
    }));

    // 4. Calculate Revenue Chart Data (Dynamic Period) - includes resale royalties
    const days = parseInt(req.query.days) || 7;
    const chartDays = days > 30 ? 30 : days; // Limit to max 30 days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (chartDays - 1));
    startDate.setHours(0, 0, 0, 0);

    // Primary revenue: ticket + merchandise orders
    const recentPaidOrders = await prisma.order.findMany({
      where: { 
        event: { organizer_id: organizer.id },
        status: 'paid',
        created_at: { gte: startDate }
      },
      select: {
        created_at: true,
        organizer_revenue: true
      }
    });

    // Secondary revenue: resale royalties from marketplace
    const recentRoyalties = await prisma.marketplaceTransaction.findMany({
      where: {
        listing: { event: { organizer_id: organizer.id } },
        status: { in: ['paid', 'completed', 'success'] },
        created_at: { gte: startDate }
      },
      select: {
        created_at: true,
        organizer_royalty: true
      }
    });

    // All-time royalty total
    const allRoyalties = await prisma.marketplaceTransaction.aggregate({
      where: {
        listing: { event: { organizer_id: organizer.id } },
        status: { in: ['paid', 'completed', 'success'] }
      },
      _sum: { organizer_royalty: true }
    });
    const totalRoyaltyRevenue = Number(allRoyalties._sum.organizer_royalty || 0);

    // Initialize per-day buckets
    const primaryByDate = {};
    const royaltyByDate = {};
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      primaryByDate[dateStr] = 0;
      royaltyByDate[dateStr] = 0;
    }

    recentPaidOrders.forEach(order => {
      const dateStr = order.created_at.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (primaryByDate[dateStr] !== undefined) {
        primaryByDate[dateStr] += Number(order.organizer_revenue || 0);
      }
    });

    recentRoyalties.forEach(tx => {
      const dateStr = tx.created_at.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (royaltyByDate[dateStr] !== undefined) {
        royaltyByDate[dateStr] += Number(tx.organizer_royalty || 0);
      }
    });

    const revenueChart = Object.keys(primaryByDate).map(date => ({
      date,
      primary: primaryByDate[date],
      royalty: royaltyByDate[date],
      revenue: primaryByDate[date] + royaltyByDate[date]
    }));

    // 5. Calculate Top Selling Merchandise
    const merchItems = await prisma.merchandiseOrderItem.groupBy({
      by: ['merchandise_id'],
      _sum: {
        quantity: true,
        subtotal: true
      },
      where: {
        order: {
          event: { organizer_id: organizer.id },
          status: 'paid'
        }
      },
      orderBy: {
        _sum: { quantity: 'desc' }
      },
      take: 3
    });

    const topMerchIds = merchItems.map(m => m.merchandise_id);
    const merchDetails = await prisma.merchandise.findMany({
      where: { id: { in: topMerchIds } },
      select: { id: true, name: true, image_url: true, price: true }
    });

    const topMerchandise = merchItems.map(m => {
      const detail = merchDetails.find(d => d.id === m.merchandise_id);
      return {
        id: detail?.id,
        name: detail?.name || 'Sản phẩm',
        image_url: detail?.image_url,
        price: detail?.price,
        sold_quantity: m._sum.quantity,
        revenue: m._sum.subtotal
      };
    });

    // 6. Calculate Revenue Distribution by Event (Primary + Royalty)
    const eventRevenueGroups = await prisma.order.groupBy({
      by: ['event_id'],
      _sum: {
        organizer_revenue: true
      },
      where: {
        event: { organizer_id: organizer.id },
        status: { in: ['paid', 'completed', 'success'] }
      }
    });

    // Royalties per event from marketplace
    const royaltyByEvent = await prisma.marketplaceTransaction.findMany({
      where: {
        listing: { event: { organizer_id: organizer.id } },
        status: { in: ['paid', 'completed', 'success'] }
      },
      select: {
        listing: { select: { event_id: true } },
        organizer_royalty: true
      }
    });

    // Group royalties by event_id
    const royaltyMapByEvent = {};
    royaltyByEvent.forEach(tx => {
      const eventId = tx.listing?.event_id;
      if (eventId) {
        royaltyMapByEvent[eventId] = (royaltyMapByEvent[eventId] || 0) + Number(tx.organizer_royalty || 0);
      }
    });

    const eventRevenueDistribution = eventRevenueGroups.map(group => {
      const ev = events.find(e => e.id === group.event_id);
      const royalty = royaltyMapByEvent[group.event_id] || 0;
      return {
        name: ev?.title || 'Unknown',
        value: (Number(group._sum.organizer_revenue) || 0) + royalty
      };
    }).filter(e => e.value > 0).sort((a, b) => b.value - a.value);

    let finalDistribution = eventRevenueDistribution;
    if (eventRevenueDistribution.length > 5) {
      const top4 = eventRevenueDistribution.slice(0, 4);
      const others = eventRevenueDistribution.slice(4).reduce((sum, e) => sum + e.value, 0);
      top4.push({ name: 'Khác', value: others });
      finalDistribution = top4;
    }

    res.status(200).json({
      data: {
        total_events: totalEvents,
        total_revenue: totalRevenue,
        total_tickets_sold: totalTicketsSold,
        fill_rate: fillRate,
        upcoming_events_count: upcomingEventsCount,
        my_events: myEvents.slice(0, 5), // Only send top 5 to dashboard
        notifications,
        revenue_chart: revenueChart,
        top_merchandise: topMerchandise,
        event_revenue_distribution: finalDistribution,
        total_royalty_revenue: totalRoyaltyRevenue
      }
    });

  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_21] Thống kê Chi tiết & Báo cáo cho Ban tổ chức
const getReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { eventId } = req.query;
    
    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    
    if (!organizer) {
      return res.status(403).json({ error: 'Tài khoản không phải Ban tổ chức.' });
    }

    // Determine target event IDs
    let targetEventIds = [];
    if (eventId) {
      // Check if the event belongs to this organizer
      const event = await prisma.event.findFirst({
        where: { id: eventId, organizer_id: organizer.id }
      });
      if (!event) {
        return res.status(404).json({ error: 'Không tìm thấy sự kiện hoặc bạn không có quyền truy cập.' });
      }
      targetEventIds = [eventId];
    } else {
      const organizerEvents = await prisma.event.findMany({
        where: { organizer_id: organizer.id },
        select: { id: true }
      });
      targetEventIds = organizerEvents.map(e => e.id);
    }

    // Fetch relevant events for detail mapping
    const organizerEvents = await prisma.event.findMany({
      where: { id: { in: targetEventIds } },
      select: { 
        id: true, 
        title: true,
        ticket_tiers: { select: { id: true, tier_name: true, price: true, quantity_total: true } }
      }
    });

    const eventIds = organizerEvents.map(e => e.id);

    // 1. Overview Financials
    const ticketRevenueRes = await prisma.order.aggregate({
      where: { event_id: { in: eventIds }, status: 'paid' },
      _sum: { organizer_revenue: true }
    });

    // Get listing IDs first to avoid nested relation filters in aggregate
    const organizerListings = await prisma.marketplaceListing.findMany({
      where: { event_id: { in: eventIds } },
      select: { id: true }
    });
    const listingIds = organizerListings.map(l => l.id);

    const royaltyRevenueRes = await prisma.marketplaceTransaction.aggregate({
      where: { 
        listing_id: { in: listingIds }, 
        status: { in: ['paid', 'completed', 'success'] } 
      },
      _sum: { organizer_royalty: true }
    });

    // 2. Ticket Tier Distribution (Aggregated by Name)
    const tierSales = await prisma.ticket.groupBy({
      by: ['ticket_tier_id'],
      _count: { id: true },
      where: { event_id: { in: eventIds } }
    });

    const aggregatedTiers = {};

    tierSales.forEach(t => {
      let tierDetail = null;
      for (const ev of organizerEvents) {
        tierDetail = ev.ticket_tiers.find(tier => tier.id === t.ticket_tier_id);
        if (tierDetail) break;
      }

      const name = tierDetail?.tier_name || 'Khác';
      if (!aggregatedTiers[name]) {
        aggregatedTiers[name] = { name, value: 0, revenue: 0 };
      }
      
      aggregatedTiers[name].value += t._count.id;
      aggregatedTiers[name].revenue += t._count.id * (Number(tierDetail?.price) || 0);
    });

    const tierDistribution = Object.values(aggregatedTiers).sort((a, b) => b.value - a.value);

    // 3. Monthly Sales (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1); // Set to 1st to avoid month rollover bugs
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyOrders = await prisma.order.findMany({
      where: { 
        event_id: { in: eventIds },
        status: 'paid',
        created_at: { gte: sixMonthsAgo }
      },
      select: { created_at: true, organizer_revenue: true }
    });

    const monthBuckets = {};
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      monthBuckets[key] = 0;
      monthLabels.push({ key, label });
    }

    monthlyOrders.forEach(order => {
      const d = new Date(order.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthBuckets[key] !== undefined) {
        monthBuckets[key] += Number(order.organizer_revenue || 0);
      }
    });

    const monthlyTrends = monthLabels.map(m => ({
      month: m.label,
      revenue: monthBuckets[m.key]
    }));

    // 5. Attendance & Check-in Stats
    const checkInStats = await prisma.ticket.count({
      where: { event_id: { in: eventIds }, is_used: true }
    });

    // 6. Refund Stats
    const refundStats = await prisma.refundRequest.count({
      where: { ticket: { event_id: { in: eventIds } } }
    });

    // 7. Merchandise Analytics
    const paidOrders = await prisma.order.findMany({
      where: { event_id: { in: eventIds }, status: 'paid' },
      select: { id: true }
    });
    const paidOrderIds = paidOrders.map(o => o.id);

    const merchItems = await prisma.merchandiseOrderItem.groupBy({
      by: ['merchandise_id'],
      _sum: { quantity: true, subtotal: true },
      where: { order_id: { in: paidOrderIds } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const merchIds = merchItems.map(m => m.merchandise_id);
    const merchDetails = await prisma.merchandise.findMany({
      where: { id: { in: merchIds } },
      select: { id: true, name: true, image_url: true }
    });

    const topMerchandise = merchItems.map(m => {
      const detail = merchDetails.find(d => d.id === m.merchandise_id);
      return {
        name: detail?.name || 'Sản phẩm',
        sold: m._sum.quantity,
        revenue: Number(m._sum.subtotal || 0),
        image: detail?.image_url
      };
    });

    // 8. Performance by Event (with attendance)
    const eventTicketCounts = await prisma.ticket.groupBy({
      by: ['event_id'],
      _count: { id: true },
      where: { event_id: { in: eventIds } }
    });

    const eventCheckInCounts = await prisma.ticket.groupBy({
      by: ['event_id'],
      _count: { id: true },
      where: { event_id: { in: eventIds }, is_used: true }
    });

    const topEvents = organizerEvents.map(e => {
      const capacity = e.ticket_tiers.reduce((sum, t) => sum + t.quantity_total, 0);
      const soldInfo = eventTicketCounts.find(count => count.event_id === e.id);
      const checkInInfo = eventCheckInCounts.find(count => count.event_id === e.id);
      
      const sold = soldInfo?._count.id || 0;
      const checkIns = checkInInfo?._count.id || 0;

      return {
        id: e.id,
        title: e.title,
        sold,
        checkIns,
        capacity,
        fillRate: capacity > 0 ? Math.round((sold/capacity)*100) : 0,
        attendanceRate: sold > 0 ? Math.round((checkIns/sold)*100) : 0
      };
    }).sort((a, b) => b.sold - a.sold).slice(0, 5);

    res.status(200).json({
      data: {
        summary: {
          ticketRevenue: Number(ticketRevenueRes._sum.organizer_revenue || 0),
          royaltyRevenue: Number(royaltyRevenueRes._sum.organizer_royalty || 0),
          totalRevenue: Number(ticketRevenueRes._sum.organizer_revenue || 0) + Number(royaltyRevenueRes._sum.organizer_royalty || 0),
          totalTickets: eventTicketCounts.reduce((sum, e) => sum + e._count.id, 0),
          totalCheckIns: checkInStats,
          totalRefunds: refundStats
        },
        tierDistribution,
        monthlyTrends,
        topEvents,
        topMerchandise
      }
    });

  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({ error: 'Lỗi server khi tổng hợp báo cáo.', message: error.message });
  }
};

module.exports = {
  getStats,
  getReports
};
