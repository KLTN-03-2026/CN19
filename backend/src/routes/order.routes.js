const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// [GET] /api/orders/my-merchandise
router.get('/my-merchandise', orderController.getMyMerchandise);

// [GET] /api/orders/my-merchandise/:id
router.get('/my-merchandise/:id', orderController.getMerchandiseOrderItemById);

// [POST] /api/orders
router.post('/', orderController.createPrimaryOrder);

// [GET] /api/orders/:id
router.get('/:id', orderController.getOrderById);

// [PATCH] /api/orders/:id
router.patch('/:id', orderController.updatePendingOrder);

// [POST] /api/orders/transfer
router.post('/transfer', orderController.createTransferOrder);

// [POST] /api/orders/marketplace
router.post('/marketplace', orderController.createMarketplaceOrder);

module.exports = router;
