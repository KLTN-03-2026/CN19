const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// [POST] /api/payments/create-url - Tạo URL thanh toán (VNPay hoặc MoMo)
router.post('/create-url', authenticate, paymentController.createPaymentUrl);

// [GET] /api/payments/vnpay-return - Redirect sau khi thanh toán VNPay
router.get('/vnpay-return', paymentController.vnpayReturn);

// [POST] /api/payments/momo-ipn - Callback ngầm xác nhận từ MoMo (IPN)
router.post('/momo-ipn', paymentController.momoIPN);

// [GET] /api/payments/status/:orderId - Kiểm tra trạng thái thanh toán
router.get('/status/:orderId', authenticate, paymentController.getPaymentStatus);

module.exports = router;
