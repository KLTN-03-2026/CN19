const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizer-order.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Áp dụng middleware bảo mật cho toàn bộ route này
router.use(authenticate, authorize('organizer'));

// [GET] /api/organizer/orders - Danh sách đơn hàng của BTC
router.get('/', controller.getOrganizerOrders);

// [GET] /api/organizer/orders/:id - Chi tiết đơn hàng
router.get('/:id', controller.getOrderDetail);

module.exports = router;
