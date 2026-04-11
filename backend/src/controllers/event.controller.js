const prisma = require('../config/prisma');
const orderService = require('../services/order.service');

// [UC_04] Tìm kiếm, lọc sự kiện
const getEvents = async (req, res) => {
  try {
    // Tự động dọn dẹp các đơn hàng quá hạn để trả lại tồn kho
    await orderService.releaseExpiredOrders();

    const { keyword, category_id, status, startDate, endDate } = req.query;

    const whereClause = {
      status: status || 'active', // Mặc định chỉ public những sự kiện đang active
      category: {
        is_active: true
      }
    };

    if (keyword) {
      whereClause.title = { contains: keyword, mode: 'insensitive' };
    }

    if (category_id) {
      whereClause.category_id = category_id;
    }

    if (startDate || endDate) {
      whereClause.event_date = {};
      if (startDate) whereClause.event_date.gte = new Date(startDate);
      if (endDate) whereClause.event_date.lte = new Date(endDate);
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        organizer: { select: { organization_name: true, is_verified: true } },
        ticket_tiers: { select: { price: true } }
      },
      orderBy: { event_date: 'asc' }
    });

    res.status(200).json({ data: events });
  } catch (error) {
    console.error('Lỗi khi tải danh sách sự kiện:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_05] Xem chi tiết sự kiện
const getEventById = async (req, res) => {
  try {
    // Tự động dọn dẹp các đơn hàng quá hạn trước khi xem chi tiết (số lượng vé)
    await orderService.releaseExpiredOrders();

    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: { select: { name: true } },
        organizer: { 
          select: { 
            id: true,
            organization_name: true, 
            is_verified: true,
            user: { select: { id: true, avatar_url: true } }
          } 
        },
        ticket_tiers: true // Lấy ra các hạng vé để bán
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }

    res.status(200).json({ data: event });
  } catch (error) {
    console.error('Lỗi khi tải chi tiết sự kiện:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UX] Gợi ý sự kiện (Ưu tiên Nổi bật & Sắp diễn ra)
const getRecommendations = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { 
        status: 'active', 
        event_date: { gt: new Date() },
        category: { is_active: true }
      },
      take: 6,
      orderBy: [
        { is_featured: 'desc' },
        { event_date: 'asc' }
      ],
      include: { 
        category: { select: { name: true } },
        organizer: { select: { organization_name: true, is_verified: true } },
        ticket_tiers: { select: { price: true } }
      }
    });

    res.status(200).json({ 
      data: events 
    });
  } catch (error) {
    console.error('Lỗi Recommendation:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UX/Real-time] Kiểm tra tính khả dụng của vé
const getEventAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        ticket_tiers: { 
          select: { id: true, tier_name: true, quantity_available: true, price: true } 
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });

    res.status(200).json({ data: event });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_XX] Lấy danh sách sản phẩm mua kèm của sự kiện
const getEventMerchandise = async (req, res) => {
  try {
    const { id } = req.params;
    const merchandise = await prisma.merchandise.findMany({
      where: { 
        event_id: id,
        is_active: true,
        stock: { gt: 0 }
      },
      orderBy: { created_at: 'desc' }
    });
    res.status(200).json({ data: merchandise });
  } catch (error) {
    console.error('Lỗi khi lấy Merchandise sự kiện:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  getRecommendations,
  getEventAvailability,
  getEventMerchandise
};
