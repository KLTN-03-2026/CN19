const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { optionalAuthenticate } = require('../middlewares/auth.middleware');

// [GET] /api/events/recommendations - Ưu tiên Trending & Sở thích cá nhân
router.get('/recommendations', optionalAuthenticate, eventController.getRecommendations);

// [GET] /api/events
router.get('/', eventController.getEvents);

// [GET] /api/events/:id/availability
router.get('/:id/availability', eventController.getEventAvailability);

// [GET] /api/events/:id
router.get('/:id', eventController.getEventById);

module.exports = router;
