const prisma = require('../config/prisma');

// [UC_10] Gọi lấy link thanh toán (Mock)
const createPaymentUrl = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { order_id, provider } = req.body; 
    // provider: 'vnpay' hoặc 'momo'

    // Xác minh Order tồn tại và của người này
    const order = await prisma.order.findUnique({
      where: { id: order_id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    if (order.customer_id !== userId) {
      return res.status(403).json({ error: 'Không có quyền truy cập.' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Đơn hàng đã được xử lý hoặc hết hạn.' });
    }

    // Thời gian hết hạn
    if (new Date() > new Date(order.expires_at)) {
      // TODO: Logic giải phóng chỗ (nhả lại kho vé) khi hết hạn
      return res.status(400).json({ error: 'Đơn hàng đã hết thời gian giữ chỗ. Vui lòng đặt lại.' });
    }

    // Giả lập trả về URL để user redirect sang thanh toán
    const mockPaymentUrl = `https://sandbox.${provider}.com/pay?tx=${order.order_number}&amount=${order.total_amount}`;

    // Cập nhật payment provider
    await prisma.order.update({
      where: { id: order.id },
      data: { payment_method: provider }
    });

    res.status(200).json({ url: mockPaymentUrl });
  } catch (error) {
    console.error('Lỗi khi tạo Payment URL:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_10] Webhook từ VNPay/MoMo gọi về sau khi thanh toán thành công
const webhookHandler = async (req, res) => {
  try {
    const { order_number, status, transaction_id } = req.body;

    // Validate Signature... (bỏ qua cho demo)

    const order = await prisma.order.findUnique({
      where: { order_number },
      include: { items: true, event: true } // items chứa ticket_tier_id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (status !== 'SUCCESS') {
      // Thanh toán thất bại -> Cập nhật fail, hệ thống cronjob nhả lại vé sau
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'failed', transaction_id }
      });
      return res.status(200).json({ message: 'Cập nhật thất bại' });
    }

    // 1. Thanh toán thành công -> Đổi Order status
    // 2. Kích hoạt Blockchain Smart Contract (Đúc vé / Mint NFT)
    // Giả lập Hash trả về từ Smart Contract
    const txHash = '0x' + require('crypto').randomBytes(32).toString('hex');

    // 3. Sinh ra Database Records cho Tickets tương ứng
    await prisma.$transaction(async (tx) => {
      // Cập nhật Order
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'paid', transaction_id, transaction_hash: txHash }
      });

      // Tạo vé sở hữu cho user
      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          await tx.ticket.create({
            data: {
              order_id: order.id,
              event_id: order.event_id,
              ticket_tier_id: item.ticket_tier_id,
              ticket_number: `TKT-${order_number}-${item.id}-${i}`,
              nft_token_id: `NFT-${Date.now()}-${i}`,
              nft_mint_tx_hash: txHash,
              status: 'minted',
              current_owner_id: order.customer_id,
              original_buyer_id: order.customer_id,
            }
          });
        }
      }
    });

    res.status(200).json({ message: 'Webhook Success. Ticket Minted!' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};

// [UX/Real-time] Kiểm tra trạng thái thanh toán (để Frontend Polling)
const getPaymentStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await prisma.order.findUnique({
      where: { order_number: orderNumber },
      select: { status: true, transaction_id: true, transaction_hash: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại.' });
    }

    res.status(200).json({ data: order });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  createPaymentUrl,
  webhookHandler,
  getPaymentStatus
};
