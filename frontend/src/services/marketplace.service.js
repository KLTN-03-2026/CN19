import api from './api';

export const marketplaceService = {
    // Đăng bán lại vé
    createListing: async (ticket_id, asking_price, merchandise_item_ids = []) => {
        const response = await api.post('/marketplace', { 
            ticket_id, 
            asking_price: Number(asking_price),
            merchandise_item_ids
        });
        return response.data;
    },

    // Lấy danh sách đang bán (công khai)
    getListings: async (params) => {
        const response = await api.get('/marketplace', { params });
        return response.data;
    },

    // Hủy đăng bán
    deleteListing: async (listingId) => {
        const response = await api.delete(`/marketplace/${listingId}`);
        return response.data;
    },

    // Cập nhật bài đăng
    updateListing: async (listingId, asking_price, merchandise_item_ids = []) => {
        const response = await api.put(`/marketplace/${listingId}`, { 
            asking_price: Number(asking_price), 
            merchandise_item_ids 
        });
        return response.data;
    }
};
