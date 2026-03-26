const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizer-event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('organizer'));

// [POST] /api/organizer/events
router.post('/', controller.createEvent);

// [PUT] /api/organizer/events/:id
router.put('/:id', controller.updateEvent);

// [POST] /api/organizer/events/:id/cancel-request
router.post('/:id/cancel-request', controller.requestCancelOrReschedule);

// [PUT] /api/organizer/events/:id/resale-policy
router.put('/:id/resale-policy', controller.updateResalePolicy);

// [GET] /api/organizer/events (Danh sách sự kiện của BTC)
router.get('/', controller.getOrganizerEvents);

// [GET] /api/organizer/events/:id (Chi tiết sự kiện của BTC)
router.get('/:id', controller.getEventById);

// [DELETE] /api/organizer/events/:id (Xóa sự kiện nháp/chờ duyệt)
router.delete('/:id', controller.deleteEvent);

// [GET] /api/organizer/events/:id/attendees
router.get('/:id/attendees', controller.getAttendees);

module.exports = router;
