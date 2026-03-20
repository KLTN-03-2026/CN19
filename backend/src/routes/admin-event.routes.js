const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

// [GET] /api/admin/events
router.get('/', controller.getEvents);

// [PUT] /api/admin/events/:id/approve
router.put('/:id/approve', controller.approveEvent);

// [PUT] /api/admin/events/:id/force-cancel
router.put('/:id/force-cancel', controller.forceCancelEvent);

// [POST] /api/admin/categories
router.post('/categories', controller.createCategory);

module.exports = router;
