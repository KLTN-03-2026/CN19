const prisma = require('../config/prisma');

// Giả lập AI Module chấm điểm rủi ro hành vi
const analyzeBotBehavior = async (reqData) => {
  // Thực tế sẽ gọi sang Microservice AI bằng axios/fetch
  // Ở đây giả định risk < 0.8 là người thật
  return {
    isBot: false,
    riskScore: 0.1
  };
};

// [UC_08] Tạo đơn hàng Mua vé (Primary Market)
const createPrimaryOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { event_id, items, behaviorData } = req.body; 
    // items: [{ ticket_tier_id, quantity }]

    // 1. Phân tích AI rủi ro Bot
    const aiAnalysis = await analyzeBotBehavior(behaviorData);
    if (aiAnalysis.isBot || aiAnalysis.riskScore >= 0.8) {
      return res.status(403).json({ 
        error: 'Phát hiện hành vi tự động. Vui lòng xác thực bạn là con người',
        requireCaptcha: true 
      });
    }

    // Lấy sự kiện kiểm tra hợp lệ
    const event = await prisma.event.findUnique({ where: { id: event_id } });
    if (!event || event.status !== 'active') {
      return res.status(400).json({ error: 'Sự kiện không tồn tại hoặc chưa mở bán.' });
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

module.exports = {
  createPrimaryOrder,
  createMarketplaceOrder
};
