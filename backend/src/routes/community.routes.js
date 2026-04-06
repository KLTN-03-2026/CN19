const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const blogController = require('../controllers/blog.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// 1. Lấy News Feed (Công khai)
router.get('/', communityController.getFeed);

// 2. Các hành động cần Đăng nhập
router.post('/posts', authenticate, communityController.createPost);
router.get('/my-events', authenticate, communityController.getMyBookedEvents);

// --- Tương tác (Tận dụng logic Blog) ---
// Thích bài viết
router.post('/:blogId/like', authenticate, blogController.toggleLike);

// Bình luận
router.post('/:blogId/comment', authenticate, blogController.addComment);

module.exports = router;
