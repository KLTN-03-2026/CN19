import api from './api';

const merchandiseService = {
    // Lấy danh sách sản phẩm mua kèm của sự kiện
    getEventMerchandise: async (eventId) => {
        const response = await api.get(`/events/${eventId}/merchandise`);
        return response.data;
    }
};

export default merchandiseService;
