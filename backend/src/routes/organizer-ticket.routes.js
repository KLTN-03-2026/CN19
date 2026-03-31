const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizer-ticket.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Protect all routes with auth and organizer role
router.use(authenticate);
router.use(authorize('organizer'));

router.get('/stats', controller.getOrganizerTicketStats);
router.get('/', controller.getOrganizerTickets);

module.exports = router;
