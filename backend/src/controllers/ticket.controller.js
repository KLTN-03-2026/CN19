const prisma = require('../config/prisma');
const crypto = require('crypto');

// [UC_xx] Xem danh sách vé của tôi
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = await prisma.ticket.findMany({
      where: { current_owner_id: userId },
      include: {
        event: { select: { title: true, event_date: true, smart_contract_address: true } },
        ticket_tier: { select: { tier_name: true, section_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ data: tickets });
  } catch (error) {
    console.error('Lỗi khi tải danh sách vé:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_14] Lấy mã QR động (Dynamic QR)
const getQrCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Không tìm thấy vé hợp lệ.' });
    }

    if (ticket.status !== 'minted') {
      return res.status(400).json({ error: `Trạng thái vé không hợp lệ để checkin: ${ticket.status}` });
    }

    if (ticket.is_on_marketplace) {
      return res.status(400).json({ error: 'Vé này đang được đăng bán, không thể lấy mã check-in.' });
    }

    // Tạo mã hash ngẫu nhiên có hạn 60s
    const tokenStr = `${ticket.id}-${Date.now()}-${Math.random()}`;
    const qrHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60s

    await prisma.dynamicQRToken.create({
      data: {
        ticket_id: ticket.id,
        token_hash: qrHash,
        expires_at: expiresAt
      }
    });

    res.status(200).json({ 
      qr_code: qrHash, 
      expires_at: expiresAt 
    });

  } catch (error) {
    console.error('Lỗi lấy QR code:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_11] Chuyển nhượng vé
const transferTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { receiver_email } = req.body;

    const ticket = await prisma.ticket.findUnique({ 
      where: { id },
      include: { event: true } 
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(403).json({ error: 'Không tìm thấy vé hợp lệ.' });
    }

    if (!ticket.event.allow_transfer) {
      return res.status(400).json({ error: 'Sự kiện này hiện không hỗ trợ chuyển nhượng vé.' });
    }

    if (ticket.is_on_marketplace) {
      return res.status(400).json({ error: 'Vé đang đăng bán Marketplace, không thể chuyển nhượng.' });
    }

    const receiver = await prisma.user.findUnique({ where: { email: receiver_email } });
    if (!receiver) {
      return res.status(404).json({ error: 'Tài khoản người nhận không tồn tại.' });
    }

    // Thực thi giả lập Blockchain & DB Transaction
    const txHash = '0xTxHashMock' + Date.now();
    
    await prisma.$transaction(async (tx) => {
      // 1. Tạo bản ghi Transfer
      await tx.ticketTransfer.create({
        data: {
          ticket_id: ticket.id,
          from_user_id: userId,
          to_user_id: receiver.id,
          event_id: ticket.event_id,
          transfer_method: 'direct',
          status: 'completed',
          nft_transfer_tx_hash: txHash,
          completed_at: new Date()
        }
      });

      // 2. Cập nhật Ticket Owner
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          current_owner_id: receiver.id,
          is_transferred: true
        }
      });
    });

    res.status(200).json({ message: 'Chuyển nhượng vé thành công!', txHash });

  } catch (error) {
    console.error('Lỗi chuyển nhượng vé:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [Web3] Lấy Data truy vết trên Blockchain
const getBlockchainInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { nft_mint_tx_hash: true, nft_token_id: true, event: { select: { smart_contract_address: true } } }
    });
    
    if (!ticket) return res.status(404).json({ error: 'Không tìm thấy vé' });

    // Mock link Etherscan / Polygonscan
    const explorerUrl = `https://mumbai.polygonscan.com/tx/${ticket.nft_mint_tx_hash}`;
    const openseaUrl = `https://testnets.opensea.io/assets/mumbai/${ticket.event.smart_contract_address}/${ticket.nft_token_id}`;

    res.status(200).json({
      data: { 
        tx_hash: ticket.nft_mint_tx_hash, 
        token_id: ticket.nft_token_id, 
        explorer_url: explorerUrl, 
        opensea_url: openseaUrl 
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getMyTickets,
  getQrCode,
  transferTicket,
  getBlockchainInfo
};
