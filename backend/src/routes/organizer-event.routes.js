const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizer-event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('organizer'));

// [POST] /api/organizer/events
router.post('/', controller.createEvent);

// [PUT] /api/organizer/events/:id
router.put('/:id', controller.updateEvent);

// [POST] /api/organizer/events/:id/cancel-request (Alias for emergency actions)
router.post('/:id/cancel-request', controller.requestCancelOrReschedule);
router.post('/:id/emergency', controller.requestCancelOrReschedule);
router.post('/:id/emergency-action', controller.requestCancelOrReschedule);
router.post('/:id/cancel-emergency', controller.cancelEmergencyRequest);
router.post('/:id/pay-cancellation-fee', controller.payCancellationFee);

// [PUT] /api/organizer/events/:id/resale-policy
router.put('/:id/resale-policy', controller.updateResalePolicy);

// [PUT] /api/organizer/events/:id/transfer-policy
router.put('/:id/transfer-policy', controller.updateTransferPolicy);

// [GET] /api/organizer/events/all-attendees (Tất cả người tham gia của BTC)
router.get('/all-attendees', controller.getAllOrganizerAttendees);

// [GET] /api/organizer/events (Danh sách sự kiện của BTC)
router.get('/', controller.getOrganizerEvents);

// [GET] /api/organizer/events/:id/attendees
router.get('/:id/attendees', controller.getAttendees);

// [GET] /api/organizer/events/:id (Chi tiết sự kiện của BTC)
router.get('/:id', controller.getEventById);

// [GET] /api/organizer/events/:id/transactions (Danh sách giao dịch)
router.get('/:id/transactions', controller.getTierTransactions);

// [GET] /api/organizer/events/:id/secondary-activity (Hoạt động bán lại/chuyển nhượng)
router.get('/:id/secondary-activity', controller.getEventSecondaryActivity);

// [DELETE] /api/organizer/events/:id (Xóa sự kiện nháp/chờ duyệt)
router.delete('/:id', controller.deleteEvent);

module.exports = router;
