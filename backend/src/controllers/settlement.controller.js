const prisma = require('../config/prisma');

/**
 * Controller xử lý Quyết toán sự kiện (Event Settlement)
 */
const SettlementController = {
  /**
   * [BTC] Lấy danh sách các sự kiện đã kết thúc và trạng thái đối soát của chúng
   */
  getOrganizerEvents: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { startDate, endDate } = req.query;
      const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
      
      if (!organizer) return res.status(403).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });

      // Build filter
      let dateFilter = {};
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        dateFilter = {
          event_date: {
            ...(start && { gte: start }),
            ...(end && { lte: end })
          }
        };
      }

      const events = await prisma.event.findMany({
        where: {
          organizer_id: organizer.id,
          ...dateFilter
        },
        include: {
          payouts: true, // Lịch sử đối soát
        },
        orderBy: { event_date: 'desc' }
      });

      // Với mỗi sự kiện, tính toán doanh thu "Pending" (chưa đối soát)
      const enhancedEvents = await Promise.all(events.map(async (event) => {
        const unsettledOrders = await prisma.order.findMany({
          where: {
            event_id: event.id,
            status: 'paid',
            is_settled: false,
            order_type: 'TICKET_PURCHASE'
          },
          select: {
            id: true,
            total_amount: true,
            platform_fee: true
          }
        });

        // Tính toán chi tiết doanh thu từ Vé và Vật phẩm
        let ticketRevenue = 0;
        let merchRevenue = 0;
        let totalFees = unsettledOrders.reduce((sum, order) => sum + Number(order.platform_fee), 0);

        for (const order of unsettledOrders) {
          const orderItems = await prisma.orderItem.findMany({
            where: { order_id: order.id }
          });
          const merchItems = await prisma.merchandiseOrderItem.findMany({
            where: { order_id: order.id }
          });

          ticketRevenue += orderItems.reduce((s, i) => s + Number(i.subtotal), 0);
          merchRevenue += merchItems.reduce((s, i) => s + Number(i.subtotal), 0);
        }

        // -- Marketplace Revenue for this event --
        const unsettledMarketplace = await prisma.marketplaceTransaction.findMany({
          where: {
            ticket: { event_id: event.id },
            status: 'paid',
            is_settled: false
          }
        });

        const pendingMarketplaceRevenue = unsettledMarketplace.reduce((sum, tx) => {
          return sum + Number(tx.organizer_royalty || 0);
        }, 0);

        const pendingRevenue = (ticketRevenue + merchRevenue + pendingMarketplaceRevenue) - totalFees;

        // Tìm yêu cầu quyết toán gần nhất
        const latestPayout = event.payouts.length > 0 ? event.payouts[0] : null;

        return {
          ...event,
          financials: {
            pending_orders_count: unsettledOrders.length,
            pending_marketplace_count: unsettledMarketplace.length,
            pending_revenue: pendingRevenue,
            ticket_revenue: ticketRevenue,
            merch_revenue: merchRevenue,
            marketplace_royalty: pendingMarketplaceRevenue,
            total_revenue: ticketRevenue + merchRevenue + pendingMarketplaceRevenue,
            total_fees: totalFees
          },
          settlement_status: latestPayout ? latestPayout.status : ((unsettledOrders.length > 0 || unsettledMarketplace.length > 0) ? 'eligible' : 'no_data')
        };
      }));

      res.status(200).json({ data: enhancedEvents });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi server khi lấy danh sách quyết toán.' });
    }
  },

  /**
   * [BTC] Gửi yêu cầu quyết toán cho một sự kiện
   */
  requestSettlement: async (req, res) => {
    try {
      const { eventId } = req.body;
      const userId = req.user.userId;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { payouts: { where: { status: { in: ['pending', 'processing'] } } } }
      });

      if (!event || event.organizer_id !== organizer.id) {
        return res.status(403).json({ error: 'Bạn không có quyền yêu cầu quyết toán cho sự kiện này.' });
      }

      // Kiểm tra thời gian kết thúc sự kiện
      const eventEndDate = event.end_date || event.event_date;
      if (eventEndDate && new Date(eventEndDate) > new Date()) {
        return res.status(400).json({ error: 'Sự kiện chưa kết thúc. Bạn chỉ có thể yêu cầu quyết toán sau khi sự kiện hoàn thành.' });
      }

      if (event.payouts.length > 0) {
        return res.status(400).json({ error: 'Sự kiện này đang có yêu cầu quyết toán chờ xử lý.' });
      }

      // Tính toán số liệu
      const unsettledOrders = await prisma.order.findMany({
        where: { event_id: eventId, status: 'paid', is_settled: false, order_type: 'TICKET_PURCHASE' }
      });

      if (unsettledOrders.length === 0) {
        return res.status(400).json({ error: 'Không có giao dịch nào mới cần đối soát.' });
      }

      const totalRevenue = unsettledOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const platformFee = unsettledOrders.reduce((sum, o) => sum + Number(o.platform_fee), 0);
      
      // -- Add Marketplace Royalties --
      const unsettledMarketplace = await prisma.marketplaceTransaction.findMany({
        where: { ticket: { event_id: eventId }, status: 'paid', is_settled: false }
      });
      const marketplaceRoyalties = unsettledMarketplace.reduce((sum, tx) => sum + Number(tx.organizer_royalty || 0), 0);

      const netPayout = (totalRevenue - platformFee) + marketplaceRoyalties;

      // Tạo yêu cầu
      const payoutRequest = await prisma.escrowPayout.create({
        data: {
          event_id: eventId,
          total_revenue: totalRevenue,
          platform_fee: platformFee,
          net_payout: netPayout,
          status: 'pending',
          requested_at: new Date(),
          bank_info: {
            bank_name: user.bank_name || organizer.bank_name,
            account_number: user.account_number || organizer.account_number,
            account_holder: user.account_holder || organizer.account_holder
          }
        }
      });

      res.status(201).json({ message: 'Yêu cầu quyết toán đã được gửi.', data: payoutRequest });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi server khi gửi yêu cầu quyết toán.' });
    }
  },

  /**
   * [Admin] Lấy danh sách tất cả yêu cầu quyết toán
   */
  adminGetSettlements: async (req, res) => {
    try {
      const { status } = req.query;
      const whereClause = status ? { status } : {};

      const payouts = await prisma.escrowPayout.findMany({
        where: whereClause,
        include: {
          event: {
            select: {
              title: true,
              event_date: true,
              organizer: { select: { organization_name: true } }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.status(200).json({ data: payouts });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi server.' });
    }
  },

  /**
   * [Admin] Xử lý yêu cầu quyết toán (Duyệt/Từ chối)
   */
  adminProcessSettlement: async (req, res) => {
    try {
      const { id } = req.params;
      const { action, note, evidence_url } = req.body; // action: 'approve' | 'reject' | 'settle'

      const payout = await prisma.escrowPayout.findUnique({
        where: { id },
        include: { 
          event: { 
            include: { 
              organizer: true 
            } 
          } 
        }
      });

      if (!payout || payout.status === 'settled') {
        return res.status(400).json({ error: 'Yêu cầu không hợp lệ hoặc đã được thanh toán.' });
      }

      if (action === 'reject') {
        const updated = await prisma.escrowPayout.update({
          where: { id },
          data: { status: 'rejected', admin_notes: note, processed_at: new Date() }
        });
        return res.status(200).json({ message: 'Đã từ chối yêu cầu quyết toán.', data: updated });
      }

      if (action === 'approve') {
        const updated = await prisma.escrowPayout.update({
          where: { id },
          data: { status: 'processing', admin_notes: note }
        });
        return res.status(200).json({ message: 'Đã chuyển trạng thái sang Đang xử lý.', data: updated });
      }

      if (action === 'settle') {
        // Thực hiện kết chuyển tiền
        await prisma.$transaction(async (tx) => {
          // 1. Cập nhật trạng thái Payout
          await tx.escrowPayout.update({
            where: { id },
            data: { 
              status: 'settled', 
              processed_at: new Date(), 
              evidence_url, 
              admin_notes: note,
              payout_trans_id: 'SETTLE-' + Date.now() 
            }
          });

          // 2. Cộng tiền vào balance Organizer (User)
          await tx.user.update({
            where: { id: payout.event.organizer.user_id },
            data: { balance: { increment: payout.net_payout } }
          });

          // 3. Tạo WalletTransaction cho Organizer
          await tx.walletTransaction.create({
            data: {
              user_id: payout.event.organizer.user_id,
              amount: payout.net_payout,
              type: 'REVENUE',
              description: `Quyết toán thủ công sự kiện: ${payout.event.title}`,
              status: 'completed'
            }
          });

          // 4. Đánh dấu các Order là đã đối soát
          await tx.order.updateMany({
            where: { event_id: payout.event_id, status: 'paid', is_settled: false, order_type: 'TICKET_PURCHASE' },
            data: { is_settled: true }
          });

          // 5. CẬP NHẬT MARKETPLACE PAYOUTS (Người bán hưởng tiền sau khi sự kiện kết thúc)
          const unsettledMkt = await tx.marketplaceTransaction.findMany({
            where: { ticket: { event_id: payout.event_id }, status: 'paid', is_settled: false }
          });

          for (const mktTx of unsettledMkt) {
            // Cộng tiền cho người bán (Seller)
            await tx.user.update({
              where: { id: mktTx.seller_id },
              data: { balance: { increment: mktTx.seller_receive_amount } }
            });

            // Ghi log giao dịch ví cho người bán
            await tx.walletTransaction.create({
              data: {
                user_id: mktTx.seller_id,
                amount: mktTx.seller_receive_amount,
                type: 'REVENUE',
                description: `Tiền bán vé Marketplace: ${payout.event.title}`,
                status: 'completed'
              }
            });

            // Đánh dấu Transaction đã quyết toán
            await tx.marketplaceTransaction.update({
              where: { id: mktTx.id },
              data: { is_settled: true }
            });
          }
        });

        return res.status(200).json({ message: 'Quyết toán thành công. Tiền đã được cộng vào ví BTC.' });
      }

      res.status(400).json({ error: 'Hành động không hợp lệ.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi server khi xử lý quyết toán.' });
    }
  }
};

module.exports = SettlementController;
