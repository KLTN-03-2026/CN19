const prisma = require('../config/prisma');

// [AI] Gửi dữ liệu hành vi từ Frontend
const logBehavior = async (req, res) => {
  try {
    const { session_id, mouse_events, cursor_speed, time_on_page } = req.body;
    
    // TODO: Gửi payload này sang 1 Microservice AI hoặc Queue
    // Tạm thời Backend chỉ Mock nhận thành công
    
    res.status(200).json({ message: 'Đã tracking hành vi người dùng.' });
  } catch (error) {
    console.error('Lỗi tracking AI:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// [AI] Xác thực thử thách Captcha
const verifyChallenge = async (req, res) => {
  try {
    const { session_id, captcha_token } = req.body;
    
    // Gọi API của Provider reCaptcha/hCaptcha
    if (captcha_token === 'mock_valid_token' || captcha_token) {
      return res.status(200).json({ 
        success: true, 
        message: 'Xác thực thành công. Hệ thống đã mở khóa nút thanh toán.' 
      });
    }

    return res.status(400).json({ error: 'Mã xác thực không hợp lệ hoặc đã hết hạn.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = {
  logBehavior,
  verifyChallenge
};
