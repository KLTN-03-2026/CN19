const express = require('express');
const router = express.Router();
const adminTransactionController = require('../controllers/admin-transaction.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Tất cả các route trong file này đều yêu cầu Admin
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', adminTransactionController.getTransactions);
router.get('/stats', adminTransactionController.getTransactionStats);
router.get('/:type/:id', adminTransactionController.getTransactionDetail);

module.exports = router;
