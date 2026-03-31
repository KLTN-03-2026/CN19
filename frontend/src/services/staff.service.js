import api from './api';

export const staffService = {
  /**
   * Lấy danh sách nhân viên của Organizer hiện tại
   * Trả về: { data: [ { id, staff: { email, phone_number, status }, event: { title } } ] }
   */
  getStaffs: async () => {
    const res = await api.get('/organizer/staffs');
    return res.data;
  },

  /**
   * Thêm mới tài khoàn nhân viên và gán vào sự kiện
   * @param {Object} data - { email, phone_number, password, event_id }
   */
  createStaff: async (data) => {
    const res = await api.post('/organizer/staffs', data);
    return res.data;
  },

  /**
   * Cập nhật thông tin nhân viên
   */
  updateStaff: async (id, data) => {
    const res = await api.put(`/organizer/staffs/${id}`, data);
    return res.data;
  },

  /**
   * Lấy chi tiết nhân viên
   */
  getStaffDetail: async (id) => {
    const res = await api.get(`/organizer/staffs/${id}`);
    return res.data;
  },

  /**
   * Khóa/Mở khóa tài khoản nhân viên (Toggle status)
   * @param {string} id - Staff User ID
   */
  lockStaff: async (id) => {
    const res = await api.put(`/organizer/staffs/${id}/lock`);
    return res.data;
  }
};
