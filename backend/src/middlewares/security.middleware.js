const rateLimit = require('express-rate-limit');

// 1. Giới hạn chung toàn hệ thống (Prevent Spam/DDoS)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Tối đa 200 requests mỗi IP
  message: {
    error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Giới hạn nghiêm ngặt cho Checkout & Auth (Prevent Brute force/Scalping)
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 10, // Tối đa 10 requests mỗi IP mỗi phút cho các route nhạy cảm
  message: {
    error: 'Hệ thống đang bận hoặc bạn thao tác quá nhanh. Vui lòng thử lại sau 1 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  strictLimiter
};
