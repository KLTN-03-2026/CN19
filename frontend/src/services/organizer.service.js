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
  }
};
