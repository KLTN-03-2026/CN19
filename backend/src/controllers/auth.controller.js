const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

// [UC_01] Đăng ký tài khoản (Khách hàng vãng lai)
const register = async (req, res) => {
  try {
    const { email, phone_number, password, full_name } = req.body;

    // 1. Kiểm tra user đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone_number }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email hoặc số điện thoại đã tồn tại trong hệ thống.' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Sinh địa chỉ ví Blockchain thật từ Ethers.js (Custodial Wallet)
    const { ethers } = require('ethers');
    const randomWallet = ethers.Wallet.createRandom();
    const realWalletAddress = randomWallet.address;
    const walletPrivateKey = randomWallet.privateKey;

    // 4. Lưu User vào database
    const newUser = await prisma.user.create({
      data: {
        email,
        full_name,
        phone_number,
        password_hash,
        role: 'customer',
        status: 'active',
        wallet_address: realWalletAddress,
        wallet_private_key: walletPrivateKey
      }
    });

    // 5. Trả về kết quả
    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        wallet_address: newUser.wallet_address
      }
    });

  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi trên server.' });
  }
};

// [UC_02] Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm user theo Email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    // 2. Kiểm tra trạng thái tài khoản
    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    // 3. Đối chiếu mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Có thể tăng failed_login_attempts ở đây
      return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
    }

    // 4. Khởi tạo JWT Token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key', {
      expiresIn: '1d'
    });

    // 5. Trả về response
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi trên server.' });
  }
};

// [UC_03] Đăng ký Ban tổ chức
const registerOrganizer = async (req, res) => {
  try {
    const { email, phone_number, password, organization_name, business_license, identity_card } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone_number }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email hoặc số điện thoại đã tồn tại.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Lưu User kèm Organizer bằng Prisma nested write
    const newUser = await prisma.user.create({
      data: {
        email,
        phone_number,
        password_hash,
        role: 'organizer', // Role dành cho Ban tổ chức
        status: 'active',
        organizer_profile: {
          create: {
            organization_name,
            business_license,
            identity_card,
            kyc_status: 'pending' // Admin cần duyệt
          }
        }
      },
      include: {
        organizer_profile: true
      }
    });

    res.status(201).json({
      message: 'Hồ sơ đã gửi thành công và đang chờ Admin duyệt trong 24h.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        kyc_status: newUser.organizer_profile.kyc_status
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký BTC:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// Quên mật khẩu (Giả lập gửi OTP qua Email)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Email không tồn tại trong hệ thống.' });
    }

    // TODO: Sinh OTP 6 số lưu vào Redis hoặc DB và gửi Email
    res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Lỗi khi forgot password:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [Utility] Gửi lại mã OTP
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    // Giả lập logic sinh lại mã OTP và gửi email
    res.status(200).json({ message: 'Mã OTP mới đã được gửi đến email của bạn.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  register,
  login,
  registerOrganizer,
  forgotPassword,
  resendOtp
};
