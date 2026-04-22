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

  // Cập nhật bài viết
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/community/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa bài viết
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/community/posts/${postId}`);
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

  // Lấy danh sách bình luận
  getComments: async (blogId) => {
    try {
      const response = await api.get(`/blogs/${blogId}/comments`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thêm bình luận
  addComment: async (blogId, content, image_url, parent_id = null) => {
    try {
      const response = await api.post(`/community/${blogId}/comment`, { content, image_url, parent_id });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thích/Bỏ thích bình luận
  toggleCommentLike: async (commentId) => {
    try {
      const response = await api.post(`/blogs/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật bình luận
  updateComment: async (commentId, data) => {
    try {
      const response = await api.put(`/blogs/comments/${commentId}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa bình luận
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/blogs/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách người thích bài viết
  getLikers: async (blogId) => {
    try {
      const response = await api.get(`/blogs/${blogId}/likers`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách người thích bình luận
  getCommentLikers: async (commentId) => {
    try {
      const response = await api.get(`/blogs/comments/${commentId}/likers`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
