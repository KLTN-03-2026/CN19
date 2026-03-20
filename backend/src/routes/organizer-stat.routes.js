const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizer-stat.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('organizer'));

// [GET] /api/organizer/stats
router.get('/', controller.getStats);

module.exports = router;
