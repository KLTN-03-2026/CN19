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
  },

  // ======= Merchandise =======
  getMerchandise: async () => {
    const res = await api.get('/organizer/merchandise');
    return res.data;
  },

  getMerchandiseById: async (id) => {
    const res = await api.get(`/organizer/merchandise/${id}`);
    return res.data;
  },

  createMerchandise: async (data) => {
    const res = await api.post('/organizer/merchandise', data);
    return res.data;
  },

  updateMerchandise: async (id, data) => {
    const res = await api.put(`/organizer/merchandise/${id}`, data);
    return res.data;
  },

  deleteMerchandise: async (id) => {
    const res = await api.delete(`/organizer/merchandise/${id}`);
    return res.data;
  },

  toggleMerchandise: async (id) => {
    const res = await api.patch(`/organizer/merchandise/${id}/toggle`);
    return res.data;
  },

  // ======= Blog =======
  getMyBlogs: async () => {
    const res = await api.get('/organizer/blogs');
    return res.data;
  },

  getBlogById: async (id) => {
    const res = await api.get(`/organizer/blogs/${id}`);
    return res.data;
  },

  createBlog: async (data) => {
    const res = await api.post('/organizer/blogs', data);
    return res.data;
  },

  updateBlog: async (id, data) => {
    const res = await api.put(`/organizer/blogs/${id}`, data);
    return res.data;
  },

  deleteBlog: async (id) => {
    const res = await api.delete(`/organizer/blogs/${id}`);
    return res.data;
  },

  getCustomerReviews: async () => {
    const res = await api.get('/organizer/blogs/all-customer-reviews');
    return res.data;
  },

  moderateBlog: async (id, status) => {
    const res = await api.patch(`/organizer/blogs/${id}/moderate`, { status });
    return res.data;
  }
};
