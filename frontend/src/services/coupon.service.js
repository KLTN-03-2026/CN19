import api from './api';

const couponService = {
    // Lấy danh sách mã giảm giá nổi bật/công khai
    getFeaturedCoupons: async () => {
        const response = await api.get('/coupons/featured');
        return response.data;
    }
};

export default couponService;
