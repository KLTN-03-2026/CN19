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

module.exports = router;
