const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');

// [UC_15] Yêu cầu hoàn tiền (Dành cho Người dùng)
const requestRefund = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticket_id, reason } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticket_id },
      include: { event: true, order: true }
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Không tìm thấy vé hợp lệ.' });
    }

    // Kiểm tra chính sách hoàn tiền
    // Thường cho phép refund nếu sự kiện bị hủy/dời lịch, hoặc sự kiện cho phép refund và chưa qua hạn
    const now = new Date();
    const canRefund = ticket.event.allow_refund && 
                     (['postponed', 'cancelled'].includes(ticket.event.status) || 
                      (ticket.event.refund_deadline_days && 
                       new Date(ticket.event.event_date).getTime() - now.getTime() > ticket.event.refund_deadline_days * 24 * 60 * 60 * 1000));

    if (!canRefund) {
      return res.status(400).json({ error: 'Sự kiện này không nằm trong diện được áp dụng hoàn tiền hoặc đã quá hạn.' });
    }

    if (ticket.status === 'refund_requested' || ticket.status === 'refunded') {
      return res.status(400).json({ error: 'Vé này đã được gửi yêu cầu hoàn tiền hoặc đã được hoàn tiền.' });
    }

    if (ticket.is_on_marketplace) {
      return res.status(400).json({ error: 'Vé của bạn đang được rao bán. Vui lòng hủy đăng bán trước khi gửi yêu cầu hoàn tiền.' });
    }

    await prisma.$transaction(async (tx) => {
      // Lock ticket
      await tx.ticket.update({
        where: { id: ticket_id },
        data: { status: 'refund_requested' } 
      });

      // Tìm giá vé để refund (dựa trên order item)
      const orderItem = await tx.orderItem.findFirst({
        where: { order_id: ticket.order_id, ticket_tier_id: ticket.ticket_tier_id }
      });

      const refundAmount = orderItem ? orderItem.unit_price : 0;

      await tx.refundRequest.create({
        data: {
          ticket_id: ticket.id,
          customer_id: userId,
          status: 'pending',
          refund_amount: refundAmount,
          reason: reason || 'Yêu cầu từ người dùng'
        }
      });
    });

    if (ticket.nft_token_id) {
      // Tạm khóa NFT trên blockchain nếu cần (mock)
      try {
        await web3Service.lockTicket(parseInt(ticket.nft_token_id));
      } catch (err) {
        console.warn('Blockchain Lock Warning:', err.message);
      }
    }

    res.status(201).json({ message: 'Đã gửi yêu cầu hoàn tiền thành công. Vé đang được tạm khóa để chờ Admin xét duyệt.' });
  } catch (error) {
    console.error('Lỗi yêu cầu hoàn tiền:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [ADMIN] Lấy danh sách yêu cầu hoàn tiền
const getAdminRefunds = async (req, res) => {
    try {
        const refunds = await prisma.refundRequest.findMany({
            include: {
                customer: { select: { full_name: true, email: true, avatar_url: true } },
                ticket: {
                    include: {
                        event: { select: { title: true, event_date: true } },
                        ticket_tier: { select: { tier_name: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({ data: refunds });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server.' });
    }
};

// [ADMIN] Xử lý hoàn tiền (Duyệt/Từ chối)
const processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, admin_notes } = req.body; // 'approve' | 'reject'
        const adminId = req.user.userId;

        const refund = await prisma.refundRequest.findUnique({
            where: { id },
            include: { ticket: true }
        });

        if (!refund) return res.status(404).json({ error: 'Yêu cầu không tồn tại.' });
        if (refund.status !== 'pending') return res.status(400).json({ error: 'Yêu cầu này đã được xử lý trước đó.' });

        await prisma.$transaction(async (tx) => {
            if (action === 'approve') {
                // 1. Cập nhật trạng thái Refund Request
                await tx.refundRequest.update({
                    where: { id },
                    data: { 
                        status: 'approved',
                        admin_id: adminId,
                        approved_at: new Date(),
                        admin_notes: admin_notes
                    }
                });

                // 2. Cập nhật trạng thái Vé (Vô hiệu hóa vé)
                await tx.ticket.update({
                    where: { id: refund.ticket_id },
                    data: { status: 'refunded' }
                });

                // 3. Hoàn tiền vào số dư ví của khách hàng (Nếu dùng hệ thống ví nội bộ)
                await tx.user.update({
                    where: { id: refund.customer_id },
                    data: { balance: { increment: refund.refund_amount } }
                });

                // 4. Ghi log giao dịch ví
                await tx.walletTransaction.create({
                    data: {
                        user_id: refund.customer_id,
                        amount: refund.refund_amount,
                        type: 'REFUND',
                        description: `Hoàn tiền vé cho sự kiện: ${refund.ticket_id}`,
                        status: 'completed'
                    }
                });

                // 5. Giải phóng NFT trên Blockchain (Mark as Burned/Refunded)
                if (refund.ticket.nft_token_id) {
                    try {
                        await web3Service.burnTicket(parseInt(refund.ticket.nft_token_id));
                    } catch (err) {
                        console.warn('Blockchain Burn Warning:', err.message);
                    }
                }

            } else {
                // Từ chối
                await tx.refundRequest.update({
                    where: { id },
                    data: { 
                        status: 'rejected',
                        admin_id: adminId,
                        admin_notes: admin_notes
                    }
                });

                // Trả lại trạng thái 'active' cho vé
                await tx.ticket.update({
                    where: { id: refund.ticket_id },
                    data: { status: 'active' }
                });

                // Mở khóa NFT (Unlock)
                if (refund.ticket.nft_token_id) {
                    try {
                        await web3Service.unlockTicket(parseInt(refund.ticket.nft_token_id));
                    } catch (err) {
                        console.warn('Blockchain Unlock Warning:', err.message);
                    }
                }
            }
        });

        res.status(200).json({ message: `Đã ${action === 'approve' ? 'chấp nhận' : 'từ chối'} yêu cầu hoàn tiền.` });
    } catch (error) {
        console.error('Process Refund Error:', error);
        res.status(500).json({ error: 'Lỗi server khi xử lý hoàn tiền.' });
    }
};

module.exports = { 
    requestRefund, 
    getAdminRefunds, 
    processRefund 
};
