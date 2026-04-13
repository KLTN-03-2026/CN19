const prisma = require('../config/prisma');

// [UC_13] Xem lịch sử giao dịch cá nhân
const getMyTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Truy vấn tổng hợp từ các bảng Orders, MarketplaceTransactions, Transfers
    const orders = await prisma.order.findMany({
      where: { customer_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_number: true,
        status: true,
        total_amount: true,
        created_at: true,
        event: { select: { title: true } }
      }
    });

    // Gom dữ liệu trả về cho client hiển thị (có thể thêm marketplace sau)
    const formattedData = orders.map(o => ({
      order_id: o.id,
      transaction_id: o.order_number,
      type: 'PRIMARY_PURCHASE',
      amount: o.total_amount,
      status: o.status,
      timestamp: o.created_at,
      description: `Mua vé sự kiện: ${o.event.title}`
    }));

    res.status(200).json({ data: formattedData });
  } catch (error) {
    console.error('Lỗi lấy lịch sử GD:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getMyTransactions
};
