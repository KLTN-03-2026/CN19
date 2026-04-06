import api from './api';

export const communityService = {
  // Lấy News Feed
  getFeed: async (params) => {
    try {
      const response = await api.get('/community', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy sự kiện người dùng đã mua
  getMyEvents: async () => {
    try {
      const response = await api.get('/community/my-events');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo bài viết mới
  createPost: async (postData) => {
    try {
      const response = await api.post('/community/posts', postData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thích bài viết
  toggleLike: async (blogId) => {
    try {
      const response = await api.post(`/community/${blogId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thêm bình luận
  addComment: async (blogId, content) => {
    try {
      const response = await api.post(`/community/${blogId}/comment`, { content });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
