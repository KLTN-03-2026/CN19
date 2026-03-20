const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-system.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

// [GET] /api/admin/config
router.get('/config', controller.getConfig);

// [PUT] /api/admin/config
router.put('/config', controller.updateConfig);

// [GET] /api/admin/fraud-alerts
router.get('/fraud-alerts', controller.getFraudAlerts);

// [PUT] /api/admin/fraud-alerts/:id/process
router.put('/fraud-alerts/:id/process', controller.processFraudAlert);

// [GET] /api/admin/stats
router.get('/stats', controller.getPlatformStats);

module.exports = router;
