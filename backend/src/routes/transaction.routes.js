const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// [GET] /api/transactions
router.get('/', transactionController.getMyTransactions);

module.exports = router;
