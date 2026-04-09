const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// [POST] /api/payments/create-vnpay - Tạo URL thanh toán VNPay
router.post('/create-vnpay', authenticate, paymentController.createVNPayUrl);

// [GET] /api/payments/vnpay-ipn - Callback ngầm xác nhận từ VNPay
router.get('/vnpay-ipn', paymentController.vnpayIPN);

// [POST] /api/payments/create-momo - Tạo URL thanh toán MoMo
router.post('/create-momo', authenticate, paymentController.createMoMoUrl);

// [POST] /api/payments/momo-ipn - Callback ngầm xác nhận từ MoMo
router.post('/momo-ipn', paymentController.momoIPN);

// [GET] /api/payments/status/:orderId - Kiểm tra trạng thái thanh toán
router.get('/status/:orderId', authenticate, paymentController.getPaymentStatus);

module.exports = router;
