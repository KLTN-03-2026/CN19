import api from './api';

const paymentService = {
  /**
   * Tạo URL thanh toán VNPay
   * @param {string} orderId ID của đơn hàng
   */
  createVNPayUrl: async (orderId) => {
    const res = await api.post('/payments/create-vnpay', { orderId });
    return res.data; // { paymentUrl }
  },

  /**
   * Tạo URL thanh toán MoMo
   * @param {string} orderId ID của đơn hàng
   */
  createMoMoUrl: async (orderId) => {
    const res = await api.post('/payments/create-momo', { orderId });
    return res.data; // { paymentUrl }
  },

  /**
   * Kiểm tra trạng thái thanh toán
   */
  getPaymentStatus: async (orderId) => {
    const res = await api.get(`/payments/status/${orderId}`);
    return res.data; // { status, is_paid }
  }
};

export default paymentService;
