const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');

// [UC_12] Đăng bán lại vé (Marketplace)
const createListing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { ticket_id, asking_price } = req.body;

    const ticket = await prisma.ticket.findUnique({ 
      where: { id: ticket_id },
      include: { event: true, ticket_tier: true }
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Không tìm thấy vé hợp lệ.' });
    }

    if (!ticket.event.allow_resale) {
      return res.status(400).json({ error: 'Sự kiện này không hỗ trợ đăng bán lại vé.' });
    }

    if (ticket.event.price_ceiling && asking_price > Number(ticket.event.price_ceiling)) {
      return res.status(400).json({ error: `Giá bán không được vượt quá giá trần: ${ticket.event.price_ceiling}` });
    }

    await prisma.$transaction(async (tx) => {
      // Đăng Listing
      await tx.marketplaceListing.create({
        data: {
          ticket_id: ticket.id,
          seller_id: userId,
          event_id: ticket.event_id,
          listing_number: 'LST-' + Date.now(),
          asking_price: asking_price,
          status: 'active',
          platform_fee_percent: ticket.event.royalty_fee_percent
        }
      });

      // Khóa tính năng vé
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { is_on_marketplace: true }
      });
    });

    // Khóa NFT trên Smart Contract
    if (ticket.nft_token_id) {
      await web3Service.lockTicket(parseInt(ticket.nft_token_id));
    }

    res.status(201).json({ message: 'Đăng bán vé thành công và đã khóa vé trên Blockchain.' });

  } catch (error) {
    console.error('Lỗi đăng bán vé:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_12] Hủy bài đăng bán vé
const deleteListing = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: { ticket: true }
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

      await tx.ticket.update({
        where: { id: listing.ticket_id },
        data: { is_on_marketplace: false }
      });
    });

    // Mở khóa NFT trên Smart Contract
    if (listing.ticket && listing.ticket.nft_token_id) {
       await web3Service.unlockTicket(parseInt(listing.ticket.nft_token_id));
    }

    res.status(200).json({ message: 'Đã hủy đăng bán. Mã QR và vé đã được mở khóa.' });
  } catch (error) {
    console.error('Lỗi hủy bán vé:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  createListing,
  deleteListing
};
