const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-finance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

// [GET] /api/admin/refunds
router.get('/refunds', controller.getRefunds);

// [POST] /api/admin/refunds/:id/process
router.post('/refunds/:id/process', controller.processRefund);

// [GET] /api/admin/payouts
router.get('/payouts', controller.getPayouts);

// [POST] /api/admin/payouts/:id/execute
router.post('/payouts/:id/execute', controller.executePayout);

module.exports = router;
