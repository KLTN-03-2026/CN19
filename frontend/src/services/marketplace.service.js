import api from './api';

export const marketplaceService = {
    // Đăng bán lại vé
    createListing: async (ticket_id, asking_price) => {
        const response = await api.post('/marketplace', { 
            ticket_id, 
            asking_price: Number(asking_price) 
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
    }
};
