const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// [POST] /api/auth/register
router.post('/register', authController.register);

// [POST] /api/auth/login
router.post('/login', authController.login);

// [POST] /api/auth/register-organizer
router.post('/register-organizer', authController.registerOrganizer);

// [POST] /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// [POST] /api/auth/resend-otp
router.post('/resend-otp', authController.resendOtp);

module.exports = router;
