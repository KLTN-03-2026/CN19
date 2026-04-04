const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-blog.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Áp dụng middleware authenticate và authorize quyền admin cho tất cả các route bên dưới
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', controller.getAllBlogs);
router.get('/:id', controller.getBlogById);
router.post('/', controller.createBlog);
router.put('/:id/toggle', controller.toggleBlogStatus);
router.delete('/:id', controller.deleteBlog);

module.exports = router;
