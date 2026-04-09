import api from './api';

const blogService = {
  // Lấy các bài review của một sự kiện
  getEventReviews: async (eventId) => {
    const res = await api.get(`/blogs/event/${eventId}`);
    return res.data;
  },

  // Tạo bài review mới (Yêu cầu login, có vé và sự kiện kết thúc)
  createReview: async (reviewData) => {
    const res = await api.post('/blogs/reviews', reviewData);
    return res.data;
  },

  // Lấy danh sách blog công khai
  getPublicBlogs: async (params) => {
    const res = await api.get('/blogs', { params });
    return res.data;
  },

  // Lấy chi tiết blog theo slug
  getBlogBySlug: async (slug) => {
    const res = await api.get(`/blogs/slug/${slug}`);
    return res.data;
  },

  // Thích hoặc bỏ thích bài viết
  toggleLike: async (blogId) => {
    const res = await api.post(`/blogs/${blogId}/like`);
    return res.data;
  },

  // Thêm bình luận
  addComment: async (blogId, content) => {
    const res = await api.post(`/blogs/${blogId}/comment`, { content });
    return res.data;
  },

  // Sửa bình luận chính (Review)
  updateReview: async (id, data) => {
    const res = await api.put(`/blogs/reviews/${id}`, data);
    return res.data;
  },

  // Xóa bình luận chính (Review)
  deleteReview: async (id) => {
    const res = await api.delete(`/blogs/reviews/${id}`);
    return res.data;
  },

  // Sửa phản hồi con
  updateComment: async (id, content) => {
    const res = await api.put(`/blogs/comments/${id}`, { content });
    return res.data;
  },

  // Xóa phản hồi con
  deleteComment: async (id) => {
    const res = await api.delete(`/blogs/comments/${id}`);
    return res.data;
  }
};

export default blogService;
