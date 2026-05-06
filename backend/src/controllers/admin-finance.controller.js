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

// [UC_ADMIN_F03] Quản lý yêu cầu rút tiền: Lấy danh sách
const getWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status ? { status } : {};

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: whereClause,
      include: {
        user: { select: { email: true, full_name: true, bank_name: true, account_number: true, account_holder: true, role: true } },
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ data: withdrawals });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách yêu cầu rút tiền.' });
  }
};

// [UC_ADMIN_F03] Xử lý yêu cầu rút tiền
const processWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, admin_notes } = req.body; // 'approve' | 'reject'

    const request = await prisma.withdrawalRequest.findUnique({ 
      where: { id },
      include: { user: true } 
    });
    
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ hoặc đã được xử lý.' });
    }

    if (action === 'reject') {
      await prisma.$transaction(async (tx) => {
        // 1. Cập nhật trạng thái yêu cầu
        await tx.withdrawalRequest.update({ 
          where: { id }, 
          data: { status: 'rejected', processed_at: new Date(), admin_notes }
        });

        // 2. Hoàn tiền lại cho User
        await tx.user.update({
          where: { id: request.user_id },
          data: { balance: { increment: request.amount } }
        });

        // 3. Cập nhật trạng thái giao dịch ví (tìm giao dịch rút tiền gần nhất của user này)
        const lastTx = await tx.walletTransaction.findFirst({
            where: { user_id: request.user_id, type: 'WITHDRAWAL', status: 'pending' },
            orderBy: { created_at: 'desc' }
        });
        if (lastTx) {
            await tx.walletTransaction.update({
                where: { id: lastTx.id },
                data: { status: 'rejected', description: lastTx.description + ' (Bị từ chối)' }
            });
        }
      });
      return res.status(200).json({ message: 'Đã từ chối yêu cầu rút tiền và hoàn trả số dư cho người dùng.' });
    }

    if (action === 'approve') {
      await prisma.$transaction(async (tx) => {
        // 1. Cập nhật trạng thái yêu cầu
        await tx.withdrawalRequest.update({ 
          where: { id }, 
          data: { status: 'approved', processed_at: new Date(), admin_notes }
        });

        // 2. Cập nhật trạng thái giao dịch ví của BTC
        const lastTx = await tx.walletTransaction.findFirst({
            where: { user_id: request.user_id, type: 'WITHDRAWAL', status: 'pending' },
            orderBy: { created_at: 'desc' }
        });
        if (lastTx) {
            await tx.walletTransaction.update({
                where: { id: lastTx.id },
                data: { status: 'completed' }
            });
        }

        // 3. CHUYỂN PHÍ 2% VỀ VÍ ADMIN
        // Tìm tài khoản admin đầu tiên (hoặc admin đang xử lý)
        const adminUser = await tx.user.findFirst({
            where: { role: 'admin' }
        });

        if (adminUser && request.fee_amount > 0) {
            // Cộng tiền vào ví admin
            await tx.user.update({
                where: { id: adminUser.id },
                data: { balance: { increment: request.fee_amount } }
            });

            // Tạo giao dịch thu phí cho admin
            await tx.walletTransaction.create({
                data: {
                    user_id: adminUser.id,
                    amount: request.fee_amount,
                    type: 'REVENUE', // Hoặc tạo thêm type 'PLATFORM_FEE'
                    description: `Thu phí rút tiền từ ${request.user.full_name || request.user.email} (2%)`,
                    status: 'completed'
                }
            });
        }
      });

      return res.status(200).json({ message: 'Duyệt yêu cầu rút tiền thành công. Tiền phí đã được chuyển vào ví Admin.' });
    }

    res.status(400).json({ error: 'Hành động không hợp lệ' });
  } catch (error) {
    console.error('Process Withdrawal Error:', error);
    res.status(500).json({ error: 'Lỗi server khi xử lý yêu cầu rút tiền.' });
  }
};

module.exports = {
  getRefunds,
  processRefund,
  getPayouts,
  executePayout,
  getWithdrawals,
  processWithdrawal
};
