const prisma = require('../config/prisma');
const sendEmail = require('../utils/sendEmail');

// [UC_21] Quản lý người dùng: Lấy toàn bộ danh sách
const getUsers = async (req, res) => {
  try {
    const { role, status, keyword, kyc_status, from, to } = req.query;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    
    if (from || to) {
      whereClause.created_at = {};
      if (from) whereClause.created_at.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // Đảm bảo lọc hết ngày được chọn
        whereClause.created_at.lte = toDate;
      }
    }
    
    if (kyc_status) {
      whereClause.organizer_profile = {
        kyc_status: kyc_status
      };
    }
    if (keyword) {
      whereClause.OR = [
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone_number: { contains: keyword } }
      ];
    }

    const [users, totalCount, pendingCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          phone_number: true,
          role: true,
          status: true,
          created_at: true,
          organizer_profile: {
            select: { id: true, kyc_status: true, organization_name: true }
          }
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count(),
      prisma.organizer.count({ where: { kyc_status: 'pending' } })
    ]);

    res.status(200).json({ 
      data: users,
      meta: {
        total: totalCount,
        pending: pendingCount
      }
    });
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

    const organizer = await prisma.organizer.update({
      where: { id },
      include: { user: true },
      data: { 
        kyc_status, 
        is_verified,
        kyc_verified_at: new Date()
      }
    });

    // Nếu Approve thì mới đổi role của User thành organizer
    if (action === 'approve') {
      await prisma.user.update({
        where: { id: organizer.user_id },
        data: { role: 'organizer' }
      });
    }

    await prisma.adminActionLog.create({
      data: {
        admin_id: req.user.userId,
        action_type: `organizer_${action}`,
        target_id: id
      }
    });

    // Gửi Email thông báo cho User
    const userEmail = organizer.user.email;
    if (action === 'approve') {
      const subject = '[BASTICKET] Chúc mừng! Hồ sơ Ban Tổ Chức của bạn đã được duyệt';
      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #52c41a;">Chúc mừng!</h2>
          <p>Chào <b>${organizer.user.full_name || userEmail}</b>,</p>
          <p>Hồ sơ đăng ký Ban Tổ Chức <b>${organizer.organization_name}</b> của bạn tại BASTICKET đã được phê duyệt thành công.</p>
          <p>Kể từ bây giờ, bạn có thể truy cập vào Dashboard dành cho Ban Tổ Chức để bắt đầu tạo và quản lý các sự kiện của mình.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/organizer/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #52c41a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Đến Dashboard BTC
          </a>
          <p style="margin-top: 20px; color: #888;">Trân trọng,<br/>Đội ngũ BASTICKET</p>
        </div>
      `;
      await sendEmail(userEmail, subject, html);
    } else {
      const subject = '[BASTICKET] Thông báo kết quả hồ sơ Ban Tổ Chức';
      const html = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #ff4d4f;">Thông báo hồ sơ</h2>
          <p>Chào <b>${organizer.user.full_name || userEmail}</b>,</p>
          <p>Rất tiếc, hồ sơ đăng ký Ban Tổ Chức <b>${organizer.organization_name}</b> của bạn đã không được duyệt vào lúc này.</p>
          <p><b>Lý do từ chối:</b> ${reason || 'Thông tin chưa đầy đủ hoặc không chính xác.'}</p>
          <p>Bạn có thể cập nhật lại thông tin và nộp lại hồ sơ sau khi đã khắc phục các vấn đề trên.</p>
          <p style="margin-top: 20px; color: #888;">Trân trọng,<br/>Đội ngũ BASTICKET</p>
        </div>
      `;
      await sendEmail(userEmail, subject, html);
    }

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
