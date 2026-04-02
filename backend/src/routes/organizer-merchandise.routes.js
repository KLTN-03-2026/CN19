const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizer-merchandise.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate, authorize('organizer'));

// [GET] /api/organizer/merchandise
router.get('/', controller.getAll);

// [GET] /api/organizer/merchandise/:id
router.get('/:id', controller.getById);

// [POST] /api/organizer/merchandise
router.post('/', controller.create);

// [PUT] /api/organizer/merchandise/:id
router.put('/:id', controller.update);

// [DELETE] /api/organizer/merchandise/:id
router.delete('/:id', controller.remove);

// [PATCH] /api/organizer/merchandise/:id/toggle
router.patch('/:id/toggle', controller.toggle);

module.exports = router;
