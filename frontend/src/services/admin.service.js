import api from './api';

export const adminService = {
  // Quản lý người dùng
  getUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },
  toggleUserStatus: async (id, data) => {
    const response = await api.put(`/admin/users/${id}/ban`, data);
    return response.data;
  },

  // Duyệt Ban Tổ Chức
  approveOrganizer: async (id, data) => {
    const response = await api.put(`/admin/users/organizer/${id}/approve`, data);
    return response.data;
  },

  // Quản lý Danh mục
  getCategories: async () => {
    const response = await api.get('/admin/categories');
    return response.data;
  },
  getCategoryById: async (id) => {
    const response = await api.get(`/admin/categories/${id}`);
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post('/admin/categories', data);
    return response.data;
  },
  updateCategory: async (id, data) => {
    const response = await api.put(`/admin/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },

  // Quản lý Sự kiện
  getEvents: async (params = {}) => {
    const response = await api.get('/admin/events', { params });
    return response.data;
  },
  getEventById: async (id) => {
    const response = await api.get(`/admin/events/${id}`);
    return response.data;
  },
  approveEvent: async (id, data) => {
    const response = await api.put(`/admin/events/${id}/approve`, data);
    return response.data;
  },
  forceCancelEvent: async (id, data) => {
    const response = await api.put(`/admin/events/${id}/force-cancel`, data);
    return response.data;
  },

  // Quản lý Sản phẩm (Merchandise)
  getMerchandise: async (params) => {
    const response = await api.get('/admin/merchandise', { params });
    return response.data;
  },
  getMerchandiseById: async (id) => {
    const response = await api.get(`/admin/merchandise/${id}`);
    return response.data;
  },
  toggleMerchandiseStatus: async (id) => {
    const response = await api.put(`/admin/merchandise/${id}/toggle`);
    return response.data;
  },
  deleteMerchandise: async (id) => {
    const response = await api.delete(`/admin/merchandise/${id}`);
    return response.data;
  },

  // Quản lý Blog
  getBlogs: async (params) => {
    const response = await api.get('/admin/blogs', { params });
    return response.data;
  },
  getBlogById: async (id) => {
    const response = await api.get(`/admin/blogs/${id}`);
    return response.data;
  },
  createBlog: async (data) => {
    const response = await api.post('/admin/blogs', data);
    return response.data;
  },
  toggleBlogStatus: async (id) => {
    const response = await api.put(`/admin/blogs/${id}/toggle`);
    return response.data;
  },
  deleteBlog: async (id) => {
    const response = await api.delete(`/admin/blogs/${id}`);
    return response.data;
  },

  // Quản lý Mã giảm giá (Coupons)
  getCoupons: async (params) => {
    const response = await api.get('/admin/coupons', { params });
    return response.data;
  },
  getCouponById: async (id) => {
    const response = await api.get(`/admin/coupons/${id}`);
    return response.data;
  },
  createCoupon: async (data) => {
    const response = await api.post('/admin/coupons', data);
    return response.data;
  },
  updateCoupon: async (id, data) => {
    const response = await api.put(`/admin/coupons/${id}`, data);
    return response.data;
  },
  toggleCouponStatus: async (id) => {
    const response = await api.patch(`/admin/coupons/${id}/toggle`);
    return response.data;
  },
  deleteCoupon: async (id) => {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  }
};
