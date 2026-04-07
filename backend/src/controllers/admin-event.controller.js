const { ethers } = require('ethers');
const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');

// [UC_22] Quản lý sự kiện: Lấy toàn bộ các sự kiện
const getEvents = async (req, res) => {
  try {
    const { status, keyword, from, to } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;

    if (from || to) {
      whereClause.event_date = {};
      if (from) whereClause.event_date.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.event_date.lte = toDate;
      }
    }

    if (keyword) {
      whereClause.title = { contains: keyword, mode: 'insensitive' };
    }

    const [events, totalCount, pendingCount] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        include: {
          organizer: { select: { organization_name: true } },
          category: { select: { name: true } }
        },
        orderBy: { event_date: 'desc' }
      }),
      prisma.event.count(),
      prisma.event.count({ 
        where: { 
          OR: [
            { status: 'pending' },
            { status: 'draft' } // Đếm cả bản nháp cần fix
          ]
        } 
      })
    ]);

    res.status(200).json({ 
      data: events,
      meta: {
        total: totalCount,
        pending: pendingCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Duyệt / Từ chối sự kiện
const approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // 'approve' | 'reject'

    const event = await prisma.event.findUnique({
      where: { id },
      include: { organizer: { include: { user: true } } }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }

    let smartContractAddress = event.smart_contract_address;

    if (action === 'approve') {
       // Nếu chưa có smart contract thì mới deploy (tránh deploy lại khi duyệt đi duyệt lại)
       if (!smartContractAddress) {
          try {
            // Lấy ví BTC, nếu không có thì dùng ví admin hệ thống làm backup
            let ownerWallet = event.organizer.user.wallet_address || process.env.CONTRACT_ADDRESS; 
            
            // Xử lý trường hợp ví bị lưu sai format (e.g. thiếu ký tự)
            if (!ownerWallet || !ethers.isAddress(ownerWallet)) {
              console.warn(`⚠️ [Admin Controller] Ví Organizer không hợp lệ (${ownerWallet}), đang dùng ví Admin dự phòng.`);
              ownerWallet = process.env.ADMIN_WALLET_ADDRESS || this.signer.address; // Giả sử có biến này hoặc lấy từ signer
            }

            console.log(`[Admin Controller] Đang yêu cầu deploy cho ví: ${ownerWallet}`);
            
            smartContractAddress = await web3Service.deployEventContract(ownerWallet);
          } catch (web3Error) {
            console.error('❌ [Web3 Deployment Error]:', web3Error.message);
            // Trả về lỗi cụ thể hơn để Admin biết (vd: RPC Error, Wallet Error)
            return res.status(500).json({ 
              error: 'Triển khai Smart Contract thất bại', 
              detail: web3Error.message,
              suggestion: 'Hãy đảm bảo Node Blockchain (Hardhat) đang chạy và ví Admin có đủ Gas.'
            });
          }
       }
    }

    const newStatus = action === 'approve' ? 'active' : 'draft'; 
    
    await prisma.event.update({
      where: { id },
      data: { 
        status: newStatus,
        smart_contract_address: smartContractAddress
      }
    });

    await prisma.adminActionLog.create({
      data: { admin_id: req.user.userId, action_type: `event_${action}`, target_id: id }
    });

    // TODO: Gửi Email cho BTC báo kết quả

    res.status(200).json({ 
      message: `Đã xử lý sự kiện: ${newStatus}`,
      contract_address: smartContractAddress 
    });
  } catch (error) {
    console.error('Approve Event Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Hủy khẩn cấp sự kiện
const forceCancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; 

    await prisma.event.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    // TODO: Block việc mua bán, chuyển nhượng và tự động kích hoạt logic Hoàn tiền

    await prisma.adminActionLog.create({
      data: { admin_id: req.user.userId, action_type: `event_force_cancel`, target_id: id, new_value: reason }
    });

    res.status(200).json({ message: 'Đã hủy khẩn cấp sự kiện.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Lấy chi tiết một sự kiện (ID) cho Admin
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { 
          select: { id: true, user_id: true, organization_name: true, kyc_status: true, user: { select: { email: true, phone_number: true } } } 
        },
        category: { select: { name: true } },
        ticket_tiers: true,
        _count: {
          select: {
            orders: { where: { status: 'completed' } },
            tickets: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Bật/Tắt sự kiện nổi bật
const toggleFeaturedEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      select: { is_featured: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { is_featured: !event.is_featured }
    });

    await prisma.adminActionLog.create({
      data: { 
        admin_id: req.user.userId, 
        action_type: `event_toggle_featured`, 
        target_id: id,
        new_value: updatedEvent.is_featured.toString()
      }
    });

    res.status(200).json({ 
      message: updatedEvent.is_featured ? 'Đã bật trạng thái nổi bật' : 'Đã tắt trạng thái nổi bật',
      is_featured: updatedEvent.is_featured 
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_24] Quản lý danh mục (Thêm mới)
const createCategory = async (req, res) => {
    try {
      const { name, is_active } = req.body;
      const cat = await prisma.category.create({ data: { name, is_active } });
      res.status(201).json({ message: 'Tạo danh mục thành công.', data: cat });
    } catch (error) {
        res.status(400).json({ error: 'Tên danh mục có thể đã tồn tại' });
    }
};

module.exports = {
  getEvents,
  getEventById,
  approveEvent,
  forceCancelEvent,
  toggleFeaturedEvent,
  createCategory
};
