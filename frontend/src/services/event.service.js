import api from './api';

const eventService = {
  // Lấy danh sách sự kiện kèm lọc
  getEvents: async (params = {}) => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  // Lấy chi tiết sự kiện
  getEventById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Lấy gợi ý sự kiện (Trending/Featured)
  getRecommendations: async () => {
    const response = await api.get('/events/recommendations');
    return response.data;
  },

  // Lấy danh sách danh mục sự kiện hoạt động
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  }
};

export default eventService;
