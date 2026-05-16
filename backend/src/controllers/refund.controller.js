const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');
const NotificationService = require('../services/notification.service');
const emailService = require('../services/email.service');

// [UC_15] Yêu cầu hoàn tiền (Dành cho Người dùng)
const requestRefund = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticket_id, reason } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticket_id },
      include: { 
        event: true, 
        order: true,
        transactions: {
          where: { status: { in: ['paid', 'success', 'completed'] } },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
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

      let refundAmount = 0;
      let resaleNote = '';
      if (ticket.transactions && ticket.transactions.length > 0 && ticket.transactions[0].buyer_id === userId) {
        refundAmount = Number(ticket.transactions[0].buyer_pay_amount);
        resaleNote = ` (Hoàn tiền mua lại vé trên Marketplace: ${refundAmount.toLocaleString('vi-VN')}đ)`;
      } else {
        const orderItem = await tx.orderItem.findFirst({
          where: { order_id: ticket.order_id, ticket_tier_id: ticket.ticket_tier_id }
        });
        refundAmount = orderItem ? Number(orderItem.unit_price) : 0;
      }

      await tx.refundRequest.create({
        data: {
          ticket_id: ticket.id,
          customer_id: userId,
          status: 'pending',
          refund_amount: refundAmount,
          type: ticket.event.status === 'postponed' ? 'event_postponed' : (ticket.event.status === 'cancelled' ? 'event_cancelled' : 'customer_request'),
          reason: (reason || (ticket.event.status === 'postponed' ? `Yêu cầu hoàn tiền do sự kiện dời lịch: ${ticket.event.title}` : 'Yêu cầu từ người dùng')) + resaleNote
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
        // Tự động rà soát tất cả các sự kiện đã hủy để tạo Refund Request nếu còn thiếu
        const cancelledEvents = await prisma.event.findMany({
            where: { status: 'cancelled' }
        });

        for (const ev of cancelledEvents) {
            const tickets = await prisma.ticket.findMany({
                where: { event_id: ev.id },
                include: { 
                    ticket_tier: true,
                    transactions: {
                        where: { status: { in: ['paid', 'success', 'completed'] } },
                        orderBy: { created_at: 'desc' },
                        take: 1
                    }
                }
            });
            for (const t of tickets) {
                const originalPrice = t.ticket_tier ? Number(t.ticket_tier.price) : 0;
                
                if (t.transactions && t.transactions.length > 0) {
                    const lastTx = t.transactions[0];
                    const buyerRefundAmount = Number(lastTx.buyer_pay_amount);
                    const sellerRefundAmount = originalPrice;
                    
                    // 1. Hoàn tiền cho Người mua lại (Buyer)
                    const buyerExist = await prisma.refundRequest.findFirst({
                        where: { ticket_id: t.id, customer_id: lastTx.buyer_id }
                    });
                    if (!buyerExist) {
                        await prisma.refundRequest.create({
                            data: {
                                ticket_id: t.id,
                                customer_id: lastTx.buyer_id,
                                status: 'pending',
                                refund_amount: buyerRefundAmount,
                                type: 'event_cancelled',
                                reason: `Tự động hoàn tiền mua vé Marketplace do sự kiện bị hủy: ${ev.title} (Giá mua: ${buyerRefundAmount.toLocaleString('vi-VN')}đ)`
                            }
                        });
                    } else if (buyerExist.status === 'pending') {
                        await prisma.refundRequest.update({
                            where: { id: buyerExist.id },
                            data: { 
                                refund_amount: buyerRefundAmount,
                                reason: `Tự động hoàn tiền mua vé Marketplace do sự kiện bị hủy: ${ev.title} (Giá mua: ${buyerRefundAmount.toLocaleString('vi-VN')}đ)`
                            }
                        });
                    }

                    // 2. Hoàn tiền gốc cho Người bán lại (Seller)
                    const sellerExist = await prisma.refundRequest.findFirst({
                        where: { ticket_id: t.id, customer_id: lastTx.seller_id }
                    });
                    if (!sellerExist) {
                        await prisma.refundRequest.create({
                            data: {
                                ticket_id: t.id,
                                customer_id: lastTx.seller_id,
                                status: 'pending',
                                refund_amount: sellerRefundAmount,
                                type: 'event_cancelled',
                                reason: `Tự động hoàn tiền gốc mua vé do sự kiện bị hủy (Vé đã bán lại trên Marketplace): ${ev.title} (Giá gốc: ${sellerRefundAmount.toLocaleString('vi-VN')}đ)`
                            }
                        });
                    } else if (sellerExist.status === 'pending') {
                        await prisma.refundRequest.update({
                            where: { id: sellerExist.id },
                            data: { 
                                refund_amount: sellerRefundAmount,
                                reason: `Tự động hoàn tiền gốc mua vé do sự kiện bị hủy (Vé đã bán lại trên Marketplace): ${ev.title} (Giá gốc: ${sellerRefundAmount.toLocaleString('vi-VN')}đ)`
                            }
                        });
                    }
                } else {
                    // Vé chưa bán lại trên Marketplace
                    const exist = await prisma.refundRequest.findFirst({
                        where: { ticket_id: t.id, customer_id: t.current_owner_id }
                    });
                    if (!exist) {
                        await prisma.refundRequest.create({
                            data: {
                                ticket_id: t.id,
                                customer_id: t.current_owner_id,
                                status: 'pending',
                                refund_amount: originalPrice,
                                type: 'event_cancelled',
                                reason: `Tự động hoàn tiền do sự kiện bị hủy: ${ev.title}`
                            }
                        });
                    } else if (exist.status === 'pending') {
                        await prisma.refundRequest.update({
                            where: { id: exist.id },
                            data: { 
                                refund_amount: originalPrice,
                                reason: `Tự động hoàn tiền do sự kiện bị hủy: ${ev.title}`
                            }
                        });
                    }
                }
            }
        }

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
        console.error('Lỗi getAdminRefunds:', error);
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

        // Gửi thông báo in-app và Email cho khách hàng
        const customer = await prisma.user.findUnique({
            where: { id: refund.customer_id }
        });

        const fullRefundReq = await prisma.refundRequest.findUnique({
            where: { id },
            include: {
                ticket: {
                    include: { event: true }
                }
            }
        });

        if (customer && fullRefundReq) {
            const isApprove = action === 'approve';
            const formattedAmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fullRefundReq.refund_amount);
            
            // 1. Tạo in-app Notification
            await NotificationService.create({
                user_id: customer.id,
                type: isApprove ? 'REFUND_APPROVED' : 'REFUND_REJECTED',
                title: isApprove ? 'Hoàn Tiền Thành Công' : 'Từ Chối Hoàn Tiền',
                message: isApprove 
                    ? `Yêu cầu hoàn ${formattedAmt} cho vé #${fullRefundReq.ticket?.ticket_number || fullRefundReq.ticket_id.slice(0,8).toUpperCase()} đã được phê duyệt và cộng vào số dư ví của bạn.`
                    : `Yêu cầu hoàn tiền vé #${fullRefundReq.ticket?.ticket_number || fullRefundReq.ticket_id.slice(0,8).toUpperCase()} bị từ chối. Lý do: "${admin_notes || 'Không đủ điều kiện'}".`,
                target_id: fullRefundReq.ticket_id
            });

            // 2. Gửi Email thông báo
            await emailService.sendRefundNotificationEmail(customer, fullRefundReq, action, admin_notes);
        }

        res.status(200).json({ message: `Đã ${action === 'approve' ? 'chấp nhận' : 'từ chối'} yêu cầu hoàn tiền.` });
    } catch (error) {
        console.error('Process Refund Error:', error);
        res.status(500).json({ error: 'Lỗi server khi xử lý hoàn tiền.' });
    }
};

// [UC_16] Hủy yêu cầu hoàn tiền (Dành cho Người dùng khi Admin chưa duyệt)
const cancelRefundRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticket_id } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticket_id }
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Không tìm thấy vé hợp lệ hoặc bạn không phải chủ sở hữu.' });
    }

    if (ticket.status !== 'refund_requested') {
      return res.status(400).json({ error: 'Vé này hiện không ở trạng thái chờ hoàn tiền.' });
    }

    const pendingRefund = await prisma.refundRequest.findFirst({
      where: { ticket_id: ticket.id, customer_id: userId, status: 'pending' }
    });

    if (!pendingRefund) {
      return res.status(400).json({ error: 'Không tìm thấy đơn yêu cầu hoàn tiền đang chờ duyệt cho vé này.' });
    }

    await prisma.$transaction(async (tx) => {
      // Đổi trạng thái RefundRequest thành 'cancelled'
      await tx.refundRequest.update({
        where: { id: pendingRefund.id },
        data: { status: 'cancelled' }
      });

      // Khôi phục trạng thái vé về 'minted'
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: 'minted' }
      });
    });

    if (ticket.nft_token_id) {
      try {
        await web3Service.unlockTicket(parseInt(ticket.nft_token_id));
      } catch (err) {
        console.warn('Blockchain Unlock Warning:', err.message);
      }
    }

    res.status(200).json({ message: 'Đã rút lại yêu cầu hoàn tiền thành công. Vé của bạn đã được mở khóa và có thể sử dụng bình thường.' });
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu hoàn tiền:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = { 
    requestRefund, 
    cancelRefundRequest,
    getAdminRefunds, 
    processRefund 
};
