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
    const { email, phone_number, password, full_name, event_id } = req.body;

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
      
      // Kiểm tra xem nhân viên này đã được gán vào sự kiện này chưa
      const existingAssignment = await prisma.eventStaffAssignment.findFirst({
        where: { staff_id: staffUser.id, event_id }
      });
      if (existingAssignment) {
        return res.status(400).json({ error: 'Nhân viên này đã được gán cho sự kiện này.' });
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

    // 3. Gán vào sự kiện
    await prisma.eventStaffAssignment.create({
      data: {
        staff_id: staffUser.id,
        event_id,
        creator_id: userId
      }
    });

    res.status(201).json({ message: 'Đã gán nhân viên vào sự kiện thành công.' });
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

    const assignment = await prisma.eventStaffAssignment.findFirst({
      where: { staff_id: id, creator_id: userId },
      include: {
        staff: { select: { id: true, email: true, phone_number: true, full_name: true, status: true, created_at: true, permissions: true } },
        event: { select: { id: true, title: true, event_date: true } }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên hoặc bạn không có quyền.' });
    }

    res.status(200).json({ data: assignment });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
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
  getStaffDetail
};
