const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

// Helper check Organizer
const getOrganizerId = async (userId) => {
  const org = await prisma.organizer.findUnique({ where: { user_id: userId } });
  if (!org) throw new Error('Không tìm thấy tài khoản Ban tổ chức');
  return org.id;
};

// [UC_18] Lấy danh sách nhân viên soát vé
const getStaffs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orgId = await getOrganizerId(userId);

    const staffs = await prisma.eventStaffAssignment.findMany({
      where: { creator_id: userId },
      include: {
        staff: { select: { id: true, email: true, phone_number: true, full_name: true, status: true, created_at: true } },
        event: { select: { id: true, title: true } }
      },
      orderBy: { staff: { created_at: 'desc' } }
    });

    res.status(200).json({ data: staffs });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_18] Thêm mới tài khoản nhân viên (Hoặc gán nhân viên cũ vào sự kiện)
const createStaff = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email, phone_number, password, full_name, event_ids } = req.body;

    if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
      return res.status(400).json({ error: 'Cần chọn ít nhất một sự kiện phụ trách.' });
    }

    const orgId = await getOrganizerId(userId);

    // 1. Kiểm tra User đã tồn tại hay chưa
    let staffUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone_number }] }
    });

    if (staffUser) {
      // Nếu đã tồn tại nhưng không phải Role staff thì báo lỗi
      if (staffUser.role !== 'staff') {
        return res.status(400).json({ error: 'Email hoặc SĐT này đã được sử dụng cho tài khoản khác.' });
      }
    } else {
      // 2. Tạo User mới nếu chưa có
      if (!password) return res.status(400).json({ error: 'Mật khẩu là bắt buộc cho tài khoản mới.' });
      
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      staffUser = await prisma.user.create({
        data: {
          email,
          phone_number,
          password_hash,
          full_name,
          role: 'staff',
          status: 'active',
          permissions: ['scan_ticket'] // Mặc định quyền soát vé
        }
      });
    }

    // 3. Gán vào các sự kiện (Bỏ qua các sự kiện đã được gán)
    await Promise.all(event_ids.map(async (eventId) => {
      const existing = await prisma.eventStaffAssignment.findFirst({
        where: { staff_id: staffUser.id, event_id: eventId }
      });
      
      if (!existing) {
        await prisma.eventStaffAssignment.create({
          data: {
            staff_id: staffUser.id,
            event_id: eventId,
            creator_id: userId
          }
        });
      }
    }));

    res.status(201).json({ message: 'Đã thêm mới và gán nhân viên vào các sự kiện thành công.' });
  } catch (error) {
    console.error('Create Staff Error:', error);
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_18] Cập nhật thông tin nhân viên & Phân công sự kiện
const updateStaff = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { full_name, phone_number, email, password, event_ids } = req.body;

    // 1. Kiểm tra quyền hạn (Organizer quản lý nhân viên này)
    const assignment = await prisma.eventStaffAssignment.findFirst({
      where: { staff_id: id, creator_id: userId }
    });

    if (!assignment) {
      return res.status(403).json({ error: 'Bạn không có quyền quản lý tài khoản này.' });
    }

    const updateData = { full_name, phone_number, email };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    // 2. Chạy giao dịch đồng bộ hóa
    await prisma.$transaction(async (tx) => {
      // Cập nhật User
      await tx.user.update({
        where: { id },
        data: updateData
      });

      // Nếu có truyền danh sách sự kiện mới
      if (Array.isArray(event_ids)) {
        // Xóa các phân công cũ của organizer này cho nhân viên này
        await tx.eventStaffAssignment.deleteMany({
          where: { staff_id: id, creator_id: userId }
        });

        // Tạo các phân công mới
        if (event_ids.length > 0) {
          await tx.eventStaffAssignment.createMany({
            data: event_ids.map(eventId => ({
              staff_id: id,
              event_id: eventId,
              creator_id: userId
            }))
          });
        }
      }
    });

    res.status(200).json({ message: 'Cập nhật thông tin và phân công thành công.' });
  } catch (error) {
    console.error('Update Staff Error:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật nhân viên.' });
  }
};

// [UC_18] Chi tiết nhân viên
const getStaffDetail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // 1. Kiểm tra xem staff này có thuộc quản lý của organizer không
    const assignments = await prisma.eventStaffAssignment.findMany({
      where: { staff_id: id, creator_id: userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            event_date: true,
            image_url: true,
            status: true,
            location_address: true
          }
        }
      }
    });

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên hoặc bạn không có quyền.' });
    }

    // 2. Lấy thông tin User và thống kê quét
    const staff = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone_number: true,
        full_name: true,
        status: true,
        created_at: true,
        avatar_url: true,
        _count: {
          select: {
            ticket_scans: { where: { is_success: true } },
            merchandise_scans: { where: { is_success: true } }
          }
        }
      }
    });

    res.status(200).json({ 
      data: {
        staff,
        assignments: assignments.map(a => a.event),
        stats: {
          total_ticket_scans: staff._count.ticket_scans,
          total_merchandise_scans: staff._count.merchandise_scans
        }
      }
    });
  } catch (error) {
    console.error('Get Staff Detail Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_18] Lấy lịch sử quét của nhân viên theo sự kiện
const getStaffScanHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ error: 'Thiếu eventId' });
    }

    // 1. Kiểm tra quyền hạn
    const staffCheck = await prisma.eventStaffAssignment.findFirst({
      where: { staff_id: id, creator_id: userId }
    });

    if (!staffCheck) {
      return res.status(403).json({ error: 'Bạn không có quyền xem lịch sử của nhân viên này.' });
    }

    // 2. Lấy lịch sử quét vé
    const ticketScans = await prisma.scanHistory.findMany({
      where: {
        staff_id: id,
        ticket: { event_id: eventId }
      },
      include: {
        ticket: {
          include: {
            current_owner: { select: { full_name: true, email: true, avatar_url: true } },
            ticket_tier: { select: { tier_name: true } },
            event: { select: { image_url: true } }
          }
        }
      },
      orderBy: { scanned_at: 'desc' }
    });

    // 3. Lấy lịch sử quét vật phẩm
    const merchScans = await prisma.merchandiseScanHistory.findMany({
      where: {
        staff_id: id,
        order_item: { 
          order: { event_id: eventId } 
        }
      },
      include: {
        order_item: {
          include: {
            merchandise: { select: { name: true, image_url: true } },
            owner: { select: { full_name: true, email: true, avatar_url: true } },
            order: {
              include: {
                customer: { select: { full_name: true, email: true, avatar_url: true } }
              }
            }
          }
        }
      },
      orderBy: { scanned_at: 'desc' }
    });

    // 3.5 Lấy thông tin sự kiện
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, event_date: true }
    });

    // 4. Tổng hợp và định dạng
    const history = [
      ...ticketScans.map(s => ({
        id: s.id,
        type: 'TICKET',
        item_name: s.ticket.ticket_tier.tier_name,
        item_image: s.ticket.event.image_url,
        customer_name: s.ticket.current_owner.full_name || s.ticket.current_owner.email,
        customer_email: s.ticket.current_owner.email,
        customer_avatar: s.ticket.current_owner.avatar_url,
        scanned_at: s.scanned_at,
        is_success: s.is_success,
        failure_reason: s.failure_reason
      })),
      ...merchScans.map(s => {
        const customer = s.order_item.owner || s.order_item.order.customer;
        return {
          id: s.id,
          type: 'MERCHANDISE',
          item_name: s.order_item.merchandise.name,
          item_image: s.order_item.merchandise.image_url,
          customer_name: customer.full_name || customer.email || 'N/A',
          customer_email: customer.email,
          customer_avatar: customer.avatar_url,
          scanned_at: s.scanned_at,
          is_success: s.is_success,
          failure_reason: s.failure_reason
        };
      })
    ].sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at));

    res.status(200).json({ data: history, event });
  } catch (error) {
    console.error('Get Scan History Error:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy lịch sử quét.' });
  }
};
// [UC_18] Khóa/Mở khóa tài khoản nhân viên (Toggle)
const lockStaff = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params; // ID của Staff User

    // Kiểm tra xem staff này có thuộc quản lý của organizer không
    const assignment = await prisma.eventStaffAssignment.findFirst({
      where: { staff_id: id, creator_id: userId }
    });

    if (!assignment) {
      return res.status(403).json({ error: 'Bạn không có quyền quản lý tài khoản này.' });
    }

    const staff = await prisma.user.findUnique({ where: { id } });
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

    const nextStatus = staff.status === 'active' ? 'inactive' : 'active';

    await prisma.user.update({
      where: { id },
      data: { status: nextStatus }
    });

    res.status(200).json({ message: `Đã ${nextStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản thành công.` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getStaffs,
  createStaff,
  lockStaff,
  updateStaff,
  getStaffDetail,
  getStaffScanHistory
};
