const express = require('express');
const router = express.Router();
const adminCategoryController = require('../controllers/admin-category.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Áp dụng bảo mật cho tất cả các route trong file này
router.use(authenticate);
router.use(authorize('admin'));

// [GET] /api/admin/categories
router.get('/', adminCategoryController.getCategories);

// [POST] /api/admin/categories
router.post('/', adminCategoryController.createCategory);

// [PUT] /api/admin/categories/:id
router.put('/:id', adminCategoryController.updateCategory);

// [GET] /api/admin/categories/:id
router.get('/:id', adminCategoryController.getCategoryById);

// [DELETE] /api/admin/categories/:id
router.delete('/:id', adminCategoryController.deleteCategory);

module.exports = router;
