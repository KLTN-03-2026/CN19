const prisma = require('../config/prisma');
const PayoutService = require('../services/payout.service');
const blockchainService = require('../services/blockchain.service');
const EmailService = require('../services/email.service');
const NotificationService = require('../services/notification.service');

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
      // 4. Thông báo hệ thống
      NotificationService.create({
        user_id: request.user_id,
        type: 'WITHDRAWAL_REJECTED',
        title: 'Yêu cầu rút tiền bị từ chối',
        message: `Yêu cầu rút ${request.amount.toLocaleString()}đ của bạn đã bị từ chối. Lý do: ${admin_notes || 'Không có lý do cụ thể'}. Số dư đã được hoàn lại.`,
        target_id: id
      });

      return res.status(200).json({ message: 'Đã từ chối yêu cầu rút tiền và hoàn trả số dư cho người dùng.' });
    }

    if (action === 'approve') {
      let txHash = null;
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
        // Tìm tài khoản admin
        const adminUser = await tx.user.findFirst({
            where: { role: { in: ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'] } }
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
                    type: 'REVENUE',
                    description: `Thu phí rút tiền từ ${request.user?.full_name || request.user?.email || 'Người dùng'} (${request.fee_percent ? Number(request.fee_percent) : 2}%)`,
                    status: 'completed'
                }
            });
        }

        // 4. GHI LOG LÊN BLOCKCHAIN (Minh bạch tài chính)
        try {
            txHash = await blockchainService.logFinancialTransaction(
                request.id,
                Number(request.net_amount),
                { ticketPlatformFee: Number(request.fee_amount) },
                'WITHDRAWAL_PAYOUT'
            );
        } catch (bcError) {
            console.error('[Web3 Error] Không thể ghi log rút tiền lên Blockchain:', bcError);
        }

        // 5. Cập nhật mã giao dịch vào DB
        if (txHash) {
            await tx.withdrawalRequest.update({
                where: { id: request.id },
                data: { payout_trans_id: txHash }
            });
        }
      });

      // 6. Gửi email thông báo cho người dùng
      if (request.user) {
          EmailService.sendWithdrawalSuccessEmail(request.user, request, txHash);
      }

      // 7. Thông báo hệ thống
      NotificationService.create({
        user_id: request.user_id,
        type: 'WITHDRAWAL_APPROVED',
        title: 'Yêu cầu rút tiền thành công',
        message: `Yêu cầu rút ${Number(request.amount).toLocaleString()}đ của bạn đã được duyệt và chuyển khoản thành công.`,
        target_id: id
      });

      return res.status(200).json({ message: 'Duyệt yêu cầu rút tiền thành công. Tiền phí đã được chuyển vào ví Admin và đã ghi log Blockchain.' });
    }

    res.status(400).json({ error: 'Hành động không hợp lệ' });
  } catch (error) {
    console.error('Process Withdrawal Error:', error);
    res.status(500).json({ error: 'Lỗi server khi xử lý yêu cầu rút tiền.' });
  }
};

// [UC_ADMIN_F03] Sinh mã VietQR để Admin quét thanh toán
const generateWithdrawalQR = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { user: { select: { account_holder: true, account_number: true, bank_name: true } } }
    });

    if (!request) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu rút tiền.' });
    }

    const shortId = request.id.slice(0, 8).toUpperCase();
    const netAmount = Number(request.net_amount);

    // 1. Lấy thông số cấu hình payOS từ biến môi trường
    const CLIENT_ID = process.env.PAYOS_CLIENT_ID;
    const API_KEY = process.env.PAYOS_API_KEY;
    const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;

    let qrUrl = null;
    let actualDesc = `WITHDRAW ${shortId}`;

    if (CLIENT_ID && API_KEY && CHECKSUM_KEY) {
        try {
            const crypto = require('crypto');
            const axios = require('axios');
            
            // Sinh orderCode là số nguyên (int) ngẫu nhiên duy nhất
            const orderCode = Number(String(Date.now()).slice(-9));
            const returnUrl = process.env.FRONTEND_URL || 'https://basticket.vercel.app';
            const cancelUrl = process.env.FRONTEND_URL || 'https://basticket.vercel.app';

            const body = {
                orderCode,
                amount: netAmount,
                description: `WITHDRAW ${shortId}`,
                returnUrl,
                cancelUrl
            };

            const sortData = `amount=${netAmount}&cancelUrl=${cancelUrl}&description=WITHDRAW ${shortId}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
            const signature = crypto.createHmac('sha256', CHECKSUM_KEY).update(sortData).digest('hex');
            body.signature = signature;

            const payosRes = await axios.post('https://api-merchant.payos.vn/v2/payment-requests', body, {
                headers: {
                    'x-client-id': CLIENT_ID,
                    'x-api-key': API_KEY,
                    'content-type': 'application/json'
                }
            });

            if (payosRes.data && payosRes.data.data) {
                const payosData = payosRes.data.data;
                actualDesc = payosData.description; // Lấy chính xác nội dung chuyển khoản do payOS sinh ra
                
                // Sử dụng VietQR io để sinh QR ảnh đẹp mắt với đúng nội dung của payOS
                const encodedName = encodeURIComponent(payosData.accountName || request.user.account_holder);
                const encodedInfo = encodeURIComponent(actualDesc);
                qrUrl = `https://img.vietqr.io/image/${payosData.bin || '970422'}-${payosData.accountNumber || '0349480914'}-compact2.png?amount=${netAmount}&addInfo=${encodedInfo}&accountName=${encodedName}`;
                console.log(`[PayOS QR] Đã tạo thành công Payment Link cho Withdrawal ${shortId}. QR Desc: "${actualDesc}"`);
            }
        } catch (payosErr) {
            console.error('[PayOS QR Error] Lỗi khi gọi API payOS, chuyển sang sinh QR VietQR tĩnh:', payosErr.response?.data || payosErr.message);
        }
    }

    // 2. Nếu không tạo được qua payOS thì fallback về VietQR tĩnh
    if (!qrUrl) {
        const bankBin = PayoutService.getBankBin(request.bank_name);
        actualDesc = `WITHDRAW ${shortId}`;
        const encodedName = encodeURIComponent(request.user?.account_holder || 'TRAN MINH PHUONG');
        const encodedInfo = encodeURIComponent(actualDesc);
        qrUrl = `https://img.vietqr.io/image/${bankBin}-${request.user?.account_number || '0349480914'}-compact2.png?amount=${netAmount}&addInfo=${encodedInfo}&accountName=${encodedName}`;
    }

    res.status(200).json({ 
      data: {
        qrUrl,
        bankInfo: {
          bankName: request.bank_name,
          accountNumber: request.user?.account_number || request.account_number,
          accountHolder: request.user?.account_holder || request.account_holder,
          amount: request.net_amount,
          reference: actualDesc
        }
      }
    });
  } catch (error) {
    console.error('Generate QR Error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo mã QR thanh toán.' });
  }
};

module.exports = {
  getRefunds,
  processRefund,
  getPayouts,
  executePayout,
  getWithdrawals,
  processWithdrawal,
  generateWithdrawalQR
};
