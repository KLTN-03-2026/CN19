const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-system.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Cho phép truy cập công khai để lấy tên site và email hỗ trợ
router.get('/config', controller.getSharedConfig);

module.exports = router;
