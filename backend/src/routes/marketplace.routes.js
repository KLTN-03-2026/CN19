const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// [GET] /api/marketplace (Public)
router.get('/', marketplaceController.getListings);

// Phải đăng nhập cho các thao tác dưới đây
router.use(authenticate);

// [POST] /api/marketplace
router.post('/', marketplaceController.createListing);

// [DELETE] /api/marketplace/:id
router.delete('/:id', marketplaceController.deleteListing);

// [PUT] /api/marketplace/:id
router.put('/:id', marketplaceController.updateListing);

module.exports = router;
