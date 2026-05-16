const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

/**
 * Service xử lý lưu trữ Metadata phi tập trung trên IPFS qua Pinata
 */
const IpfsService = {
  /**
   * Upload Metadata của vé lên IPFS
   * @param {object} ticketData Thông tin chi tiết vé
   * @returns {Promise<string>} CID của metadata (ipfs://...)
   */
  uploadTicketMetadata: async (ticketData) => {
    try {
      console.log(`[IPFS] Đang chuẩn bị Metadata cho vé: ${ticketData.ticketNumber}...`);
      
      const metadata = {
        name: `BASTICKET #${ticketData.ticketNumber} - ${ticketData.eventTitle}`,
        description: `Vé NFT chính thức từ hệ thống BASTICKET cho sự kiện "${ticketData.eventTitle}".`,
        image: ticketData.eventImage, // Link ảnh từ Cloudinary
        external_url: `${process.env.FRONTEND_URL}/tickets/${ticketData.ticketId}`,
        attributes: [
          { trait_type: "Event Name", value: ticketData.eventTitle },
          { trait_type: "Ticket Class", value: ticketData.tierName },
          { trait_type: "Seat/Section", value: ticketData.sectionName || "General" },
          { trait_type: "Ticket ID", value: ticketData.ticketId },
          { trait_type: "Issued At", value: new Date().toISOString() }
        ]
      };

      const options = {
        pinataMetadata: {
          name: `Ticket_${ticketData.ticketNumber}_Metadata`,
          keyvalues: {
            eventId: ticketData.eventId,
            orderId: ticketData.orderId
          }
        },
        pinataOptions: {
            cidVersion: 0
        }
      };

      // Gọi API Pinata để lưu JSON
      const result = await pinata.pinJSONToIPFS(metadata, options);
      
      const ipfsUrl = `ipfs://${result.IpfsHash}`;
      console.log(`[IPFS] Đã lưu Metadata thành công: ${ipfsUrl}`);
      
      return ipfsUrl;
    } catch (error) {
      console.error('[IPFS] Lỗi khi upload metadata lên Pinata:', error);
      // Fallback về metadata tĩnh nếu IPFS lỗi để không làm gián đoạn luồng mua vé
      return `https://api.basticket.com/fallback-metadata/${ticketData.ticketId}`;
    }
  }
};

module.exports = IpfsService;
