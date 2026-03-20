const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// [POST] /api/orders
router.post('/', orderController.createPrimaryOrder);

// [POST] /api/orders/marketplace
router.post('/marketplace', orderController.createMarketplaceOrder);

module.exports = router;
