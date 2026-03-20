const prisma = require('../config/prisma');

// [UC_21] Quản lý người dùng: Lấy toàn bộ danh sách
const getUsers = async (req, res) => {
  try {
    const { role, status, keyword } = req.query;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (keyword) {
      whereClause.OR = [
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone_number: { contains: keyword } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        phone_number: true,
        role: true,
        status: true,
        created_at: true,
        organizer_profile: {
          select: { kyc_status: true, organization_name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_21] Quản lý người dùng: Khóa/Mở Khóa User
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'active' | 'banned'

    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });

    // Logging action
    await prisma.adminActionLog.create({
      data: {
        admin_id: req.user.userId,
        action_type: status === 'banned' ? 'ban_user' : 'unban_user',
        target_id: id,
        new_value: status,
        old_value: user.status
      }
    });

    res.status(200).json({ message: `Cập nhật trạng thái thành ${status}.` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_21] Duyệt hồ sơ Ban tổ chức
const approveOrganizer = async (req, res) => {
  try {
    const { id } = req.params; // Organizer ID
    const { action, reason } = req.body; // 'approve' | 'reject'

    const kyc_status = action === 'approve' ? 'approved' : 'rejected';
    const is_verified = action === 'approve' ? true : false;

    await prisma.organizer.update({
      where: { id },
      data: { 
        kyc_status, 
        is_verified,
        kyc_verified_at: new Date()
      }
    });

    await prisma.adminActionLog.create({
      data: {
        admin_id: req.user.userId,
        action_type: `organizer_${action}`,
        target_id: id
      }
    });

    res.status(200).json({ message: `Hồ sơ đã được ${action}.` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getUsers,
  toggleUserStatus,
  approveOrganizer
};
