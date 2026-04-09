const prisma = require('../config/prisma');
const axios = require('axios');
const orderService = require('../services/order.service');

// [AI Module] Chấm điểm rủi ro hành vi kết hợp reCAPTCHA v3
const analyzeBotBehavior = async (userId, captchaToken, behaviorData) => {
  try {
    let recaptchaScore = 0.5; // Mặc định trung lập nếu lỗi
    
    // 1. Xác thực với Google reCAPTCHA API
    if (captchaToken) {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
      );
      if (response.data.success) {
        recaptchaScore = response.data.score; // 1.0 là người, 0.0 là bot
      }
    }

    // 2. Phân tích dữ liệu hành vi gửi từ client
    // Ví dụ: bot thường điền form < 2 giây hoặc click speed cực nhanh
    const { form_fill_duration, click_speed_ms, behavior_metrics } = behaviorData || {};
    
    let behaviorRisk = 0;
    if (form_fill_duration < 3) behaviorRisk += 0.4; // Quá nhanh
    if (click_speed_ms > 0 && click_speed_ms < 100) behaviorRisk += 0.3; // Click quá nhanh
    if (behavior_metrics && !behavior_metrics.mouseDistance) behaviorRisk += 0.2; // Không di chuyển chuột

    // 3. Tính toán tổng điểm rủi ro (0.0 -> 1.0)
    // Càng cao càng nguy hiểm. reCAPTCHA chiếm 60% trọng số, hành vi chiếm 40%
    const finalRiskScore = ( (1 - recaptchaScore) * 0.6 ) + ( Math.min(behaviorRisk, 1) * 0.4 );

    return {
      isBot: finalRiskScore > 0.7, // Ngưỡng chặn
      riskScore: finalRiskScore,
      recaptchaScore
    };
  } catch (error) {
    console.error('AI Bot Analysis Error:', error);
    return { isBot: false, riskScore: 0.5, recaptchaScore: 0.5 };
  }
};

// [UC_08] Tạo đơn hàng Mua vé (Primary Market)
const createPrimaryOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { event_id, items, behaviorData, captchaToken } = req.body; 
    
    // Tự động giải phóng các đơn hàng quá hạn trước khi kiểm tra tồn kho
    await orderService.releaseExpiredOrders();

    // 1. [Tạm ẩn] Phân tích AI rủi ro Bot
    // const aiAnalysis = await analyzeBotBehavior(userId, captchaToken, behaviorData);

    // [Tạm ẩn] Lưu Log vào DB
    /*
    await prisma.botDetectionLog.create({
      data: {
        user_id: userId,
        order__id: 'pending_' + Date.now(),
        click_speed_ms: behaviorData?.click_speed_ms || 0,
        form_fill_duration: behaviorData?.form_fill_duration || 0,
        behavior_metrics: behaviorData?.behavior_metrics || {},
        risk_score: aiAnalysis.riskScore,
        decision: aiAnalysis.isBot ? 'BLOCK' : 'ALLOW'
      }
    });

    if (aiAnalysis.isBot) {
      return res.status(403).json({ 
        error: 'Phát hiện hành vi tự động không an toàn (Risk: ' + Math.round(aiAnalysis.riskScore * 100) + '%). Vui lòng thử lại chậm hơn.',
        isBot: true 
      });
    }
    */

    const aiAnalysis = { riskScore: 0 }; // Mặc định an toàn

    // Lấy sự kiện kiểm tra hợp lệ
    const event = await prisma.event.findUnique({ where: { id: event_id } });
    if (!event || event.status !== 'active') {
      return res.status(400).json({ error: 'Sự kiện không tồn tại hoặc chưa mở bán.' });
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

      // Platform fee (Hoa hồng 2%) trích từ doanh thu của BTC để chi trả Gas
      const platform_fee = subtotal * 0.02;
      const total_amount = subtotal; // Khách hàng trả đúng giá vé niêm yết (Phí gas đã nằm trong giá vé)

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
          total_amount,
          payment_method: 'unselected',
          risk_score: aiAnalysis.riskScore,
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
    const { listing_id } = req.body;

    // 1. Tìm listing
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listing_id },
      include: { ticket: true }
    });

    if (!listing || listing.status !== 'active') {
      return res.status(400).json({ error: 'Rất tiếc, vé này vừa được khách hàng khác đưa vào giỏ hàng.' });
    }

    if (listing.seller_id === userId) {
      return res.status(400).json({ error: 'Bạn không thể mua vé của chính mình.' });
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

      // Tạo transaction lưu trữ logic tính phí
      const platform_fee = (listing.asking_price * listing.platform_fee_percent) / 100;
      const seller_receive_amount = listing.asking_price - platform_fee;
      
      const mTransaction = await tx.marketplaceTransaction.create({
        data: {
          listing_id: listing.id,
          ticket_id: listing.ticket_id,
          seller_id: listing.seller_id,
          buyer_id: userId,
          seller_receive_amount: seller_receive_amount,
          platform_fee: platform_fee,
          buyer_pay_amount: listing.asking_price,
          status: 'pending'
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        event: {
          select: { title: true, image_url: true, location_address: true, event_date: true }
        },
        items: {
          include: { ticket_tier: true }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    if (order.customer_id !== userId) return res.status(403).json({ error: 'Bạn không có quyền xem đơn hàng này.' });

    res.status(200).json({ data: order });
  } catch (error) {
    console.error('Lỗi lấy chi tiết đơn hàng:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  createPrimaryOrder,
  createMarketplaceOrder,
  getOrderById
};
