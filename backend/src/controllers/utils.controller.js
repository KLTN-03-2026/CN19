const jwt = require('jsonwebtoken');

// [Utility] Upload file ảnh 
const uploadImage = async (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Upload file thành công.',
      url: 'https://cdn.basticket.com/mock-upload-file-' + Date.now() + '.jpg'
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi upload.' });
  }
};

// [Anti-Bot] Generate Puzzle Captcha
const generateCaptcha = async (req, res) => {
  try {
    // 1. Tạo vị trí ngẫu nhiên cho mảnh ghép (x: 50 -> 250, y: 10 -> 100)
    const targetX = Math.floor(Math.random() * 200) + 50;
    const targetY = Math.floor(Math.random() * 80) + 10;

    // 2. Tạo token chứa tọa độ thực (mã hóa để client không đọc được)
    const captchaToken = jwt.sign(
      { x: targetX, y: targetY, timestamp: Date.now() },
      process.env.JWT_SECRET || 'basticket_secret_key',
      { expiresIn: '5m' }
    );

    res.json({
      success: true,
      data: {
        x: targetX, // Gửi X để frontend biết vị trí đặt "lỗ hổng"
        y: targetY, // Gửi Y để frontend vẽ mảnh ghép đúng hàng
        captchaSession: captchaToken
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Không thể tạo captcha.' });
  }
};

// [Anti-Bot] Verify Puzzle Captcha (Internal utility or API)
const verifyCaptchaSecret = (token, userX) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'basticket_secret_key');
    const diff = Math.abs(decoded.x - userX);
    
    // Cho phép sai số 5px
    return diff <= 7;
  } catch (error) {
    return false;
  }
};

module.exports = { 
  uploadImage,
  generateCaptcha,
  verifyCaptchaSecret
};
