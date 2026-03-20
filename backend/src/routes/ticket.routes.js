const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Các tác vụ thao tác vé của user bắt buộc phải login
router.use(authenticate);

// [GET] /api/tickets
router.get('/', ticketController.getMyTickets);

// [GET] /api/tickets/:id/qr-code
router.get('/:id/qr-code', ticketController.getQrCode);

// [POST] /api/tickets/:id/transfer
router.post('/:id/transfer', ticketController.transferTicket);

module.exports = router;
