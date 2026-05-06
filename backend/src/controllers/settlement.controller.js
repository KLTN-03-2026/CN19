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
        let totalPlatFee = 0;
        let totalCommFee = 0;
        let totalGasFee = 0;

        for (const order of unsettledOrders) {
          const platFee = Number(order.platform_fee || 0);
          const commFee = Number(order.commission_fee || 0);
          const gasFee = Number(order.gas_fee || 0);
          
          totalPlatFee += platFee;
          totalCommFee += commFee;
          totalGasFee += gasFee;

          const orderItems = await prisma.orderItem.findMany({
            where: { order_id: order.id }
          });
          const merchItems = await prisma.merchandiseOrderItem.findMany({
            where: { order_id: order.id }
          });

          ticketRevenue += orderItems.reduce((s, i) => s + Number(i.subtotal), 0);
          merchRevenue += merchItems.reduce((s, i) => s + Number(i.subtotal), 0);
        }

        const totalFees = totalPlatFee + totalCommFee + totalGasFee;

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

        // Tìm yêu cầu quyết toán gần nhất
        const latestPayout = event.payouts.length > 0 ? event.payouts[0] : null;

        // Nếu đã quyết toán (settled), lấy dữ liệu từ bản ghi Payout
        if (latestPayout && latestPayout.status === 'settled') {
          const pPlatFee = Number(latestPayout.platform_fee || 0);
          const pCommFee = Number(latestPayout.commission_fee || 0);
          const pGasFee = Number(latestPayout.gas_fee || 0);
          const pRoyalty = Number(latestPayout.marketplace_royalty || 0);

          return {
            ...event,
            financials: {
              pending_orders_count: 0,
              pending_marketplace_count: 0,
              pending_revenue: Number(latestPayout.net_payout),
              ticket_revenue: Number(latestPayout.total_revenue),
              merch_revenue: 0, 
              marketplace_royalty: pRoyalty,
              total_revenue: Number(latestPayout.total_revenue) + pRoyalty,
              total_fees: pPlatFee + pCommFee + pGasFee
            },
            settlement_status: 'settled',
            payout_details: latestPayout
          };
        }

        const pendingRevenue = (ticketRevenue + merchRevenue + pendingMarketplaceRevenue) - totalFees;

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
          settlement_status: latestPayout ? latestPayout.status : ((unsettledOrders.length > 0 || unsettledMarketplace.length > 0) ? 'eligible' : 'no_data'),
          payout_details: latestPayout
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
        where: { 
          event_id: eventId, 
          status: 'paid', 
          is_settled: false, 
          order_type: { in: ['TICKET_PURCHASE', 'MERCHANDISE_PURCHASE'] } 
        }
      });

      if (unsettledOrders.length === 0 && (await prisma.marketplaceTransaction.count({ where: { ticket: { event_id: eventId }, status: 'paid', is_settled: false } })) === 0) {
        return res.status(400).json({ error: 'Không có giao dịch nào mới cần đối soát.' });
      }

      let ticketRevenue = 0;
      let merchRevenue = 0;
      let totalPlatFee = 0;
      let totalCommFee = 0;
      let totalGasFee = 0;

      for (const order of unsettledOrders) {
        const platFee = Number(order.platform_fee || 0);
        const commFee = Number(order.commission_fee || 0);
        const gasFee = Number(order.gas_fee || 0);
        
        totalPlatFee += platFee;
        totalCommFee += commFee;
        totalGasFee += gasFee;

        // Check if it's merch or ticket
        const orderItems = await prisma.orderItem.findMany({ where: { order_id: order.id } });
        const merchItems = await prisma.merchandiseOrderItem.findMany({ where: { order_id: order.id } });
        ticketRevenue += orderItems.reduce((s, i) => s + Number(i.subtotal), 0);
        merchRevenue += merchItems.reduce((s, i) => s + Number(i.subtotal), 0);
      }

      const totalRevenue = ticketRevenue + merchRevenue;
      
      // -- Add Marketplace Royalties --
      const unsettledMarketplace = await prisma.marketplaceTransaction.findMany({
        where: { ticket: { event_id: eventId }, status: 'paid', is_settled: false }
      });
      const marketplaceRoyalties = unsettledMarketplace.reduce((sum, tx) => sum + Number(tx.organizer_royalty || 0), 0);

      const netPayout = (totalRevenue - (totalPlatFee + totalCommFee + totalGasFee)) + marketplaceRoyalties;

      // Tạo yêu cầu
      const payoutRequest = await prisma.escrowPayout.create({
        data: {
          event_id: eventId,
          total_revenue: totalRevenue,
          platform_fee: totalPlatFee,
          commission_fee: totalCommFee,
          gas_fee: totalGasFee,
          marketplace_royalty: marketplaceRoyalties,
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
   * [Admin] Lấy danh sách tất cả yêu cầu quyết toán kèm chi tiết doanh thu
   */
  adminGetSettlements: async (req, res) => {
    try {
      const { status } = req.query;
      const whereClause = status ? { status } : {};

      const payouts = await prisma.escrowPayout.findMany({
        where: whereClause,
        include: {
          event: {
            include: {
              organizer: { select: { organization_name: true } }
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Bổ sung chi tiết doanh thu nếu chưa có (tính toán lại để hiển thị UI)
      const enhancedPayouts = await Promise.all(payouts.map(async (p) => {
        // Nếu đã có trong DB thì dùng (giả định sau này sẽ lưu), 
        // hiện tại tính toán lại để fix lỗi hiển thị 0đ cho yêu cầu cũ
        const eventId = p.event_id;
        
        // Lấy orders thuộc payout này (hoặc thuộc event nếu là yêu cầu cũ)
        const orders = await prisma.order.findMany({
          where: {
            event_id: eventId,
            status: 'paid',
            order_type: 'TICKET_PURCHASE'
          }
        });

        let ticketRevenue = 0;
        let merchRevenue = 0;
        for (const order of orders) {
          const orderItems = await prisma.orderItem.findMany({ where: { order_id: order.id } });
          const merchItems = await prisma.merchandiseOrderItem.findMany({ where: { order_id: order.id } });
          ticketRevenue += orderItems.reduce((s, i) => s + Number(i.subtotal), 0);
          merchRevenue += merchItems.reduce((s, i) => s + Number(i.subtotal), 0);
        }

        const marketplace = await prisma.marketplaceTransaction.findMany({
          where: { ticket: { event_id: eventId }, status: 'paid' }
        });
        const marketplaceRoyalty = marketplace.reduce((sum, tx) => sum + Number(tx.organizer_royalty || 0), 0);

        const platFee = Number(p.platform_fee || 0);
        const commFee = Number(p.commission_fee || 0);
        const gasFee = Number(p.gas_fee || 0);

        return {
          ...p,
          ticket_revenue: ticketRevenue,
          merch_revenue: merchRevenue,
          marketplace_royalty: marketplaceRoyalty || Number(p.marketplace_royalty || 0),
          total_fees: platFee + commFee + gasFee
        };
      }));

      res.status(200).json({ data: enhancedPayouts });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi server.' });
    }
  },

  /**
   * [Admin] Lấy danh sách tất cả các sự kiện đã kết thúc để Admin có cái nhìn tổng quan
   */
  adminGetEligibleEvents: async (req, res) => {
    try {
      // Lấy TẤT CẢ các sự kiện KHÔNG phải nháp để có cái nhìn tổng quan
      const events = await prisma.event.findMany({
        where: {
          status: {
            not: 'draft'
          }
        },
        include: {
          organizer: { select: { organization_name: true } },
          payouts: { orderBy: { created_at: 'desc' } }
        },
        orderBy: { event_date: 'desc' }
      });

      const enhancedEvents = await Promise.all(events.map(async (event) => {
        // Tính toán toàn bộ doanh thu (kể cả đã đối soát hay chưa để xem tổng quan)
        const orders = await prisma.order.findMany({
          where: {
            event_id: event.id,
            status: 'paid',
            order_type: { in: ['TICKET_PURCHASE', 'MERCHANDISE_PURCHASE'] }
          }
        });

        let ticketRevenue = 0;
        let merchRevenue = 0;
        let totalFees = orders.reduce((sum, order) => {
          return sum + Number(order.platform_fee || 0) + Number(order.commission_fee || 0) + Number(order.gas_fee || 0);
        }, 0);

        for (const order of orders) {
          const orderItems = await prisma.orderItem.findMany({ where: { order_id: order.id } });
          const merchItems = await prisma.merchandiseOrderItem.findMany({ where: { order_id: order.id } });
          ticketRevenue += orderItems.reduce((s, i) => s + Number(i.subtotal), 0);
          merchRevenue += merchItems.reduce((s, i) => s + Number(i.subtotal), 0);
        }

        const marketplace = await prisma.marketplaceTransaction.findMany({
          where: { ticket: { event_id: event.id }, status: 'paid' }
        });
        const marketplaceRoyalty = marketplace.reduce((sum, tx) => sum + Number(tx.organizer_royalty || 0), 0);

        const latestPayout = event.payouts.length > 0 ? event.payouts[0] : null;
        
        // Trạng thái tài chính
        let financialStatus = 'not_started';
        if (latestPayout) {
          financialStatus = latestPayout.status; // settled, pending, processing, rejected
        } else if (orders.length > 0 || marketplace.length > 0) {
          financialStatus = 'eligible';
        }

        return {
          ...event,
          financials: {
            pending_revenue: (ticketRevenue + merchRevenue + marketplaceRoyalty) - totalFees,
            ticket_revenue: ticketRevenue,
            merch_revenue: merchRevenue,
            marketplace_royalty: marketplaceRoyalty,
            total_fees: totalFees
          },
          settlement_status: financialStatus
        };
      }));

      res.status(200).json({ data: enhancedEvents });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu tổng quan quyết toán.' });
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
            where: { 
              event_id: payout.event_id, 
              status: 'paid', 
              is_settled: false, 
              order_type: { in: ['TICKET_PURCHASE', 'MERCHANDISE_PURCHASE'] } 
            },
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
