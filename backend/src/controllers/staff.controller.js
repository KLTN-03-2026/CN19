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
        staff: { select: { id: true, email: true, phone_number: true, status: true } },
        event: { select: { title: true } }
      }
    });

    res.status(200).json({ data: staffs });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_18] Thêm mới tài khoản nhân viên
const createStaff = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email, phone_number, password, event_id } = req.body;

    const orgId = await getOrganizerId(userId);

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone_number }] }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email hoặc SĐT đã tồn tại.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await prisma.$transaction(async (tx) => {
      const newStaff = await tx.user.create({
        data: {
          email,
          phone_number,
          password_hash,
          role: 'staff',
          status: 'active'
        }
      });

      await tx.eventStaffAssignment.create({
        data: {
          staff_id: newStaff.id,
          event_id,
          creator_id: userId
        }
      });
    });

    res.status(201).json({ message: 'Thêm mới nhân viên soát vé thành công.' });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Lỗi server.' });
  }
};

// [UC_18] Khóa tài khoản nhân viên
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

    await prisma.user.update({
      where: { id },
      data: { status: 'inactive' }
    });

    res.status(200).json({ message: 'Đã khóa tài khoản nhân viên thành công.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getStaffs,
  createStaff,
  lockStaff
};
