const prisma = require('../config/prisma');

// [UC_22] Quản lý sự kiện: Lấy toàn bộ các sự kiện
const getEvents = async (req, res) => {
  try {
    const { status, keyword } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (keyword) {
      whereClause.title = { contains: keyword, mode: 'insensitive' };
    }

    const [events, totalCount, pendingCount] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          organizer: { select: { organization_name: true } },
          category: { select: { name: true } }
        },
        orderBy: { event_date: 'desc' }
      }),
      prisma.event.count(),
      prisma.event.count({ 
        where: { 
          OR: [
            { status: 'pending' },
            { status: 'draft' } // Đếm cả bản nháp cần fix
          ]
        } 
      })
    ]);

    res.status(200).json({ 
      data: events,
      meta: {
        total: totalCount,
        pending: pendingCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Duyệt / Từ chối sự kiện
const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // 'approve' | 'reject'

    const newStatus = action === 'approve' ? 'active' : 'draft'; // Nếu reject thì trả về draft cho sửa
    
    await prisma.event.update({
      where: { id },
      data: { status: newStatus }
    });

    await prisma.adminActionLog.create({
      data: { admin_id: req.user.userId, action_type: `event_${action}`, target_id: id }
    });

    // TODO: Gửi Email cho BTC báo kết quả

    res.status(200).json({ message: `Đã xử lý sự kiện: ${newStatus}` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Hủy khẩn cấp sự kiện
const forceCancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; 

    await prisma.event.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    // TODO: Block việc mua bán, chuyển nhượng và tự động kích hoạt logic Hoàn tiền

    await prisma.adminActionLog.create({
      data: { admin_id: req.user.userId, action_type: `event_force_cancel`, target_id: id, new_value: reason }
    });

    res.status(200).json({ message: 'Đã hủy khẩn cấp sự kiện.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_24] Quản lý danh mục (Thêm mới)
const createCategory = async (req, res) => {
    try {
      const { name, is_active } = req.body;
      const cat = await prisma.category.create({ data: { name, is_active } });
      res.status(201).json({ message: 'Tạo danh mục thành công.', data: cat });
    } catch (error) {
        res.status(400).json({ error: 'Tên danh mục có thể đã tồn tại' });
    }
};

module.exports = {
  getEvents,
  approveEvent,
  forceCancelEvent,
  createCategory
};
