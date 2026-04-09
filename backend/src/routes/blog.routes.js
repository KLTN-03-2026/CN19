const express = require('express');
const router = express.Router();
const controller = require('../controllers/blog.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// --- CÔNG KHAI (Public) ---
// Lấy toàn bộ bài viết công khai (Hệ thống, BTC, Khách hàng)
router.get('/', controller.getPublicBlogs);

// Lấy chi tiết bài viết theo Slug
router.get('/slug/:slug', controller.getBlogBySlug);

// Lấy toàn bộ review của một sự kiện
router.get('/event/:eventId', controller.getEventReviews);

// --- BẢO MẬT (Protected) ---
// Đăng bài review sự kiện (Chỉ sau khi sự kiện kết thúc & có vé)
router.post('/reviews', authenticate, controller.createReview);

// Like hoặc Unlike một bài viết
router.post('/:blogId/like', authenticate, controller.toggleLike);

// Bình luận vào bài viết
router.post('/:blogId/comment', authenticate, controller.addComment);
// Cập nhật / Xóa Review cá nhân
router.put('/reviews/:id', authenticate, controller.updateReview);
router.delete('/reviews/:id', authenticate, controller.deleteReview);

// Cập nhật / Xóa bình luận
router.put('/comments/:id', authenticate, controller.updateComment);
router.delete('/comments/:id', authenticate, controller.deleteComment);

module.exports = router;
