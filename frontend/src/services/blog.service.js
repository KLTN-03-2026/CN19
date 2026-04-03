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

  // Thích hoặc bỏ thích bài viết
  toggleLike: async (blogId) => {
    const res = await api.post(`/blogs/${blogId}/like`);
    return res.data;
  },

  // Thêm bình luận
  addComment: async (blogId, content) => {
    const res = await api.post(`/blogs/${blogId}/comment`, { content });
    return res.data;
  }
};

export default blogService;
