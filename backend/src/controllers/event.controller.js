const prisma = require('../config/prisma');
const orderService = require('../services/order.service');

// [UC_04] Tìm kiếm, lọc sự kiện
const getEvents = async (req, res) => {
  try {
    // Tự động dọn dẹp các đơn hàng quá hạn để trả lại tồn kho
    await orderService.releaseExpiredOrders();

    const { 
      keyword, 
      category_id, 
      status, 
      startDate, 
      endDate, 
      date, 
      minPrice, 
      maxPrice, 
      sort,
      is_featured 
    } = req.query;

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
      // Hỗ trợ lọc nhiều danh mục (phân tách bằng dấu phẩy)
      const catIds = category_id.split(',').filter(id => id.trim());
      if (catIds.length > 1) {
        whereClause.category_id = { in: catIds };
      } else if (catIds.length === 1) {
        whereClause.category_id = catIds[0];
      }
    }

    if (is_featured !== undefined) {
      whereClause.is_featured = is_featured === 'true';
    }

    // Lọc theo ngày cụ thể (exact date) hoặc khoảng ngày
    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(targetDate.getDate() + 1);
      
      whereClause.event_date = {
        gte: targetDate,
        lt: nextDate
      };
    } else if (startDate || endDate) {
      whereClause.event_date = {};
      if (startDate) whereClause.event_date.gte = new Date(startDate);
      if (endDate) whereClause.event_date.lte = new Date(endDate);
    }

    // Lọc theo khoảng giá (minPrice, maxPrice)
    // Chỉ áp dụng filter nếu giá trị không phải là mặc định (0 - 10,000,000)
    // Hoặc nếu muốn lọc khắt khe hơn thì giữ nguyên logic 'some'
    const isDefaultPrice = (!minPrice || parseFloat(minPrice) === 0) && (!maxPrice || parseFloat(maxPrice) >= 10000000);
    
    if (!isDefaultPrice && (minPrice !== undefined || maxPrice !== undefined)) {
      whereClause.ticket_tiers = {
        some: {
          price: {
            gte: minPrice ? parseFloat(minPrice) : undefined,
            lte: maxPrice ? parseFloat(maxPrice) : undefined
          }
        }
      };
    }

    // Xử lý sắp xếp (Sorting)
    let orderBy = { created_at: 'desc' }; // Mặc định mới nhất

    if (sort === 'oldest') {
      orderBy = [
        { created_at: 'asc' }
      ];
    } else if (sort === 'event-asc') {
      orderBy = [
        { event_date: 'asc' },
        { created_at: 'desc' }
      ];
    } else if (sort === 'event-desc') {
      orderBy = [
        { event_date: 'desc' },
        { created_at: 'desc' }
      ];
    } else if (sort === 'popular') {
      orderBy = [
        { orders: { _count: 'desc' } },
        { created_at: 'desc' }
      ];
    } else if (sort === 'price-asc' || sort === 'price-desc') {
      orderBy = [
        { created_at: 'desc' }
      ];
    } else {
      // Mặc định: Mới nhất
      orderBy = [
        { created_at: 'desc' }
      ];
    }

    let events = await prisma.event.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        organizer: { select: { organization_name: true, is_verified: true } },
        ticket_tiers: { select: { price: true } }
      },
      orderBy: orderBy
    });

    // Xử lý sort theo giá thủ công (vì Prisma limit ở top-level relation sorting)
    if (sort === 'price-asc') {
      events.sort((a, b) => {
        const minA = a.ticket_tiers.length > 0 
          ? Math.min(...a.ticket_tiers.map(t => parseFloat(t.price))) 
          : 0;
        const minB = b.ticket_tiers.length > 0 
          ? Math.min(...b.ticket_tiers.map(t => parseFloat(t.price))) 
          : 0;
        return minA - minB;
      });
    } else if (sort === 'price-desc') {
      events.sort((a, b) => {
        const minA = a.ticket_tiers.length > 0 
          ? Math.min(...a.ticket_tiers.map(t => parseFloat(t.price))) 
          : 0;
        const minB = b.ticket_tiers.length > 0 
          ? Math.min(...b.ticket_tiers.map(t => parseFloat(t.price))) 
          : 0;
        return minB - minA;
      });
    }

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
            user: { select: { id: true, avatar_url: true, status: true } }
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
