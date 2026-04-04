const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin-coupon.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Áp dụng middleware authenticate và authorize quyền admin cho tất cả các route bên dưới
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', controller.getAllCoupons);
router.get('/:id', controller.getCouponById);
router.post('/', controller.createCoupon);
router.put('/:id', controller.updateCoupon);
router.patch('/:id/toggle', controller.toggleCouponStatus);
router.delete('/:id', controller.deleteCoupon);

module.exports = router;
