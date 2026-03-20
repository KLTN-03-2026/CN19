const express = require('express');
const router = express.Router();
const controller = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('organizer'));

// [GET] /api/organizer/staffs
router.get('/', controller.getStaffs);

// [POST] /api/organizer/staffs
router.post('/', controller.createStaff);

// [PUT] /api/organizer/staffs/:id/lock
router.put('/:id/lock', controller.lockStaff);

module.exports = router;
