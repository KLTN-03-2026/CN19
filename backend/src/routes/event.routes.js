const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
// [GET] /api/events/recommendations - Ưu tiên Nổi bật
router.get('/recommendations', eventController.getRecommendations);

// [GET] /api/events
router.get('/', eventController.getEvents);

// [GET] /api/events/:id/availability
router.get('/:id/availability', eventController.getEventAvailability);

// [GET] /api/events/:id
router.get('/:id', eventController.getEventById);

module.exports = router;
