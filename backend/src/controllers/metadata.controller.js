const prisma = require('../config/prisma');

// [Web3] Cung cấp ERC721 Metadata dạng JSON
const getMetadata = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const ticket = await prisma.ticket.findFirst({
      where: { nft_token_id: tokenId },
      include: { event: true, ticket_tier: true }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Metadata không tồn tại' });
    }

    // JSON chuẩn OpenSea Metadata
    const metadata = {
      name: `${ticket.event.title} - ${ticket.ticket_tier.tier_name}`,
      description: `Vé tham gia sự kiện ${ticket.event.title} vào ngày ${ticket.event.event_date}. Phân khu: ${ticket.ticket_tier.section_name}`,
      image: ticket.event.banner_url || "https://example.com/default-ticket.png",
      attributes: [
        { trait_type: "Event", value: ticket.event.title },
        { trait_type: "Tier", value: ticket.ticket_tier.tier_name },
        { trait_type: "Ticket Number", value: ticket.ticket_number },
        { display_type: "date", trait_type: "Event Date", value: new Date(ticket.event.event_date).getTime() / 1000 }
      ]
    };

    res.status(200).json(metadata);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = { getMetadata };
