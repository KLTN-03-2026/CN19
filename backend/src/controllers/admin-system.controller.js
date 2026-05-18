const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');
const EmailService = require('../services/email.service');
const { format } = require('date-fns');

// Biến tạm lưu OTP (Trong thực tế nên dùng Redis hoặc DB có TTL)
const otpCache = new Map();

// [UC_26] Quản lý cấu hình hệ thống
const getConfig = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const config = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    const defaults = {
      event_platform_fee_percent: '5',
      product_platform_fee_percent: '3',
      event_marketplace_fee_percent: '5',
      product_marketplace_fee_percent: '2',
      withdrawal_fee_percent: '2',
      min_withdrawal_amount: '50000',
      default_royalty_percent: '3',
      system_gas_fee: '10000',
      site_name: 'BASTICKET',
      support_email: 'support@basticket.com',
      maintenance_mode: 'false',
      bot_risk_threshold: '0.7',
      smart_contract_address: process.env.CONTRACT_ADDRESS || '0x9711005b6f9AC6953c41A5Bb3d86a7549a9084EE',
      rpc_url: process.env.RPC_URL || 'https://rpc-amoy.polygon.technology/'
    };
    res.status(200).json({ data: { ...defaults, ...config } });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { settings, otp_code } = req.body;
    
    // Kiểm tra OTP động
    const adminEmail = 'basticket.noreply@gmail.com';
    const cachedOtp = otpCache.get(adminEmail);
    
    if (!cachedOtp || cachedOtp.code !== otp_code) {
      return res.status(403).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }
    
    // Xóa OTP sau khi dùng thành công
    otpCache.delete(adminEmail);

    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });
    await Promise.all(updatePromises);
    res.status(200).json({ message: 'Thành công.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const requestConfigOTP = async (req, res) => {
  try {
    const adminEmail = 'basticket.noreply@gmail.com';
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Lưu vào cache 5 phút
    otpCache.set(adminEmail, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000
    });

    // Gửi email
    await EmailService.sendOTPConfigEmail(adminEmail, otp);
    
    res.status(200).json({ message: 'Đã gửi mã OTP vào email admin.' });
  } catch (error) {
    console.error('OTP Request Error:', error);
    res.status(500).json({ error: 'Không thể gửi OTP.' });
  }
};

const getFraudAlerts = async (req, res) => {
  try {
    const alerts = await prisma.botDetectionLog.findMany({
      orderBy: { created_at: 'desc' },
      include: { user: true, order: true }
    });
    res.status(200).json({ data: alerts });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const processFraudAlert = async (req, res) => {
  try {
    const { action } = req.body;
    res.status(200).json({ message: 'Thành công.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const getPlatformStats = async (req, res) => {
  try {
    const { period = 'day' } = req.query; // 'day' or 'month'
    
    // 1. Current Stats
    const totalUsers = await prisma.user.count() || 0;
    const totalEvents = await prisma.event.count() || 0;
    const totalDirectOrders = await prisma.order.count({ 
      where: { status: 'paid' } 
    }) || 0;
    const totalMarketplaceOrders = await prisma.marketplaceTransaction.count({
      where: { status: { in: ['paid', 'completed'] } }
    }) || 0;
    const totalSuccessfulOrders = totalDirectOrders + totalMarketplaceOrders;

    // 2. Growth Calculation (Comparing with previous 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    // Users Growth
    const usersLast7Days = await prisma.user.count({ where: { created_at: { gte: sevenDaysAgo } } });
    const usersPrev7Days = await prisma.user.count({ where: { created_at: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } });
    const userGrowth = usersPrev7Days === 0 ? (usersLast7Days > 0 ? 100 : 0) : ((usersLast7Days - usersPrev7Days) / usersPrev7Days * 100);

    // Revenue Growth
    const calcRevenue = async (start, end) => {
      const where = end ? { created_at: { gte: start, lt: end } } : { created_at: { gte: start } };
      const d = await prisma.order.aggregate({ where: { ...where, status: 'paid' }, _sum: { platform_fee: true, commission_fee: true } });
      const m = await prisma.marketplaceTransaction.aggregate({ where: { ...where, status: { in: ['paid', 'completed'] } }, _sum: { platform_fee: true, commission_fee: true } });
      const w = await prisma.withdrawalRequest.aggregate({ where: { ...where, status: 'approved' }, _sum: { fee_amount: true } });
      const merch = await prisma.merchandiseOrderItem.aggregate({ where: { order: { status: 'paid', created_at: end ? { gte: start, lt: end } : { gte: start } } }, _sum: { platform_fee: true, commission_fee: true } });
      
      return (Number(d._sum.platform_fee) || 0) + (Number(d._sum.commission_fee) || 0) +
             (Number(m._sum.platform_fee) || 0) + (Number(m._sum.commission_fee) || 0) +
             (Number(w._sum.fee_amount) || 0) +
             (Number(merch._sum.platform_fee) || 0) + (Number(merch._sum.commission_fee) || 0);
    };

    const revLast7Days = await calcRevenue(sevenDaysAgo);
    const revPrev7Days = await calcRevenue(fourteenDaysAgo, sevenDaysAgo);
    const revenueGrowth = revPrev7Days === 0 ? (revLast7Days > 0 ? 100 : 0) : ((revLast7Days - revPrev7Days) / revPrev7Days * 100);

    // Orders Growth
    const ordersLast7Days = await prisma.order.count({ where: { status: 'paid', created_at: { gte: sevenDaysAgo } } }) + 
                             await prisma.marketplaceTransaction.count({ where: { status: { in: ['paid', 'completed'] }, created_at: { gte: sevenDaysAgo } } });
    const ordersPrev7Days = await prisma.order.count({ where: { status: 'paid', created_at: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }) +
                             await prisma.marketplaceTransaction.count({ where: { status: { in: ['paid', 'completed'] }, created_at: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } });
    const ordersGrowth = ordersPrev7Days === 0 ? (ordersLast7Days > 0 ? 100 : 0) : ((ordersLast7Days - ordersPrev7Days) / ordersPrev7Days * 100);

    // Event Growth
    const eventsLast7Days = await prisma.event.count({ where: { created_at: { gte: sevenDaysAgo } } });
    const eventsPrev7Days = await prisma.event.count({ where: { created_at: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } });
    const eventsGrowth = eventsPrev7Days === 0 ? (eventsLast7Days > 0 ? 100 : 0) : ((eventsLast7Days - eventsPrev7Days) / eventsPrev7Days * 100);

    // 3. All-time Revenue
    const directRevData = await prisma.order.aggregate({
      where: { status: 'paid' },
      _sum: { platform_fee: true, commission_fee: true }
    });
    const totalDirectRev = (Number(directRevData._sum.platform_fee) || 0) + (Number(directRevData._sum.commission_fee) || 0);

    const marketplaceRevData = await prisma.marketplaceTransaction.aggregate({
      where: { status: { in: ['paid', 'completed'] } },
      _sum: { platform_fee: true, commission_fee: true }
    });
    const totalMarketplaceRev = (Number(marketplaceRevData._sum.platform_fee) || 0) + (Number(marketplaceRevData._sum.commission_fee) || 0);

    const withdrawalFees = await prisma.withdrawalRequest.aggregate({
      where: { status: 'approved' },
      _sum: { fee_amount: true }
    });
    
    const merchandiseFees = await prisma.merchandiseOrderItem.aggregate({
      where: { order: { status: 'paid' } },
      _sum: { platform_fee: true, commission_fee: true }
    });

    const totalOtherFees = (Number(withdrawalFees._sum.fee_amount) || 0) + 
                          (Number(merchandiseFees._sum.platform_fee) || 0) + 
                          (Number(merchandiseFees._sum.commission_fee) || 0);

    const totalRevenue = totalDirectRev + totalMarketplaceRev + totalOtherFees;

    const revenueDistribution = [
      { name: 'Vé sơ cấp', value: totalDirectRev, color: '#39FF14' },
      { name: 'Vé thứ cấp', value: totalMarketplaceRev, color: '#3B82F6' },
      { name: 'Phí dịch vụ khác', value: totalOtherFees, color: '#8B5CF6' }
    ];

    // 4. Trend Map
    let revenueTrend = [];
    const trendMap = new Map();

    if (period === 'month') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);

      for (let i = 0; i < 12; i++) {
        const d = new Date(startOfYear);
        d.setMonth(i);
        const label = `Tháng ${i + 1}`;
        trendMap.set(label, 0);
      }

      const [orders, mkt, wds, merch] = await Promise.all([
        prisma.order.findMany({ where: { status: 'paid', created_at: { gte: startOfYear } }, select: { created_at: true, platform_fee: true, commission_fee: true } }),
        prisma.marketplaceTransaction.findMany({ where: { status: { in: ['paid', 'completed'] }, created_at: { gte: startOfYear } }, select: { created_at: true, platform_fee: true, commission_fee: true } }),
        prisma.withdrawalRequest.findMany({ where: { status: 'approved', created_at: { gte: startOfYear } }, select: { created_at: true, fee_amount: true } }),
        prisma.merchandiseOrderItem.findMany({ include: { order: true }, where: { order: { status: 'paid', created_at: { gte: startOfYear } } } })
      ]);

      orders.forEach(o => { const label = `Tháng ${new Date(o.created_at).getMonth() + 1}`; if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(o.platform_fee) || 0) + (Number(o.commission_fee) || 0)); });
      mkt.forEach(m => { const label = `Tháng ${new Date(m.created_at).getMonth() + 1}`; if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(m.platform_fee) || 0) + (Number(m.commission_fee) || 0)); });
      wds.forEach(w => { const label = `Tháng ${new Date(w.created_at).getMonth() + 1}`; if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(w.fee_amount) || 0)); });
      merch.forEach(m => { const label = `Tháng ${new Date(m.order.created_at).getMonth() + 1}`; if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(m.platform_fee) || 0) + (Number(m.commission_fee) || 0)); });
    } else {
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + 1 + i); // Corrected from 6 days ago
        const label = format(d, 'dd/MM');
        trendMap.set(label, 0);
      }

      const [orders, mkt, wds, merch] = await Promise.all([
        prisma.order.findMany({ where: { status: 'paid', created_at: { gte: sevenDaysAgo } }, select: { created_at: true, platform_fee: true, commission_fee: true } }),
        prisma.marketplaceTransaction.findMany({ where: { status: { in: ['paid', 'completed'] }, created_at: { gte: sevenDaysAgo } }, select: { created_at: true, platform_fee: true, commission_fee: true } }),
        prisma.withdrawalRequest.findMany({ where: { status: 'approved', created_at: { gte: sevenDaysAgo } }, select: { created_at: true, fee_amount: true } }),
        prisma.merchandiseOrderItem.findMany({ include: { order: true }, where: { order: { status: 'paid', created_at: { gte: sevenDaysAgo } } } })
      ]);

      orders.forEach(o => { const label = format(new Date(o.created_at), 'dd/MM'); if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(o.platform_fee) || 0) + (Number(o.commission_fee) || 0)); });
      mkt.forEach(m => { const label = format(new Date(m.created_at), 'dd/MM'); if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(m.platform_fee) || 0) + (Number(m.commission_fee) || 0)); });
      wds.forEach(w => { const label = format(new Date(w.created_at), 'dd/MM'); if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(w.fee_amount) || 0)); });
      merch.forEach(m => { const label = format(new Date(m.order.created_at), 'dd/MM'); if (trendMap.has(label)) trendMap.set(label, trendMap.get(label) + (Number(m.platform_fee) || 0) + (Number(m.commission_fee) || 0)); });
    }

    revenueTrend = Array.from(trendMap.entries()).map(([label, revenue]) => ({ label, revenue }));

    const recentTransactions = await prisma.order.findMany({
      where: { status: 'paid' },
      take: 6,
      orderBy: { created_at: 'desc' },
      include: { customer: { select: { full_name: true, email: true, avatar_url: true } } }
    });

    const eventStats = {
      pending: await prisma.event.count({ where: { status: 'pending' } }),
      published: await prisma.event.count({ where: { status: { in: ['published', 'active'] } } }),
      completed: await prisma.event.count({ where: { status: { in: ['completed', 'ended', 'settled'] } } })
    };

    const pendingWithdrawals = await prisma.withdrawalRequest.count({
      where: { status: 'pending' }
    });


    const growthData = {
      users: userGrowth.toFixed(1),
      revenue: revenueGrowth.toFixed(1),
      orders: ordersGrowth.toFixed(1),
      events: eventsGrowth.toFixed(1)
    };

    console.log('DEBUG DASHBOARD GROWTH:', growthData);

    res.status(200).json({
      data: {
        total_users: totalUsers,
        total_events: totalEvents,
        total_successful_orders: totalSuccessfulOrders,
        total_revenue: totalRevenue,
        revenue_distribution: revenueDistribution,
        revenue_trend: revenueTrend,
        recent_transactions: recentTransactions,
        event_stats: eventStats,
        pending_withdrawals: pendingWithdrawals,
        growth: growthData
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const getAnalytics = async (req, res) => {
    try {
        const { period = '30days', startDate: qStart, endDate: qEnd } = req.query;
        let start = new Date();
        let end = new Date();
        
        if (qStart && qEnd) {
            start = new Date(qStart);
            start.setHours(0, 0, 0, 0);
            end = new Date(qEnd);
            end.setHours(23, 59, 59, 999);
        } else {
            if (period === 'today') {
                start.setHours(0, 0, 0, 0);
            } else if (period === '7days') {
                start.setDate(start.getDate() - 7);
            } else if (period === '30days') {
                start.setDate(start.getDate() - 30);
            } else if (period === '90days') {
                start.setDate(start.getDate() - 90);
            } else {
                start.setDate(start.getDate() - 30);
            }
        }

        const dateFilter = { created_at: { gte: start, lte: end } };

        // 1. User Growth (Filtered by period)
        const userGrowth = await prisma.user.groupBy({
            where: dateFilter,
            by: ['role'],
            _count: { id: true }
        }).catch(() => []);

        // 2. Category Stats (Usually all-time for current state)
        const categoryStats = await prisma.event.groupBy({
            by: ['category_id'],
            _count: { id: true }
        }).catch(() => []);

        const categories = await prisma.category.findMany({
            select: { id: true, name: true }
        }).catch(() => []);

        const eventByCategory = categoryStats.map(stat => ({
            name: categories.find(c => c.id === stat.category_id)?.name || 'Khác',
            count: stat._count.id
        }));

        // 3. Ticket Stats
        const ticketPerformances = await prisma.ticketTier.findMany({
            select: {
                tier_name: true,
                quantity_total: true,
                quantity_available: true,
                event: { select: { title: true } }
            },
            take: 10
        }).catch(() => []);

        const ticketStats = ticketPerformances.map(tp => ({
            name: `${tp.event?.title || 'N/A'} - ${tp.tier_name}`,
            sold: tp.quantity_total - tp.quantity_available,
            total: tp.quantity_total,
            ratio: tp.quantity_total > 0 ? (((tp.quantity_total - tp.quantity_available) / tp.quantity_total) * 100).toFixed(1) : 0
        }));

        // 4. Payments (Filtered)
        const payments = await prisma.payment.groupBy({
            where: { status: 'paid', ...dateFilter },
            by: ['method'],
            _sum: { amount: true }
        }).catch(() => []);

        // 5. Financials (Comprehensive & Filtered)
        const directRevData = await prisma.order.aggregate({
          where: { status: 'paid', ...dateFilter },
          _sum: { platform_fee: true, commission_fee: true }
        });
        const totalDirectRev = (Number(directRevData._sum.platform_fee) || 0) + (Number(directRevData._sum.commission_fee) || 0);

        const marketplaceRevData = await prisma.marketplaceTransaction.aggregate({
          where: { status: { in: ['paid', 'completed'] }, ...dateFilter },
          _sum: { platform_fee: true, commission_fee: true }
        });
        const totalMarketplaceRev = (Number(marketplaceRevData._sum.platform_fee) || 0) + (Number(marketplaceRevData._sum.commission_fee) || 0);

        const withdrawalFees = await prisma.withdrawalRequest.aggregate({
          where: { status: 'approved', ...dateFilter },
          _sum: { net_amount: true, fee_amount: true }
        });
        
        const merchandiseFees = await prisma.merchandiseOrderItem.aggregate({
          where: { order: { status: 'paid', ...dateFilter } },
          _sum: { platform_fee: true, commission_fee: true }
        });

        const totalOtherFees = (Number(withdrawalFees._sum.fee_amount) || 0) + 
                              (Number(merchandiseFees._sum.platform_fee) || 0) + 
                              (Number(merchandiseFees._sum.commission_fee) || 0);

        const totalRevenue = totalDirectRev + totalMarketplaceRev + totalOtherFees;

        const revenueDistribution = [
          { name: 'Vé sơ cấp', value: totalDirectRev, color: '#39FF14' },
          { name: 'Vé thứ cấp', value: totalMarketplaceRev, color: '#3B82F6' },
          { name: 'Phí dịch vụ khác', value: totalOtherFees, color: '#8B5CF6' }
        ];

        // 6. Merch & KYC
        const totalMerchSold = await prisma.merchandiseOrderItem.count().catch(() => 0);
        const totalUsersCount = await prisma.user.count().catch(() => 0);
        const kycUsers = await prisma.user.count({ where: { organizer_profile: { is_verified: true } } }).catch(() => 0);
        
        const kycRatio = totalUsersCount > 0 ? ((kycUsers / totalUsersCount) * 100).toFixed(1) : 0;

        res.status(200).json({
            data: {
                user_growth: userGrowth,
                event_by_category: eventByCategory,
                ticket_stats: ticketStats,
                payment_methods: payments,
                financial_outflow: withdrawalFees,
                total_revenue: totalRevenue,
                revenue_distribution: revenueDistribution,
                total_merch_sold: totalMerchSold,
                kyc_ratio: kycRatio,
                total_users: totalUsersCount,
                total_events_count: await prisma.event.count({ where: { status: { in: ['active', 'published'] } } }).catch(() => 0)
            }
        });
    } catch (error) {
        console.error('CRITICAL ANALYTICS ERROR:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy báo cáo.', details: error.message });
    }
};

const getSharedConfig = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'site_name', 
            'support_email', 
            'maintenance_mode',
            'event_platform_fee_percent',
            'event_transaction_fee_percent',
            'product_platform_fee_percent',
            'product_transaction_fee_percent',
            'system_gas_fee',
            'resale_price_cap_percent',
            'resale_transaction_fee_percent',
            'default_royalty_percent',
            'smart_contract_address',
            'rpc_url',
            'withdrawal_fee_percent',
            'min_withdrawal_amount'
          ]
        }
      }
    });
    const config = settings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});
    
    // Mặc định nếu chưa có (Fallback values)
    const finalConfig = {
      site_name: config.site_name || 'BASTICKET',
      support_email: config.support_email || 'support@basticket.com',
      maintenance_mode: config.maintenance_mode || 'false',
      event_platform_fee_percent: config.event_platform_fee_percent || '5',
      event_transaction_fee_percent: config.event_transaction_fee_percent || '3',
      product_platform_fee_percent: config.product_platform_fee_percent || '5',
      product_transaction_fee_percent: config.product_transaction_fee_percent || '3',
      system_gas_fee: config.system_gas_fee || '10000',
      resale_price_cap_percent: config.resale_price_cap_percent || '8',
      resale_transaction_fee_percent: config.resale_transaction_fee_percent || '1',
      default_royalty_percent: config.default_royalty_percent || '3',
      withdrawal_fee_percent: config.withdrawal_fee_percent || '2',
      min_withdrawal_amount: config.min_withdrawal_amount || '10000',
      smart_contract_address: config.smart_contract_address || process.env.CONTRACT_ADDRESS || '0x9711005b6f9AC6953c41A5Bb3d86a7549a9084EE',
      rpc_url: config.rpc_url || process.env.RPC_URL || 'https://rpc-amoy.polygon.technology/'
    };

    res.status(200).json({ data: finalConfig });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getConfig, updateConfig, requestConfigOTP,
  getFraudAlerts, processFraudAlert,
  getPlatformStats,
  getAnalytics,
  getSharedConfig
};
