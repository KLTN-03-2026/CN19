const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-merchandise.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Áp dụng middleware authenticate và authorize quyền admin cho tất cả các route bên dưới
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', controller.getAllProducts);
router.get('/:id', controller.getProductById);
router.put('/:id/toggle', controller.toggleProductStatus);
router.delete('/:id', controller.deleteProduct);

module.exports = router;
