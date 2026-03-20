const prisma = require('../config/prisma');

// [UC_23] Quản lý yêu cầu hoàn tiền: Lấy danh sách
const getRefunds = async (req, res) => {
  try {
    const { status } = req.query; // pending, approved, rejected
    const whereClause = status ? { status } : {};

    const refunds = await prisma.refundRequest.findMany({
      where: whereClause,
      include: {
        ticket: { select: { ticket_number: true, nft_token_id: true } },
        customer: { select: { email: true } },
      },
      orderBy: { id: 'desc' }
    });

    res.status(200).json({ data: refunds });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_23] Xử lý đơn hoàn tiền
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, otp_code } = req.body; // 'approve' | 'reject'

    const refund = await prisma.refundRequest.findUnique({ where: { id }, include: { ticket: true } });
    
    if (!refund || refund.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ hoặc đã được xử lý.' });
    }

    if (action === 'reject') {
      await prisma.$transaction(async (tx) => {
        await tx.refundRequest.update({ where: { id }, data: { status: 'rejected', approved_at: new Date(), admin_id: req.user.userId }});
        await tx.ticket.update({ where: { id: refund.ticket_id }, data: { status: 'minted' }}); // Mở khóa vé
      });
      return res.status(200).json({ message: 'Đã từ chối hoàn tiền và mở khóa vé.' });
    }

    if (action === 'approve') {
      // Validate OTP
      if (!otp_code || otp_code !== '123456') { // Mock OTP validation
        return res.status(401).json({ error: 'Mã xác thực OTP không chính xác.' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.refundRequest.update({ where: { id }, data: { status: 'approved', approved_at: new Date(), admin_id: req.user.userId }});
        await tx.ticket.update({ where: { id: refund.ticket_id }, data: { status: 'refunded' }}); // Gọi Web3 Burn NFT
      });

      // TODO: Gọi API VNPay/Momo Refund trả tiền về ví Client
      return res.status(200).json({ message: 'Duyệt hoàn tiền thành công. Tiền đang được chuyển, NFT đã được lên lịch Burn.' });
    }

    res.status(400).json({ error: 'Hành động không hợp lệ' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_25] Quản lý đối soát doanh thu & Giải ngân
const getPayouts = async (req, res) => {
  try {
    const payouts = await prisma.escrowPayout.findMany({
      include: {
        event: { select: { title: true, organizer: { select: { organization_name: true } } } }
      },
      orderBy: { id: 'desc' }
    });
    res.status(200).json({ data: payouts });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

const executePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp_code } = req.body;

    const payout = await prisma.escrowPayout.findUnique({ where: { id } });
    
    if (!payout || payout.status !== 'pending') {
      return res.status(400).json({ error: 'Kỳ đối soát không hợp lệ hoặc đã thanh toán.' });
    }

    if (otp_code !== '123456') { // Mock Check 2FA
      return res.status(403).json({ error: 'Mã OTP không hợp lệ.' }); 
    }

    // TODO: Gọi API Ngân hàng chuyển khoản (Bank Transfer)

    const updatedPayout = await prisma.escrowPayout.update({
      where: { id },
      data: { status: 'settled', payout_trans_id: 'BNK' + Date.now() }
    });

    res.status(200).json({ message: 'Giải ngân thành công!', data: updatedPayout });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getRefunds,
  processRefund,
  getPayouts,
  executePayout
};
