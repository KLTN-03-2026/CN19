const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const adminCouponController = {
  // Lấy danh sách toàn bộ mã giảm giá
  getAllCoupons: async (req, res) => {
    try {
      const { search, status } = req.query;
      
      const where = {};
      if (search) {
        where.code = { contains: search, mode: 'insensitive' };
      }
      
      if (status === 'active') {
        where.is_active = true;
        where.end_date = { gte: new Date() };
      } else if (status === 'expired') {
        where.end_date = { lt: new Date() };
      } else if (status === 'inactive') {
        where.is_active = false;
      }

      const coupons = await prisma.coupon.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: { orders: true }
          }
        }
      });

      res.json({ success: true, data: coupons });
    } catch (error) {
      console.error('getAllCoupons error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy danh sách mã giảm giá.' });
    }
  },

  // Lấy chi tiết mã giảm giá
  getCouponById: async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await prisma.coupon.findUnique({
        where: { id },
        include: {
          orders: {
            take: 10,
            orderBy: { created_at: 'desc' },
            include: {
              customer: { select: { full_name: true, email: true } }
            }
          }
        }
      });

      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error('getCouponById error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
    }
  },

  // Tạo mã giảm giá mới
  createCoupon: async (req, res) => {
    try {
      const { 
        code, description, discount_type, discount_value, 
        min_order_amount, max_discount_amount, usage_limit, 
        start_date, end_date 
      } = req.body;

      if (!code || !discount_type || !discount_value || !start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' });
      }

      // Kiểm tra code trùng
      const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Mã giảm giá này đã tồn tại.' });
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          description,
          discount_type,
          discount_value: parseFloat(discount_value),
          min_order_amount: min_order_amount ? parseFloat(min_order_amount) : null,
          max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
          usage_limit: usage_limit ? parseInt(usage_limit) : null,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          is_active: true
        }
      });

      res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công!', data: coupon });
    } catch (error) {
      console.error('createCoupon error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo mã giảm giá.' });
    }
  },

  // Cập nhật mã giảm giá
  updateCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        description, discount_type, discount_value, 
        min_order_amount, max_discount_amount, usage_limit, 
        start_date, end_date, is_active 
      } = req.body;

      const coupon = await prisma.coupon.findUnique({ where: { id } });
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
      }

      const updated = await prisma.coupon.update({
        where: { id },
        data: {
          description,
          discount_type,
          discount_value: discount_value ? parseFloat(discount_value) : undefined,
          min_order_amount: min_order_amount !== undefined ? (min_order_amount ? parseFloat(min_order_amount) : null) : undefined,
          max_discount_amount: max_discount_amount !== undefined ? (max_discount_amount ? parseFloat(max_discount_amount) : null) : undefined,
          usage_limit: usage_limit !== undefined ? (usage_limit ? parseInt(usage_limit) : null) : undefined,
          start_date: start_date ? new Date(start_date) : undefined,
          end_date: end_date ? new Date(end_date) : undefined,
          is_active
        }
      });

      res.json({ success: true, message: 'Cập nhật thành công!', data: updated });
    } catch (error) {
      console.error('updateCoupon error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật mã giảm giá.' });
    }
  },

  // Bật/tắt trạng thái mã giảm giá
  toggleCouponStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await prisma.coupon.findUnique({ where: { id } });
      
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
      }

      const updated = await prisma.coupon.update({
        where: { id },
        data: { is_active: !coupon.is_active }
      });

      res.json({ 
        success: true, 
        message: updated.is_active ? 'Đã kích hoạt mã.' : 'Đã tạm dừng mã.',
        data: updated 
      });
    } catch (error) {
      console.error('toggleCouponStatus error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
    }
  },

  // Xóa mã giảm giá
  deleteCoupon: async (req, res) => {
    try {
      const { id } = req.params;
      
      const coupon = await prisma.coupon.findUnique({ 
        where: { id },
        include: { _count: { select: { orders: true } } }
      });

      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại.' });
      }

      if (coupon._count.orders > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không thể xóa mã giảm giá đã được sử dụng. Hãy tạm dừng mã này thay thế.' 
        });
      }

      await prisma.coupon.delete({ where: { id } });
      res.json({ success: true, message: 'Đã xóa mã giảm giá thành công.' });
    } catch (error) {
      console.error('deleteCoupon error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi xóa mã giảm giá.' });
    }
  }
};

module.exports = adminCouponController;
