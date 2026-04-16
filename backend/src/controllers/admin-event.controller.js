const { ethers } = require('ethers');
const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');

// [UC_22] Quản lý sự kiện: Lấy toàn bộ các sự kiện
const getEvents = async (req, res) => {
  try {
    const { status, keyword, from, to } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;

    if (from || to) {
      whereClause.event_date = {};
      if (from) whereClause.event_date.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.event_date.lte = toDate;
      }
    }

    if (keyword) {
      whereClause.title = { contains: keyword, mode: 'insensitive' };
    }

    const [events, totalCount, pendingCount] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          organizer: { select: { organization_name: true } },
          category: { select: { name: true } },
          ticket_tiers: {
            select: {
              quantity_total: true,
              quantity_available: true
            }
          }
        },
        orderBy: { event_date: 'desc' }
      }),
      prisma.event.count(),
      prisma.event.count({ 
        where: { 
          OR: [
            { status: 'pending' },
            { status: 'draft' }
          ]
        } 
      })
    ]);

    // Format events to include aggregated counts
    const formattedEvents = events.map(event => {
      const totalTickets = event.ticket_tiers.reduce((sum, tier) => sum + tier.quantity_total, 0);
      const availableTickets = event.ticket_tiers.reduce((sum, tier) => sum + tier.quantity_available, 0);
      const soldTickets = totalTickets - availableTickets;

      return {
        ...event,
        total_tickets: totalTickets,
        sold_tickets: soldTickets
      };
    });

    res.status(200).json({ 
      data: formattedEvents,
      meta: {
        total: totalCount,
        pending: pendingCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Duyệt / Từ chối sự kiện
const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // 'approve' | 'reject'

    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizer: { include: { user: true } } }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }

    let smartContractAddress = event.smart_contract_address;

    if (action === 'approve') {
       // Nếu chưa có smart contract thì mới deploy (tránh deploy lại khi duyệt đi duyệt lại)
       if (!smartContractAddress) {
          try {
            // Lấy ví BTC, nếu không có thì dùng ví admin hệ thống làm backup
            let ownerWallet = event.organizer.user.wallet_address || process.env.CONTRACT_ADDRESS; 
            
            // Xử lý trường hợp ví bị lưu sai format (e.g. thiếu ký tự)
            if (!ownerWallet || !ethers.isAddress(ownerWallet)) {
              console.warn(`⚠️ [Admin Controller] Ví Organizer không hợp lệ (${ownerWallet}), đang dùng ví Admin dự phòng.`);
              ownerWallet = process.env.ADMIN_WALLET_ADDRESS || this.signer.address; // Giả sử có biến này hoặc lấy từ signer
            }

            console.log(`[Admin Controller] Đang yêu cầu deploy cho ví: ${ownerWallet}`);
            
            smartContractAddress = await web3Service.deployEventContract(ownerWallet);
          } catch (web3Error) {
            console.error('❌ [Web3 Deployment Error]:', web3Error.message);
            // Trả về lỗi cụ thể hơn để Admin biết (vd: RPC Error, Wallet Error)
            return res.status(500).json({ 
              error: 'Triển khai Smart Contract thất bại', 
              detail: web3Error.message,
              suggestion: 'Hãy đảm bảo Node Blockchain (Hardhat) đang chạy và ví Admin có đủ Gas.'
            });
          }
       }
    }

    const newStatus = action === 'approve' ? 'active' : 'draft'; 
    
    await prisma.event.update({
      where: { id },
      data: { 
        status: newStatus,
        smart_contract_address: smartContractAddress
      }
    });

    await prisma.adminActionLog.create({
      data: { admin_id: req.user.userId, action_type: `event_${action}`, target_id: id }
    });

    // TODO: Gửi Email cho BTC báo kết quả

    res.status(200).json({ 
      message: `Đã xử lý sự kiện: ${newStatus}`,
      contract_address: smartContractAddress 
    });
  } catch (error) {
    console.error('Approve Event Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Hủy khẩn cấp sự kiện
const forceCancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; 

    await prisma.event.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    // TODO: Block việc mua bán, chuyển nhượng và tự động kích hoạt logic Hoàn tiền

    await prisma.adminActionLog.create({
      data: { admin_id: req.user.userId, action_type: `event_force_cancel`, target_id: id, new_value: reason }
    });

    res.status(200).json({ message: 'Đã hủy khẩn cấp sự kiện.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Lấy chi tiết một sự kiện (ID) cho Admin
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { 
          select: { 
            id: true, 
            user_id: true, 
            organization_name: true, 
            kyc_status: true,
            balance: true,
            bank_name: true,
            account_number: true,
            account_holder: true,
            user: { select: { email: true, phone_number: true, wallet_address: true } } 
          } 
        },
        category: { select: { id: true, name: true } },
        ticket_tiers: {
          include: {
            _count: { select: { tickets: true } },
            order_items: {
              take: 50,
              orderBy: { order: { created_at: 'desc' } },
              include: {
                order: {
                  select: {
                    id: true,
                    order_number: true,
                    status: true,
                    total_amount: true,
                    created_at: true,
                    payment_method: true,
                    customer: { select: { id: true, full_name: true, email: true, phone_number: true } }
                  }
                }
              }
            },
            tickets: {
              take: 50,
              orderBy: { ticket_number: 'asc' },
              include: {
                current_owner: { select: { id: true, full_name: true, email: true, phone_number: true } },
                original_buyer: { select: { id: true, full_name: true, email: true } }
              }
            }
          }
        },
        merchandise: {
          orderBy: { created_at: 'desc' },
          include: {
            _count: { select: { order_items: true } }
          }
        },
        blogs: {
          take: 50,
          orderBy: { created_at: 'desc' },
          include: {
            author: { select: { full_name: true, email: true, avatar_url: true } }
          }
        },
        emergency_requests: {
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: {
            orders: { where: { status: { in: ['paid', 'success', 'completed'] } } },
            tickets: true,
            marketplace_listings: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }

    // Lấy danh sách đơn hàng (Tăng giới hạn để hỗ trợ lọc/phân trang ở frontend)
    const recentOrders = await prisma.order.findMany({
      where: { event_id: id },
      take: 500,
      orderBy: { created_at: 'desc' },
      include: {
        customer: { select: { full_name: true, email: true } },
        _count: { select: { items: true, merchandise_items: true } }
      }
    });

    // Lấy log thao tác admin liên quan đến sự kiện này
    const adminLogs = await prisma.adminActionLog.findMany({
      where: { target_id: id },
      orderBy: { created_at: 'desc' },
      include: {
        admin: { select: { full_name: true, email: true, role: true } }
      }
    });

    // 1. Lấy toàn bộ đơn hàng thành công (Primary & Transfer)
    const successfulOrders = await prisma.order.findMany({
      where: { 
        event_id: id,
        status: { in: ['paid', 'success', 'completed'] }
      },
      include: {
        items: true,
        merchandise_items: true
      }
    });

    // 2. Tính toán doanh thu và phí sơ cấp
    let primaryTicketRevenue = 0;
    let primaryMerchRevenue = 0;
    let totalTicketsSoldCount = 0;
    let primaryTicketPlatformFee = 0;
    let primaryMerchPlatformFee = 0;
    let transferFeeTotal = 0;

    successfulOrders.forEach(order => {
      if (order.order_type === 'TICKET_PURCHASE') {
        const orderTicketSubtotal = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
        const orderTicketCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const orderMerchSubtotal = order.merchandise_items.reduce((sum, item) => sum + Number(item.subtotal), 0);

        primaryTicketRevenue += orderTicketSubtotal;
        primaryMerchRevenue += orderMerchSubtotal;
        totalTicketsSoldCount += orderTicketCount;

        // Rule: Vé (8% + 10k/vé) + Sản phẩm (8%)
        primaryTicketPlatformFee += (orderTicketSubtotal * 0.08) + (orderTicketCount * 10000);
        primaryMerchPlatformFee += (orderMerchSubtotal * 0.08);
      } else if (order.order_type === 'TICKET_TRANSFER') {
        // Rule: Phí gas 10,000đ mỗi lần chuyển
        transferFeeTotal += 10000;
      }
    });

    // 3. Tính toán Chợ (Marketplace) - Resale Volume & Royalties
    const marketplaceTransactions = await prisma.marketplaceTransaction.findMany({
      where: { 
        ticket: { event_id: id },
        status: 'completed'
      }
    });

    let resaleVolume = 0;
    let resaleCount = marketplaceTransactions.length;
    let secondaryPlatformFee = 0;
    let resaleRoyalties = 0;

    marketplaceTransactions.forEach(tx => {
      const askingPrice = Number(tx.buyer_pay_amount); // Giả định buyer_pay_amount là giá niêm yết
      resaleVolume += askingPrice;
      // Rule: 10,000đ + 3% phí giao dịch
      secondaryPlatformFee += 10000 + (askingPrice * 0.03);
      // Rule: Phí bản quyền tối đa 3% cho Organizer
      resaleRoyalties += askingPrice * (Number(event.royalty_fee_percent || 3.0) / 100);
    });

    // 4. Tổng hợp chỉ số
    const totalPlatformProfit = primaryTicketPlatformFee + primaryMerchPlatformFee + transferFeeTotal + secondaryPlatformFee;
    const totalOrganizerNet = (primaryTicketRevenue - primaryTicketPlatformFee) + 
                              (primaryMerchRevenue - primaryMerchPlatformFee) + 
                              resaleRoyalties;

    const result = {
      ...event,
      recent_orders: recentOrders,
      admin_logs: adminLogs,
      financials: {
        total_revenue: primaryTicketRevenue + primaryMerchRevenue + transferFeeTotal + resaleVolume, // Tổng doanh thu hợp nhất
        platform_fees: totalPlatformProfit,
        net_revenue: totalOrganizerNet,
        breakdown: {
          ticket_revenue_gross: primaryTicketRevenue,
          merch_revenue_gross: primaryMerchRevenue,
          resale_volume: resaleVolume,
          resale_royalties: resaleRoyalties,
          primary_platform_fees: primaryTicketPlatformFee + primaryMerchPlatformFee,
          secondary_platform_fees: secondaryPlatformFee,
          transfer_fees: transferFeeTotal
        }
      },
      statistics: {
        timeline: [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          
          const dayOrders = successfulOrders.filter(o => o.created_at.toISOString().split('T')[0] === dateStr);
          const daySecondary = marketplaceTransactions.filter(t => t.created_at.toISOString().split('T')[0] === dateStr);

          const tRev = dayOrders.filter(o => o.order_type === 'TICKET_PURCHASE').reduce((sum, o) => sum + o.items.reduce((s, i) => s + Number(i.subtotal), 0), 0);
          const mRev = dayOrders.filter(o => o.order_type === 'TICKET_PURCHASE').reduce((sum, o) => sum + o.merchandise_items.reduce((s, i) => s + Number(i.subtotal), 0), 0);
          const rVol = daySecondary.reduce((sum, t) => sum + Number(t.buyer_pay_amount), 0);

          return {
            date: dateStr.split('-').reverse().slice(0, 2).join('/'),
            revenue: tRev + mRev + rVol,
            tickets: tRev,
            merch: mRev,
            resale: rVol
          };
        }),
        tier_distribution: event.ticket_tiers.map(tier => ({
          name: tier.tier_name,
          value: tier._count.tickets
        })),
        revenue_mix: [
          { name: 'Vé sơ cấp', value: primaryTicketRevenue },
          { name: 'Sản phẩm', value: primaryMerchRevenue },
          { name: 'Giao dịch Resale', value: resaleVolume }
        ].filter(d => d.value > 0)
      }
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Get Event Detail Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Bật/Tắt sự kiện nổi bật
const toggleFeaturedEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      select: { is_featured: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { is_featured: !event.is_featured }
    });

    await prisma.adminActionLog.create({
      data: { 
        admin_id: req.user.userId, 
        action_type: `event_toggle_featured`, 
        target_id: id,
        new_value: updatedEvent.is_featured.toString()
      }
    });

    res.status(200).json({ 
      message: updatedEvent.is_featured ? 'Đã bật trạng thái nổi bật' : 'Đã tắt trạng thái nổi bật',
      is_featured: updatedEvent.is_featured 
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_24] Quản lý danh mục (Thêm mới)
const createCategory = async (req, res) => {
    try {
      const { name, is_active } = req.body;
      const cat = await prisma.category.create({ data: { name, is_active } });
      res.status(201).json({ message: 'Tạo danh mục thành công.', data: cat });
    } catch (error) {
        res.status(400).json({ error: 'Tên danh mục có thể đã tồn tại' });
    }
};

module.exports = {
  getEvents,
  getEventById,
  approveEvent,
  forceCancelEvent,
  toggleFeaturedEvent,
  createCategory
};
