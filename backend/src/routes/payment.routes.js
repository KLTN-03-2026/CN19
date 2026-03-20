const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// [POST] /api/payments/pay
// Require auth để biết ai tạo link thanh toán
router.post('/pay', authenticate, paymentController.createPaymentUrl);

// [POST] /api/payments/webhook
// KHÔNG CẦN ATH. VNPay server sẽ gọi vào trực tiếp
router.post('/webhook', paymentController.webhookHandler);

// [GET] /api/payments/status/:orderNumber
// Polling trạng thái đơn hàng (Có thể require auth tùy thiết kế, tạm thời public)
router.get('/status/:orderNumber', paymentController.getPaymentStatus);

module.exports = router;
