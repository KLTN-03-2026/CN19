const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail');

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
    const {
      title,
      category_id,
      description,
      image_url,
      video_url,
      event_date,
      event_time,
      end_date, end_time,
      location_address, latitude, longitude,
      ticket_tiers,
      seating_charts,
      allow_resale, allow_transfer, allow_refund, royalty_fee_percent, resale_price_limit_percent, refund_deadline_days,
      status
    } = req.body;

    const organizer = await prisma.organizer.findUnique({ 
      where: { user_id: userId },
      include: { user: true }
    });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    // Validate ticket tiers
    if (!ticket_tiers || !Array.isArray(ticket_tiers) || ticket_tiers.length === 0) {
      return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất một hạng vé.' });
    }

    for (const tier of ticket_tiers) {
      if (!tier.tier_name || !tier.price || tier.quantity_total === undefined || tier.quantity_total === '') {
        return res.status(400).json({ error: `Hạng vé "${tier.tier_name || 'không tên'}" thiếu thông tin giá hoặc số lượng.` });
      }
      if (isNaN(parseFloat(tier.price)) || isNaN(parseInt(tier.quantity_total))) {
        return res.status(400).json({ error: `Thông tin giá hoặc số lượng của hạng vé "${tier.tier_name}" không hợp lệ.` });
      }
    }


    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        image_url,
        video_url,
        category_id,
        organizer_id: organizer.id,
        event_date: new Date(event_date),
        event_time,
        end_date: end_date ? new Date(end_date) : null,
        end_time,
        location_address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: status || 'pending', // Mặc định là pending nếu không có status
        allow_resale: allow_resale !== undefined ? allow_resale : true,
        allow_transfer: allow_transfer !== undefined ? allow_transfer : true,
        allow_refund: allow_refund !== undefined ? allow_refund : true,
        royalty_fee_percent: royalty_fee_percent ? parseFloat(royalty_fee_percent) : 3.0,
        resale_price_limit_percent: resale_price_limit_percent ? parseFloat(resale_price_limit_percent) : 108.0,
        refund_deadline_days: refund_deadline_days ? parseInt(refund_deadline_days) : 0,
        ticket_tiers: {
          create: ticket_tiers.map(tier => ({
            tier_name: tier.tier_name,
            price: parseFloat(tier.price),
            quantity_total: parseInt(tier.quantity_total),
            quantity_available: parseInt(tier.quantity_total), // Changed from quantity_remaining to quantity_available to match original
            benefits: tier.benefits,
            section_name: tier.section_name
          }))
        },
        seating_charts: seating_charts && Array.isArray(seating_charts) ? seating_charts : []
      }
    });

    res.status(201).json({ message: 'Tạo sự kiện thành công. Đang chờ Admin phê duyệt.', data: newEvent });

    // Gửi email thông báo cho BTC (Non-blocking)
    if (status !== 'draft') {
      const emailContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #2563eb; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; text-transform: uppercase;">Xác nhận tạo sự kiện</h1>
          </div>
          <div style="padding: 30px; line-height: 1.6; color: #333;">
            <p>Chào <strong>${organizer.user.full_name || 'Ban tổ chức'}</strong>,</p>
            <p>Sự kiện <strong>"${title}"</strong> của bạn đã được gửi thành công lên hệ thống BASTICKET.</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0;">
              <p style="margin: 0; font-weight: bold; color: #1e293b;">Thông tin phê duyệt:</p>
              <p style="margin: 10px 0 0 0;">Đội ngũ kiểm duyệt của chúng tôi sẽ xem xét nội dung sự kiện của bạn. Dự kiến sự kiện sẽ được <strong>duyệt và mở bán trong vòng 24 giờ tới</strong>.</p>
            </div>
            <p>Trong thời gian chờ đợi, bạn có thể theo dõi trạng thái sự kiện tại trang Dashboard dành cho Ban tổ chức.</p>
            <div style="text-align: center; margin-top: 35px;">
              <a href="${process.env.FRONTEND_URL}/organizer/dashboard" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">ĐẾN DASHBOARD BTC</a>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
            <p>© 2026 BASTICKET System - Nền tảng bán vé sự kiện thông minh</p>
          </div>
        </div>
      `;
      
      sendEmail(
        organizer.user.email, 
        `[BASTICKET] Xác nhận nhận yêu cầu tạo sự kiện: ${title}`, 
        emailContent
      ).catch(err => console.error('Lỗi khi gửi email xác nhận sự kiện:', err));
    }
  } catch (error) {
    console.error('Lỗi tạo sự kiện (Chi tiết):', error);
    if (error.code) {
        console.error('Prisma Error Code:', error.code);
        console.error('Prisma Error Meta:', error.meta);
    }
    res.status(500).json({ error: 'Lỗi server: ' + (error.message || 'Lỗi không xác định') });
  }
};

// [UC_16] Cập nhật sự kiện (Tương tự UC_16 tạo mới but as an update)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category_id,
      description,
      image_url,
      video_url,
      event_date,
      event_time,
      end_date, end_time,
      location_address, latitude, longitude,
      ticket_tiers,
      seating_charts,
      allow_resale, allow_transfer, allow_refund, royalty_fee_percent, resale_price_limit_percent, refund_deadline_days,
      status
    } = req.body;

    const event = await verifyEventOwnership(id, req.user.userId);

    // Chỉ cho phép sửa toàn bộ nếu status là draft hoặc pending
    const isLocked = event.status === 'active' || event.status === 'ended';

    // Nếu đã active/ended, hạn chế sửa thông tin tài chính/vé quan trọng
    // Nhưng ở đây ta cứ triển khai cho các trường hợp draft/pending trước
    if (isLocked) {
      return res.status(400).json({ error: 'Không thể chỉnh sửa sự kiện đã bắt đầu bán vé hoặc đã kết thúc.' });
    }

    // Cập nhật thông tin cơ bản
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        image_url,
        video_url,
        category_id,
        event_date: event_date ? new Date(event_date) : undefined,
        event_time,
        end_date: end_date ? new Date(end_date) : null,
        end_time,
        location_address,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        status: status || event.status,
        allow_resale: allow_resale !== undefined ? allow_resale : undefined,
        allow_transfer: allow_transfer !== undefined ? allow_transfer : undefined,
        allow_refund: allow_refund !== undefined ? allow_refund : undefined,
        royalty_fee_percent: royalty_fee_percent !== undefined ? parseFloat(royalty_fee_percent) : undefined,
        resale_price_limit_percent: resale_price_limit_percent !== undefined ? parseFloat(resale_price_limit_percent) : undefined,
        refund_deadline_days: refund_deadline_days !== undefined ? parseInt(refund_deadline_days) : undefined,
        // Cập nhật hạng vé: Xóa cũ, tạo mới (Đơn giản nhất cho logic CreateEvent data)
        ticket_tiers: ticket_tiers ? {
          deleteMany: {},
          create: ticket_tiers.map(tier => ({
            tier_name: tier.tier_name,
            price: parseFloat(tier.price),
            quantity_total: parseInt(tier.quantity_total),
            quantity_available: parseInt(tier.quantity_total),
            benefits: tier.benefits,
            section_name: tier.section_name
          }))
        } : undefined,
        seating_charts: seating_charts && Array.isArray(seating_charts) ? seating_charts : undefined
      }
    });

    res.status(200).json({ message: 'Cập nhật sự kiện thành công.', data: updatedEvent });
  } catch (error) {
    console.error('Lỗi cập nhật sự kiện:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_16] Yêu cầu dời/hủy sự kiện khẩn cấp
const requestCancelOrReschedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      request_type, 
      reason, 
      new_date, 
      new_time, 
      new_end_date, 
      new_end_time, 
      evidence_url 
    } = req.body; 

    const event = await verifyEventOwnership(id, req.user.userId);

    if (event.status !== 'active') {
      return res.status(400).json({ error: 'Chỉ có thể yêu cầu xử lý khẩn cấp với sự kiện đang hoạt động.' });
    }

    const nextStatus = request_type === 'cancel' ? 'pending_cancel' : 'pending_reschedule';
    
    // Sử dụng transaction để đảm bảo cả 2 bước đều thành công hoặc thất bại
    await prisma.$transaction([
      // 1. Tạo bản ghi yêu cầu khẩn cấp chi tiết
      prisma.emergencyRequest.create({
        data: {
          event_id: id,
          request_type,
          reason,
          new_date: new_date ? new Date(new_date) : null,
          new_time: new_time || null,
          new_end_date: new_end_date ? new Date(new_end_date) : null,
          new_end_time: new_end_time || null,
          evidence_url: evidence_url || null,
          status: 'pending'
        }
      }),
      // 2. Cập nhật trạng thái sự kiện
      prisma.event.update({
        where: { id },
        data: { status: nextStatus }
      })
    ]);

    res.status(200).json({ message: 'Đã gửi yêu cầu xử lý khẩn cấp cùng minh chứng lên Admin.' });
  } catch (error) {
     console.error('Error in requestCancelOrReschedule:', error);
    res.status(400).json({ error: error.message || 'Lỗi server khi xử lý yêu cầu khẩn cấp.' });
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

// [UC_19] Xem danh sách người tham gia của MỘT sự kiện cụ thể
const getAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await verifyEventOwnership(id, userId);

    const tickets = await prisma.ticket.findMany({
      where: { event_id: id, status: 'active' },
      include: {
        current_owner: { 
          select: { 
            id: true,
            full_name: true, 
            email: true, 
            phone_number: true,
            avatar_url: true
          } 
        },
        ticket_tier: { select: { tier_name: true } },
        event: { select: { title: true } }
      },
      orderBy: { order: { created_at: 'desc' } }
    });

    res.status(200).json({ data: tickets });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_19] Xem TẤT CẢ người tham gia của Ban tổ chức
const getAllOrganizerAttendees = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const tickets = await prisma.ticket.findMany({
      where: {
        event: {
          organizer_id: organizer.id
        },
        status: 'active'
      },
      include: {
        current_owner: { 
          select: { 
            id: true,
            full_name: true, 
            email: true, 
            phone_number: true,
            avatar_url: true
          } 
        },
        ticket_tier: { select: { tier_name: true } },
        event: { select: { title: true } }
      },
      orderBy: { order: { created_at: 'desc' } }
    });

    res.status(200).json({ data: tickets });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy tất cả người tham gia: ' + error.message });
  }
};

// [UC_16] Lấy danh sách sự kiện của BTC
const getOrganizerEvents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) return res.status(403).json({ error: 'Không tìm thấy hồ sơ Ban tổ chức.' });

    const events = await prisma.event.findMany({
      where: { organizer_id: organizer.id },
      orderBy: { event_date: 'desc' },
      include: {
        category: { select: { name: true } },
        _count: {
          select: { tickets: true }
        }
      }
    });

    res.status(200).json({ data: events });
  } catch (error) {
    console.error('Lỗi lấy danh sách sự kiện:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách sự kiện.' });
  }
};

// [UC_16] Lấy chi tiết sự kiện (dành cho BTC)
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await verifyEventOwnership(id, req.user.userId);
    
    // Lấy thêm thông tin hạng vé
    const eventDetails = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        ticket_tiers: true
      }
    });

    res.status(200).json({ data: eventDetails });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_16] Xóa sự kiện (Chỉ khi là Draft hoặc Pending)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await verifyEventOwnership(id, req.user.userId);

    if (event.status !== 'draft' && event.status !== 'pending') {
      return res.status(400).json({ error: 'Chỉ có thể xóa sự kiện ở trạng thái Nháp hoặc Chờ duyệt.' });
    }

    await prisma.event.delete({ where: { id } });

    res.status(200).json({ message: 'Đã xóa sự kiện thành công.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  requestCancelOrReschedule,
  updateResalePolicy,
  getAttendees,
  getAllOrganizerAttendees,
  getOrganizerEvents,
  getEventById,
  deleteEvent
};
