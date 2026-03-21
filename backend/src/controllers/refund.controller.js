const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');

// [UC_15] Yêu cầu hoàn tiền
const requestRefund = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticket_id } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticket_id },
      include: { event: true, order: true }
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Không tìm thấy vé hợp lệ.' });
    }

    if (!ticket.event.allow_refund || !['postponed', 'cancelled'].includes(ticket.event.status)) {
      return res.status(400).json({ error: 'Sự kiện này không nằm trong diện được áp dụng hoàn tiền.' });
    }

    if (ticket.is_on_marketplace) {
      return res.status(400).json({ error: 'Vé của bạn đang được rao bán. Vui lòng hủy đăng bán trước khi gửi yêu cầu Refund.' });
    }

    await prisma.$transaction(async (tx) => {
      // Lock ticket
      await tx.ticket.update({
        where: { id: ticket_id },
        data: { status: 'refund_requested' } // Ngăn checkin, transfer
      });

      // Tính tổng refund based on unit price 
      // Do lấy từ primary mock: tìm order item
      const orderItem = await tx.orderItem.findFirst({
        where: { order_id: ticket.order_id, ticket_tier_id: ticket.ticket_tier_id }
      });

      const refundAmount = orderItem ? orderItem.unit_price : 0;

      await tx.refundRequest.create({
        data: {
          ticket_id: ticket.id,
          customer_id: userId,
          status: 'pending',
          refund_amount: refundAmount
        }
      });
    });

    if (ticket.nft_token_id) {
      // Khóa NFT ngăn sử dụng hoặc transfer
      await web3Service.lockTicket(parseInt(ticket.nft_token_id));
    }

    res.status(201).json({ message: 'Đã gửi yêu cầu hoàn tiền thành công. Vé đang được tạm khóa trên Blockchain.' });
  } catch (error) {
    console.error('Lỗi yêu cầu hoàn tiền:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = { requestRefund };
