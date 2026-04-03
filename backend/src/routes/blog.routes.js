const express = require('express');
const router = express.Router();
const controller = require('../controllers/blog.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// --- CÔNG KHAI (Public) ---
// Lấy toàn bộ review của một sự kiện
router.get('/event/:eventId', controller.getEventReviews);

// --- BẢO MẬT (Protected) ---
// Đăng bài review sự kiện (Chỉ sau khi sự kiện kết thúc & có vé)
router.post('/reviews', authenticate, controller.createReview);

// Like hoặc Unlike một bài viết
router.post('/:blogId/like', authenticate, controller.toggleLike);

// Bình luận vào bài viết
router.post('/:blogId/comment', authenticate, controller.addComment);

module.exports = router;
