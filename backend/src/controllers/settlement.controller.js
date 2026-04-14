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
      const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
      
      if (!organizer) return res.status(403).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });

      // Lấy tất cả sự kiện đã kết thúc (end_date < now hoặc status = finished)
      // Trong hệ thống này, status có thể là 'published', 'finished', 'cancelled'
      // Ta lấy các sự kiện có ngày kết thúc đã qua
      const now = new Date();
      const events = await prisma.event.findMany({
        where: {
          organizer_id: organizer.id,
          OR: [
            { end_date: { lte: now } },
            { 
              AND: [
                { end_date: null },
                { event_date: { lte: now } }
              ]
            }
          ]
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
            is_settled: false
          },
          select: {
            total_amount: true,
            platform_fee: true
          }
        });

        const pendingRevenue = unsettledOrders.reduce((sum, order) => {
          return sum + (Number(order.total_amount) - Number(order.platform_fee));
        }, 0);

        const totalRevenue = unsettledOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const totalFees = unsettledOrders.reduce((sum, order) => sum + Number(order.platform_fee), 0);

        // Tìm yêu cầu quyết toán gần nhất
        const latestPayout = event.payouts.length > 0 ? event.payouts[0] : null;

        return {
          ...event,
          financials: {
            pending_orders_count: unsettledOrders.length,
            pending_revenue: pendingRevenue,
            total_revenue: totalRevenue,
            total_fees: totalFees
          },
          settlement_status: latestPayout ? latestPayout.status : (unsettledOrders.length > 0 ? 'eligible' : 'no_data')
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
      const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { payouts: { where: { status: { in: ['pending', 'processing'] } } } }
      });

      if (!event || event.organizer_id !== organizer.id) {
        return res.status(403).json({ error: 'Bạn không có quyền yêu cầu quyết toán cho sự kiện này.' });
      }

      if (event.payouts.length > 0) {
        return res.status(400).json({ error: 'Sự kiện này đang có yêu cầu quyết toán chờ xử lý.' });
      }

      // Tính toán số liệu
      const unsettledOrders = await prisma.order.findMany({
        where: { event_id: eventId, status: 'paid', is_settled: false }
      });

      if (unsettledOrders.length === 0) {
        return res.status(400).json({ error: 'Không có giao dịch nào mới cần đối soát.' });
      }

      const totalRevenue = unsettledOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const platformFee = unsettledOrders.reduce((sum, o) => sum + Number(o.platform_fee), 0);
      const netPayout = totalRevenue - platformFee;

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
            bank_name: organizer.bank_name,
            account_number: organizer.account_number,
            account_holder: organizer.account_holder
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
        include: { event: true }
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

          // 2. Cộng tiền vào balance Organizer
          await tx.organizer.update({
            where: { id: payout.event.organizer_id },
            data: { balance: { increment: payout.net_payout } }
          });

          // 3. Tạo WalletTransaction
          await tx.walletTransaction.create({
            data: {
              organizer_id: payout.event.organizer_id,
              amount: payout.net_payout,
              type: 'REVENUE',
              description: `Quyết toán thủ công sự kiện: ${payout.event.title}`,
              status: 'completed'
            }
          });

          // 4. Đánh dấu các Order là đã đối soát
          await tx.order.updateMany({
            where: { event_id: payout.event_id, status: 'paid', is_settled: false },
            data: { is_settled: true }
          });
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
