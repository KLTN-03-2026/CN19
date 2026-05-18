const { ethers } = require('ethers');
const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');
const emailService = require('../services/email.service');
const NotificationService = require('../services/notification.service');

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
          },
          _count: {
            select: { 
              tickets: {
                where: {
                  order: {
                    status: { in: ['paid', 'success', 'completed'] }
                  }
                }
              }
            }
          }
        },
        orderBy: { event_date: 'desc' }
      }),
      prisma.event.count(),
      prisma.event.count({ 
        where: { 
          status: { 
            in: ['pending', 'pending_cancel', 'pending_reschedule']
          }
        } 
      })
    ]);

    // Format events to include aggregated counts by summing OrderItem quantities for successful orders
    const formattedEvents = await Promise.all(events.map(async event => {
      const totalTickets = event.ticket_tiers.reduce((sum, tier) => sum + tier.quantity_total, 0);
      
      // Lấy tổng số lượng từ OrderItems thay vì đếm số bản ghi Ticket (đề phòng orphan data)
      const aggregates = await prisma.orderItem.aggregate({
        where: {
          order: {
            event_id: event.id,
            status: { in: ['paid', 'success', 'completed'] }
          }
        },
        _sum: {
          quantity: true
        }
      });

      const soldTickets = aggregates._sum.quantity || 0;

      return {
        ...event,
        total_tickets: totalTickets,
        sold_tickets: soldTickets
      };
    }));

    res.status(200).json({ 
      data: formattedEvents,
      meta: {
        total: totalCount,
        pending: pendingCount
      }
    });
  } catch (error) {
    console.error('Get Events Error:', error);
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
      include: { 
        organizer: { include: { user: true } },
        _count: {
          select: { 
            tickets: {
              where: {
                order: {
                  status: { in: ['paid', 'success', 'completed'] }
                }
              }
            }
          }
        }
      }
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
            await web3Service.ensureInitialized();
            let ownerWallet = web3Service.signer?.address || '0x3078b443A7eC4C8bE695A2dF7a03F9629501E238'; 
            
            console.log(`[Admin Controller] Đang yêu cầu deploy cho ví Admin: ${ownerWallet}`);
            
            smartContractAddress = await web3Service.deployEventContract(ownerWallet);
          } catch (web3Error) {
            console.error('❌ [Web3 Deployment Error]:', web3Error.message);
            
            // Phân loại lỗi để phản hồi chính xác cho Admin
            let errorMessage = 'Triển khai Smart Contract thất bại';
            let suggestion = 'Hãy đảm bảo Node Blockchain (Hardhat) đang chạy và ví Admin có đủ Gas.';
            
            if (web3Error.message.includes('số dư') || web3Error.message.includes('balance') || web3Error.message.includes('funds')) {
              errorMessage = 'Ví Admin không đủ số dư MATIC';
              suggestion = 'Vui lòng nạp thêm MATIC vào ví Admin để tiếp tục duyệt sự kiện.';
            } else if (web3Error.message.includes('network') || web3Error.message.includes('RPC')) {
              errorMessage = 'Lỗi kết nối mạng Blockchain';
              suggestion = 'Kiểm tra lại RPC URL hoặc tình trạng mạng Internet.';
            }

            return res.status(500).json({ 
              error: errorMessage, 
              detail: web3Error.message,
              suggestion: suggestion
            });
          }
       }
    }

    let newStatus = event.status;
    let eventUpdateData = { smart_contract_address: smartContractAddress };

    if (action === 'approve') {
      if (event.status === 'pending_reschedule') {
        newStatus = 'postponed';
        
        // Tìm yêu cầu EmergencyRequest gần nhất
        const latestEmergency = await prisma.emergencyRequest.findFirst({
          where: { event_id: id, status: 'pending', request_type: 'reschedule' },
          orderBy: { created_at: 'desc' }
        });

        if (latestEmergency) {
          if (latestEmergency.new_date) eventUpdateData.event_date = latestEmergency.new_date;
          if (latestEmergency.new_time) eventUpdateData.event_time = latestEmergency.new_time;
          if (latestEmergency.new_end_date) eventUpdateData.end_date = latestEmergency.new_end_date;
          if (latestEmergency.new_end_time) eventUpdateData.end_time = latestEmergency.new_end_time;

          await prisma.emergencyRequest.update({
            where: { id: latestEmergency.id },
            data: { status: 'approved', admin_notes: reason || 'Admin đã duyệt dời lịch' }
          });

          // Thông báo Email cho toàn bộ khách hàng mua vé
          const affectedTickets = await prisma.ticket.findMany({
            where: { event_id: id, status: { notIn: ['cancelled', 'refunded'] } },
            include: { current_owner: { select: { email: true, full_name: true } } }
          });

          const uniqueUsersMap = new Map();
          for (const t of affectedTickets) {
            if (t.current_owner && t.current_owner.email) {
              uniqueUsersMap.set(t.current_owner.email, t.current_owner);
            }
          }

          const oldDate = event.event_date;
          const newDate = latestEmergency.new_date || event.event_date;
          const newTime = latestEmergency.new_time || event.event_time;

          for (const u of uniqueUsersMap.values()) {
            emailService.sendEventRescheduleEmail(u, event, oldDate, newDate, newTime).catch(e => console.error("Email error:", e));
          }
        }
      } else {
        newStatus = 'active';
      }
    } else if (action === 'active') { // Hủy ẩn (Unhide)
      // Tìm lịch sử ẩn gần nhất của sự kiện này để khôi phục đúng trạng thái cũ
      const lastHideLog = await prisma.adminActionLog.findFirst({
        where: { target_id: id, action_type: 'event_hide' },
        orderBy: { created_at: 'desc' }
      });
      if (lastHideLog && lastHideLog.old_value) {
        newStatus = lastHideLog.old_value;
      } else {
        // Nếu không có log cũ, kiểm tra nếu chưa có smart contract thì phải quay về pending
        newStatus = event.smart_contract_address ? 'active' : 'pending';
      }
    } else if (action === 'hide') {
      newStatus = 'hidden';
    } else if (action === 'reject') {
      if (event.status === 'active' || event._count.tickets > 0) {
        newStatus = 'hidden';
      } else {
        newStatus = 'draft';
      }
    }

    eventUpdateData.status = newStatus;

    await prisma.event.update({
      where: { id },
      data: eventUpdateData
    });

    await prisma.adminActionLog.create({
      data: { 
        admin_id: req.user.userId, 
        action_type: `event_${action}`, 
        target_id: id,
        old_value: event.status,
        new_value: newStatus
      }
    });

    // 2. Thông báo cho BTC qua hệ thống chính xác theo từng action
    if (action === 'approve' || action === 'reject') {
      const isReschedule = event.status === 'pending_reschedule';
      await NotificationService.create({
        user_id: event.organizer.user_id,
        type: action === 'approve' ? (isReschedule ? 'EVENT_RESCHEDULED' : 'EVENT_APPROVED') : 'EVENT_REJECTED',
        title: action === 'approve' ? (isReschedule ? 'Yêu cầu dời lịch đã được duyệt' : 'Sự kiện đã được duyệt') : 'Sự kiện bị từ chối',
        message: action === 'approve' 
          ? (isReschedule ? `Yêu cầu dời lịch sự kiện "${event.title}" đã được Admin phê duyệt. Trạng thái sự kiện hiện tại: Đã dời lịch.` : `Chúc mừng! Sự kiện "${event.title}" đã được duyệt và đang mở bán.`)
          : `Rất tiếc, sự kiện "${event.title}" đã bị từ chối. Lý do: ${reason || 'Không có lý do cụ thể'}.`,
        target_id: id
      });
    } else if (action === 'hide' || action === 'active') {
      await NotificationService.create({
        user_id: event.organizer.user_id,
        type: action === 'hide' ? 'EVENT_HIDDEN' : 'EVENT_UNHIDDEN',
        title: action === 'hide' ? 'Sự kiện bị ẩn' : 'Sự kiện được hiển thị lại',
        message: action === 'hide'
          ? `Sự kiện "${event.title}" của bạn tạm thời bị ẩn khỏi hệ thống.`
          : `Sự kiện "${event.title}" của bạn đã được hiển thị trở lại trên hệ thống.`,
        target_id: id
      });
    }

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
// [UC_22] Hủy khẩn cấp sự kiện & Đối soát bồi hoàn tài chính (2-Step Verification)
const forceCancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, confirm_fee_paid } = req.body; 

    // 1. Tìm thông tin sự kiện và Organizer
    const event = await prisma.event.findUnique({
      where: { id },
      include: { 
        organizer: { include: { user: true } }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }

    // 2. TÍNH TOÁN TOÀN BỘ CÁC KHOẢN PHÍ (Hệ thống, Dịch vụ, Gas, Merch, Resale, Transfer)
    const successfulOrders = await prisma.order.findMany({
      where: { 
        event_id: id,
        status: { in: ['paid', 'success', 'completed', 'refund_pending'] }
      }
    });

    let totalPrimaryFee = 0;
    successfulOrders.forEach(o => {
      totalPrimaryFee += Number(o.platform_fee || 0) + Number(o.commission_fee || 0) + Number(o.gas_fee || 0);
    });

    const successfulMkt = await prisma.marketplaceTransaction.findMany({
      where: {
        ticket: { event_id: id },
        status: { in: ['paid', 'success', 'completed'] }
      }
    });
    let totalMarketplaceFee = 0;
    successfulMkt.forEach(tx => {
      totalMarketplaceFee += Number(tx.platform_fee || 0) + Number(tx.gas_fee || 0);
    });

    const totalFeeRequired = totalPrimaryFee + totalMarketplaceFee;

    // BƯỚC 1: NẾU BTC CHƯA THANH TOÁN (Hoặc Admin đang kiểm tra/gửi thông báo)
    if (!confirm_fee_paid) {
      await prisma.event.update({
        where: { id },
        data: { status: 'pending_cancellation_fee' }
      });

      await prisma.adminActionLog.create({
        data: {
          admin_id: req.user.userId,
          action_type: 'cancellation_fee_notice',
          target_id: id,
          new_value: String(totalFeeRequired)
        }
      });

      // Gửi Email thông báo yêu cầu BTC nộp phí trước
      await NotificationService.create({
        user_id: event.organizer.user_id,
        type: 'CANCELLATION_FEE_NOTICE',
        title: 'Yêu cầu thanh toán phí bồi hoàn hủy sự kiện',
        message: `Sự kiện "${event.title}" đang chờ hủy. Ban tổ chức vui lòng thanh toán phí bồi hoàn hệ thống và Gas (${totalFeeRequired.toLocaleString()} đ) để hoàn tất quy trình hủy và hoàn tiền khách hàng.`,
        target_id: id
      });

      return res.status(200).json({
        status: 'pending_cancellation_fee',
        total_fee_required: totalFeeRequired,
        message: 'Đã gửi thông báo yêu cầu BTC thanh toán chi phí bồi hoàn hủy sự kiện.'
      });
    }

    // BƯỚC 2: KHI ĐÃ XÁC NHẬN BTC THANH TOÁN ĐỦ -> HỦY CHÍNH THỨC & HOÀN TIỀN
    await prisma.event.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    if (event.smart_contract_address) {
      try {
        await web3Service.pauseContract(event.smart_contract_address);
        console.log(`[Admin] Đã tạm dừng Smart Contract: ${event.smart_contract_address}`);
      } catch (contractError) {
        console.error('⚠️ [Web3 Pause Error]:', contractError.message);
      }
    }

    const affectedOrders = await prisma.order.updateMany({
      where: { 
        event_id: id,
        status: { in: ['paid', 'success', 'completed'] }
      },
      data: { status: 'refund_pending' }
    });

    await prisma.ticket.updateMany({
      where: { event_id: id },
      data: { status: 'cancelled' }
    });

    await prisma.marketplaceTransaction.updateMany({
      where: { ticket: { event_id: id }, status: { in: ['paid', 'success', 'completed'] } },
      data: { status: 'cancelled' }
    });

    const ticketsToRefund = await prisma.ticket.findMany({
      where: { event_id: id },
      include: { 
        ticket_tier: true,
        transactions: {
          where: { status: { in: ['paid', 'success', 'completed'] } },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });
    for (const t of ticketsToRefund) {
      const originalPrice = t.ticket_tier ? Number(t.ticket_tier.price) : 0;
      
      if (t.transactions && t.transactions.length > 0) {
        const lastTx = t.transactions[0];
        const buyerRefundAmount = Number(lastTx.buyer_pay_amount);
        const sellerRefundAmount = originalPrice;
        
        // 1. Hoàn tiền cho Người mua lại (Buyer)
        const buyerExist = await prisma.refundRequest.findFirst({
          where: { ticket_id: t.id, customer_id: lastTx.buyer_id }
        });
        if (!buyerExist) {
          await prisma.refundRequest.create({
            data: {
              ticket_id: t.id,
              customer_id: lastTx.buyer_id,
              status: 'pending',
              refund_amount: buyerRefundAmount,
              type: 'event_cancelled',
              reason: `Tự động hoàn tiền mua vé Marketplace do sự kiện bị hủy: ${event.title} (Giá mua: ${buyerRefundAmount.toLocaleString('vi-VN')}đ)`
            }
          });
        }

        // 2. Hoàn tiền gốc cho Người bán lại (Seller)
        const sellerExist = await prisma.refundRequest.findFirst({
          where: { ticket_id: t.id, customer_id: lastTx.seller_id }
        });
        if (!sellerExist) {
          await prisma.refundRequest.create({
            data: {
              ticket_id: t.id,
              customer_id: lastTx.seller_id,
              status: 'pending',
              refund_amount: sellerRefundAmount,
              type: 'event_cancelled',
              reason: `Tự động hoàn tiền gốc mua vé do sự kiện bị hủy (Vé đã bán lại trên Marketplace): ${event.title} (Giá gốc: ${sellerRefundAmount.toLocaleString('vi-VN')}đ)`
            }
          });
        }
      } else {
        // Vé chưa bán lại trên Marketplace
        const exist = await prisma.refundRequest.findFirst({
          where: { ticket_id: t.id, customer_id: t.current_owner_id }
        });
        if (!exist) {
          await prisma.refundRequest.create({
            data: {
              ticket_id: t.id,
              customer_id: t.current_owner_id,
              status: 'pending',
              refund_amount: originalPrice,
              type: 'event_cancelled',
              reason: `Tự động tạo yêu cầu hoàn tiền do sự kiện bị hủy: ${event.title}`
            }
          });
        }
      }
    }

    // Trừ tiền từ ví BTC hoặc ghi nhận thanh toán phí
    await prisma.user.update({
      where: { id: event.organizer.user_id },
      data: { balance: { decrement: totalFeeRequired } }
    });

    await prisma.walletTransaction.create({
      data: {
        user_id: event.organizer.user_id,
        amount: totalFeeRequired,
        type: 'FEE',
        description: `Thanh toán phí bồi hoàn hủy sự kiện: ${event.title}`,
        status: 'completed'
      }
    });

    await prisma.adminActionLog.create({
      data: { 
        admin_id: req.user.userId, 
        action_type: `event_force_cancel`, 
        target_id: id, 
        new_value: reason || 'Hủy sự kiện và hoàn tiền'
      }
    });

    // Gửi Email thông báo hủy và hoàn tiền cho BTC và toàn bộ Khách hàng
    const sendNotifications = async () => {
      try {
        await emailService.sendEventCancellationEmail(event.organizer.user, event, reason || 'Hủy sự kiện', 'organizer');

        const orders = await prisma.order.findMany({
          where: { event_id: id, status: 'refund_pending' },
          include: { customer: true }
        });

        for (const order of orders) {
          if (order.customer) {
            await emailService.sendEventCancellationEmail(order.customer, event, reason || 'Hủy sự kiện', 'customer');
          }
        }
        console.log(`[Admin Notification] Đã gửi thông báo hủy cho BTC và ${orders.length} khách hàng.`);
      } catch (emailError) {
        console.error('[Admin Notification Error]:', emailError);
      }
    };

    sendNotifications();

    res.status(200).json({ 
      status: 'cancelled',
      message: 'Đã hủy khẩn cấp sự kiện, thu phí bồi hoàn từ BTC và chuyển trạng thái hoàn tiền cho toàn bộ đơn hàng.',
      total_fee_paid: totalFeeRequired,
      affected_orders: affectedOrders.count
    });
  } catch (error) {
    console.error('Force Cancel Event Error:', error);
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
            user: { 
              select: { 
                email: true, 
                phone_number: true, 
                wallet_address: true,
                balance: true,
                bank_name: true,
                account_number: true,
                account_holder: true
              } 
            } 
          } 
        },
        category: { select: { id: true, name: true } },
        ticket_tiers: {
          include: {
            _count: { 
              select: { 
                tickets: {
                  where: {
                    order: {
                      status: { in: ['paid', 'success', 'completed'] }
                    }
                  }
                } 
              } 
            },
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
            tickets: {
              where: {
                order: {
                  status: { in: ['paid', 'success', 'completed'] }
                }
              }
            },
            marketplace_listings: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }

    // Lấy danh sách đơn hàng (Tăng giới hạn để hỗ trợ lọc/phân trang ở frontend)
    const recentOrdersRaw = await prisma.order.findMany({
      where: { event_id: id },
      take: 500,
      orderBy: { created_at: 'desc' },
      include: {
        customer: { select: { full_name: true, email: true } },
        items: { select: { quantity: true } },
        merchandise_items: { select: { quantity: true } }
      }
    });

    // Lấy thêm giao dịch Marketplace (Bán lại vé) cho sự kiện này
    const mktTransactionsRaw = await prisma.marketplaceTransaction.findMany({
      where: { ticket: { event_id: id } },
      take: 500,
      orderBy: { created_at: 'desc' },
      include: {
        buyer: { select: { full_name: true, email: true } },
        seller: { select: { full_name: true, email: true } }
      }
    });

    // Map MarketplaceTransaction sang cấu trúc giống Order để frontend dùng chung
    const mktOrders = mktTransactionsRaw.map(tx => ({
      id: tx.id,
      order_number: tx.transaction_number,
      order_type: 'MARKETPLACE_PURCHASE',
      status: tx.status,
      total_amount: tx.buyer_pay_amount,
      subtotal: tx.buyer_pay_amount,
      platform_fee: tx.platform_fee,
      commission_fee: tx.commission_fee,
      gas_fee: tx.gas_fee,
      created_at: tx.created_at,
      customer: tx.buyer,   // Người mua = khách hàng
      seller: tx.seller,    // Người bán lại
      total_ticket_quantity: 1,
      total_merch_quantity: 0,
      _isMkt: true
    }));

    const recentOrders = [
      ...recentOrdersRaw.map(order => ({
        ...order,
        total_ticket_quantity: (order.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0),
        total_merch_quantity: (order.merchandise_items || []).reduce((sum, i) => sum + (i.quantity || 0), 0)
      })),
      ...mktOrders
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 0. Tính toán tổng số vé đã bán cho từng hạng vé bằng cách cộng dồn OrderItem.quantity
    const tierSoldAggregates = await prisma.orderItem.groupBy({
      by: ['ticket_tier_id'],
      where: {
        order: {
          event_id: id,
          status: { in: ['paid', 'success', 'completed'] }
        }
      },
      _sum: {
        quantity: true
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
        const orderTicketSubtotal = (order.items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
        const orderTicketCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
        const orderMerchSubtotal = (order.merchandise_items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

        primaryTicketRevenue += orderTicketSubtotal;
        primaryMerchRevenue += orderMerchSubtotal;
        totalTicketsSoldCount += orderTicketCount;

        // Sử dụng phí đã snapshot trong đơn hàng để tính toán chính xác
        const ticketFeeRate = (Number(order.platform_fee_percent || 0) + Number(order.commission_fee_percent || 0)) / 100;
        primaryTicketPlatformFee += (orderTicketSubtotal * ticketFeeRate) + (orderTicketCount * Number(order.gas_fee || 10000) / orderTicketCount || 0);
        
        // Phí vật phẩm lấy trực tiếp từ tổng phí đã lưu trong đơn hàng
        primaryMerchPlatformFee += (Number(order.merchandise_platform_fee || 0) + Number(order.merchandise_commission_fee || 0));
      } else if (order.order_type === 'TICKET_TRANSFER') {
        // Rule: Phí gas thực tế đã thu trong đơn hàng
        transferFeeTotal += Number(order.gas_fee || 10000);
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
      const askingPrice = Number(tx.buyer_pay_amount); 
      resaleVolume += askingPrice;
      // Lấy trực tiếp từ giao dịch đã lưu
      secondaryPlatformFee += Number(tx.platform_fee || 0);
      resaleRoyalties += Number(tx.organizer_royalty || 0);
    });

    // 4. Tổng hợp chỉ số
    const system_commission = primaryTicketPlatformFee + primaryMerchPlatformFee + transferFeeTotal + secondaryPlatformFee;
    const net_revenue = (primaryTicketRevenue - primaryTicketPlatformFee) + 
                        (primaryMerchRevenue - primaryMerchPlatformFee) + 
                        resaleRoyalties;

    const result = {
      ...event,
      ticket_tiers: event.ticket_tiers.map(tier => {
        const tierAgg = tierSoldAggregates.find(a => a.ticket_tier_id === tier.id);
        const soldCount = tierAgg?._sum?.quantity || 0;
        return {
          ...tier,
          _count: {
            ...tier._count,
            tickets: soldCount // Override with accurate sum
          }
        };
      }),
      _count: {
        ...event._count,
        tickets: totalTicketsSoldCount // Use the accurately calculated sum from successful orders
      },
      recent_orders: recentOrders,
      admin_logs: adminLogs,
      financials: {
        total_revenue: primaryTicketRevenue + primaryMerchRevenue + transferFeeTotal + resaleVolume, // Tổng doanh thu hợp nhất
        system_commission,
        net_revenue,
        breakdown: {
          ticket_revenue_gross: primaryTicketRevenue,
          merch_revenue_gross: primaryMerchRevenue,
          resale_volume: resaleVolume,
          resale_royalties: resaleRoyalties,
          primary_platform_commission: primaryTicketPlatformFee + primaryMerchPlatformFee,
          secondary_platform_commission: secondaryPlatformFee,
          transfer_fees: transferFeeTotal
        }
      },
      statistics: {
        timeline: [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          
          const dayOrders = successfulOrders.filter(o => o.created_at && o.created_at.toISOString().split('T')[0] === dateStr);
          const daySecondary = marketplaceTransactions.filter(t => t.created_at && t.created_at.toISOString().split('T')[0] === dateStr);

          const tRev = dayOrders.filter(o => o.order_type === 'TICKET_PURCHASE').reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + Number(i.subtotal || 0), 0), 0);
          const mRev = dayOrders.filter(o => o.order_type === 'TICKET_PURCHASE').reduce((sum, o) => sum + (o.merchandise_items || []).reduce((s, i) => s + Number(i.subtotal || 0), 0), 0);
          const rVol = daySecondary.reduce((sum, t) => sum + Number(t.buyer_pay_amount || 0), 0);

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
