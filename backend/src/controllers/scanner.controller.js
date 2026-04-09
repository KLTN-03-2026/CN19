const prisma = require('../config/prisma');

// [UC_29] Quét mã QR soát vé
const scanQr = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const { qr_hash } = req.body; // Chuỗi Hash scan được từ màn hình user

    // 1. Tìm token động trong bảng DynamicQRToken
    const tokenRecord = await prisma.dynamicQRToken.findUnique({
      where: { token_hash: qr_hash },
      include: { 
      ticket: { 
        include: { 
          event: true,
          ticket_tier: { select: { tier_name: true } },
          order: {
            select: {
              customer: { select: { full_name: true } }
            }
          }
        } 
      } 
    }
    });

    // 2. Kiểm tra tính hợp lệ
    let isSuccess = false;
    let failureReason = '';
    let ticketId = tokenRecord ? tokenRecord.ticket_id : null;

    if (!tokenRecord) {
      failureReason = 'Mã QR không tồn tại hoặc giả mạo';
    } else if (new Date() > new Date(tokenRecord.expires_at)) {
      failureReason = 'Mã QR đã hết hạn. Yêu cầu tạo mã mới';
    } else if (tokenRecord.is_used) {
      failureReason = 'Mã QR này đã được quét rồi';
    } else if (tokenRecord.ticket.is_used) {
      failureReason = 'Vé này đã được Check-in rồi';
    } else if (tokenRecord.ticket.is_on_marketplace) {
      failureReason = 'Vé đang bị tạm khóa để bán lại trên Marketplace';
    } else {
      // 3. Kiểm tra Staff có quyền scan event này không
      const assignment = await prisma.eventStaffAssignment.findFirst({
        where: { staff_id: staffId, event_id: tokenRecord.ticket.event_id }
      });
      if (!assignment) {
        failureReason = 'Nhân viên không được phân công cho sự kiện này';
      } else {
        isSuccess = true;
      }
    }

    // 4. Record History log
    if (ticketId) {
      await prisma.$transaction(async (tx) => {
        // Log lịch sử
        await tx.scanHistory.create({
          data: {
            ticket_id: ticketId,
            is_success: isSuccess,
            failure_reason: failureReason || null
          }
        });

        if (isSuccess) {
          // Vô hiệu hóa mã QR tránh chụp ảnh quét lại
          await tx.dynamicQRToken.update({
            where: { id: tokenRecord.id },
            data: { is_used: true }
          });
          
          // Check-in Ticket
          await tx.ticket.update({
            where: { id: ticketId },
            data: { is_used: true, checked_in_at: new Date() }
          });
        }
      });
    }

    if (isSuccess) {
      return res.status(200).json({ message: 'Check-in hợp lệ. Khách được qua cổng', data: tokenRecord.ticket });
    } else {
      return res.status(400).json({ error: failureReason });
    }
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_30] Xem lịch sử quét vé (Ca làm việc)
const getScanHistory = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const { event_id } = req.query; // Nhận event_id từ query nếu có
    
    let whereClause = {};

    if (event_id) {
      // Nếu có event_id, chỉ lấy log của event đó
      whereClause = {
        ticket: { event_id: event_id }
      };
    } else {
      // Nếu không có, lấy tất cả các event mà nhân viên này được phân công
      const assignments = await prisma.eventStaffAssignment.findMany({
        where: { staff_id: staffId },
        select: { event_id: true }
      });
      const eventIds = assignments.map(a => a.event_id);
      whereClause = {
        ticket: { event_id: { in: eventIds } }
      };
    }

    const logs = await prisma.scanHistory.findMany({
      where: whereClause,
      include: {
        ticket: { 
          select: { 
            ticket_number: true, 
            event: { select: { title: true } },
            ticket_tier: { select: { tier_name: true } },
            order: {
              select: {
                customer: { select: { full_name: true } }
              }
            }
          } 
        }
      },
      orderBy: { scanned_at: 'desc' },
      take: 100
    });

    res.status(200).json({ data: logs });
  } catch (error) {
    console.error('Get Scan History Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_31] Lấy danh sách sự kiện được phân công (Dành cho Staff)
const getMyEvents = async (req, res) => {
  try {
    const staffId = req.user.userId;

    const assignments = await prisma.eventStaffAssignment.findMany({
      where: { staff_id: staffId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            event_date: true,
            event_time: true,
            location_address: true,
            image_url: true,
            _count: {
              select: { tickets: { where: { is_used: true } } }
            }
          }
        }
      }
    });

    const events = assignments.map(a => ({
      ...a.event,
      scanned_count: a.event._count.tickets
    }));

    res.status(200).json({ data: events });
  } catch (error) {
    console.error('Get My Events Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  scanQr,
  getScanHistory,
  getMyEvents
};
