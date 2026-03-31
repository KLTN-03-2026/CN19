import api from './api';

export const organizerService = {
  // Lấy danh sách danh mục (dùng cho dropdown)
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },

  // Tạo sự kiện mới
  createEvent: async (eventData) => {
    const res = await api.post('/organizer/events', eventData);
    return res.data;
  },

  // Lấy danh sách sự kiện của tôi
  getMyEvents: async () => {
    const res = await api.get('/organizer/events');
    return res.data;
  },

  // Lấy chi tiết sự kiện
  getEventById: async (id) => {
    const res = await api.get(`/organizer/events/${id}`);
    return res.data;
  },

  // Cập nhật sự kiện
  updateEvent: async (id, eventData) => {
    const res = await api.put(`/organizer/events/${id}`, eventData);
    return res.data;
  },

  // Yêu cầu xử lý khẩn cấp (Hủy/Dời lịch)
  requestEmergencyAction: async (id, data) => {
    const res = await api.post(`/organizer/events/${id}/emergency`, data);
    return res.data;
  },

  // Xóa sự kiện
  deleteEvent: async (id) => {
    const res = await api.delete(`/organizer/events/${id}`);
    return res.data;
  },

  // [NEW] Lấy thông tin công khai của Ban tổ chức (dành cho khách hàng)
  getPublicProfile: async (id) => {
    const res = await api.get(`/organizers/${id}`);
    return res.data;
  }
};
