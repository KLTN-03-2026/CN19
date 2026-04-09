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

// [UX] Gợi ý sự kiện cá nhân hóa & Trending
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.userId;
    let recommendedCategoryIds = [];
    let recommendationType = 'trending'; // 'trending' hoặc 'personalized'

    // 1. Nếu đã đăng nhập, tìm 3 danh mục người dùng quan tâm nhất (qua lịch sử mua vé)
    if (userId) {
      const pastOrders = await prisma.order.findMany({
        where: { user_id: userId },
        take: 10,
        orderBy: { created_at: 'desc' },
        include: { event: { select: { category_id: true } } }
      });

      if (pastOrders.length > 0) {
        // Đếm tần suất danh mục
        const catCounts = {};
        pastOrders.forEach(ord => {
          const cid = ord.event.category_id;
          catCounts[cid] = (catCounts[cid] || 0) + 1;
        });
        // Sắp xếp lấy danh mục nhiều nhất
        recommendedCategoryIds = Object.keys(catCounts)
          .sort((a, b) => catCounts[b] - catCounts[a])
          .slice(0, 2);
        
        if (recommendedCategoryIds.length > 0) recommendationType = 'personalized';
      }
    }

    // 2. Truy vấn sự kiện theo trọng số
    // - Ưu tiên: is_featured -> Category khớp sở thích -> Lượt xem (Hot)
    const events = await prisma.event.findMany({
      where: { 
        status: 'active', 
        event_date: { gt: new Date() },
        category: { is_active: true },
        OR: [
          { is_featured: true },
          { category_id: { in: recommendedCategoryIds } }
        ]
      },
      take: 6,
      orderBy: [
        { is_featured: 'desc' },
        { views: 'desc' },
        { event_date: 'asc' }
      ],
      include: { 
        category: { select: { name: true } },
        organizer: { select: { organization_name: true, is_verified: true } }
      }
    });

    res.status(200).json({ 
      success: true,
      recommendation_type: recommendationType,
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

module.exports = {
  getEvents,
  getEventById,
  getRecommendations,
  getEventAvailability
};
