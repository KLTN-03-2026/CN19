const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-coupon.controller');
const publicController = require('../controllers/coupon.controller');

// [POST] /api/coupons/apply
router.post('/apply', publicController.applyCoupon);

// [GET] /api/coupons/featured
// Lấy các mã giảm giá công khai đang hoạt động
router.get('/featured', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const coupons = await prisma.coupon.findMany({
      where: {
        is_active: true,
        end_date: { gte: new Date() },
        usage_limit: { gt: 0 } // Hoặc logic khác tùy hệ thống
      },
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        event: { select: { title: true, image_url: true } }
      }
    });

    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error('getFeaturedCoupons error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy mã giảm giá.' });
  }
});

// [GET] /api/coupons/event/:eventId
router.get('/event/:eventId', publicController.getAvailableCoupons);

module.exports = router;
