const web3Service = require('../services/web3.service');
const orderService = require('../services/order.service');
const { getSystemConfig } = require('../utils/systemConfig');
const prisma = require('../config/prisma');

// [UC_12] Đăng bán lại vé (Marketplace)
const createListing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticket_id, asking_price, merchandise_item_ids } = req.body;

    const ticket = await prisma.ticket.findUnique({ 
      where: { id: ticket_id },
      include: { event: true, ticket_tier: true }
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Không tìm thấy vé hợp lệ.' });
    }

    // [New] Kiểm tra xem vé đã được đăng bán chưa (Tránh trùng lặp)
    const existingListing = await prisma.marketplaceListing.findFirst({
      where: {
        ticket_id: ticket.id,
        status: 'active'
      }
    });

    if (existingListing) {
      return res.status(400).json({ error: 'Vé này đã được đăng bán trên Chợ rồi.' });
    }

    if (!ticket.event.allow_resale) {
      return res.status(400).json({ error: 'Sự kiện này không hỗ trợ đăng bán lại vé.' });
    }

    // [Business Rule] Không được bán lại quá giới hạn giá gốc niêm yết của sự kiện (ưu tiên) hoặc hệ thống (fallback)
    const sysConfig = await getSystemConfig();
    const ticketAskingPrice = Number(asking_price);
    const originalPrice = Number(ticket.ticket_tier.price);
    
    // Ưu tiên cấu hình sự kiện (ví dụ 108%), nếu không có mới lấy hệ thống (ví dụ 100 + 7 = 107%)
    const limitPercent = ticket.event.resale_price_limit_percent 
      ? Number(ticket.event.resale_price_limit_percent)
      : (100 + Number(sysConfig.resale_price_cap_percent || 7));
    const maxTicketAskingPrice = (originalPrice * limitPercent) / 100;
    
    if (ticketAskingPrice > maxTicketAskingPrice) {
      return res.status(400).json({ 
        error: `Giá vé bán lại không được vượt quá ${limitPercent}% giá gốc (Tối đa: ${maxTicketAskingPrice.toLocaleString()} VNĐ)` 
      });
    }

    // Tính toán giá trị sản phẩm tặng kèm
    let merchandiseTotal = 0;
    const selectedMerchandise = [];

    if (merchandise_item_ids && merchandise_item_ids.length > 0) {
      // [Security Check] Đảm bảo user sở hữu các vật phẩm này và chúng hợp lệ
      const items = await prisma.merchandiseOrderItem.findMany({
        where: {
          id: { in: merchandise_item_ids },
          order_id: ticket.order_id, // [QUAN TRỌNG] Phải cùng đơn hàng với vé
          merchandise: { 
            OR: [
              { event_id: ticket.event_id },
              { event_id: null } // Cho phép cả sản phẩm chung của BTC không gắn event cụ thể
            ]
          },
          is_redeemed: false,
          // Kiểm tra quyền sở hữu
          OR: [
            { owner_id: userId },
            { 
              owner_id: null, 
              order: { customer_id: userId } 
            }
          ]
        },
        include: { merchandise: true }
      });

      console.log(`[Marketplace] User ${userId} listing ticket ${ticket_id} with ${merchandise_item_ids.length} items. Found in DB: ${items.length}`);

      // Kiểm tra chi tiết từng item để báo lỗi chính xác
      if (items.length !== merchandise_item_ids.length) {
        const foundIds = items.map(i => i.id);
        const missingIds = merchandise_item_ids.filter(id => !foundIds.includes(id));
        
        // Kiểm tra xem có phải do đã được đăng bán ở bài khác không
        const alreadyListed = await prisma.merchandiseOrderItem.findFirst({
            where: { 
                id: { in: missingIds },
                listing_id: { not: null }
            }
        });

        if (alreadyListed) {
            return res.status(400).json({ error: 'Một số sản phẩm đã được đăng bán ở bài đăng khác. Vui lòng kiểm tra lại.' });
        }

        return res.status(400).json({ 
          error: 'Một số sản phẩm không hợp lệ hoặc không thuộc sở hữu của bạn.' 
        });
      }

      // Kiểm tra xem có item nào đã được gán listing_id chưa (tránh trùng lặp)
      const busyItem = items.find(i => i.listing_id !== null);
      if (busyItem) {
        return res.status(400).json({ error: `Sản phẩm "${busyItem.merchandise.name}" đã được đăng bán ở bài khác.` });
      }

      items.forEach(item => {
        merchandiseTotal += Number(item.unit_price) * item.quantity;
        selectedMerchandise.push({
          id: item.id,
          name: item.merchandise.name,
          image_url: item.merchandise.image_url,
          quantity: item.quantity,
          unit_price: Number(item.unit_price)
        });
      });
    }

    // [Logic Chuẩn]: Giá niêm yết trên Chợ = Giá vé + Giá vật phẩm
    const totalAskingPrice = ticketAskingPrice + merchandiseTotal; 

    await prisma.$transaction(async (tx) => {
      const sysConfig = await getSystemConfig();
      
      // Đăng Listing
      const newListing = await tx.marketplaceListing.create({
        data: {
          ticket_id: ticket.id,
          seller_id: userId,
          event_id: ticket.event_id,
          listing_number: 'LST-' + Date.now(),
          asking_price: totalAskingPrice,
          status: 'active',
          platform_fee_percent: ticket.event.royalty_fee_percent || parseFloat(sysConfig.default_royalty_percent || 3.0),
          metadata: {
            ticket_price: ticketAskingPrice, // Lưu vết giá gốc người bán đặt
            merchandise_total: merchandiseTotal,
            selected_merchandise: selectedMerchandise,
            merchandise_item_ids: merchandise_item_ids || []
          }
        }
      });

      // [New] Liên kết chính thức các sản phẩm với Listing này
      if (merchandise_item_ids && merchandise_item_ids.length > 0) {
        await tx.merchandiseOrderItem.updateMany({
          where: { id: { in: merchandise_item_ids } },
          data: { listing_id: newListing.id }
        });
      }

      // Khóa tính năng vé
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { is_on_marketplace: true }
      });
    });

    // Khóa NFT trên Smart Contract
    if (ticket.nft_token_id && ticket.event.smart_contract_address) {
      await web3Service.lockTicket(ticket.event.smart_contract_address, parseInt(ticket.nft_token_id));
    }

    res.status(201).json({ message: 'Đăng bán vé thành công và đã khóa vé trên Blockchain.' });

  } catch (error) {
    console.error('Lỗi đăng bán vé:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi đăng bán.',
      details: error.message 
    });
  }
};

// [UC_12] Hủy bài đăng bán vé
const deleteListing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: { 
        ticket: {
          include: { event: true }
        } 
      }
    });

    if (!listing || listing.seller_id !== userId) {
      return res.status(403).json({ error: 'Không có quyền hủy bài đăng này.' });
    }

    if (listing.is_locked || listing.status !== 'active') {
      return res.status(400).json({ error: 'Bài đăng đang có người giao dịch, không thể hủy lúc này.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.marketplaceListing.update({
        where: { id: listing.id },
        data: { status: 'cancelled' }
      });

      // [New] Giải phóng sản phẩm đi kèm
      await tx.merchandiseOrderItem.updateMany({
        where: { listing_id: listing.id },
        data: { listing_id: null }
      });

      await tx.ticket.update({
        where: { id: listing.ticket_id },
        data: { is_on_marketplace: false }
      });
    });

    // Mở khóa NFT trên Smart Contract
    if (listing.ticket && listing.ticket.nft_token_id && listing.ticket.event?.smart_contract_address) {
       await web3Service.unlockTicket(listing.ticket.event.smart_contract_address, parseInt(listing.ticket.nft_token_id));
    }

    res.status(200).json({ message: 'Đã hủy đăng bán. Mã QR và vé đã được mở khóa.' });
  } catch (error) {
    console.error('Lỗi hủy bán vé:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_12] Lấy danh sách vé đang bán (Công khai)
const getListings = async (req, res) => {
  try {
    // Tự động giải phóng các listing pending đã quá hạn
    await orderService.releaseExpiredOrders().catch(e => console.error('Release error:', e));

    const now = new Date();
    const listings = await prisma.marketplaceListing.findMany({
      where: { 
        status: 'active',
        event: {
          OR: [
            { end_date: { gt: now } },
            { AND: [{ end_date: null }, { event_date: { gt: now } }] }
          ]
        }
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticket_number: true,
            nft_token_id: true,
            ticket_tier: {
              select: { tier_name: true, section_name: true, benefits: true, price: true }
            }
          }
        },
        merchandise_items: {
          include: { merchandise: true }
        },
        event: {
          include: {
            organizer: {
              select: { user_id: true }
            }
          }
        },
        seller: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true
          }
        }
      },
      orderBy: { listing_number: 'desc' }
    });

    res.status(200).json({ data: listings });
  } catch (error) {
    console.error('Lỗi lấy danh sách Marketplace:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_12] Cập nhật giá bán vé
const updateListing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { asking_price, merchandise_item_ids } = req.body;

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: { 
        ticket: {
          include: { event: true, ticket_tier: true }
        } 
      }
    });

    if (!listing || listing.seller_id !== userId) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa bài đăng này.' });
    }

    if (listing.is_locked || listing.status !== 'active') {
      return res.status(400).json({ error: 'Bài đăng đang có người giao dịch hoặc không còn hoạt động.' });
    }

    // [Business Rule] Kiểm tra giới hạn giá trần (Ưu tiên Sự kiện > Hệ thống > 107%)
    const sysConfig = await getSystemConfig();
    const newTicketPrice = Number(asking_price);
    const originalPrice = Number(listing.ticket.ticket_tier.price);
    const limitPercent = listing.ticket.event.resale_price_limit_percent 
      ? Number(listing.ticket.event.resale_price_limit_percent)
      : (100 + Number(sysConfig.resale_price_cap_percent || 7));
    const maxTicketPrice = (originalPrice * limitPercent) / 100;

    if (newTicketPrice > maxTicketPrice) {
      return res.status(400).json({ 
        error: `Giá vé mới không được vượt quá ${limitPercent}% giá gốc (Tối đa: ${maxTicketPrice.toLocaleString()} VNĐ)` 
      });
    }

    // Tính toán lại giá trị sản phẩm tặng kèm (nếu có gửi lên danh sách mới)
    let merchandiseTotal = 0;
    let selectedMerchandise = [];
    const currentMetadata = listing.metadata || {};

    if (merchandise_item_ids) {
      // [Security Check] Đảm bảo user sở hữu các vật phẩm này và chúng hợp lệ
      const items = await prisma.merchandiseOrderItem.findMany({
        where: {
          id: { in: merchandise_item_ids },
          order_id: listing.ticket.order_id, // [QUAN TRỌNG] Phải cùng đơn hàng với vé
          merchandise: { 
            OR: [
              { event_id: listing.ticket.event_id },
              { event_id: null }
            ]
          },
          is_redeemed: false,
          OR: [
            { owner_id: userId },
            { 
              owner_id: null, 
              order: { customer_id: userId } 
            }
          ]
        },
        include: { merchandise: true }
      });

      console.log(`[Marketplace Update] User ${userId} updating listing ${id}. Found in DB: ${items.length}`);

      if (items.length !== merchandise_item_ids.length) {
        return res.status(400).json({ error: 'Một số sản phẩm không hợp lệ hoặc không thuộc sở hữu của bạn.' });
      }

      // Kiểm tra xem có item nào đã được gán cho listing KHÁC chưa
      const busyItem = items.find(i => i.listing_id !== null && i.listing_id !== listing.id);
      if (busyItem) {
        return res.status(400).json({ error: `Sản phẩm "${busyItem.merchandise.name}" đã được đăng bán ở bài khác.` });
      }

      items.forEach(item => {
        merchandiseTotal += Number(item.unit_price) * item.quantity;
        selectedMerchandise.push({
          id: item.id,
          name: item.merchandise.name,
          image_url: item.merchandise.image_url,
          quantity: item.quantity,
          unit_price: Number(item.unit_price)
        });
      });
    } else {
      // Nếu không gửi, giữ nguyên từ metadata cũ
      merchandiseTotal = currentMetadata.merchandise_total || 0;
      selectedMerchandise = currentMetadata.selected_merchandise || [];
    }

    // [Logic Chuẩn]: Giá cập nhật = Giá vé mới + Giá vật phẩm
    const totalAskingPrice = newTicketPrice + merchandiseTotal;

    await prisma.$transaction(async (tx) => {
      // 1. Giải phóng tất cả sản phẩm cũ của bài đăng này
      await tx.merchandiseOrderItem.updateMany({
        where: { listing_id: listing.id },
        data: { listing_id: null }
      });

      // 2. Liên kết các sản phẩm mới được chọn
      if (merchandise_item_ids && merchandise_item_ids.length > 0) {
        await tx.merchandiseOrderItem.updateMany({
          where: { id: { in: merchandise_item_ids } },
          data: { listing_id: listing.id }
        });
      }

      // 3. Cập nhật thông tin bài đăng
      await tx.marketplaceListing.update({
        where: { id: listing.id },
        data: { 
          asking_price: totalAskingPrice,
          metadata: {
            ...currentMetadata,
            ticket_price: newTicketPrice,
            merchandise_total: merchandiseTotal,
            selected_merchandise: selectedMerchandise,
            merchandise_item_ids: merchandise_item_ids || currentMetadata.merchandise_item_ids || []
          }
        }
      });
    });

    res.status(200).json({ message: 'Cập nhật bài đăng thành công.' });
  } catch (error) {
    console.error('Lỗi cập nhật bài đăng:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật.' });
  }
};

module.exports = {
  createListing,
  deleteListing,
  getListings,
  updateListing
};
