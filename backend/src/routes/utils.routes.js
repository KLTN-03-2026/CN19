const express = require('express');
const router = express.Router();
const controller = require('../controllers/utils.controller');

// [POST] /api/utils/upload
// Trong thực tế cần gọi multerMw.single('file') vào tham số giữa
router.post('/upload', controller.uploadImage);

module.exports = router;
