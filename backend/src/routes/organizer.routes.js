const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizer.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// [GET] /api/organizers/me (Self profile for dashboard)
router.get('/me', authenticate, authorize('organizer'), organizerController.getOrganizerSelfProfile);

// [PUT] /api/organizers/me (Update self profile)
router.put('/me', authenticate, authorize('organizer'), organizerController.updateOrganizerProfile);

// [GET] /api/organizers/:id (Public profile)
router.get('/:id', organizerController.getOrganizerProfile);

module.exports = router;
