import api from './api';

const orderService = {
    // Tạo đơn hàng mua vé (Sơ cấp)
    createPrimaryOrder: async (orderData) => {
        // orderData: { event_id, items, behaviorData, captchaToken }
        const response = await api.post('/orders', orderData);
        return response.data;
    },

    // Tạo đơn hàng mua vé Marketplace (Thứ cấp)
    createMarketplaceOrder: async (listing_id, behaviorData, captchaToken) => {
        const response = await api.post('/orders/marketplace', { 
            listing_id, 
            behaviorData, 
            captchaToken 
        });
        return response.data;
    },

    // Lấy danh sách đơn hàng của tôi
    getMyOrders: async () => {
        const response = await api.get('/orders/my-orders');
        return response.data;
    },

    // Lấy chi tiết đơn hàng
    getOrderById: async (id) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    }
};

export default orderService;
