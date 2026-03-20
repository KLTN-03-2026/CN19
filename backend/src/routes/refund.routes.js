const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refund.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// [POST] /api/refunds/request
router.post('/request', refundController.requestRefund);

module.exports = router;
