const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');

// [UC_07] Lấy thông tin cá nhân
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Lấy thông tin User (không lấy password_hash)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone_number: true,
        role: true,
        status: true,
        wallet_address: true,
        avatar_url: true,
        address: true,
        date_of_birth: true,
        created_at: true,
        organizer_profile: true // Lấy thêm info BTC nếu có
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin cá nhân:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_07] Cập nhật thông tin cá nhân
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { phone_number, avatar_url, address, date_of_birth } = req.body;

    // Kiểm tra số điện thoại có bị trùng không
    if (phone_number) {
      const existingUser = await prisma.user.findFirst({
        where: { phone_number, NOT: { id: userId } }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Số điện thoại này đã được sử dụng.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        phone_number,
        avatar_url,
        address,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined
      },
      select: {
        id: true,
        email: true,
        phone_number: true,
        address: true,
        date_of_birth: true,
        avatar_url: true
      }
    });

    res.status(200).json({ message: 'Cập nhật thông tin thành công!', data: updatedUser });
  } catch (error) {
    console.error('Lỗi khi cập nhật:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_07] Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { old_password, new_password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(old_password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu cũ không chính xác.' });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const new_password_hash = await bcrypt.hash(new_password, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: new_password_hash }
    });

    res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    console.error('Lỗi khi đổi mật khẩu:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
