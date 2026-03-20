const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizer.controller');

// [GET] /api/organizers/:id
router.get('/:id', organizerController.getOrganizerProfile);

module.exports = router;
