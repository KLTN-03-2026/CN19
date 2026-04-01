const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Các route bên dưới yêu cầu phải đăng nhập
router.use(authenticate);

// [GET] /api/users/profile
router.get('/profile', userController.getProfile);

// [GET] /api/users/find-by-email
router.get('/find-by-email', userController.findByEmail);

// [PUT] /api/users/profile
router.put('/profile', userController.updateProfile);

// [PUT] /api/users/change-password
router.put('/change-password', userController.changePassword);

// [POST] /api/users/link-external-wallet
router.post('/link-external-wallet', userController.linkExternalWallet);

// [GET] /api/users/wallet-balance
router.get('/wallet-balance', userController.getWalletBalance);

module.exports = router;
