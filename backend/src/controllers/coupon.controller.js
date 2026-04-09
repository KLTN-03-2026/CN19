const prisma = require('../config/prisma');

const applyCoupon = async (req, res) => {
  try {
    const { code, event_id, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá.' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon || !coupon.is_active) {
      return res.status(404).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
    }

    // 1. Kiểm tra thời gian
    const now = new Date();
    if (now < coupon.start_date || now > coupon.end_date) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết hạn sử dụng.' });
    }

    // 2. Kiểm tra giới hạn sử dụng
    const usageCount = await prisma.order.count({
      where: { coupon_id: coupon.id, status: { in: ['pending', 'paid'] } }
    });

    if (coupon.usage_limit && usageCount >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng.' });
    }

    // 3. Kiểm tra sự kiện (nếu mã chỉ dành cho 1 event)
    if (coupon.event_id && coupon.event_id !== event_id) {
      return res.status(400).json({ error: 'Mã giảm giá này không áp dụng cho sự kiện hiện tại.' });
    }

    // 4. Kiểm tra đơn hàng tối thiểu
    if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
      return res.status(400).json({ error: `Đơn giá tối thiểu để sử dụng mã này là ${new Intl.NumberFormat('vi-VN').format(coupon.min_order_amount)}đ.` });
    }

    // 5. Tính toán số tiền giảm
    let discount_amount = 0;
    if (coupon.discount_type === 'percentage') {
      discount_amount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount && discount_amount > coupon.max_discount_amount) {
        discount_amount = coupon.max_discount_amount;
      }
    } else {
      discount_amount = coupon.discount_value;
    }

    res.status(200).json({
      message: 'Áp dụng mã giảm giá thành công!',
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_amount,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      }
    });

  } catch (error) {
    console.error('Apply Coupon Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const getAvailableCoupons = async (req, res) => {
  try {
    const { eventId } = req.params;
    const now = new Date();

    const coupons = await prisma.coupon.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
        OR: [
          { event_id: null },
          { event_id: eventId }
        ]
      },
      orderBy: { end_date: 'asc' }
    });

    // Optional: Filter out coupons that reached usage_limit
    // For simplicity and since we don't have thousands, we can do it here
    const validCoupons = [];
    for (const coupon of coupons) {
       const usageCount = await prisma.order.count({
          where: { coupon_id: coupon.id, status: { in: ['pending', 'paid'] } }
       });
       if (!coupon.usage_limit || usageCount < coupon.usage_limit) {
          validCoupons.push(coupon);
       }
    }

    res.status(200).json({ success: true, data: validCoupons });
  } catch (error) {
    console.error('Get Available Coupons Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  applyCoupon,
  getAvailableCoupons
};
