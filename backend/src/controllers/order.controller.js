const prisma = require('../config/prisma');
const axios = require('axios');
const orderService = require('../services/order.service');
const botService = require('../services/bot.service');
const utilsController = require('./utils.controller');
const { getSystemConfig } = require('../utils/systemConfig');

// logic previously here moved to bot.service.js
const generatePickupCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BT-${code}`;
};

// [UC_08] Tạo đơn hàng Mua vé (Primary Market)
const createPrimaryOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { event_id, items, behaviorData, captchaToken } = req.body; 
    
    // Tự động giải phóng các đơn hàng quá hạn trước khi kiểm tra tồn kho
    await orderService.releaseExpiredOrders();

    // 1. Phân tích AI rủi ro Bot
    const aiAnalysis = await botService.analyzeBotBehavior(req, captchaToken, behaviorData, req.body.puzzleData);

    // Lưu Log vào DB (không chặn transaction chính nếu log lỗi)
    prisma.botDetectionLog.create({
      data: {
        user_id: userId,
        order_id: null, 
        event_type: 'PRIMARY_ORDER',
        click_speed_ms: behaviorData?.click_speed_ms || 0,
        form_fill_duration: behaviorData?.form_fill_duration || 0,
        behavior_metrics: behaviorData?.behavior_metrics || {},
        risk_score: aiAnalysis.riskScore,
        decision: aiAnalysis.isBot ? 'BLOCK' : 'ALLOW',
        ip_address: botService.getClientIp(req),
        user_agent: req.headers['user-agent'],
        detection_details: {
          details: aiAnalysis.details,
          recaptchaScore: aiAnalysis.recaptchaScore,
          aiRiskScore: aiAnalysis.aiRiskScore
        }
      }
    }).catch(err => console.error('Bot log error:', err));

    if (aiAnalysis.isBot) {
      return res.status(403).json({ 
        error: 'Phát hiện hành vi tự động không an toàn (Risk: ' + Math.round(aiAnalysis.riskScore * 100) + '%). Vui lòng thử lại chậm hơn.',
        isBot: true 
      });
    }

    // Lấy sự kiện kiểm tra hợp lệ
    const event = await prisma.event.findUnique({ 
      where: { id: event_id },
      include: { organizer: true }
    });
    if (!event || event.status !== 'active') {
      return res.status(400).json({ error: 'Sự kiện không tồn tại hoặc chưa mở bán.' });
    }

    // [Business Logic] Chặn Ban tổ chức tự đặt vé của chính mình
    if (event.organizer && event.organizer.user_id === userId) {
      return res.status(400).json({ error: 'Bạn là Ban tổ chức của sự kiện này, không thể tự đặt vé cho chính mình.' });
    }

    // [Business Logic] Chặn mua vé từ khuya ngày diễn ra sự kiện (00:00 của event_date)
    const currentDate = new Date();
    const eventDate = new Date(event.event_date);
    eventDate.setHours(0, 0, 0, 0); // Đưa về 0h sáng của ngày diễn ra sự kiện

    if (currentDate >= eventDate) {
      return res.status(400).json({ error: 'Sự kiện đã hoặc đang diễn ra, hệ thống đã ngưng mở bán vé.' });
    }

    let subtotal = 0;
    const orderItemsData = [];

    // Bắt đầu Transaction DB (đảm bảo tính toàn vẹn)
    const newOrder = await prisma.$transaction(async (tx) => {
      // 2. Kiểm tra tồn kho và tính tiền
      for (const item of items) {
        const tier = await tx.ticketTier.findUnique({ where: { id: item.ticket_tier_id } });
        if (!tier || tier.quantity_available < item.quantity) {
          throw new Error('Số lượng vé không đủ, vui lòng chọn lại.');
        }

        // Trừ tồn kho tạm thời (Giữ chỗ)
        await tx.ticketTier.update({
          where: { id: tier.id },
          data: { quantity_available: { decrement: item.quantity } }
        });

        const lineTotal = tier.price * item.quantity;
        subtotal += lineTotal;

        orderItemsData.push({
          ticket_tier_id: tier.id,
          quantity: item.quantity,
          unit_price: tier.price,
          subtotal: lineTotal
        });
      }

      // [AUDIT] Ưu tiên lấy phí đã chốt của Sự kiện (Locked Fees)
      const sysConfig = await getSystemConfig();
      
      const platformFeeRate = Number(event.platform_fee_percent !== null && event.platform_fee_percent !== undefined ? event.platform_fee_percent : (sysConfig.event_platform_fee_percent || 5));
      const transactionFeeRate = Number(event.commission_fee_percent !== null && event.commission_fee_percent !== undefined ? event.commission_fee_percent : (sysConfig.event_transaction_fee_percent || 3));
      const sysGasFee = Number(event.resale_gas_fee !== null && event.resale_gas_fee !== undefined ? event.resale_gas_fee : (sysConfig.system_gas_fee || 10000));

      const platformFeePercent = platformFeeRate / 100;
      const transactionFeePercent = transactionFeeRate / 100;

      // Tách bạch các khoản phí (Ban tổ chức chịu toàn bộ)
      const totalTickets = items.reduce((sum, item) => sum + item.quantity, 0);
      
      const platform_fee = subtotal * (platformFeeRate / 100);
      const commission_fee = subtotal * (transactionFeeRate / 100);
      const gas_fee = totalTickets * sysGasFee;
      const organizer_revenue = subtotal - platform_fee - commission_fee - gas_fee;
      const total_amount = subtotal; // Khách hàng trả đúng giá vé niêm yết

      // Hạn giữ chỗ = hiện tại + 10 phút
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // 3. Tạo Order
      const order = await tx.order.create({
        data: {
          customer_id: userId,
          event_id,
          order_number: 'ORD' + Date.now(),
          status: 'pending',
          subtotal,
          platform_fee,
          platform_fee_percent: platformFeeRate,
          commission_fee,
          commission_fee_percent: transactionFeeRate,
          gas_fee,

          // Separated Fees
          ticket_platform_fee: platform_fee,
          ticket_commission_fee: commission_fee,
          merchandise_platform_fee: 0,
          merchandise_commission_fee: 0,

          organizer_revenue,
          total_amount,
          payment_method: 'unselected',
          risk_score: aiAnalysis.riskScore,
          ip_address: botService.getClientIp(req),
          expires_at: expiresAt,
          items: {
            create: orderItemsData
          }
        }
      });

      return order;
    });

    res.status(201).json({ 
      message: 'Giữ chỗ vé thành công!', 
      data: newOrder 
    });

  } catch (error) {
    console.error('Lỗi khi tạo đơn sơ cấp:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_09] Mua vé trên Marketplace
const createMarketplaceOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { listing_id, behaviorData, captchaToken, puzzleData } = req.body;
    
    // Giải phóng các đơn hàng quá hạn trước khi kiểm tra listing
    await orderService.releaseExpiredOrders().catch(e => console.error('Release error:', e));

    // 1. Phân tích AI rủi ro Bot
    const aiAnalysis = await botService.analyzeBotBehavior(req, captchaToken, behaviorData, puzzleData);
    if (aiAnalysis.isBot) {
      return res.status(403).json({ 
        error: 'Phat hien hanh vi tu dong khong an toan. Vui long thu lai cham hon.',
        isBot: true 
      });
    }

    // 2. Tìm listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listing_id },
      include: { 
        ticket: { 
          include: { 
            event: { include: { organizer: true } } 
          } 
        } 
      }
    });

    if (!listing || listing.status !== 'active') {
      return res.status(400).json({ error: 'Rất tiếc, vé này vừa được khách hàng khác đưa vào giỏ hàng.' });
    }

    if (listing.ticket.event.status !== 'active') {
      return res.status(400).json({ error: 'Sự kiện này đang bị tạm dừng giao dịch bởi Quản trị viên.' });
    }

    if (listing.seller_id === userId) {
      return res.status(400).json({ error: 'Bạn không thể mua vé của chính mình.' });
    }

    // [Business Logic] Chặn Ban tổ chức mua vé marketplace của sự kiện chính mình
    if (listing.ticket.event.organizer.user_id === userId) {
      return res.status(400).json({ error: 'Bạn là Ban tổ chức của sự kiện này, không thể mua lại vé từ khách hàng.' });
    }

    // 2. Transaction Lock
    const transaction = await prisma.$transaction(async (tx) => {
      // Khóa vé lại 10 phút
      const lockExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      await tx.marketplaceListing.update({
        where: { id: listing_id },
        data: {
          status: 'pending', // Pending => Không hiện lên chợ nữa
          is_locked: true,
          lock_expires_at: lockExpiresAt
        }
      });

      // [AUDIT] Luồng tiền Bán lại (Resale) ưu tiên lấy từ Event (Locked Fees):
      const sysConfig = await getSystemConfig();
      const event = listing.ticket.event;
      const askingPrice = Number(listing.asking_price);
      
      // [Smart Fee Base]: Chỉ tính phí trên phần Giá vé, không tính trên vật phẩm tặng kèm
      const metadata = listing.metadata || {};
      const feeBasePrice = Number(metadata.ticket_price || askingPrice);
      
      const resale_gas_fee = Number(event.resale_gas_fee !== null && event.resale_gas_fee !== undefined ? event.resale_gas_fee : (sysConfig.system_gas_fee || 10000));
      const transaction_fee_rate = Number(event.resale_platform_fee_percent !== null && event.resale_platform_fee_percent !== undefined ? event.resale_platform_fee_percent : (sysConfig.resale_transaction_fee_percent || 1.0));
      const royalty_fee_rate = Number(event.royalty_fee_percent !== null && event.royalty_fee_percent !== undefined ? event.royalty_fee_percent : (sysConfig.default_royalty_percent || 3.0));

      const transaction_fee_percent = transaction_fee_rate / 100;
      const royalty_fee_percent = royalty_fee_rate / 100;

      // [Smart Fee Logic] Phân loại logic cũ/mới để không làm loạn bài đăng cũ
      // Thời điểm thay đổi logic: 2026-05-05T00:00:00Z
      const logicChangeDate = new Date('2026-05-05T00:00:00Z');
      const isLegacyListing = new Date(listing.created_at) < logicChangeDate;

      // 1. Phí hệ thống = Phí Gas + (Giá vé * % Phí giao dịch)
      const system_fee = resale_gas_fee + (feeBasePrice * transaction_fee_percent);
      
      // 2. Phí bản quyền = % Bản quyền * Giá vé
      const royalty_fee = feeBasePrice * royalty_fee_percent;
      
      let total_buyer_pay, seller_receive_amount;

      if (isLegacyListing) {
        // LOGIC CŨ: Phí cộng thêm (Đã luôn là cộng thêm từ trước)
        total_buyer_pay = askingPrice + system_fee;
        seller_receive_amount = askingPrice - royalty_fee;
      } else {
        // LOGIC MỚI: Theo yêu cầu mới nhất, Marketplace vẫn là cộng thêm phí hệ thống cho người mua trả
        total_buyer_pay = askingPrice + system_fee; 
        seller_receive_amount = askingPrice - royalty_fee;
      }
      
      const resale_profit = seller_receive_amount; 

      const mTransaction = await tx.marketplaceTransaction.create({
        data: {
          transaction_number: 'MKT' + Date.now(),
          listing_id: listing.id,
          ticket_id: listing.ticket_id,
          seller_id: listing.seller_id,
          buyer_id: userId,
          seller_receive_amount: seller_receive_amount,
          platform_fee: feeBasePrice * transaction_fee_percent,
          platform_fee_percent: transaction_fee_rate, // Snapshot % phí giao dịch sàn
          commission_fee: feeBasePrice * transaction_fee_percent, // Legacy field
          gas_fee: resale_gas_fee,
          organizer_royalty: royalty_fee,
          organizer_royalty_percent: royalty_fee_rate, // Snapshot % bản quyền cho BTC
          resale_profit: resale_profit,
          buyer_pay_amount: total_buyer_pay,
          status: 'pending',
          is_settled: false,
          ip_address: botService.getClientIp(req)
        }
      });

      return mTransaction;
    });

    res.status(201).json({
      message: 'Đã khóa vé marketplace thành công. Vui lòng thanh toán.',
      data: transaction
    });

  } catch (error) {
    console.error('Lỗi mua vé thứ cấp:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// Lấy chi tiết đơn hàng (Dùng cho trang Checkout)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log(`[DEBUG] getOrderById - ID: ${id}, UserID: ${userId}`);
    // Kiểm tra xem id có phải là UUID hợp lệ không để tránh lỗi DB
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    let order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(isUUID ? [{ id: id }] : []),
          { order_number: id }
        ]
      },
      include: {
        event: {
          include: { 
            organizer: {
              select: { user_id: true }
            }
          }
        },
        items: {
          include: { ticket_tier: true }
        },
        merchandise_items: {
          include: { merchandise: true }
        }
      }
    });

    // Nếu không thấy trong Order, tìm trong MarketplaceTransaction
    if (!order) {
        // [Bổ sung] Kiểm tra xem có phải là ID của TicketTransfer không (cho các giao dịch cũ)
        if (isUUID) {
            const transferRecord = await prisma.ticketTransfer.findUnique({
                where: { id: id },
                include: {
                    ticket: { include: { ticket_tier: true } },
                    event: true,
                    sender: { select: { full_name: true, email: true } },
                    receiver: { select: { full_name: true, email: true, avatar_url: true } }
                }
            });
    
            if (transferRecord) {
                // Map TicketTransfer thành cấu trúc giống Order để hiển thị
                order = {
                    id: transferRecord.id,
                    order_number: `TRF-${transferRecord.id.split('-')[0].toUpperCase()}`,
                    order_type: 'TICKET_TRANSFER',
                    status: transferRecord.status === 'completed' ? 'paid' : 'pending',
                    total_amount: 0, // Các giao dịch cũ có thể không lưu phí
                    subtotal: 0,
                    created_at: transferRecord.requested_at,
                    event: transferRecord.event,
                    customer_id: transferRecord.from_user_id,
                    metadata: {
                        ticket_id: transferRecord.ticket_id,
                        receiver_email: transferRecord.receiver.email
                    },
                    items: [{
                        ticket_tier: transferRecord.ticket.ticket_tier,
                        quantity: 1,
                        subtotal: 0
                    }],
                    receiver: transferRecord.receiver
                };
            }
        }
    }

    if (!order) {
        const mktTx = await prisma.marketplaceTransaction.findFirst({
          where: { 
            OR: [
              { id: id },
              { transaction_number: id }
            ]
          },
          include: {
            ticket: {
              include: {
                event: { include: { organizer: true } },
                ticket_tier: true
              }
            },
            buyer: true,
            seller: true,
            listing: true,
            payments: {
              where: { status: { in: ['paid', 'success', 'completed', 'thanh_cong'] } },
              take: 1
            }
          }
        });

        if (mktTx) {
          const isMktBuyer = mktTx.buyer_id === userId;
          const isMktSeller = mktTx.seller_id === userId;
          const isMktEventOrganizer = mktTx.ticket.event.organizer?.user_id === userId;
          const isMktAdmin = req.user.role === 'admin';

          if (!isMktBuyer && !isMktSeller && !isMktEventOrganizer && !isMktAdmin) {
            console.log(`[DEBUG] getOrderById(MKT) - Forbidden. Buyer: ${mktTx.buyer_id}, Seller: ${mktTx.seller_id}, Org: ${mktTx.ticket.event.organizer?.user_id}, CurrentUser: ${userId}`);
            return res.status(403).json({ error: 'Bạn không có quyền xem giao dịch này.' });
          }

          // Map sang cấu trúc Order
          order = {
            id: mktTx.id,
            order_number: mktTx.transaction_number,
            total_amount: mktTx.buyer_pay_amount,
            subtotal: mktTx.listing.asking_price,
            status: mktTx.status,
            order_type: 'MARKETPLACE_PURCHASE',
            customer_id: mktTx.buyer_id, // Map sang customer_id để dùng chung logic check sở hữu
            buyer_id: mktTx.buyer_id,
            seller_id: mktTx.seller_id,
            payment_method: mktTx.payments[0]?.method || 'vnpay',
            event: mktTx.ticket.event,
            created_at: mktTx.created_at,
            updated_at: mktTx.updated_at,
            expires_at: mktTx.listing.lock_expires_at, // Bổ sung thời hạn giữ vé
          items: [
            {
              id: 'mkt-item',
              quantity: 1,
              unit_price: mktTx.listing.metadata?.ticket_price || mktTx.listing.asking_price,
              subtotal: mktTx.listing.metadata?.ticket_price || mktTx.listing.asking_price,
              ticket_tier: mktTx.ticket.ticket_tier
            }
          ],
          platform_fee: mktTx.platform_fee,
          platform_fee_percent: mktTx.platform_fee_percent,
          commission_fee: mktTx.commission_fee,
          gas_fee: mktTx.gas_fee,
          organizer_royalty: mktTx.organizer_royalty,
          organizer_royalty_percent: mktTx.organizer_royalty_percent,
          merchandise_items: [] 
        };

        // Thêm thông tin quà tặng từ metadata listing
        const { merchandise_item_ids } = mktTx.listing.metadata || {};
        if (merchandise_item_ids && Array.isArray(merchandise_item_ids) && merchandise_item_ids.length > 0) {
           const gifts = await prisma.merchandiseOrderItem.findMany({
             where: { id: { in: merchandise_item_ids } },
             include: { merchandise: true }
           });
           order.merchandise_items = gifts.map(g => ({ ...g, is_gift: true }));
        }
      }
    }

    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng hoặc giao dịch.' });
    
    // [Bổ sung] Xử lý lấy thông tin vé cho đơn hàng Chuyển nhượng (TICKET_TRANSFER)
    if (order.order_type === 'TICKET_TRANSFER' && order.metadata?.ticket_id) {
      try {
        const ticketId = order.metadata.ticket_id;
        const receiverEmail = order.metadata.receiver_email;
        const isTicketUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId);

        const [transferTicket, receiver] = await Promise.all([
          isTicketUUID ? prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { ticket_tier: true }
          }) : null,
          receiverEmail ? prisma.user.findUnique({
            where: { email: receiverEmail },
            select: { 
              full_name: true, 
              avatar_url: true, 
              email: true,
              organizer_profile: {
                select: { organization_name: true }
              }
            }
          }) : null
        ]);
        
        if (transferTicket) {
          order.items = [{
            id: 'transfer-item',
            quantity: 1,
            unit_price: Number(transferTicket.ticket_tier.price),
            subtotal: 0, // Giá trị thanh toán của vé trong đơn chuyển nhượng là 0
            ticket_code: transferTicket.nft_token_id || transferTicket.id.substring(0, 8),
            ticket_tier: transferTicket.ticket_tier,
            is_transfer_item: true
          }];
        }
        if (receiver) {
          // Ưu tiên lấy tên Tổ chức nếu là tài khoản BTC
          if (receiver.organizer_profile?.organization_name) {
            receiver.full_name = receiver.organizer_profile.organization_name;
          }
          order.receiver = receiver;
        }
      } catch (subErr) {
        console.error('[ERROR] getOrderById Sub-queries failed:', subErr);
        // Không quăng lỗi ra ngoài để tránh sập cả trang chi tiết
      }
    }

    // Check ownership for Order model (Hỗ trợ cả Order thường và MarketplaceTransaction đã map)
    const authUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const isReceiver = !!authUser?.email && !!order.metadata?.receiver_email && order.metadata.receiver_email === authUser.email;
    const isOwner = order.customer_id === userId || order.buyer_id === userId || order.seller_id === userId || isReceiver;
    const isEventOrganizer = order.event?.organizer?.user_id === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isEventOrganizer && !isAdmin) {
       console.log(`[DEBUG] getOrderById - Forbidden. Order.customer_id: ${order.customer_id}, Buyer: ${order.buyer_id}, Seller: ${order.seller_id}, Org: ${order.event?.organizer?.user_id}, Receiver: ${order.metadata?.receiver_email}, CurrentUser: ${userId}`);
       return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });
    }

    // [Bổ sung] Nếu là đơn chuyển nhượng, lấy thêm thông tin sản phẩm từ metadata nếu chưa có
    if (order.order_type === 'TICKET_TRANSFER' && order.metadata?.merchandise_item_ids?.length > 0 && (!order.merchandise_items || order.merchandise_items.length === 0)) {
        const giftItems = await prisma.merchandiseOrderItem.findMany({
            where: { id: { in: order.metadata.merchandise_item_ids } },
            include: { merchandise: true }
        });
        order.merchandise_items = giftItems.map(g => ({ ...g, is_gift: true }));
    }
    
    // Log thành công nếu pass
    console.log(`[DEBUG] getOrderById - Access Granted. User: ${userId}, Role: ${req.user.role}`);

    res.status(200).json({ data: order });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// Cập nhật đơn hàng đang chờ (Thêm sản phẩm mua kèm & Mã giảm giá)
const updatePendingOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { merchandise_items } = req.body;
    const userId = req.user.userId;

    // 1. Kiểm tra đơn hàng hợp lệ
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        items: true,
        merchandise_items: true
      }
    });

    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    if (order.customer_id !== userId) return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa đơn hàng này.' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Chỉ có thể cập nhật đơn hàng ở trạng thái chờ thanh toán.' });

    // 2. Chạy Transaction để cập nhật
    const updatedOrder = await prisma.$transaction(async (tx) => {
      
      // A. Hoàn trả tồn kho Merchandise cũ (nếu có)
      if (order.merchandise_items.length > 0) {
        for (const item of order.merchandise_items) {
          await tx.merchandise.update({
            where: { id: item.merchandise_id },
            data: { stock: { increment: item.quantity } }
          });
        }
        // Xóa các bản ghi MerchandiseOrderItem cũ
        await tx.merchandiseOrderItem.deleteMany({ where: { order_id: id } });
      }

      // D. Cập nhật Order chính - Tính toán lại platform_fee
      const sysConfig = await getSystemConfig();
      
      // Lấy phí Vé (Ưu tiên phí riêng của Sự kiện)
      const event = await tx.event.findUnique({ where: { id: order.event_id } });
      const ticketPlatformFeeRate = Number(event?.platform_fee_percent || sysConfig.event_platform_fee_percent || 5);
      const ticketTransFeeRate = Number(event?.commission_fee_percent || sysConfig.event_transaction_fee_percent || 3);
      const sysGasFee = Number(event?.resale_gas_fee || sysConfig.system_gas_fee || 10000);

      let merchSubtotal = 0;
      let total_merch_platform_fee = 0;
      let total_merch_commission_fee = 0;
      const newMerchItems = [];

      // B. Xử lý Merchandise mới (Phải tính phí theo từng sản phẩm vì phí có thể khác nhau)
      if (merchandise_items && merchandise_items.length > 0) {
        const fallbackMerchPlatformFee = Number(sysConfig.product_platform_fee_percent || 5);
        const fallbackMerchTransFee = Number(sysConfig.product_transaction_fee_percent || 3);

        for (const item of merchandise_items) {
          const m = await tx.merchandise.findUnique({ where: { id: item.merchandise_id } });
          if (!m || !m.is_active || m.stock < item.quantity) {
            throw new Error(`Sản phẩm ${m?.name || 'không xác định'} đã hết hàng hoặc không khả dụng.`);
          }

          // Trừ tồn kho
          await tx.merchandise.update({
            where: { id: m.id },
            data: { stock: { decrement: item.quantity } }
          });

          const lineTotal = Number(m.price) * item.quantity;
          merchSubtotal += lineTotal;

          // Tính phí cho từng sản phẩm (Ưu tiên phí riêng của sản phẩm, fallback về hệ thống)
          const mPlatformFeeRate = Number(m.platform_fee_percent !== null ? m.platform_fee_percent : fallbackMerchPlatformFee);
          const mCommissionFeeRate = Number(m.commission_fee_percent !== null ? m.commission_fee_percent : fallbackMerchTransFee);

          const mPlatformFee = (lineTotal * mPlatformFeeRate / 100);
          const mCommissionFee = (lineTotal * mCommissionFeeRate / 100);

          total_merch_platform_fee += mPlatformFee;
          total_merch_commission_fee += mCommissionFee;

          newMerchItems.push({
            merchandise_id: m.id,
            quantity: item.quantity,
            unit_price: m.price,
            subtotal: lineTotal,
            platform_fee: mPlatformFee,
            commission_fee: mCommissionFee,
            pickup_code: generatePickupCode()
          });
        }
      }

      const ticketSubtotal = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
      const currentSubtotal = ticketSubtotal + merchSubtotal;
      const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);
      
      const ticket_platform_fee = (ticketSubtotal * ticketPlatformFeeRate / 100);
      const ticket_commission_fee = (ticketSubtotal * ticketTransFeeRate / 100);
      
      const total_platform_fee = ticket_platform_fee + total_merch_platform_fee;
      const total_commission_fee = ticket_commission_fee + total_merch_commission_fee;
      const gas_fee = totalTickets * sysGasFee;
      
      const organizer_revenue = currentSubtotal - total_platform_fee - total_commission_fee - gas_fee;

      return await tx.order.update({
        where: { id },
        data: {
          subtotal: currentSubtotal,
          platform_fee: total_platform_fee,
          commission_fee: total_commission_fee,
          gas_fee: gas_fee,
          
          // Separated Fees (Snapshot cho báo cáo)
          ticket_platform_fee,
          ticket_commission_fee,
          merchandise_platform_fee: total_merch_platform_fee,
          merchandise_commission_fee: total_merch_commission_fee,

          organizer_revenue: organizer_revenue,
          total_amount: currentSubtotal,
          merchandise_items: {
            create: newMerchItems
          }
        },
        include: {
          event: { select: { title: true, image_url: true, location_address: true, event_date: true } },
          items: { include: { ticket_tier: true } },
          merchandise_items: { include: { merchandise: true } }
        }
      });
    });

    res.status(200).json({ 
      message: 'Cập nhật đơn hàng thành công!', 
      data: updatedOrder 
    });

  } catch (error) {
    console.error('Update Order Error:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_xx] Tạo đơn hàng phí chuyển nhượng (Transfer Fee)
const createTransferOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticket_id, receiver_email, merchandise_item_ids } = req.body;

    // 1. Kiểm tra vé và quyền sở hữu
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticket_id },
      include: { 
        event: {
          include: {
            organizer: {
              include: { user: { select: { email: true } } }
            }
          }
        } 
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Không tìm thấy vé.' });
    if (ticket.current_owner_id !== userId) return res.status(403).json({ error: 'Bạn không sở hữu vé này.' });
    if (ticket.is_on_marketplace) return res.status(400).json({ error: 'Vé đang được niêm yết trên chợ, vui lòng gỡ niêm yết trước khi chuyển nhượng.' });
    if (ticket.status !== 'valid' && ticket.status !== 'active' && ticket.status !== 'minted') return res.status(400).json({ error: 'Vé không khả dụng để chuyển nhượng.' });
    
    // [Business Rule] Chặn chuyển nhượng cho chính mình
    if (ticket.event.organizer.user.email === receiver_email) {
      return res.status(400).json({ error: 'Không thể chuyển nhượng vé cho Ban tổ chức của sự kiện này.' });
    }

    if (!ticket.event.allow_transfer) {
      return res.status(400).json({ error: 'Sự kiện này không hỗ trợ chuyển nhượng.' });
    }

    // [Business Rule] Mỗi vé chỉ được phép chuyển nhượng tối đa 2 lần
    if (ticket.transfer_count >= 2) {
      return res.status(400).json({ error: 'Vé này đã đạt giới hạn chuyển nhượng tối đa (2 lần).' });
    }

    // [AUDIT] Chuyển nhượng cũng phải lấy phí Gas của Sự kiện đã chốt (Locked Fees)
    const sysConfig = await getSystemConfig();
    const sysGasFee = Number(ticket.event.resale_gas_fee !== null && ticket.event.resale_gas_fee !== undefined ? ticket.event.resale_gas_fee : (sysConfig.system_gas_fee || 10000));
    
    const order_number = 'TRF' + Date.now();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút để thanh toán phí

    const order = await prisma.order.create({
      data: {
        customer_id: userId,
        event_id: ticket.event_id,
        order_number: order_number,
        order_type: 'TICKET_TRANSFER',
        status: 'pending',
        subtotal: 0,
        gas_fee: sysGasFee,
        platform_fee: sysGasFee,
        commission_fee: 0,
        organizer_revenue: 0,
        total_amount: sysGasFee,
        payment_method: 'unselected',
        expires_at: expiresAt,
        ip_address: botService.getClientIp(req),
        metadata: {
          ticket_id: ticket.id,
          receiver_email: receiver_email,
          merchandise_item_ids: merchandise_item_ids || []
        }
      }
    });

    // [Security Check] Kiểm tra vật phẩm tặng kèm nếu có
    if (merchandise_item_ids && Array.isArray(merchandise_item_ids) && merchandise_item_ids.length > 0) {
      const validItems = await prisma.merchandiseOrderItem.findMany({
        where: {
          id: { in: merchandise_item_ids },
          order_id: ticket.order_id, // [QUAN TRỌNG] Phải cùng đơn hàng với vé
          merchandise: {
            OR: [
              { event_id: ticket.event_id },
              { event_id: null }
            ]
          },
          is_redeemed: false,
          OR: [
            { owner_id: userId },
            { owner_id: null, order: { customer_id: userId } }
          ]
        }
      });

      if (validItems.length !== merchandise_item_ids.length) {
        // Xóa đơn hàng vừa tạo vì dữ liệu không hợp lệ
        await prisma.order.delete({ where: { id: order.id } });
        return res.status(400).json({ error: 'Một số sản phẩm không hợp lệ, đã nhận hoặc không thuộc sở hữu của bạn.' });
      }
    }

    res.status(201).json({ 
      message: 'Khởi tạo thanh toán phí chuyển nhượng thành công.', 
      data: order 
    });

  } catch (error) {
    console.error('Lỗi khi tạo đơn chuyển nhượng:', error);
    res.status(500).json({ error: 'Lỗi server khi khởi tạo thanh toán.' });
  }
};

// [UC_xx] Lấy danh sách vật phẩm của tôi (Phân loại: Đã mua, Đang bán, Đã bán)
const getMyMerchandise = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Lấy tất cả vật phẩm hiện đang sở hữu
    const items = await prisma.merchandiseOrderItem.findMany({
      where: {
        OR: [
          { owner_id: userId },
          { 
            owner_id: null,
            order: { 
              customer_id: userId,
              status: { in: ['paid', 'success', 'completed'] }
            }
          }
        ]
      },
      select: {
        id: true,
        quantity: true,
        unit_price: true,
        subtotal: true,
        is_redeemed: true,
        pickup_code: true,
        order_id: true,
        merchandise: {
          select: {
            id: true,
            name: true,
            image_url: true,
            event: { select: { title: true } }
          }
        },
        order: { 
          select: { 
            status: true,
            order_number: true,
            event: { select: { title: true } }
          } 
        },
        scan_history: {
          where: { is_success: true },
          take: 1,
          orderBy: { scanned_at: 'desc' },
          include: {
            staff: {
              select: { full_name: true }
            }
          }
        }
      },
      orderBy: { order: { created_at: 'desc' } }
    });

    // 2. Lấy danh sách bài đăng đang hoạt động
    const activeListings = await prisma.marketplaceListing.findMany({
      where: { seller_id: userId, status: 'active' },
      select: { 
        id: true, 
        metadata: true,
        asking_price: true,
        listing_number: true,
        ticket: {
          select: {
            id: true,
            nft_token_id: true,
            ticket_tier: { select: { tier_name: true } },
            event: { select: { title: true, image_url: true, location_address: true, resale_gas_fee: true, resale_platform_fee_percent: true } }
          }
        }
      }
    });

    // 3. Lấy danh sách giao dịch đã bán thành công
    const soldTransactions = await prisma.marketplaceTransaction.findMany({
      where: { 
        seller_id: userId, 
        status: { in: ['paid', 'success', 'completed', 'thanh_cong'] } 
      },
      select: {
        id: true,
        created_at: true,
        buyer: { select: { id: true, full_name: true, email: true, avatar_url: true } },
        listing: { select: { metadata: true } }
      }
    });

    // 4. Lấy các giao dịch mua Marketplace của user này để map ngược lại sản phẩm
    const purchaseTransactions = await prisma.marketplaceTransaction.findMany({
      where: { 
        buyer_id: userId,
        status: { in: ['paid', 'success', 'completed', 'thanh_cong'] }
      },
      select: {
        transaction_number: true,
        listing: { select: { metadata: true } }
      }
    });

    // 5. Thu thập ID các sản phẩm đã bán qua marketplace listing
    const soldItemIds = new Set();
    const transactionMap = {};

    if (soldTransactions && soldTransactions.length > 0) {
      soldTransactions.forEach(tx => {
        const mIds = tx.listing?.metadata?.merchandise_item_ids;
        if (Array.isArray(mIds)) {
          mIds.forEach(id => {
            soldItemIds.add(id);
            transactionMap[id] = tx;
          });
        }
      });
    }

    // 6. Query các sản phẩm đã chuyển nhượng (người mua gốc là mình nhưng chủ hiện tại là người khác)
    const directTransferredItems = await prisma.merchandiseOrderItem.findMany({
      where: {
        order: {
          customer_id: userId,
          status: { in: ['paid', 'success', 'completed'] }
        }
      },
      include: {
        owner: {
          select: { id: true, full_name: true, email: true, avatar_url: true }
        },
        merchandise: {
          include: { event: { select: { title: true } } }
        },
        order: { 
          include: { event: { select: { title: true } } } 
        }
      }
    });

    // Lọc thủ công trong JS để đảm bảo không bị lỗi Prisma logic
    const finalTransferredItems = directTransferredItems.filter(item => 
      item.owner_id !== userId && 
      item.owner_id !== null && 
      !soldItemIds.has(item.id)
    );

    // 7. Chuẩn hóa sản phẩm sở hữu
    const transferredItemIds = new Set(finalTransferredItems.map(i => i.id));
    const excludedIds = new Set([...soldItemIds, ...transferredItemIds]);

    const formattedOwned = items
      .filter(item => !excludedIds.has(item.id))
      .map(item => {
        let status = item.is_redeemed ? 'received' : 'pending';
        if (item.order?.status === 'cancelled' || item.order?.status === 'refunded') status = 'cancelled';
        
        const listing = activeListings.find(l => {
          const mIds = l.metadata?.merchandise_item_ids || [];
          return Array.isArray(mIds) && mIds.includes(item.id);
        });
        if (listing) status = 'listing';

        const purchaseTx = purchaseTransactions.find(tx => {
          const mIds = tx.listing?.metadata?.merchandise_item_ids || [];
          return Array.isArray(mIds) && mIds.includes(item.id);
        });

        return { 
          ...item, 
          status,
          mkt_transaction_number: purchaseTx ? purchaseTx.transaction_number : null,
          listing_info: listing ? {
              ...listing,
              asking_price: Number(listing.asking_price),
              order_number: item.order?.order_number,
              event_title: item.order?.event?.title,
              ticket: listing.ticket ? {
                  ...listing.ticket,
                  event: listing.ticket.event ? {
                      ...listing.ticket.event,
                      resale_gas_fee: Number(listing.ticket.event.resale_gas_fee || 10000),
                      resale_platform_fee_percent: Number(listing.ticket.event.resale_platform_fee_percent || 3.0)
                  } : null
              } : null
          } : null,
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          event_title: item.merchandise?.event?.title || item.order?.event?.title || 'Sự kiện hệ thống'
        };
      });

    // 8. Chuẩn hóa sản phẩm đã BÁN
    const formattedSold = [];
    if (soldItemIds.size > 0) {
      const soldItems = await prisma.merchandiseOrderItem.findMany({
        where: { id: { in: [...soldItemIds] } },
        include: {
          merchandise: { include: { event: { select: { title: true } } } },
          order: { include: { event: { select: { title: true } } } }
        }
      });
      soldItems.forEach(item => {
        const tx = transactionMap[item.id];
        formattedSold.push({
          ...item,
          status: 'sold',
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          sold_at: tx?.created_at,
          transaction_id: tx?.id,
          transaction_number: tx?.transaction_number,
          buyer: tx?.buyer,
          event_title: item.merchandise?.event?.title || item.order?.event?.title || 'Sự kiện hệ thống'
        });
      });
    }

    // 9. Chuẩn hóa sản phẩm đã CHUYỂN NHƯỢNG
    const formattedTransferred = finalTransferredItems.map(item => ({
      ...item,
      status: 'transferred',
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
      sold_at: item.updated_at,
      transaction_number: 'GAS-TRANSFER',
      buyer: item.owner,
      event_title: item.merchandise?.event?.title || item.order?.event?.title || 'Sự kiện hệ thống'
    }));

    return res.status(200).json({ data: [...formattedOwned, ...formattedSold, ...formattedTransferred] });
  } catch (error) {
    console.error('getMyMerchandise error:', error);
    return res.status(500).json({ error: 'Lỗi server khi lấy danh sách sản phẩm.', detail: error.message });
  }
};

const getMerchandiseOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const item = await prisma.merchandiseOrderItem.findUnique({
      where: { id },
      include: {
        merchandise: {
          select: { name: true, image_url: true }
        },
        order: {
          select: { customer_id: true, order_number: true }
        },
        scan_history: {
          where: { is_success: true },
          take: 1,
          orderBy: { scanned_at: 'desc' },
          include: {
            staff: {
              select: { full_name: true }
            }
          }
        }
      }
    });

    if (!item) return res.status(404).json({ error: 'Không tìm thấy sản phẩm.' });
    const isItemOwner = item.order?.customer_id === userId || item.owner_id === userId;
    const isItemAdmin = req.user.role === 'admin';

    if (!isItemOwner && !isItemAdmin) {
       return res.status(403).json({ error: 'Bạn không có quyền xem thông tin này.' });
    }

    res.status(200).json({ data: item });
  } catch (error) {
    console.error('getMerchandiseOrderItemById error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  createPrimaryOrder,
  createMarketplaceOrder,
  getOrderById,
  updatePendingOrder,
  createTransferOrder,
  getMyMerchandise,
  getMerchandiseOrderItemById
};
