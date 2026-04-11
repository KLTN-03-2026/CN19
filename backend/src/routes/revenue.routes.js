const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenue.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// [GET] /api/revenue/summary - Lấy tổng quan doanh thu & số dư
router.get('/summary', authenticate, revenueController.getRevenueSummary);

// [GET] /api/revenue/transactions - Lấy lịch sử giao dịch
router.get('/transactions', authenticate, revenueController.getTransactionHistory);

// [POST] /api/revenue/withdraw - Yêu cầu rút tiền
router.post('/withdraw', authenticate, revenueController.requestWithdrawal);

// [PUT] /api/revenue/bank-info - Cập nhật thông tin ngân hàng
router.put('/bank-info', authenticate, revenueController.updateBankInfo);

// [POST] /api/revenue/run-settlement-test - Kích hoạt đối soát thủ công (Demo)
router.post('/run-settlement-test', authenticate, revenueController.runSettlementTest);

module.exports = router;
