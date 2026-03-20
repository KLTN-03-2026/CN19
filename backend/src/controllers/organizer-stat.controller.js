const prisma = require('../config/prisma');

// [UC_20] Thống kê Dashboard cho Ban tổ chức
const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    
    if (!organizer) {
      return res.status(403).json({ error: 'Tài khoản không phải Ban tổ chức.' });
    }

    // Lấy tổng số sự kiện
    const totalEvents = await prisma.event.count({ where: { organizer_id: organizer.id } });

    // Lấy doanh thu từ EscrowPayout (Các kỳ đối soát đã được duyệt trả)
    const payouts = await prisma.escrowPayout.findMany({
      where: { event: { organizer_id: organizer.id }, status: 'settled' }
    });
    
    const totalRevenue = payouts.reduce((acc, curr) => acc + Number(curr.net_payout), 0);

    // Tính tổng số lượng vé đã xuất (minted) so với tổng sức chứa để tính % bán ra
    // Bỏ qua chi tiết phức tạp, ta chỉ trả về các chỉ số mock basic

    res.status(200).json({
      data: {
        total_events: totalEvents,
        total_revenue: totalRevenue,
        recent_payouts: payouts
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getStats
};
