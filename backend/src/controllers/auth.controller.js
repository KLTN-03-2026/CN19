const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const sendEmail = require('../utils/sendEmail');

// Cache tạm thời lưu OTP thay thế Redis Database (Hết hạn sau 5 phút)
global.otpCache = global.otpCache || new Map();

// [UC_01_A] Gửi OTP Đăng ký (Thay thế Register cũ)
const sendRegisterOtp = async (req, res) => {
  try {
    const { email, phone_number, full_name, password } = req.body;
    
    // 1. Kiểm tra tồn tại
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone_number }] }
    });
    if (existing) return res.status(400).json({ error: 'Email hoặc SĐT đã tồn tại.' });

    // 2. Sinh OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. Lưu vào Cache
    global.otpCache.set(email, {
      otp: otp,
      data: req.body,
      expires: Date.now() + 5 * 60 * 1000 // 5 Mins
    });

    // 4. Bắn Email ngay lập tức
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #111; color: #fff; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #52c41a; text-align: center;">BASTICKET</h2>
        <p>Chào <b>${full_name}</b>,</p>
        <p>Đây là mã xác nhận (OTP) 6 số để hoàn tất đăng ký tài khoản hệ thống vé BASTICKET Web3 của bạn:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #52c41a; padding: 15px; border: 1px dashed #52c41a; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ cho bất kỳ ai nhé!</p>
      </div>
    `;

    // Gọi await để bắt lỗi nếu email cấu hình sai
    const emailSent = await sendEmail(email, 'Mã xác nhận Đăng ký - BASTICKET', htmlContent);
    if (!emailSent) {
      global.otpCache.delete(email);
      return res.status(500).json({ error: 'Không thể gửi email OTP. Vui lòng thử lại.' });
    }
    
    // Log tạm để test dễ dàng nếu email không tới (hoặc email cấu hình lỗi)
    console.log(`[DEV OTP MOCK] Gửi OTP ${otp} đến ${email}`);

    res.status(200).json({ message: 'Mã xác nhận 6 số đã được gửi qua Email.' });
  } catch (err) {
    console.error('Lỗi khi gửi OTP', err);
    res.status(500).json({ error: 'Hệ thống gửi Email tạm lỗi.' });
  }
};

// [UC_01_B] Verify OTP và Khởi tạo Data (User + Web3 Custodial Wallet)
const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const record = global.otpCache.get(email);
    if (!record) return res.status(400).json({ error: 'Lỗi: Phiên đăng ký đã bị hủy hoặc không tồn tại.' });
    if (Date.now() > record.expires) {
      global.otpCache.delete(email);
      return res.status(400).json({ error: 'Mã OTP của bạn đã hết thời hạn 5 phút. Vui lòng thử lại.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Mã OTP không chính xác!' });

    // Dữ liệu hợp lệ, bắt đầu lưu DB!
    const { full_name, phone_number, password, date_of_birth } = record.data;

    // Server-side Validation: Kiểm tra ngày sinh
    if (date_of_birth) {
      const selectedDate = new Date(date_of_birth);
      const today = new Date();
      if (selectedDate > today) return res.status(400).json({ error: 'Ngày sinh không thể ở tương lai.' });
      
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
      if (selectedDate > minAgeDate) return res.status(400).json({ error: 'Bạn phải từ 13 tuổi trở lên để sử dụng hệ thống.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Call Web3 module: Tạo Ví Custodial bảo mật
    const { ethers } = require('ethers');
    const randomWallet = ethers.Wallet.createRandom();

    // Lưu Database User
    const newUser = await prisma.user.create({
      data: {
        email,
        full_name,
        phone_number,
        password_hash,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        role: 'customer',
        status: 'active',
        wallet_address: randomWallet.address,
        wallet_private_key: randomWallet.privateKey
      }
    });

    // Dọn dẹp Cache
    global.otpCache.delete(email);

    res.status(201).json({ message: 'Tạo tài khoản và Ví Web3 cá nhân thành công!' });
  } catch (err) {
    console.error('Lỗi xác thực và lưu user:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi lưu User.' });
  }
};

// [UC_02] Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm user theo Email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organizer_profile: true }
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

    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        phone_number: user.phone_number,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        organizer_profile: user.organizer_profile
      }
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi trên server.' });
  }
};

// [UC_03_A] Gửi OTP Đăng ký Ban Tổ chức (Hỗ trợ cả User mới lẫn Customer nâng cấp)
const sendOrganizerOtp = async (req, res) => {
  try {
    const { phone_number, full_name, password, organization_name, address, existing_user_id, business_license, description, latitude, longitude } = req.body;
    const email = req.body.email?.trim();

    // Nếu là Customer đã đăng nhập nâng cấp thì kiểm tra tồn tại qua existing_user_id
    // Nếu là User mới hoàn toàn thì kiểm tra Email/SĐT
    if (!existing_user_id) {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone_number }] }
      });
      if (existing) return res.status(400).json({ error: 'Email hoặc SĐT đã tồn tại.' });
    }

    // Kiểm tra đã có OTP pending cho email này chưa (tránh spam)
    const existOtp = global.otpCache.get(`org_${email}`);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    global.otpCache.set(`org_${email}`, {
      otp,
      data: req.body,
      expires: Date.now() + 5 * 60 * 1000
    });

    const displayName = full_name || 'Quý khách';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #111; color: #fff; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #52c41a; text-align: center;">BASTICKET</h2>
        <p>Chào <b>${displayName}</b>,</p>
        <p>Đây là mã xác nhận (OTP) 6 số để hoàn tất đăng ký tài khoản tổ chức sự kiện BASTICKET Web3 của bạn:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #52c41a; padding: 15px; border: 1px dashed #52c41a; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ cho bất kỳ ai nhé!</p>
      </div>
    `;

    const emailSent = await sendEmail(email, 'Mã xác nhận Đăng ký - BASTICKET', htmlContent);
    if (!emailSent) {
      global.otpCache.delete(`org_${email}`);
      return res.status(500).json({ error: 'Không thể gửi email OTP, vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.' });
    }

    console.log(`[DEV OTP] Organizer OTP: ${otp} -> ${email}`);

    res.status(200).json({ message: 'Mã OTP đã gửi qua Email của bạn.' });
  } catch (err) {
    console.error('Lỗi gửi OTP BTC:', err);
    res.status(500).json({ error: 'Hệ thống gửi Email lỗi.' });
  }
};

// [UC_03_B] Verify OTP và Lưu/Nâng cấp Ban Tổ Chức
const verifyOrganizerOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = req.body.email?.trim();

    const record = global.otpCache.get(`org_${email}`);
    if (!record) return res.status(400).json({ error: 'Phiên đăng ký không tồn tại hoặc đã hết hạn.' });
    if (Date.now() > record.expires) {
      global.otpCache.delete(`org_${email}`);
      return res.status(400).json({ error: 'Mã OTP đã hết hiủu lực 5 phút.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Mã OTP không chính xác!' });

    const { 
      full_name, phone_number, password, organization_name, address, existing_user_id, business_license, 
      description, latitude, longitude, // Nhận thêm trường vị trí và mô tả
      kyc_data 
    } = record.data;

    // Hàm chuyển đổi DD/MM/YYYY -> Date object
    const parseDate = (dateStr) => {
      if (!dateStr || !dateStr.includes('/')) return null;
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
    };

    // 2. Kiểm tra tính duy nhất của CCCD (Double check trước khi lưu)
    if (kyc_data?.id_number) {
      const existingId = await prisma.organizer.findFirst({
        where: { 
          OR: [
            { id_number: kyc_data.id_number },
            { identity_card: kyc_data.id_number }
          ]
        }
      });
      if (existingId) return res.status(400).json({ error: 'Số CCCD này đã được sử dụng cho một Ban tổ chức khác.' });
    }

    let userId;

    if (existing_user_id) {
      // Kịch bản 2: Customer đã có tài khoản - Chỉ cần thêm Organizer Profile
      const hasProfile = await prisma.organizer.findUnique({ where: { user_id: existing_user_id } });
      if (hasProfile) return res.status(400).json({ error: 'Tài khoản này đã có hồ sơ Ban Tổ Chức.' });

      // 1. Cập nhật thông tin vị trí, địa chỉ và NGÀY SINH vào bảng User
      await prisma.user.update({
        where: { id: existing_user_id },
        data: {
          address: address || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          date_of_birth: kyc_data?.dob ? parseDate(kyc_data.dob) : undefined
        }
      });

      // 2. Lưu Organizer Profile ở trạng thái pending với đầy đủ dữ liệu KYC
      await prisma.organizer.create({
        data: {
          user_id: existing_user_id,
          organization_name: organization_name || '',
          business_license: business_license || null,
          description: description || null,
          identity_card: kyc_data?.id_number || null,
          kyc_status: 'pending',
          is_verified: true, // Ép xác thực luôn cho KLTN
          kyc_verified_at: new Date(), 
          // --- Lưu dữ liệu eKYC ---
          id_number: kyc_data?.id_number || null,
          full_name_raw: kyc_data?.full_name || null,
          dob_raw: kyc_data?.dob || null,
          address_raw: kyc_data?.address || null,
          front_image_url: kyc_data?.front_image_url || null,
          back_image_url: kyc_data?.back_image_url || null,
          face_image_url: kyc_data?.face_image_url || null,
          facematch_score: kyc_data?.facematch_score || null,
          liveness_score: kyc_data?.liveness_score || null,
          kyc_raw_data: kyc_data?.raw || null
        }
      });
      userId = existing_user_id;
    } else {
      // Kịch bản 1: User hoàn toàn mới - Tạo User mới + Profile BTC
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const { ethers } = require('ethers');
      const randomWallet = ethers.Wallet.createRandom();

      const newUser = await prisma.user.create({
        data: {
          email,
          full_name: full_name || '',
          phone_number,
          password_hash,
          address: address || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          date_of_birth: kyc_data?.dob ? parseDate(kyc_data.dob) : null, // Thêm ngày sinh cho User mới
          role: 'customer', 
          status: 'active',
          wallet_address: randomWallet.address,
          wallet_private_key: randomWallet.privateKey,
          organizer_profile: {
            create: {
              organization_name: organization_name || '',
              business_license: business_license || null,
              description: description || null,
              identity_card: kyc_data?.id_number || null,
              kyc_status: 'pending',
              is_verified: true, // Ép xác thực luôn cho KLTN
              kyc_verified_at: new Date(),
              // --- Lưu dữ liệu eKYC ---
              id_number: kyc_data?.id_number || null,
              full_name_raw: kyc_data?.full_name || null,
              dob_raw: kyc_data?.dob || null,
              address_raw: kyc_data?.address || null,
              front_image_url: kyc_data?.front_image_url || null,
              back_image_url: kyc_data?.back_image_url || null,
              face_image_url: kyc_data?.face_image_url || null,
              facematch_score: kyc_data?.facematch_score || null,
              liveness_score: kyc_data?.liveness_score || null,
              kyc_raw_data: kyc_data?.raw || null
            }
          }
        }
      });
      userId = newUser.id;
    }

    global.otpCache.delete(`org_${email}`);
    res.status(201).json({ message: 'Hồ sơ Ban Tổ Chức đã gửi thành công! Vui lòng chờ Admin duyệt trong 24h.' });
  } catch (err) {
    console.error('Lỗi xác thực và lưu BTC:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi lưu hồ sơ.' });
  }
};

// [UC_04] Đăng nhập & Đăng ký bằng Google (Firebase Auth)
const googleLogin = async (req, res) => {
  try {
    const { email, name, uid, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Không lấy được email từ tài khoản Google.' });
    }

    // 1. Tìm user theo Email (lấy kèm cả profile BTC nNếu có)
    let user = await prisma.user.findUnique({
      where: { email },
      include: { organizer_profile: true }
    });

    if (!user) {
      // 2. Nếu chưa có, tạo tài khoản mới ngay lập tức (Kèm Ví Web3)
      const { ethers } = require('ethers');
      const randomWallet = ethers.Wallet.createRandom();
      
      user = await prisma.user.create({
        data: {
          email,
          full_name: name || 'Người dùng Google',
          role: 'customer',
          status: 'active',
          password_hash: '', // Không cần password vì đăng nhập qua Google Auth
          wallet_address: randomWallet.address,
          wallet_private_key: randomWallet.privateKey,
          avatar_url: photoURL
        }
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    // 3. Khởi tạo JWT Token cho Hệ thống BASTICKET
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key', {
      expiresIn: '1d'
    });

    res.status(200).json({
      message: 'Đăng nhập Google thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
        wallet_address: user.wallet_address,
        organizer_profile: user.organizer_profile
      }
    });

  } catch (error) {
    console.error('Lỗi khi đăng nhập Google:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống khi liên kết Google.' });
  }
};

// [UC_08_A] Quên mật khẩu - Gửi mã OTP xác nhận
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Email không tồn tại trong hệ thống.' });
    }

    // 1. Sinh OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Lưu vào Cache (Hết hạn sau 5 phút)
    global.otpCache.set(`reset_${email}`, {
      otp: otp,
      userId: user.id,
      expires: Date.now() + 5 * 60 * 1000
    });

    // 3. Gửi Email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #111; color: #fff; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #52c41a; text-align: center;">BASTICKET</h2>
        <p>Chào <b>${user.full_name || 'Bạn'}</b>,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản BASTICKET. Đây là mã xác nhận (OTP) 6 số của bạn:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #52c41a; padding: 15px; border: 1px dashed #52c41a; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">Mã này sẽ hết hạn sau 5 phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `;

    const emailSent = await sendEmail(email, 'Mã xác nhận Đặt lại mật khẩu - BASTICKET', htmlContent);
    if (!emailSent) {
      global.otpCache.delete(`reset_${email}`);
      return res.status(500).json({ error: 'Không thể gửi email OTP, vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.' });
    }

    console.log(`[DEV OTP RESET] OTP: ${otp} -> ${email}`);

    res.status(200).json({ message: 'Mã OTP đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Lỗi khi forgot password:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_08_B] Xác nhận OTP và Reset mật khẩu mới
const resetPassword = async (req, res) => {
  try {
    const { email, otp, new_password } = req.body;

    const record = global.otpCache.get(`reset_${email}`);
    if (!record) return res.status(400).json({ error: 'Phiên đặt lại mật khẩu không tồn tại hoặc đã hết hạn.' });
    if (Date.now() > record.expires) {
      global.otpCache.delete(`reset_${email}`);
      return res.status(400).json({ error: 'Mã OTP đã hết hiệu lực 5 phút.' });
    }
    if (record.otp !== otp) return res.status(400).json({ error: 'Mã OTP không chính xác!' });

    // Cập nhật mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await prisma.user.update({
      where: { id: record.userId },
      data: { password_hash }
    });

    // Xóa cache
    global.otpCache.delete(`reset_${email}`);

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });
  } catch (err) {
    console.error('Lỗi khi reset password:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật mật khẩu.' });
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
  sendRegisterOtp,
  verifyRegisterOtp,
  login,
  googleLogin,
  sendOrganizerOtp,
  verifyOrganizerOtp,
  forgotPassword,
  resetPassword,
  resendOtp
};
