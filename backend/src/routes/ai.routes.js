const express = require('express');
const router = express.Router();
const controller = require('../controllers/ai.controller');

// [POST] /api/ai/behavior-log
router.post('/behavior-log', controller.logBehavior);

// [POST] /api/ai/verify-challenge
router.post('/verify-challenge', controller.verifyChallenge);

module.exports = router;
