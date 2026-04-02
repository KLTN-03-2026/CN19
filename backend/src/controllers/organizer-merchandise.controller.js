const prisma = require('../config/prisma');

// Lấy danh sách sản phẩm của BTC
const getAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const merchandise = await prisma.merchandise.findMany({
      where: { organizer_id: organizer.id },
      include: {
        event: { select: { id: true, title: true, image_url: true } },
        _count: { select: { order_items: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ data: merchandise });
  } catch (error) {
    console.error('getMerchandise error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
};

// Tạo sản phẩm mới
const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, price, stock, image_url, event_id, is_active } = req.body;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    if (!name || !price) {
      return res.status(400).json({ error: 'Tên sản phẩm và giá bán là bắt buộc.' });
    }

    if (parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Giá sản phẩm phải lớn hơn 0.' });
    }

    // Nếu gắn sự kiện, verify quyền sở hữu
    if (event_id) {
      const event = await prisma.event.findUnique({
        where: { id: event_id },
        include: { organizer: true }
      });
      if (!event || event.organizer.user_id !== userId) {
        return res.status(403).json({ error: 'Sự kiện không thuộc quyền quản lý của bạn.' });
      }
    }

    const merchandise = await prisma.merchandise.create({
      data: {
        organizer_id: organizer.id,
        event_id: event_id || null,
        name,
        description: description || null,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        image_url: image_url || null,
        is_active: is_active !== undefined ? is_active : true
      },
      include: {
        event: { select: { id: true, title: true } }
      }
    });

    res.status(201).json({ data: merchandise, message: 'Tạo sản phẩm thành công.' });
  } catch (error) {
    console.error('createMerchandise error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
};

// Cập nhật sản phẩm
const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, description, price, stock, image_url, event_id, is_active } = req.body;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const existing = await prisma.merchandise.findUnique({ where: { id } });
    if (!existing || existing.organizer_id !== organizer.id) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc bạn không có quyền.' });
    }

    // Nếu đổi sự kiện, verify quyền sở hữu
    if (event_id) {
      const event = await prisma.event.findUnique({
        where: { id: event_id },
        include: { organizer: true }
      });
      if (!event || event.organizer.user_id !== userId) {
        return res.status(403).json({ error: 'Sự kiện không thuộc quyền quản lý của bạn.' });
      }
    }

    const updated = await prisma.merchandise.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        price: price ? parseFloat(price) : existing.price,
        stock: stock !== undefined ? parseInt(stock) : existing.stock,
        image_url: image_url !== undefined ? image_url : existing.image_url,
        event_id: event_id !== undefined ? (event_id || null) : existing.event_id,
        is_active: is_active !== undefined ? is_active : existing.is_active
      },
      include: {
        event: { select: { id: true, title: true } }
      }
    });

    res.json({ data: updated, message: 'Cập nhật sản phẩm thành công.' });
  } catch (error) {
    console.error('updateMerchandise error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
};

// Xóa sản phẩm
const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const existing = await prisma.merchandise.findUnique({
      where: { id },
      include: { _count: { select: { order_items: true } } }
    });

    if (!existing || existing.organizer_id !== organizer.id) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc bạn không có quyền.' });
    }

    if (existing._count.order_items > 0) {
      return res.status(400).json({ error: 'Không thể xóa sản phẩm đã có đơn hàng. Hãy tắt bán thay vì xóa.' });
    }

    await prisma.merchandise.delete({ where: { id } });
    res.json({ message: 'Đã xóa sản phẩm thành công.' });
  } catch (error) {
    console.error('removeMerchandise error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
};

// Toggle bật/tắt bán
const toggle = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const existing = await prisma.merchandise.findUnique({ where: { id } });
    if (!existing || existing.organizer_id !== organizer.id) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc bạn không có quyền.' });
    }

    const updated = await prisma.merchandise.update({
      where: { id },
      data: { is_active: !existing.is_active }
    });

    res.json({ data: updated, message: updated.is_active ? 'Đã bật bán sản phẩm.' : 'Đã tắt bán sản phẩm.' });
  } catch (error) {
    console.error('toggleMerchandise error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
};

// Lấy chi tiết sản phẩm + lịch sử đơn hàng
const getById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const merchandise = await prisma.merchandise.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true, image_url: true, event_date: true } },
        order_items: {
          include: {
            order: {
              select: {
                id: true,
                order_number: true,
                status: true,
                created_at: true,
                customer: {
                  select: { id: true, full_name: true, email: true, avatar_url: true }
                }
              }
            }
          },
          orderBy: { order: { created_at: 'desc' } }
        },
        _count: { select: { order_items: true } }
      }
    });

    if (!merchandise || merchandise.organizer_id !== organizer.id) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc bạn không có quyền.' });
    }

    // Tính tổng doanh thu và số lượng đã bán
    const totalSold = merchandise.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = merchandise.order_items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    res.json({
      data: {
        ...merchandise,
        totalSold,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('getMerchandiseById error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống.' });
  }
};

module.exports = { getAll, getById, create, update, remove, toggle };
