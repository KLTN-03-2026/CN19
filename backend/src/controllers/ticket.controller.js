const prisma = require('../config/prisma');
const crypto = require('crypto');
const web3Service = require('../services/web3.service');
const sendEmail = require('../utils/sendEmail');

// [UC_xx] Xem danh sách vé của tôi
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = await prisma.ticket.findMany({
      where: { 
        OR: [
          { current_owner_id: userId },
          { original_buyer_id: userId }
        ]
      },
      include: {
        event: { 
          select: { 
            id: true,
            title: true, 
            event_date: true, 
            event_time: true,
            location_address: true,
            image_url: true,
            status: true,
            allow_resale: true,
            allow_transfer: true,
            smart_contract_address: true 
          } 
        },
        ticket_tier: { 
          select: { 
            tier_name: true, 
            section_name: true,
            price: true
          } 
        },
        // Kiểm tra xem vé có listing đã được bán trên chợ không
        marketplace_listings: {
          select: { id: true, status: true }
        },
        transactions: {
          where: { 
            OR: [
              { buyer_id: userId },
              { seller_id: userId }
            ],
            status: { in: ['paid', 'success', 'completed', 'thanh_cong'] }
          },
          select: { 
            id: true,
            transaction_number: true,
            buyer_id: true,
            seller_id: true
          },
          orderBy: { created_at: 'desc' }
        },
        transfers: {
          where: { from_user_id: userId },
          orderBy: { requested_at: 'desc' },
          take: 1,
          include: {
            receiver: {
              select: { id: true, full_name: true, email: true, avatar_url: true }
            }
          }
        },
        scan_history: {
          where: { is_success: true },
          include: {
            staff: {
              select: { full_name: true, email: true }
            }
          },
          orderBy: { scanned_at: 'desc' },
          take: 1
        }
      },
    });

    // 2. Lấy danh sách blog của user cho các sự kiện này để check has_blog
    const eventIds = [...new Set(tickets.map(t => t.event_id))];
    const userBlogs = await prisma.blog.findMany({
      where: {
        author_id: userId,
        event_id: { in: eventIds }
      },
      select: { id: true, event_id: true }
    });

    const blogMap = new Map(userBlogs.map(b => [b.event_id, b.id]));

    // Bổ sung thêm flag để frontend dễ phân biệt
    const enrichedTickets = tickets.map(t => {
      const activeListing = t.marketplace_listings.find(l => l.status === 'active');
      const soldListing = t.marketplace_listings.find(l => l.status === 'sold');
      const purchaseTransaction = t.transactions[0];
      const latestTransfer = t.transfers[0];
      const blogId = blogMap.get(t.event_id);
      
      return {
        ...t,
        status: t.is_used ? 'used' : t.status,
        is_current_owner: t.current_owner_id === userId,
        is_original_buyer: t.original_buyer_id === userId,
        // true nếu vé này từng được bán qua Chợ vé (có listing với status = 'sold')
        was_sold_on_marketplace: !!soldListing,
        // Mã giao dịch mua/bán để frontend điều hướng
        mkt_transaction_number: purchaseTransaction ? purchaseTransaction.transaction_number : null,
        mkt_transaction_id: purchaseTransaction ? purchaseTransaction.id : null,
        is_seller_of_mkt: purchaseTransaction ? purchaseTransaction.seller_id === userId : false,
        // Thông tin chuyển nhượng trực tiếp (Ưu tiên lấy Order ID để xem chi tiết thanh toán)
        latest_transfer_id: latestTransfer ? (latestTransfer.order_id || latestTransfer.id) : null,
        latest_transfer_number: latestTransfer ? `TRANSFER-${latestTransfer.id.split('-')[0].toUpperCase()}` : null,
        // ID của bài đăng đang hoạt động (để hủy/sửa)
        active_listing_id: activeListing ? activeListing.id : null,
        // Thông tin blog
        has_blog: !!blogId,
        blog_id: blogId || null
      };
    });

    res.status(200).json({ data: enrichedTickets });
  } catch (error) {
    console.error('Lỗi khi tải danh sách vé:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tải danh sách vé: ' + error.message });
  }
};

// [UC_xx] Lấy chi tiết 1 vé
const getTicketDetail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        ticket_tier: true,
        current_owner: {
           select: { id: true, email: true, full_name: true }
        },
        order: {
          include: {
            merchandise_items: {
              include: {
                merchandise: true
              }
            }
          }
        },
        marketplace_listings: {
          where: { status: 'active' }
        },
        scan_history: {
          where: { is_success: true },
          include: {
            staff: {
              select: { full_name: true, email: true }
            }
          },
          orderBy: { scanned_at: 'desc' },
          take: 1
        }
      }
    });

    if (!ticket || ticket.current_owner_id !== userId) {
      return res.status(404).json({ error: 'Không tìm thấy vé hoặc bạn không sở hữu vé này.' });
    }

    // [Business Logic] Lọc các sản phẩm thuộc quyền sở hữu của user
    // Một sản phẩm thuộc về user nếu:
    // 1. User là owner_id trực tiếp
    // 2. owner_id là null VÀ user là người mua đơn hàng đó (order.user_id)
    if (ticket.order && ticket.order.merchandise_items) {
      // Lấy ID của listing đang hoạt động của vé này (nếu có)
      const activeListingId = ticket.marketplace_listings[0]?.id;

      ticket.order.merchandise_items = ticket.order.merchandise_items.filter(item => {
        // 1. Kiểm tra quyền sở hữu
        const isOwner = item.owner_id === userId || (item.owner_id === null && ticket.order.customer_id === userId);
        
        // 2. Kiểm tra xem sản phẩm đã bị đem đi bán ở đâu chưa
        // Chỉ hiện nếu: Chưa đăng bán (listing_id null) HOẶC đang đăng bán ở chính bài của vé này
        const isAvailable = !item.listing_id || (activeListingId && item.listing_id === activeListingId);
        
        // 3. Phải chưa nhận hàng (chưa redeemed)
        const isNotRedeemed = !item.is_redeemed;

        return isOwner && isAvailable && isNotRedeemed;
      });
    }

    res.status(200).json({ 
      data: {
        ...ticket,
        status: ticket.is_used ? 'used' : ticket.status, 
        is_current_owner: ticket.current_owner_id === userId,
        is_original_buyer: ticket.original_buyer_id === userId
      } 
    });
  } catch (error) {
    console.error('Lỗi lấy chi tiết vé:', error);
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

    // Thực thi gọi Blockchain
    let txHash = '0xTxHashMock' + Date.now();
    try {
        if (ticket.nft_token_id) {
            // Tạm mượn admin làm proxy transfer do user chưa có ví thật kết nối
            const mockSenderWallet = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat #1
            const mockReceiverWallet = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'; // Hardhat #2
            txHash = await web3Service.transferTicket(mockSenderWallet, mockReceiverWallet, parseInt(ticket.nft_token_id));
        }
    } catch (err) {
        console.error('Blockchain transfer error:', err);
        return res.status(500).json({ error: 'Lỗi Smart Contract: Không thể chuyển nhượng.' });
    }
    
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

      // 3. Cập nhật quyền sở hữu sản phẩm (nếu có chọn)
      if (merchandise_item_ids && Array.isArray(merchandise_item_ids) && merchandise_item_ids.length > 0) {
        await tx.merchandiseOrderItem.updateMany({
          where: {
            id: { in: merchandise_item_ids },
            order_id: ticket.order_id,
            // Kiểm tra quyền sở hữu: Hoặc là chủ sở hữu hiện tại, hoặc là người mua đơn hàng (nếu chưa từng chuyển nhượng)
            OR: [
              { owner_id: userId },
              { owner_id: null, order: { user_id: userId } }
            ]
          },
          data: {
            owner_id: receiver.id
          }
        });
      }
    });

    // Gửi email thông báo (Không đợi phản hồi)
    const sender = await prisma.user.findUnique({ where: { id: userId } });
    if (sender) {
        // Email cho người chuyển
        sendEmail(
            sender.email,
            '[BASTICKET] Xác nhận chuyển nhượng vé thành công',
            `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #28a745;">Chuyển nhượng thành công!</h2>
                <p>Chào <b>${sender.full_name || 'bạn'}</b>,</p>
                <p>Vé của bạn cho sự kiện <b>${ticket.event.title}</b> đã được chuyển nhượng thành công.</p>
                <p><b>Người nhận:</b> ${receiver.full_name || 'N/A'} (${receiver.email})</p>
                <p><b>Mã giao dịch (TX):</b> <a href="https://mumbai.polygonscan.com/tx/${txHash}">${txHash}</a></p>
                <hr/>
                <p style="font-size: 12px; color: #777;">Cảm ơn bạn đã sử dụng BASTICKET.</p>
            </div>`
        );

        // Email cho người nhận
        sendEmail(
            receiver.email,
            '[BASTICKET] Bạn vừa nhận được một vé NFT mới!',
            `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #28a745;">Bạn có vé mới!</h2>
                <p>Chào <b>${receiver.full_name || 'bạn'}</b>,</p>
                <p>Bạn vừa nhận được vé sự kiện <b>${ticket.event.title}</b> từ <b>${sender.full_name || sender.email}</b>.</p>
                <p>Hãy đăng nhập vào BASTICKET và kiểm tra mục <b>"Vé của tôi"</b> để sử dụng vé.</p>
                <div style="margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-tickets" 
                       style="background: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                       Xem vé ngay
                    </a>
                </div>
                <p style="font-size: 12px; color: #777;">Đây là tài sản NFT được xác thực trên Blockchain.</p>
            </div>`
        );
    }

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
  getTicketDetail,
  getQrCode,
  transferTicket,
  getBlockchainInfo
};
