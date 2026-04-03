const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kyc.controller');

/**
 * @route   POST /api/kyc/ocr
 * @desc    Bóc tách thông tin thẻ ID (CMND/CCCD/Hộ chiếu)
 * @access  Public (để đăng ký)
 */
router.post('/ocr', kycController.ocrIdCard);

/**
 * @route   POST /api/kyc/verify-biometric
 * @desc    So khớp khuôn mặt & Liveness
 * @access  Public
 */
router.post('/verify-biometric', kycController.verifyBiometric);

module.exports = router;
