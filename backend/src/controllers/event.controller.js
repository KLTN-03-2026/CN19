const prisma = require('../config/prisma');

// [UC_04] Tìm kiếm, lọc sự kiện
const getEvents = async (req, res) => {
  try {
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
            user: { select: { avatar_url: true } }
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

// [UX] Gợi ý sự kiện
const getRecommendations = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { 
        status: 'active', 
        event_date: { gt: new Date() },
        category: { is_active: true }
      },
      take: 6,
      orderBy: { event_date: 'asc' },
      include: { category: { select: { name: true } } }
    });
    res.status(200).json({ data: events });
  } catch (error) {
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

module.exports = {
  getEvents,
  getEventById,
  getRecommendations,
  getEventAvailability
};
