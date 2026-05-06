const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-system.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Chỉ yêu cầu đăng nhập, không yêu cầu quyền Admin
router.get('/config', authenticate, controller.getSharedConfig);

module.exports = router;
