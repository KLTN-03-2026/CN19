const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhook.controller');

/**
 * Routes cho Webhook từ các bên thứ 3 (Casso, v.v.)
 * Lưu ý: Các route này KHÔNG dùng middleware authenticate vì được gọi từ Server-to-Server
 */

// [POST] /api/webhooks/casso
router.post('/casso', WebhookController.handleCasso);

module.exports = router;
