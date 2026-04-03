const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizer-blog.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Áp dụng middleware xác thực và phân quyền BTC cho tất cả các routes trong tệp này
// Áp dụng middleware xác thực và phân quyền BTC cho tất cả các routes trong tệp này
router.use(authenticate, authorize('organizer'));

// [POST] /api/organizer/blogs - Tạo bài viết mới
router.post('/', controller.createBlog);

// [GET] /api/organizer/blogs - Danh sách bài viết của BTC hiện tại
router.get('/', controller.getOrganizerBlogs);

// [GET] /api/organizer/blogs/all-customer-reviews - Danh sách bài viết từ khách hàng
router.get('/all-customer-reviews', controller.getCustomerReviews);

// [GET] /api/organizer/blogs/:id - Chi tiết bài viết
router.get('/:id', controller.getBlogById);

// [PUT] /api/organizer/blogs/:id - Cập nhật bài viết
router.put('/:id', controller.updateBlog);

// [PATCH] /api/organizer/blogs/:id/moderate - Kiểm duyệt bài viết của khách hàng
router.patch('/:id/moderate', controller.moderateBlog);

module.exports = router;
