const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { ethers } = require('ethers');
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

// [UC_21] Quản lý người dùng: Tạo người dùng mới (Dành cho Admin)
const createUser = async (req, res) => {
  try {
    const { email, password, phone_number, full_name, role, permissions } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã tồn tại trên hệ thống.' });
    }
    // 2. Mã hóa mật khẩu
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Tạo Ví Web3 Custodial
    const randomWallet = ethers.Wallet.createRandom();

    // 4. Tạo user
    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash,
        phone_number: phone_number || null,
        full_name,
        role: role || 'customer',
        permissions: role === 'admin' ? (permissions || []) : [],
        wallet_address: randomWallet.address,
        wallet_private_key: randomWallet.privateKey,
        status: 'active'
      }
    });

    // 5. Gửi Email thông báo tài khoản & Ví mới
    try {
      const subject = '[BASTICKET] Thông tin tài khoản & Ví Web3 mới';
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #52c41a; text-align: center;">Chào mừng bạn đến với BASTICKET!</h2>
          <p>Tài khoản quản trị và <b>Ví Web3 cá nhân</b> của bạn đã được khởi tạo thành công.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><b>📧 Email đăng nhập:</b> ${email}</p>
            <p style="margin: 5px 0;"><b>🔑 Mật khẩu tạm thời:</b> <span style="color: #ff4d4f; font-family: monospace; font-weight: bold;">${password}</span></p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;"/>
            <p style="margin: 5px 0;"><b>💎 Địa chỉ Ví Web3:</b></p>
            <p style="word-break: break-all; font-family: monospace; font-size: 13px; color: #666; background: #fff; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
              ${randomWallet.address}
            </p>
            <p style="font-size: 11px; color: #999; margin-top: 10px;"><i>* Ví này dùng để quản lý vé NFT và các giao dịch trên hệ thống.</i></p>
          </div>

          <p>Hành động cần làm: <b>Vui lòng đăng nhập và đổi mật khẩu ngay để bảo mật tài khoản.</b></p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
               style="display: inline-block; padding: 12px 30px; background-color: #52c41a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Đăng nhập ngay
            </a>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
            Trân trọng,<br/>
            <b>Đội ngũ Quản trị BASTICKET</b>
          </p>
        </div>
      `;
      await sendEmail(email, subject, html);
    } catch (emailError) {
      console.error('Lỗi gửi email:', emailError);
    }

    res.status(201).json({ 
      message: 'Tạo tài khoản và Ví Web3 thành công.',
      data: { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role,
        wallet_address: newUser.wallet_address 
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi tạo người dùng.' });
  }
};

// [UC_21] Quản lý người dùng: Lấy chi tiết 360 độ (ID)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        organizer_profile: true,
        orders: {
          include: {
            event: {
              select: { id: true, title: true, event_date: true, image_url: true }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 10 // Chỉ lấy 10 đơn gần nhất để tránh overload, có thể mở rộng sau
        },
        owned_tickets: {
          include: {
            event: {
              select: { id: true, title: true, event_date: true, location_address: true }
            },
            ticket_tier: {
              select: { tier_name: true, price: true }
            }
          },
          where: { status: 'active' } // Chỉ lấy vé đang có hiệu lực
        },
        listings: {
          include: {
            event: { select: { title: true } },
            ticket: { select: { ticket_number: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    // Không trả về private key vì lý do bảo mật
    const sensitiveData = { ...user };
    delete sensitiveData.wallet_private_key;
    delete sensitiveData.password_hash;

    res.status(200).json(sensitiveData);
  } catch (error) {
    console.error('Error fetching user detail:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết người dùng.' });
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
  createUser,
  getUserById,
  toggleUserStatus,
  approveOrganizer
};
