const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// [POST] /api/auth/send-register-otp
router.post('/send-register-otp', authController.sendRegisterOtp);

// [POST] /api/auth/verify-register-otp
router.post('/verify-register-otp', authController.verifyRegisterOtp);

// [POST] /api/auth/login
router.post('/login', authController.login);

// [POST] /api/auth/google
router.post('/google', authController.googleLogin);

// [POST] /api/auth/send-organizer-otp
router.post('/send-organizer-otp', authController.sendOrganizerOtp);

// [POST] /api/auth/verify-organizer-otp
router.post('/verify-organizer-otp', authController.verifyOrganizerOtp);

// [POST] /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// [POST] /api/auth/resend-otp
router.post('/resend-otp', authController.resendOtp);

module.exports = router;
