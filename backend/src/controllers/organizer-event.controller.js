const prisma = require('../config/prisma');

// Utils: Kiểm tra quyền sở hữu sự kiện
const verifyEventOwnership = async (eventId, userId) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { organizer: true }
  });
  if (!event || event.organizer.user_id !== userId) {
    throw new Error('Sự kiện không tồn tại hoặc bạn không có quyền quản lý sự kiện này.');
  }
  return event;
};

// [UC_16] Tạo mới sự kiện
const createEvent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, category_id, event_date, event_time, ticket_tiers } = req.body;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const newEvent = await prisma.event.create({
      data: {
        organizer_id: organizer.id,
        category_id,
        title,
        event_date: new Date(event_date),
        event_time,
        status: 'pending', // Chờ Admin duyệt
        ticket_tiers: {
          create: ticket_tiers.map(t => ({
            tier_name: t.tier_name,
            price: t.price,
            quantity_total: t.quantity_total,
            quantity_available: t.quantity_total
          }))
        }
      }
    });

    res.status(201).json({ message: 'Tạo sự kiện thành công. Đang chờ Admin phê duyệt.', data: newEvent });
  } catch (error) {
    console.error('Lỗi tạo sự kiện:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_16] Cập nhật sự kiện (Tương tự UC_16 tạo mới nhưng chỉ cho phép khi event 'draft' hoặc 'pending' hoặc khóa các field giá nếu 'active')
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, event_date, event_time } = req.body; 
    
    await verifyEventOwnership(id, req.user.userId);

    // TODO: Chỉ cho phép update giới hạn tùy thuộc vào Event Status
    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        event_date: event_date ? new Date(event_date) : undefined,
        event_time
      }
    });

    res.status(200).json({ message: 'Cập nhật sự kiện thành công.', data: event });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_16] Yêu cầu dời/hủy sự kiện khẩn cấp
const requestCancelOrReschedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { request_type, reason, new_date } = req.body; // 'cancel', 'reschedule'

    const event = await verifyEventOwnership(id, req.user.userId);

    if (event.status !== 'active') {
      return res.status(400).json({ error: 'Chỉ có thể yêu cầu xử lý khẩn cấp với sự kiện đang hoạt động.' });
    }

    const nextStatus = request_type === 'cancel' ? 'pending_cancel' : 'pending_reschedule';
    
    await prisma.event.update({
      where: { id },
      data: { 
        status: nextStatus,
        // Có thể lưu reason vào 1 bảng Report/Log mới, demo ta chỉ đổi status
      }
    });

    res.status(200).json({ message: 'Đã gửi yêu cầu xử lý khẩn cấp lên Admin.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_17] Thiết lập chính sách đăng bán vé (Resale Policy - Smart Contract)
const updateResalePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { allow_resale, price_ceiling, royalty_fee_percent } = req.body;

    const event = await verifyEventOwnership(id, req.user.userId);
    
    if (event.status === 'active') {
      return res.status(400).json({ error: 'Sự kiện đã mở bán, không thể tự chỉnh sửa chính sách tài chính lúc này.' });
    }

    await prisma.event.update({
      where: { id },
      data: {
        allow_resale,
        price_ceiling: price_ceiling ? price_ceiling : null,
        royalty_fee_percent: royalty_fee_percent ? royalty_fee_percent : 5.0
      }
    });

    res.status(200).json({ message: 'Cập nhật chính sách Marketplace thành công.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_19] Xem danh sách người tham gia
const getAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    await verifyEventOwnership(id, req.user.userId);

    const tickets = await prisma.ticket.findMany({
      where: { event_id: id, status: 'minted' }, // Đã thanh toán và đang sở hữu vé
      include: {
        current_owner: { select: { email: true, phone_number: true } },
        ticket_tier: { select: { tier_name: true } }
      }
    });

    res.status(200).json({ data: tickets });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  requestCancelOrReschedule,
  updateResalePolicy,
  getAttendees
};
