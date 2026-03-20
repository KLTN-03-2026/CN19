const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');

// [GET] /api/events
router.get('/', eventController.getEvents);

// [GET] /api/events/:id
router.get('/:id', eventController.getEventById);

module.exports = router;
