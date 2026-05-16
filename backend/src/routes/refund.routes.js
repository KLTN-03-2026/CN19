const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refund.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// [USER] Yêu cầu hoàn tiền & Hủy yêu cầu
router.post('/request', refundController.requestRefund);
router.post('/cancel-request', refundController.cancelRefundRequest);

// [ADMIN] Quản lý hoàn tiền
router.get('/admin/list', authorize('admin'), refundController.getAdminRefunds);
router.post('/admin/:id/process', authorize('admin'), refundController.processRefund);

module.exports = router;
