import api from './api';

const couponService = {
    // Áp dụng mã giảm giá
    applyCoupon: (data) => {
        return api.post('/coupons/apply', data);
    },

    getEventCoupons: (eventId) => {
        return api.get(`/coupons/event/${eventId}`);
    }
};

export default couponService;
