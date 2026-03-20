const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// [POST] /api/marketplace/listings
router.post('/', marketplaceController.createListing);

// [DELETE] /api/marketplace/listings/:id
router.delete('/:id', marketplaceController.deleteListing);

module.exports = router;
