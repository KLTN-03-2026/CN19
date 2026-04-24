const prisma = require('../config/prisma');

// [UC_13] Xem lịch sử giao dịch cá nhân
const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Lấy tất cả Orders liên quan (Mua vé & Chuyển nhượng)
    const orders = await prisma.order.findMany({
      where: { customer_id: userId },
      orderBy: { created_at: 'desc' },
      include: { event: { select: { title: true } } }
    });

    // 2. Mua vé trên chợ (Buyer)
    const marketplacePurchases = await prisma.marketplaceTransaction.findMany({
      where: { buyer_id: userId },
      include: { ticket: { include: { event: { select: { title: true } } } } }
    });

    // 3. Doanh thu bán lại (Seller)
    const marketplaceSales = await prisma.marketplaceTransaction.findMany({
      where: { seller_id: userId },
      include: { ticket: { include: { event: { select: { title: true } } } } }
    });

    console.log(`[DEBUG] User ${userId}: Orders(${orders.length}), MktBuy(${marketplacePurchases.length}), MktSell(${marketplaceSales.length})`);

    // Gom dữ liệu chuẩn hóa
    const formattedOrders = orders.map(o => ({
      order_id: o.id,
      transaction_id: o.order_number,
      type: o.order_type === 'TICKET_TRANSFER' ? 'TRANSFER_FEE' : 'PRIMARY_PURCHASE',
      amount: Number(o.total_amount),
      status: o.status,
      timestamp: o.created_at,
      description: o.order_type === 'TICKET_TRANSFER' 
        ? `Phí chuyển nhượng vé: ${o.event?.title || 'N/A'}`
        : `Mua vé sự kiện: ${o.event?.title || 'N/A'}`
    }));

    const formattedMktPurchases = marketplacePurchases.map(m => ({
      transaction_id: m.transaction_number || m.id,
      type: 'MARKETPLACE_BUY',
      amount: Number(m.buyer_pay_amount),
      status: m.status,
      timestamp: m.created_at,
      description: `Mua lại vé từ chợ: ${m.ticket?.event?.title || 'N/A'}`
    }));

    const formattedMktSales = marketplaceSales.map(m => ({
      transaction_id: m.transaction_number || m.id,
      type: 'RESELL_REVENUE',
      amount: Number(m.seller_receive_amount),
      status: m.status,
      timestamp: m.created_at,
      description: `Doanh thu bán vé: ${m.ticket?.event?.title || 'N/A'}`
    }));

    const allTransactions = [
      ...formattedOrders,
      ...formattedMktPurchases,
      ...formattedMktSales
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({ data: allTransactions });
  } catch (error) {
    console.error('Lỗi lấy lịch sử GD:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getMyTransactions
};
