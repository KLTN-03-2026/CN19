const prisma = require('../config/prisma');

// Mock data base cấu hình, thực tế tạo Settings table hoặc lưu file
let systemConfig = {
  platform_fee_percent: 5,
  marketplace_fee_percent: 5,
  smart_contract_address: '0x1234567890abcdef',
  rpc_url: 'https://rpc-mumbai.matic.today'
};

// [UC_26] Quản lý cấu hình hệ thống
const getConfig = async (req, res) => {
  try {
    // Có thể fetch từ Database bảng config
    res.status(200).json({ data: systemConfig });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const { platform_fee_percent, smart_contract_address, otp_code } = req.body;
    if (otp_code !== '123456') { // Check 2FA cực kỳ quan trọng
      return res.status(403).json({ error: 'Mã OTP không hợp lệ do thay đổi cấu trúc cốt lõi.' });
    }

    if (platform_fee_percent) systemConfig.platform_fee_percent = platform_fee_percent;
    if (smart_contract_address) systemConfig.smart_contract_address = smart_contract_address;

    // Ghi audit log
    await prisma.adminActionLog.create({
      data: {
        admin_id: req.user.userId,
        action_type: 'update_system_config',
        target_id: 'config_singleton',
        new_value: JSON.stringify({ platform_fee_percent, smart_contract_address })
      }
    });

    res.status(200).json({ message: 'Cập nhật cấu hình hệ thống thành công.', data: systemConfig });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_27] Cảnh báo gian lận
const getFraudAlerts = async (req, res) => {
  try {
    const alerts = await prisma.botDetectionLog.findMany({
      orderBy: { created_at: 'desc' },
      include: { user: { select: { email: true } }, order: { select: { order_number: true } } }
    });
    res.status(200).json({ data: alerts });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

const processFraudAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'ban_user' | 'safe'

    const alert = await prisma.botDetectionLog.findUnique({ where: { id } });
    if (!alert) return res.status(404).json({ error: 'Log không tồn tại' });

    if (action === 'ban_user') {
      await prisma.user.update({
        where: { id: alert.user_id },
        data: { status: 'banned' }
      });
      // Thu hồi Token / Logout logic
    }

    res.status(200).json({ message: `Đã xử lý cảnh báo rủi ro: ${action}` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_28] Thống kê Dashboard Admin
const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    const totalOrders = await prisma.order.count({ where: { status: 'paid' } });
    
    res.status(200).json({
      data: {
        total_users: totalUsers,
        total_events: totalEvents,
        total_successful_orders: totalOrders,
        platform_fee_percent: systemConfig.platform_fee_percent
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getConfig, updateConfig,
  getFraudAlerts, processFraudAlert,
  getPlatformStats
};
