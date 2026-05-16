const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail');
const { getSystemConfig } = require('../utils/systemConfig');
const NotificationService = require('../services/notification.service');

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

    // Validate Dates: Ngày diễn ra và Ngày kết thúc là bắt buộc
    if (!event_date || !end_date) {
      return res.status(400).json({ error: 'Ngày diễn ra và ngày kết thúc sự kiện là bắt buộc.' });
    }
    const startObj = new Date(event_date);
    const endObj = new Date(end_date);
    startObj.setHours(0, 0, 0, 0);
    endObj.setHours(0, 0, 0, 0);

    if (startObj > endObj) {
      return res.status(400).json({ error: 'Ngày kết thúc không được trước ngày diễn ra sự kiện.' });
    } else if (startObj.getTime() === endObj.getTime()) {
      if (event_time && end_time) {
        const [startH, startM] = event_time.split(':').map(Number);
        const [endH, endM] = end_time.split(':').map(Number);
        if (startH * 60 + startM >= endH * 60 + endM) {
          return res.status(400).json({ error: 'Nếu cùng một ngày, giờ kết thúc phải lớn hơn giờ bắt đầu.' });
        }
      }
    }

    // Validate Future Date
    const selectedEventDate = new Date(`${event_date}T${event_time || '00:00'}`);
    if (selectedEventDate <= new Date()) {
      return res.status(400).json({ error: 'Ngày và giờ diễn ra sự kiện phải ở tương lai.' });
    }

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

    // Lấy cấu hình hệ thống để gán phí mặc định và làm mức chặn (Cap)
    const sysConfig = await getSystemConfig();

    const maxRoyaltyCap = parseFloat(sysConfig.default_royalty_percent || 3.0);
    const resalePriceCapMargin = Number(sysConfig.resale_price_cap_percent || 8);
    const maxResaleLimitPercent = 100 + resalePriceCapMargin;

    // Validate Resale & Royalty theo mức chặn của Hệ thống
    if (allow_resale) {
      const inputResaleLimit = resale_price_limit_percent ? parseFloat(resale_price_limit_percent) : maxResaleLimitPercent;
      const inputRoyaltyFee = royalty_fee_percent ? parseFloat(royalty_fee_percent) : maxRoyaltyCap;

      if (inputResaleLimit > maxResaleLimitPercent) {
        return res.status(400).json({ error: `Giới hạn giá bán lại tối đa không được vượt quá ${maxResaleLimitPercent}% theo quy định hệ thống.` });
      }
      if (inputRoyaltyFee > maxRoyaltyCap) {
        return res.status(400).json({ error: `Phí bản quyền không được vượt quá mức tối đa ${maxRoyaltyCap}% của hệ thống.` });
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
        end_date: new Date(end_date),
        end_time,
        location_address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: status || 'pending', 
        allow_resale: allow_resale !== undefined ? allow_resale : true,
        allow_transfer: allow_transfer !== undefined ? allow_transfer : true,
        allow_refund: allow_refund !== undefined ? allow_refund : true,
        
        // Chốt cứng các loại phí tại thời điểm tạo
        royalty_fee_percent: royalty_fee_percent ? parseFloat(royalty_fee_percent) : maxRoyaltyCap,
        resale_price_limit_percent: resale_price_limit_percent ? parseFloat(resale_price_limit_percent) : maxResaleLimitPercent,
        resale_platform_fee_percent: parseFloat(sysConfig.resale_transaction_fee_percent || 1.0),
        resale_gas_fee: parseFloat(sysConfig.system_gas_fee || 10000.0),
        platform_fee_percent: parseFloat(sysConfig.event_platform_fee_percent || 5.0),
        commission_fee_percent: parseFloat(sysConfig.event_transaction_fee_percent || 3.0),
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

    // 2. Thông báo cho Admin (Non-blocking)
    if (newEvent.status === 'pending') {
      NotificationService.notifyAdmins({
        type: 'NEW_EVENT_REQUEST',
        title: 'Yêu cầu duyệt sự kiện mới',
        message: `BTC "${organizer.organization_name}" vừa gửi yêu cầu duyệt sự kiện "${title}".`,
        target_id: newEvent.id
      });
    }

    // 3. Gửi email thông báo cho BTC (Non-blocking)
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

    // [Mới] Chỉ chặn hoàn toàn nếu sự kiện đã kết thúc. 
    // Nếu đang active, ta cho phép đi tiếp nhưng sẽ lọc trường ở bước update bên dưới.
    if (event.status === 'ended') {
      return res.status(400).json({ error: 'Không thể chỉnh sửa sự kiện đã kết thúc.' });
    }
    const isActive = event.status === 'active';

    // Với sự kiện đang active, bỏ qua toàn bộ validation về ngày, giá, phí
    // vì những trường này đã bị khóa và sẽ không được cập nhật
    if (!isActive) {
      // Validate Dates: Ngày diễn ra và Ngày kết thúc là bắt buộc
      if (!event_date || !end_date) {
        return res.status(400).json({ error: 'Ngày diễn ra và ngày kết thúc sự kiện là bắt buộc.' });
      }
      const startObj = new Date(event_date);
      const endObj = new Date(end_date);
      startObj.setHours(0, 0, 0, 0);
      endObj.setHours(0, 0, 0, 0);

      if (startObj > endObj) {
        return res.status(400).json({ error: 'Ngày kết thúc không được trước ngày diễn ra sự kiện.' });
      } else if (startObj.getTime() === endObj.getTime()) {
        if (event_time && end_time) {
          const [startH, startM] = event_time.split(':').map(Number);
          const [endH, endM] = end_time.split(':').map(Number);
          if (startH * 60 + startM >= endH * 60 + endM) {
            return res.status(400).json({ error: 'Nếu cùng một ngày, giờ kết thúc phải lớn hơn giờ bắt đầu.' });
          }
        }
      }

      // Validate Resale & Royalty
      if (allow_resale !== false) {
        const sysConfig = await getSystemConfig();
        const maxResaleLimitPercent = 100 + Number(sysConfig.resale_price_cap_percent || 8);
        const maxRoyaltyCap = parseFloat(sysConfig.default_royalty_percent || 3.0);
        
        if (resale_price_limit_percent && parseFloat(resale_price_limit_percent) > maxResaleLimitPercent) {
          return res.status(400).json({ error: `Giới hạn giá bán lại tối đa không được vượt quá ${maxResaleLimitPercent}% theo quy định hệ thống.` });
        }
        if (royalty_fee_percent && parseFloat(royalty_fee_percent) > maxRoyaltyCap) {
          return res.status(400).json({ error: `Phí bản quyền không được vượt quá mức tối đa ${maxRoyaltyCap}% của hệ thống.` });
        }
      }
    }

    // Cập nhật thông tin cơ bản
    // [Mới] Xây dựng object update linh hoạt dựa trên trạng thái active
    const updateData = {
      title: !isActive ? title : undefined,
      category_id: !isActive ? category_id : undefined,
      description, // Luôn cho phép sửa
      image_url,   // Luôn cho phép sửa
      video_url,   // Luôn cho phép sửa
      event_date: !isActive ? (event_date ? new Date(event_date) : undefined) : undefined,
      event_time: !isActive ? event_time : undefined,
      end_date: !isActive ? (end_date ? new Date(end_date) : undefined) : undefined,
      end_time: !isActive ? end_time : undefined,
      location_address: !isActive ? location_address : undefined,
      latitude: !isActive ? (latitude ? parseFloat(latitude) : undefined) : undefined,
      longitude: !isActive ? (longitude ? parseFloat(longitude) : undefined) : undefined,
      status: (() => {
        // Nếu sự kiện đang active, không cho phép hạ cấp về draft/pending
        if (isActive && (status === 'draft' || status === 'pending')) {
          return undefined; // Giữ nguyên status cũ
        }
        return status || event.status;
      })(),
      allow_resale: !isActive ? (allow_resale !== undefined ? allow_resale : undefined) : undefined,
      allow_transfer: !isActive ? (allow_transfer !== undefined ? allow_transfer : undefined) : undefined,
      allow_refund: allow_refund !== undefined ? allow_refund : undefined,
      royalty_fee_percent: !isActive ? (royalty_fee_percent !== undefined ? parseFloat(royalty_fee_percent) : undefined) : undefined,
      resale_price_limit_percent: !isActive ? (resale_price_limit_percent !== undefined ? parseFloat(resale_price_limit_percent) : undefined) : undefined,
      refund_deadline_days: refund_deadline_days !== undefined ? parseInt(refund_deadline_days) : undefined,
      seating_charts: seating_charts && Array.isArray(seating_charts) ? seating_charts : undefined,
      // Hạng vé: Tuyệt đối không xóa/sửa khi đã active
      ticket_tiers: (!isActive && ticket_tiers) ? {
        deleteMany: {},
        create: ticket_tiers.map(tier => ({
          tier_name: tier.tier_name,
          price: parseFloat(tier.price),
          quantity_total: parseInt(tier.quantity_total),
          quantity_available: parseInt(tier.quantity_total),
          benefits: tier.benefits,
          section_name: tier.section_name
        }))
      } : undefined
    };

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData
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
      evidence_urls 
    } = req.body; 

    const event = await verifyEventOwnership(id, req.user.userId);

    if (!['active', 'pending_cancel', 'pending_reschedule'].includes(event.status)) {
      return res.status(400).json({ error: 'Chỉ có thể yêu cầu xử lý khẩn cấp với sự kiện đang hoạt động hoặc đang chờ xử lý khẩn cấp.' });
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
          evidence_urls: evidence_urls || [],
          status: 'pending'
        }
      }),
      // 2. Cập nhật trạng thái sự kiện
      prisma.event.update({
        where: { id },
        data: { status: nextStatus }
      })
    ]);

    // 3. Thông báo cho Admin
    try {
      await NotificationService.notifyAdmins({
        type: 'EMERGENCY_REQUEST',
        title: 'Yêu cầu xử lý khẩn cấp',
        message: `BTC sự kiện "${event.title}" vừa gửi yêu cầu ${request_type === 'cancel' ? 'hủy' : 'dời ngày'} khẩn cấp.`,
        target_id: id
      });
    } catch (notifErr) {
      console.error('[Emergency Request] Failed to notify admins:', notifErr);
    }

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
    const { allow_resale, price_ceiling, royalty_fee_percent, resale_price_limit_percent } = req.body;

    const event = await verifyEventOwnership(id, req.user.userId);
    
    if (event.status === 'active') {
      return res.status(400).json({ error: 'Sự kiện đã mở bán, không thể tự chỉnh sửa chính sách tài chính lúc này.' });
    }

    await prisma.event.update({
      where: { id },
      data: {
        allow_resale,
        price_ceiling: price_ceiling ? price_ceiling : null,
        royalty_fee_percent: royalty_fee_percent ? royalty_fee_percent : 5.0,
        resale_price_limit_percent: resale_price_limit_percent ? resale_price_limit_percent : 108.0
      }
    });

    res.status(200).json({ message: 'Cập nhật chính sách Marketplace thành công.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [NEW] Cập nhật chính sách chuyển nhượng vé (Transfer Policy)
const updateTransferPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { allow_transfer } = req.body;

    const event = await verifyEventOwnership(id, req.user.userId);
    
    // Transfer có thể được bật/tắt mọi lúc hoặc chỉ khi chưa diễn ra? 
    // Tạm thời cho phép cập nhật khi event chưa kết thúc.
    if (event.status === 'ended') {
      return res.status(400).json({ error: 'Sự kiện đã kết thúc, không thể cấu hình chuyển nhượng.' });
    }

    await prisma.event.update({
      where: { id },
      data: { allow_transfer }
    });

    res.status(200).json({ message: 'Cập nhật trạng thái Chuyển nhượng vé thành công.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_19] Xem danh sách người tham gia/người sở hữu của MỘT sự kiện cụ thể
const getAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const { tier_id, is_checked_in } = req.query;
    const userId = req.user.userId;

    await verifyEventOwnership(id, userId);

    const where = { 
      event_id: id, 
      status: { in: ['valid', 'minted', 'used', 'active'] } 
    };

    if (tier_id && tier_id !== 'all') {
      where.ticket_tier_id = tier_id;
    }

    if (is_checked_in === 'true') {
      where.is_used = true;
    }

    const tickets = await prisma.ticket.findMany({
      where,
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
        order: true,
        ticket_tier: { select: { tier_name: true } },
        event: { select: { title: true } },
        scan_history: {
          where: { is_success: true },
          take: 1,
          orderBy: { scanned_at: 'desc' },
          include: { staff: { select: { full_name: true, email: true } } }
        }
      },
      orderBy: { 
        checked_in_at: 'desc' 
      }
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
        status: { in: ['valid', 'minted', 'used', 'active'] }
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
        event: { select: { title: true } },
        scan_history: {
          where: { is_success: true },
          take: 1,
          orderBy: { scanned_at: 'desc' },
          include: { staff: { select: { full_name: true, email: true } } }
        }
      },
      orderBy: { order: { created_at: 'desc' } }
    });

    res.status(200).json({ data: tickets });
  } catch (error) {
    console.error('Lỗi lấy tất cả người tham gia (Chi tiết):', error);
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
        ticket_tiers: {
          include: {
            _count: {
              select: { tickets: { where: { status: { in: ['valid', 'minted', 'used'] } } } }
            }
          }
        },
        _count: {
          select: { tickets: { where: { status: { in: ['valid', 'minted', 'used'] } } } }
        },
        emergency_requests: {
          where: { status: 'pending' },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    // Remap to match expected frontend structure if needed, 
    // but the frontend calculation total - available is problematic if stock is desynced.
    // We'll provide the count directly.
    const mappedEvents = events.map(event => ({
      ...event,
      total_sold: event._count.tickets
    }));

    res.status(200).json({ data: mappedEvents });
  } catch (error) {
    console.error('Lỗi lấy danh sách sự kiện (Chi tiết):', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách sự kiện: ' + error.message });
  }
};

// [UC_16] Lấy chi tiết sự kiện (dành cho BTC) - ĐÃ NÂNG CẤP (Dashboard-ready)
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await verifyEventOwnership(id, req.user.userId);
    
    // 1. Fetch event with rich inclusions
    const eventDetails = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        ticket_tiers: {
          include: {
            _count: {
              select: { tickets: { where: { status: { in: ['valid', 'minted', 'used'] } } } }
            }
          }
        },
        merchandise: {
          orderBy: { created_at: 'desc' },
          include: {
            _count: { select: { order_items: true } }
          }
        },
        blogs: {
          orderBy: { created_at: 'desc' },
          include: {
            author: { select: { full_name: true, avatar_url: true } }
          }
        },
        _count: {
          select: {
            orders: { where: { status: { in: ['paid', 'success', 'completed'] } } },
            tickets: { where: { status: { in: ['valid', 'minted', 'used'] } } },
            marketplace_listings: true
          }
        },
        emergency_requests: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    // 2. Counts
    const soldCount = eventDetails._count.tickets;
    const checkInCount = await prisma.ticket.count({
      where: { event_id: id, is_used: true }
    });

    // 3. Fetch Successful Orders (Primary & Transfer) for Financials
    const successfulOrders = await prisma.order.findMany({
      where: { 
        event_id: id,
        status: { in: ['paid', 'success', 'completed'] }
      },
      include: {
        items: true,
        merchandise_items: true
      }
    });

    // 4. Calculate Financials (Primary Market)
    let primaryTicketRevenue = 0;
    let primaryMerchRevenue = 0;
    let primaryTotalFees = 0;
    let transferFeeTotal = 0;

    successfulOrders.forEach(order => {
      const subtotal = Number(order.subtotal || 0);
      const platFee = Number(order.platform_fee || 0);
      const commFee = Number(order.commission_fee || 0);
      const gasFee = Number(order.gas_fee || 0);

      if (order.order_type === 'TICKET_PURCHASE') {
        primaryTicketRevenue += order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
        primaryMerchRevenue += order.merchandise_items.reduce((sum, item) => sum + Number(item.subtotal), 0);
        
        // Accumulate all fees deducted from organizer for the primary market
        primaryTotalFees += (platFee + commFee + gasFee);
      } else if (order.order_type === 'TICKET_TRANSFER') {
        // Transfer fees are paid by users and don't affect organizer revenue
        transferFeeTotal += (platFee + commFee + gasFee);
      }
    });

    // 5. Calculate Marketplace (Secondary Market)
    const marketplaceTransactions = await prisma.marketplaceTransaction.findMany({
      where: { 
        ticket: { event_id: id },
        status: { in: ['paid', 'completed', 'success'] }
      }
    });

    let resaleVolume = 0;
    let resaleRoyalties = 0;
    marketplaceTransactions.forEach(tx => {
      const amount = Number(tx.buyer_pay_amount);
      resaleVolume += amount;
      resaleRoyalties += Number(tx.organizer_royalty || 0);
    });

    // 6. Summary Totals
    let total_gross_revenue = primaryTicketRevenue + primaryMerchRevenue + resaleVolume;
    let estimated_net_revenue = (primaryTicketRevenue + primaryMerchRevenue - primaryTotalFees) + resaleRoyalties;

    if (['cancelled', 'pending_cancellation_fee'].includes(eventDetails.status)) {
        primaryTicketRevenue = 0;
        primaryMerchRevenue = 0;
        resaleVolume = 0;
        resaleRoyalties = 0;
        primaryTotalFees = 0;
        total_gross_revenue = 0;
        estimated_net_revenue = 0;
    }

    // 7. Recent Orders List
    const recentOrdersRaw = await prisma.order.findMany({
      where: { 
        event_id: id,
        order_type: 'TICKET_PURCHASE'
      },
      take: 200,
      orderBy: { created_at: 'desc' },
      include: {
        customer: { select: { full_name: true, email: true, avatar_url: true } },
        items: true,
        merchandise_items: true
      }
    });

    const recentOrders = recentOrdersRaw.map(order => {
      const ticketSub = order.items.reduce((s, i) => s + Number(i.subtotal), 0);
      const ticketCount = order.items.reduce((s, i) => s + i.quantity, 0);
      const merchSub = order.merchandise_items.reduce((s, i) => s + Number(i.subtotal), 0);
      const merchCount = order.merchandise_items.reduce((s, i) => s + i.quantity, 0);
      
      const net_revenue = Number(order.organizer_revenue || (Number(order.total_amount) - Number(order.platform_fee || 0)));

      return {
        ...order,
        net_revenue: Math.round(net_revenue),
        ticket_count: ticketCount,
        merch_count: merchCount
      };
    });

    // 8. Statistics for Charts
    const generateTimeline = (days) => {
      return [...Array(days)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const dateStr = d.toISOString().split('T')[0];
        
        const dayOrders = successfulOrders.filter(o => 
          o.created_at.toISOString().split('T')[0] === dateStr && 
          o.order_type === 'TICKET_PURCHASE'
        );
        const daySecondary = marketplaceTransactions.filter(t => t.created_at.toISOString().split('T')[0] === dateStr);

        // Calculate Net Revenue for the day
        let tNet = 0;
        dayOrders.forEach(order => {
            tNet += Number(order.organizer_revenue || 0);
        });

        const rRoyalties = daySecondary.reduce((sum, t) => sum + Number(t.organizer_royalty || 0), 0);

        return {
          date: dateStr.split('-').reverse().slice(0, 2).join('/'),
          revenue: Math.round(tNet + rRoyalties),
          tickets: Math.round(tNet),
          resale: Math.round(rRoyalties)
        };
      });
    };

    // 9. Fetch Logs (Admin Action on this event)
    const adminLogs = await prisma.adminActionLog.findMany({
      where: { target_id: id },
      orderBy: { created_at: 'desc' },
      include: {
        admin: { select: { full_name: true, email: true, role: true } }
      }
    });

    // 10. Cancellation Fee Breakdown (nếu đang ở trạng thái chờ nộp phí hủy)
    let cancellation_fee_breakdown = null;
    let isFeePaid = false;
    if (eventDetails.status === 'pending_cancellation_fee') {
      let totalPrimaryFee = 0;
      successfulOrders.forEach(o => {
        totalPrimaryFee += Number(o.platform_fee || 0) + Number(o.commission_fee || 0) + Number(o.gas_fee || 0);
      });

      let totalMarketplaceFee = 0;
      marketplaceTransactions.forEach(tx => {
        totalMarketplaceFee += Number(tx.platform_fee || 0) + Number(tx.gas_fee || 0);
      });

      const latestFeeLog = adminLogs.find(l => l.action_type === 'cancellation_fee_notice');
      const totalFeeRequired = latestFeeLog ? Number(latestFeeLog.new_value) : (totalPrimaryFee + totalMarketplaceFee);
      isFeePaid = adminLogs.some(l => l.action_type === 'cancellation_fee_paid');

      cancellation_fee_breakdown = {
        primary_fee: totalPrimaryFee,
        marketplace_fee: totalMarketplaceFee,
        total_fee: totalFeeRequired,
        is_paid: isFeePaid
      };
    }

    res.status(200).json({ 
      data: { 
        ...eventDetails, 
        total_gross_revenue,
        estimated_net_revenue,
        estimated_system_revenue: total_gross_revenue - estimated_net_revenue,
        total_sold: soldCount,
        check_in_count: checkInCount,
        recent_orders: recentOrders,
        admin_logs: adminLogs,
        cancellation_fee_breakdown,
        financials: {
          ticket_revenue_gross: primaryTicketRevenue,
          merch_revenue_gross: primaryMerchRevenue,
          resale_volume: resaleVolume,
          resale_royalties: resaleRoyalties,
          primary_fees_deducted: primaryTotalFees
        },
        statistics: {
          timeline7d: generateTimeline(7),
          timeline30d: generateTimeline(30),
          tier_distribution: eventDetails.ticket_tiers.map(tier => ({
            name: tier.tier_name,
            value: tier._count.tickets
          })),
          revenue_mix: [
            { name: 'Doanh thu sơ cấp (Net)', value: primaryTicketRevenue + primaryMerchRevenue - primaryTotalFees },
            { name: 'Hoa hồng bán lại', value: resaleRoyalties }
          ].filter(d => d.value > 0)
        }
      } 
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết sự kiện:', error);
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

// [UC_xx] Lấy danh sách giao dịch của sự kiện/hạng vé
const getTierTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { tier_id, search, status, page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;

    await verifyEventOwnership(id, userId);

    // 1. Fetch Primary Orders & Transfers (TICKET_PURCHASE & TICKET_TRANSFER)
    const orderWhere = {
      event_id: id,
    };

    if (tier_id && tier_id !== 'all') {
      orderWhere.OR = [
        { items: { some: { ticket_tier_id: tier_id } } },
        { metadata: { path: ['ticket_id'], string_contains: tier_id } } // This might be tricky, let's refine
      ];
      // Better approach: Find tickets of that tier and check their orders
    }
    
    // Let's use a simpler approach: get all orders of event, filter in JS or use complex OR


    // 1. Fetch Primary Orders & Transfers (TICKET_PURCHASE & TICKET_TRANSFER)
    const [orders, marketplaceTx] = await Promise.all([
      prisma.order.findMany({
        where: {
          event_id: id,
          status: status === 'all' ? undefined : (status === 'success' ? { in: ['paid', 'completed', 'success'] } : { in: ['failed', 'cancelled', 'refunded', 'expired'] }),
          ...(search ? {
            OR: [
              { order_number: { contains: search, mode: 'insensitive' } },
              { customer: { full_name: { contains: search, mode: 'insensitive' } } }
            ]
          } : {})
        },
        include: {
          customer: { select: { full_name: true, email: true, avatar_url: true } },
          items: {
            include: { ticket_tier: { select: { tier_name: true } } }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.marketplaceTransaction.findMany({
        where: {
          ticket: {
            event_id: id,
            ticket_tier_id: (tier_id && tier_id !== 'all') ? tier_id : undefined
          },
          status: status === 'all' ? undefined : (status === 'success' ? { in: ['paid', 'completed', 'success'] } : 'cancelled'),
          ...(search ? {
            OR: [
              { buyer: { full_name: { contains: search, mode: 'insensitive' } } },
              { seller: { full_name: { contains: search, mode: 'insensitive' } } }
            ]
          } : {})
        },
        include: {
          buyer: { select: { full_name: true, email: true, avatar_url: true } },
          ticket: { 
            include: { 
              ticket_tier: { select: { tier_name: true } } 
            } 
          },
          listing: { select: { listing_number: true } },
          payments: {
            where: { status: { in: ['paid', 'success', 'completed'] } },
            take: 1
          }
        },
        orderBy: { created_at: 'desc' }
      })
    ]);

    // 2. Map basic transactions
    let unifiedTransactions = [
      ...orders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        type: o.order_type === 'TICKET_TRANSFER' ? 'transfer' : 'primary',
        customer: o.customer,
        quantity: o.items.reduce((sum, item) => sum + item.quantity, 0) || 1,
        total_amount: Number(o.total_amount),
        payment_method: o.payment_method,
        status: o.status,
        created_at: o.created_at,
        tier_name: o.items[0]?.ticket_tier?.tier_name || 'N/A',
        ticket_id: o.metadata?.ticket_id // For transfer filtering
      })),
      ...marketplaceTx.map(m => ({
        id: m.id,
        order_number: m.listing?.listing_number || 'RESALE',
        type: 'resale',
        customer: m.buyer,
        quantity: 1,
        total_amount: Number(m.buyer_pay_amount),
        payment_method: m.payments[0]?.method || 'vnpay',
        status: m.status,
        created_at: m.created_at,
        tier_name: m.ticket?.ticket_tier?.tier_name || 'N/A'
      }))
    ];

    // 3. Handle Transfer Tier Names & Filtering
    const transferOrders = unifiedTransactions.filter(tx => tx.type === 'transfer' && tx.ticket_id);
    if (transferOrders.length > 0) {
      const ticketIds = transferOrders.map(tx => tx.ticket_id);
      const tickets = await prisma.ticket.findMany({
        where: { id: { in: ticketIds } },
        include: { ticket_tier: { select: { tier_name: true, id: true } } }
      });

      const ticketMap = {};
      tickets.forEach(t => { ticketMap[t.id] = t; });

      unifiedTransactions = unifiedTransactions.map(tx => {
        if (tx.type === 'transfer' && tx.ticket_id && ticketMap[tx.ticket_id]) {
          return {
            ...tx,
            tier_name: ticketMap[tx.ticket_id].ticket_tier?.tier_name || 'N/A',
            tier_id_internal: ticketMap[tx.ticket_id].ticket_tier?.id
          };
        }
        return tx;
      });
    }

    // 4. Final Tier Filtering in JS
    if (tier_id && tier_id !== 'all') {
      unifiedTransactions = unifiedTransactions.filter(tx => {
        if (tx.type === 'primary') {
          const originalOrder = orders.find(o => o.id === tx.id);
          return originalOrder?.items.some(i => i.ticket_tier_id === tier_id);
        } else if (tx.type === 'resale') {
          const originalTx = marketplaceTx.find(m => m.id === tx.id);
          return originalTx?.ticket?.ticket_tier_id === tier_id;
        } else if (tx.type === 'transfer') {
          return tx.tier_id_internal === tier_id;
        }
        return true;
      });
    }

    // Sort by created_at desc

    unifiedTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination in JS
    const total = unifiedTransactions.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedItems = unifiedTransactions.slice(start, start + parseInt(limit));

    res.status(200).json({
      data: paginatedItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Lỗi lấy giao dịch sự kiện:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_xx] Lấy danh sách hoạt động chuyển nhượng/bán lại (Secondary Market)
const getEventSecondaryActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { tier_id, type } = req.query; // type: 'resale' | 'transfer' | 'all'
    const userId = req.user.userId;

    await verifyEventOwnership(id, userId);

    const ticketWhere = { event_id: id };
    if (tier_id && tier_id !== 'all') {
      ticketWhere.ticket_tier_id = tier_id;
    }

    const results = {};

    if (!type || type === 'all' || type === 'resale') {
      results.marketplace = await prisma.marketplaceTransaction.findMany({
        where: {
          ticket: ticketWhere,
          status: { in: ['paid', 'completed', 'success'] }
        },
        include: {
          buyer: { select: { full_name: true, email: true, avatar_url: true } },
          seller: { select: { full_name: true, email: true, avatar_url: true } },
          ticket: { 
            include: { 
              ticket_tier: { select: { tier_name: true } } 
            } 
          }
        },
        orderBy: { id: 'desc' } // Hoặc dùng created_at nếu có
      });
    }

    if (!type || type === 'all' || type === 'transfer') {
      results.transfers = await prisma.ticketTransfer.findMany({
        where: {
          event_id: id,
          ticket: tier_id && tier_id !== 'all' ? { ticket_tier_id: tier_id } : undefined,
          status: { in: ['completed', 'success'] }
        },
        include: {
          sender: { select: { full_name: true, email: true, avatar_url: true } },
          receiver: { select: { full_name: true, email: true, avatar_url: true } },
          ticket: { 
            include: { 
              ticket_tier: { select: { tier_name: true } } 
            } 
          }
        },
        orderBy: { requested_at: 'desc' }
      });
    }

    res.status(200).json({ data: results });
  } catch (error) {
    console.error('Lỗi lấy hoạt động thứ cấp:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_16] Hủy yêu cầu khẩn cấp (khi Admin chưa duyệt)
const cancelEmergencyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const event = await verifyEventOwnership(id, userId);

    if (!['pending_cancel', 'pending_reschedule'].includes(event.status)) {
      return res.status(400).json({ error: 'Sự kiện không có yêu cầu khẩn cấp nào đang chờ xử lý.' });
    }

    // Cập nhật trạng thái sự kiện về active và hủy bỏ yêu cầu
    await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: { status: 'active' }
      }),
      prisma.emergencyRequest.updateMany({
        where: { 
          event_id: id,
          status: 'pending'
        },
        data: { status: 'cancelled' }
      })
    ]);

    res.status(200).json({ message: 'Đã hủy yêu cầu xử lý khẩn cấp thành công. Sự kiện đã quay lại trạng thái hoạt động.' });

    // Thông báo cho Admin biết yêu cầu đã bị hủy
    try {
      await NotificationService.notifyAdmins({
        type: 'EMERGENCY_CANCELLED',
        title: 'Yêu cầu khẩn cấp đã được rút lại',
        message: `BTC sự kiện "${event.title}" đã hủy yêu cầu xử lý khẩn cấp trước đó.`,
        target_id: id
      });
    } catch (notifErr) {
      console.error('[Cancel Emergency] Failed to notify admins:', notifErr);
    }

  } catch (error) {
    console.error('Error in cancelEmergencyRequest:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [NEW] Thanh toán phí bồi hoàn hủy sự kiện
const payCancellationFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const userId = req.user.userId;
    const event = await verifyEventOwnership(id, userId);

    if (event.status !== 'pending_cancellation_fee') {
      return res.status(400).json({ error: 'Sự kiện không ở trạng thái yêu cầu nộp phí hủy.' });
    }

    const latestFeeLog = await prisma.adminActionLog.findFirst({
      where: { target_id: id, action_type: 'cancellation_fee_notice' },
      orderBy: { created_at: 'desc' }
    });

    let totalFeeRequired = latestFeeLog && latestFeeLog.new_value ? Number(latestFeeLog.new_value) : 16810;

    if (paymentMethod === 'vnpay') {
      const orderMock = {
        order_number: `FEE-${id}`,
        total_amount: totalFeeRequired,
        expires_at: new Date(Date.now() + 15 * 60 * 1000)
      };
      const vnpUrl = createRealVNPayUrl(orderMock, req);
      return res.status(200).json({ payment_url: vnpUrl });
    }

    // Khấu trừ ví doanh thu / hoàn tất thanh toán
    await prisma.$transaction(async (tx) => {
      await tx.adminActionLog.create({
        data: {
          admin_id: userId,
          action_type: 'cancellation_fee_paid',
          target_id: id,
          new_value: String(totalFeeRequired)
        }
      });

      await tx.event.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      await tx.order.updateMany({
        where: { event_id: id, status: { in: ['paid', 'success', 'completed'] } },
        data: { status: 'refund_pending' }
      });

      await tx.ticket.updateMany({
        where: { event_id: id },
        data: { status: 'cancelled' }
      });

      await tx.marketplaceTransaction.updateMany({
        where: { ticket: { event_id: id }, status: { in: ['paid', 'success', 'completed'] } },
        data: { status: 'cancelled' }
      });

      const ticketsToRefund = await tx.ticket.findMany({
        where: { event_id: id },
        include: { 
          ticket_tier: true,
          transactions: {
            where: { status: { in: ['paid', 'success', 'completed'] } },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      });
      for (const t of ticketsToRefund) {
        const originalPrice = t.ticket_tier ? Number(t.ticket_tier.price) : 0;
        
        if (t.transactions && t.transactions.length > 0) {
          const lastTx = t.transactions[0];
          const buyerRefundAmount = Number(lastTx.buyer_pay_amount);
          const sellerRefundAmount = originalPrice;
          
          // 1. Hoàn tiền cho Người mua lại (Buyer)
          const buyerExist = await tx.refundRequest.findFirst({
            where: { ticket_id: t.id, customer_id: lastTx.buyer_id }
          });
          if (!buyerExist) {
            await tx.refundRequest.create({
              data: {
                ticket_id: t.id,
                customer_id: lastTx.buyer_id,
                status: 'pending',
                refund_amount: buyerRefundAmount,
                type: 'event_cancelled',
                reason: `Tự động hoàn tiền mua vé Marketplace do sự kiện bị hủy: ${event.title} (Giá mua: ${buyerRefundAmount.toLocaleString('vi-VN')}đ)`
              }
            });
          }

          // 2. Hoàn tiền gốc cho Người bán lại (Seller)
          const sellerExist = await tx.refundRequest.findFirst({
            where: { ticket_id: t.id, customer_id: lastTx.seller_id }
          });
          if (!sellerExist) {
            await tx.refundRequest.create({
              data: {
                ticket_id: t.id,
                customer_id: lastTx.seller_id,
                status: 'pending',
                refund_amount: sellerRefundAmount,
                type: 'event_cancelled',
                reason: `Tự động hoàn tiền gốc mua vé do sự kiện bị hủy (Vé đã bán lại trên Marketplace): ${event.title} (Giá gốc: ${sellerRefundAmount.toLocaleString('vi-VN')}đ)`
              }
            });
          }
        } else {
          // Vé chưa bán lại trên Marketplace
          const exist = await tx.refundRequest.findFirst({
            where: { ticket_id: t.id, customer_id: t.current_owner_id }
          });
          if (!exist) {
            await tx.refundRequest.create({
              data: {
                ticket_id: t.id,
                customer_id: t.current_owner_id,
                status: 'pending',
                refund_amount: originalPrice,
                type: 'event_cancelled',
                reason: `Tự động tạo yêu cầu hoàn tiền do sự kiện bị hủy: ${event.title}`
              }
            });
          }
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalFeeRequired } }
      });

      await tx.walletTransaction.create({
        data: {
          user_id: userId,
          amount: totalFeeRequired,
          type: 'FEE',
          description: `Khấu trừ ví doanh thu nộp phí hủy sự kiện: ${event.title}`,
          status: 'completed'
        }
      });
    });

    const web3Service = require('../services/web3.service');
    const emailService = require('../services/email.service');
    const blockchainService = require('../services/blockchain.service');

    if (event.smart_contract_address) {
      web3Service.pauseContract(event.smart_contract_address).catch(e => console.error('Pause error:', e));
    }

    const organizerUser = await prisma.user.findUnique({ where: { id: userId } });
    blockchainService.logFinancialTransaction(
      'FEE-' + id.slice(0, 8).toUpperCase(),
      totalFeeRequired,
      { cancellationFee: totalFeeRequired },
      'FEE',
      organizerUser?.wallet_address || undefined
    );

    emailService.sendEventCancellationEmail(organizerUser, event, 'Sự kiện bị hủy khẩn cấp', 'organizer').catch(() => {});
    
    const orders = await prisma.order.findMany({
      where: { event_id: id, status: 'refund_pending' },
      include: { customer: true }
    });

    orders.forEach(o => {
      if (o.customer) {
        emailService.sendEventCancellationEmail(o.customer, event, 'Sự kiện bị hủy khẩn cấp', 'customer').catch(() => {});
      }
    });

    res.status(200).json({ 
      status: 'cancelled',
      message: 'Đã nộp phí & Xác nhận hoàn tất hủy sự kiện thành công! Hệ thống đang tự động hoàn tiền cho khách hàng.' 
    });
  } catch (error) {
    console.error('Lỗi thanh toán phí hủy:', error);
    res.status(400).json({ error: error.message || 'Lỗi server khi thanh toán phí.' });
  }
};

const crypto = require('crypto');
const qs = require('qs');

function createRealVNPayUrl(order, req) {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  let date = new Date();
  
  const pad = n => n < 10 ? '0' + n : n;
  const formatDate = d => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  
  let createDate = formatDate(date);
  let expireDate = formatDate(new Date(order.expires_at));
  
  let tmnCode = process.env.VNP_TMN_CODE.trim();
  let secretKey = process.env.VNP_HASH_SECRET.trim();
  let vnpUrl = process.env.VNP_URL.trim();
  let returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-result`;

  let amount = Math.round(order.total_amount);
  let orderInfo = `ThanhToanPhiBoiHoan-${order.order_number}`;
  let locale = 'vn';
  let currCode = 'VND';
  
  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = locale;
  vnp_Params['vnp_CurrCode'] = currCode;
  vnp_Params['vnp_TxnRef'] = order.order_number;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
  }
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  vnp_Params['vnp_ExpireDate'] = expireDate;

  let sortedKeys = Object.keys(vnp_Params).sort();
  let sortedParams = {};
  sortedKeys.forEach(k => sortedParams[k] = vnp_Params[k]);

  const signData = qs.stringify(sortedParams, { encode: true });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
  
  return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
}

module.exports = {
  createEvent,
  updateEvent,
  requestCancelOrReschedule,
  cancelEmergencyRequest,
  updateResalePolicy,
  updateTransferPolicy,
  getAttendees,
  getAllOrganizerAttendees,
  getOrganizerEvents,
  getEventById,
  deleteEvent,
  getTierTransactions,
  getEventSecondaryActivity,
  payCancellationFee
};
