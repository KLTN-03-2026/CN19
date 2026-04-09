const express = require('express');
const router = express.Router();
const controller = require('../controllers/scanner.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Các route bên dưới yêu cầu Staff
router.use(authenticate, authorize('staff'));

// [POST] /api/staff/scan
router.post('/scan', controller.scanQr);

// [GET] /api/staff/scan-history
router.get('/scan-history', controller.getScanHistory);

// [GET] /api/staff/my-events
router.get('/my-events', controller.getMyEvents);

module.exports = router;
