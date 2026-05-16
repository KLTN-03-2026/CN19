const axios = require('axios');
const utilsController = require('../controllers/utils.controller');

/**
 * Lấy IP khách hàng (Xử lý cả Proxy/Nginx)
 */
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress;
};

/**
 * Chấm điểm rủi ro hành vi kết hợp reCAPTCHA & Puzzle Captcha
 * @returns { isBot: boolean, riskScore: number }
 */
const analyzeBotBehavior = async (req, captchaToken, behaviorData, puzzleData) => {
  try {
    let recaptchaScore = 1.0; 
    let aiRiskScore = 0.0;
    
    // 1. Xác thực với Google reCAPTCHA v3 hoặc Cloudflare Turnstile
    if (captchaToken === 'local-dev-bypass') {
      console.log('[SECURITY] Local development bypass detected.');
      recaptchaScore = 1.0;
    } else if (captchaToken) {
      if (captchaToken.startsWith('0.x') || captchaToken.length > 100) {
        // Có vẻ là Turnstile Token
        const response = await axios.post(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${captchaToken}`,
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        if (response.data.success) {
          recaptchaScore = 1.0; 
        } else {
          console.error('[SECURITY] Turnstile Verification Failed:', response.data['error-codes']);
          recaptchaScore = 0.0;
        }
      } else {
        // Google reCAPTCHA v3
        const response = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
        );
        if (response.data.success) {
          recaptchaScore = response.data.score; 
        } else {
          console.error('[SECURITY] reCAPTCHA Verification Failed:', response.data['error-codes']);
          recaptchaScore = 0.0;
        }
      }
    }

    // 2. Xác thực Puzzle Slider Captcha (nếu có)
    let puzzleValid = true;
    if (puzzleData && puzzleData.captchaSession) {
      puzzleValid = utilsController.verifyCaptchaSecret(puzzleData.captchaSession, puzzleData.x);
    }

    // 3. Gọi AI Service (Python) để phân tích hành vi chi tiết
    let aiDetails = [];
    try {
      const aiResponse = await axios.post('http://127.0.0.1:5001/analyze', { behaviorData });
      if (aiResponse.data.status === 'success') {
        aiRiskScore = aiResponse.data.risk_score;
        aiDetails = aiResponse.data.details || [];
      }
    } catch (aiErr) {
      console.warn('AI Service unavailable, falling back to basic rules.');
      const { form_fill_duration, click_speed_ms, behavior_metrics } = behaviorData || {};
      if (form_fill_duration < 2000) aiDetails.push('Quy tắc Tĩnh: Tốc độ hoàn thành biểu mẫu quá nhanh mức sinh học (<2s).');
      if (click_speed_ms > 0 && click_speed_ms < 100) aiDetails.push('Quy tắc Tĩnh: Chạm/Click chuột nhanh bất thường, nghi ngờ công cụ tự động.');
      if (behavior_metrics && !behavior_metrics.mouseDistance) aiDetails.push('Quy tắc Tĩnh: Không ghi nhận được vệt di chuyển chuột.');
      
      // Basic score calculation if AI is down
      if (form_fill_duration < 2000) aiRiskScore += 0.5;
      if (click_speed_ms > 0 && click_speed_ms < 100) aiRiskScore += 0.3;
      if (behavior_metrics && !behavior_metrics.mouseDistance) aiRiskScore += 0.2;
    }

    // 4. Tính toán tổng điểm rủi ro (0.0 -> 1.0)
    if (!puzzleValid) return { isBot: true, riskScore: 1.0, details: ['Puzzle verification failed'] };

    // Đảm bảo các giá trị là số và không phải NaN
    const rScore = Number(recaptchaScore) || 0;
    const aRisk = Number(aiRiskScore) || 0;

    const finalRiskScore = ( (1 - rScore) * 0.4 ) + ( Math.min(aRisk, 1) * 0.6 );
    const finalScore = isNaN(finalRiskScore) ? 0.5 : finalRiskScore;

    return {
      isBot: finalScore > 0.7, 
      riskScore: finalScore,
      details: aiDetails,
      recaptchaScore: rScore,
      aiRiskScore: aRisk
    };
  } catch (error) {
    console.error('AI Bot Analysis Error:', error);
    return { isBot: false, riskScore: 0.1 };
  }
};

module.exports = {
  getClientIp,
  analyzeBotBehavior
};
