const prisma = require('../config/prisma');

// Lấy toàn bộ sản phẩm trên hệ thống
const getAllProducts = async (req, res) => {
  try {
    const { status, organizerId, search } = req.query;

    const where = {};
    if (status === 'active') where.is_active = true;
    if (status === 'hidden') where.is_active = false;
    if (organizerId) where.organizer_id = organizerId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await prisma.merchandise.findMany({
      where,
      include: {
        organizer: {
          select: { id: true, organization_name: true }
        },
        event: {
          select: { id: true, title: true }
        },
        _count: {
          select: { order_items: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('getAllProducts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy danh sách sản phẩm.' });
  }
};

// Xem chi tiết sản phẩm và lịch sử đơn hàng
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.merchandise.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, organization_name: true, user: { select: { email: true } } }
        },
        event: {
          select: { id: true, title: true, event_date: true }
        },
        order_items: {
          include: {
            order: {
              select: {
                id: true,
                order_number: true,
                status: true,
                created_at: true,
                customer: {
                    select: { id: true, full_name: true, email: true }
                }
              }
            }
          },
          orderBy: { order: { created_at: 'desc' } }
        },
        _count: {
          select: { order_items: true }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
    }

    // Thống kê sơ bộ
    const totalSold = product.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = product.order_items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        ...product,
        totalSold,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('getProductById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy chi tiết sản phẩm.' });
  }
};

// Admin ẩn/hiện sản phẩm
const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.merchandise.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
    }

    const updated = await prisma.merchandise.update({
      where: { id },
      data: { is_active: !product.is_active }
    });

    res.json({
      success: true,
      message: updated.is_active ? 'Đã hiện sản phẩm.' : 'Đã ẩn sản phẩm thành công.',
      data: updated
    });
  } catch (error) {
    console.error('toggleProductStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái sản phẩm.' });
  }
};

// Admin xóa sản phẩm (chọn lọc)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.merchandise.findUnique({
      where: { id },
      include: { _count: { select: { order_items: true } } }
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
    }

    if (product._count.order_items > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm đã có giao dịch, không thể xóa. Vui lòng sử dụng tính năng ẩn sản phẩm.'
      });
    }

    await prisma.merchandise.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công.'
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa sản phẩm.' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  toggleProductStatus,
  deleteProduct
};
