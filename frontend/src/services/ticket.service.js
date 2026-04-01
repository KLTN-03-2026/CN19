import api from './api';

export const ticketService = {
    // Lấy thống kê vé dành cho Ban tổ chức
    getOrganizerStats: async () => {
        const res = await api.get('/organizer/tickets/stats');
        return res.data;
    },

    // Lấy danh sách vé đã bán dành cho Ban tổ chức (có phân trang & lọc)
    getOrganizerTickets: async (params = {}) => {
        const res = await api.get('/organizer/tickets', { params });
        return res.data;
    },

    // Lấy danh sách vé của chính người dùng (Customer role)
    getMyTickets: async () => {
        const res = await api.get('/tickets');
        return res.data;
    },

    // Lấy chi tiết 1 vé
    getTicketById: async (id) => {
        const res = await api.get(`/tickets/${id}`);
        return res.data;
    },

    // Lấy mã QR động cho vé
    getQrCode: async (ticketId) => {
        const res = await api.get(`/tickets/${ticketId}/qr-code`);
        return res.data;
    },

    // Chuyển nhượng vé
    transferTicket: async (ticketId, receiverEmail) => {
        const res = await api.post(`/tickets/${ticketId}/transfer`, { receiver_email: receiverEmail });
        return res.data;
    },

    // Lấy thông tin Blockchain (txHash, tokenId)
    getBlockchainInfo: async (ticketId) => {
        const res = await api.get(`/tickets/${ticketId}/blockchain`);
        return res.data;
    }
};
