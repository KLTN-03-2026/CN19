const express = require('express');
const router = express.Router();
const controller = require('../controllers/utils.controller');

// [POST] /api/utils/upload
router.post('/upload', controller.uploadImage);

// [GET] /api/utils/captcha/generate
router.get('/captcha/generate', controller.generateCaptcha);

module.exports = router;
