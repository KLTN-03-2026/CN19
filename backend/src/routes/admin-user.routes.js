const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

// [GET] /api/admin/users
router.get('/', controller.getUsers);

// [GET] /api/admin/users/:id
router.get('/:id', controller.getUserById);

// [POST] /api/admin/users
router.post('/', controller.createUser);

// [PUT] /api/admin/users/:id/ban
router.put('/:id/ban', controller.toggleUserStatus);

// [PUT] /api/admin/organizers/:id/approve
router.put('/organizer/:id/approve', controller.approveOrganizer);

module.exports = router;
