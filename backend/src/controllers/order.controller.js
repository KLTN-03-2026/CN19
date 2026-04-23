const prisma = require('../config/prisma');
const axios = require('axios');
const orderService = require('../services/order.service');
const botService = require('../services/bot.service');
const utilsController = require('./utils.controller');

// logic previously here moved to bot.service.js

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

      // platform_fee: (8% Doanh thu) + (Số lượng vé * 10.000đ phí Gas)
      const totalTickets = items.reduce((sum, item) => sum + item.quantity, 0);
      const commission_fee = subtotal * 0.08;
      const gas_fee = totalTickets * 10000;
      const platform_fee = commission_fee + gas_fee;
      const organizer_revenue = subtotal - platform_fee;
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
          commission_fee,
          gas_fee,
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

      // [Business Rule] Luồng tiền Bán lại (Resale) lấy từ Database Event:
      const event = listing.ticket.event;
      const askingPrice = Number(listing.asking_price);
      const ticketPriceOnly = Number(listing.metadata?.ticket_price || askingPrice);
      
      const resale_gas_fee = Number(event.resale_gas_fee || 10000);
      const platform_fee_percent = Number(event.resale_platform_fee_percent || 3.0) / 100;
      const royalty_fee_percent = Number(event.royalty_fee_percent || 3.0) / 100;

      // 1. Phí hệ thống (Cộng vào người mua) = Phí Gas + (Giá vé niêm yết * % Phí sàn)
      // Chỉ tính 3% trên giá vé, không tính trên giá sản phẩm đi kèm
      const system_fee = resale_gas_fee + (ticketPriceOnly * platform_fee_percent);
      
      // 2. Tính toán lợi nhuận bán lại (Resale Profit) để tính phí bản quyền BTC
      let acquisitionCost = 0;
      const lastSuccessTx = await tx.marketplaceTransaction.findFirst({
        where: { 
          ticket_id: listing.ticket_id, 
          status: { in: ['paid', 'success', 'completed'] } 
        },
        orderBy: { created_at: 'desc' }
      });

      if (lastSuccessTx) {
        acquisitionCost = Number(lastSuccessTx.buyer_pay_amount);
      } else {
        const originalOrder = await tx.order.findUnique({
          where: { id: listing.ticket.order_id },
          include: { items: { where: { ticket_tier_id: listing.ticket.ticket_tier_id } } }
        });
        acquisitionCost = Number(originalOrder?.items[0]?.unit_price || 0);
      }

      const gross_profit = Math.max(0, askingPrice - acquisitionCost);
      
      // 3. BTC nhận (Khấu trừ người bán) = % Bản quyền * Giá gốc (Nếu bán cao hơn giá gốc)
      const royalty_fee = askingPrice > acquisitionCost ? (acquisitionCost * royalty_fee_percent) : 0;
      
      const seller_receive_amount = askingPrice - royalty_fee;
      const total_buyer_pay = askingPrice + system_fee;
      const resale_profit = seller_receive_amount - acquisitionCost;
      
      const mTransaction = await tx.marketplaceTransaction.create({
        data: {
          transaction_number: 'MKT' + Date.now(),
          listing_id: listing.id,
          ticket_id: listing.ticket_id,
          seller_id: listing.seller_id,
          buyer_id: userId,
          seller_receive_amount: seller_receive_amount,
          platform_fee: system_fee,
          commission_fee: ticketPriceOnly * platform_fee_percent,
          gas_fee: resale_gas_fee,
          organizer_royalty: royalty_fee,
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

    let order = await prisma.order.findUnique({
      where: { id },
      include: {
        event: {
          select: { title: true, image_url: true, location_address: true, event_date: true }
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
              event: true,
              ticket_tier: true
            }
          },
          buyer: true,
          seller: true,
          listing: true
        }
      });

      if (mktTx) {
        if (mktTx.buyer_id !== userId && mktTx.seller_id !== userId) {
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
          event: mktTx.ticket.event,
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
          commission_fee: mktTx.commission_fee,
          gas_fee: mktTx.gas_fee,
          organizer_royalty: mktTx.organizer_royalty,
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
    
    // Check ownership for Order model
    if (order.customer_id && order.customer_id !== userId) {
       return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });
    }

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
    const { merchandise_items, coupon_code } = req.body;
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

      let merchSubtotal = 0;
      const newMerchItems = [];

      // B. Xử lý Merchandise mới
      if (merchandise_items && merchandise_items.length > 0) {
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

          newMerchItems.push({
            merchandise_id: m.id,
            quantity: item.quantity,
            unit_price: m.price,
            subtotal: lineTotal
          });
        }
      }

      // C. Xử lý Coupon
      let discountAmount = 0;
      let couponId = null;

      const ticketSubtotal = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
      const currentSubtotal = ticketSubtotal + merchSubtotal;

      if (coupon_code) {
        const coupon = await tx.coupon.findUnique({
          where: { code: coupon_code.toUpperCase() }
        });

        if (!coupon || !coupon.is_active) throw new Error('Mã giảm giá không lệ hoặc đã hết hạn.');
        
        const now = new Date();
        if (now < coupon.start_date || now > coupon.end_date) throw new Error('Mã giảm giá đã hết hạn.');

        if (coupon.min_order_amount && currentSubtotal < Number(coupon.min_order_amount)) {
          throw new Error('Đơn hàng không đạt giá trị tối thiểu để dùng mã này.');
        }

        // Tính giảm giá
        if (coupon.discount_type === 'percentage') {
          discountAmount = (currentSubtotal * Number(coupon.discount_value)) / 100;
          if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
            discountAmount = Number(coupon.max_discount_amount);
          }
        } else {
          discountAmount = Number(coupon.discount_value);
        }
        
        couponId = coupon.id;
      }

      // D. Cập nhật Order chính - Tính toán lại platform_fee
      const totalTickets = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const commission_fee = (ticketSubtotal * 0.08) + (merchSubtotal * 0.08);
      const gas_fee = totalTickets * 10000;
      const newPlatformFee = commission_fee + gas_fee;
      const organizer_revenue = currentSubtotal - newPlatformFee;

      return await tx.order.update({
        where: { id },
        data: {
          subtotal: currentSubtotal,
          coupon_id: couponId,
          discount_amount: discountAmount,
          platform_fee: newPlatformFee,
          commission_fee: commission_fee,
          gas_fee: gas_fee,
          organizer_revenue: organizer_revenue,
          total_amount: currentSubtotal - discountAmount,
          merchandise_items: {
            create: newMerchItems
          }
        },
        include: {
          event: { select: { title: true, image_url: true, location_address: true, event_date: true } },
          items: { include: { ticket_tier: true } },
          merchandise_items: { include: { merchandise: true } },
          coupon: true
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
      include: { event: true }
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Bạn không sở hữu vé này hoặc vé không tồn tại.' });
    }

    if (!ticket.event.allow_transfer) {
      return res.status(400).json({ error: 'Sự kiện này không hỗ trợ chuyển nhượng.' });
    }

    // [Business Rule] Mỗi vé chỉ được phép chuyển nhượng tối đa 2 lần
    const transferCount = await prisma.order.count({
      where: {
        metadata: { path: ['ticket_id'], equals: ticket_id },
        order_type: 'TICKET_TRANSFER',
        status: { in: ['paid', 'success', 'completed'] }
      }
    });

    if (transferCount >= 2) {
      return res.status(400).json({ error: 'Vé này đã đạt giới hạn chuyển nhượng tối đa (2 lần).' });
    }

    // 2. Tạo Order với type TRANSFER
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
        gas_fee: 10000,
        platform_fee: 10000,
        commission_fee: 0,
        organizer_revenue: 0,
        total_amount: 10000,
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

    res.status(201).json({ 
      message: 'Khởi tạo thanh toán phí chuyển nhượng thành công.', 
      data: order 
    });

  } catch (error) {
    console.error('Lỗi khi tạo đơn chuyển nhượng:', error);
    res.status(500).json({ error: 'Lỗi server khi khởi tạo thanh toán.' });
  }
};

module.exports = {
  createPrimaryOrder,
  createMarketplaceOrder,
  getOrderById,
  updatePendingOrder,
  createTransferOrder
};
