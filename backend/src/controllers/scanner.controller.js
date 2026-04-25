const prisma = require('../config/prisma');

// [UC_29] Quét mã QR soát vé
const scanQr = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const { qr_hash, event_id } = req.body; // Chuỗi Hash scan được từ màn hình user

    let ticket = null;
    let ticketId = null;
    let tokenRecordId = null;

    // 1. Thử tìm token động trước
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

    if (tokenRecord) {
      ticket = tokenRecord.ticket;
      ticketId = ticket.id;
      tokenRecordId = tokenRecord.id;
    } else {
      // 2. Nếu không thấy token động, thử tìm trực tiếp theo Ticket ID (Mã tĩnh)
      ticket = await prisma.ticket.findUnique({
        where: { id: qr_hash },
        include: { 
          event: true,
          ticket_tier: { select: { tier_name: true } },
          order: {
            select: {
              customer: { select: { full_name: true } }
            }
          }
        }
      });
      if (ticket) ticketId = ticket.id;
    }

    // 3. Kiểm tra tính hợp lệ
    let isSuccess = false;
    let failureReason = '';

    if (!ticket) {
      failureReason = 'Mã QR không tồn tại hoặc giả mạo';
    } else if (tokenRecord && new Date() > new Date(tokenRecord.expires_at)) {
      failureReason = 'Mã QR đã hết hạn. Yêu cầu tạo mã mới';
    } else if (tokenRecord && tokenRecord.is_used) {
      failureReason = 'Mã QR này đã được quét rồi';
    } else if (ticket.is_used) {
      failureReason = 'Vé này đã được Check-in rồi';
    } else if (ticket.is_on_marketplace) {
      failureReason = 'Vé đang bị tạm khóa để bán lại trên Marketplace';
    } else if (event_id && ticket.event_id !== event_id) {
      failureReason = 'Vé này không thuộc về sự kiện bạn đang quét';
    } else {
      // Kiểm tra Staff có quyền scan event này không
      const assignment = await prisma.eventStaffAssignment.findFirst({
        where: { staff_id: staffId, event_id: ticket.event_id }
      });
      if (!assignment) {
        failureReason = 'Nhân viên không được phân công cho sự kiện này';
      } else {
        isSuccess = true;
      }
    }

    // 4. Luôn ghi Record History log nếu tìm thấy vé
    if (ticketId) {
      await prisma.$transaction(async (tx) => {
        await tx.scanHistory.create({
          data: {
            ticket_id: ticketId,
            staff_id: staffId,
            is_success: isSuccess,
            failure_reason: failureReason || null
          }
        });

        if (isSuccess) {
          if (tokenRecordId) {
            await tx.dynamicQRToken.update({
              where: { id: tokenRecordId },
              data: { is_used: true }
            });
          }
          
          await tx.ticket.update({
            where: { id: ticketId },
            data: { 
              is_used: true, 
              status: 'used', 
              checked_in_at: new Date() 
            }
          });
        }
      });
    }

    if (isSuccess) {
      return res.status(200).json({ message: 'Check-in hợp lệ. Khách được qua cổng', data: ticket });
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
    const { event_id } = req.query;
    
    // 1. Lấy danh sách sự kiện được phân công
    const assignments = await prisma.eventStaffAssignment.findMany({
      where: { staff_id: staffId },
      select: { event_id: true }
    });
    const assignedEventIds = assignments.map(a => a.event_id);

    // 2. Xây dựng điều kiện lọc: 
    // Hiện thị tất cả bản ghi mà nhân viên này quét HOẶC thuộc sự kiện nhân viên này được phân công
    let whereClause = {
      OR: [
        { staff_id: staffId },
        { ticket: { event_id: { in: assignedEventIds } } }
      ]
    };

    // Nếu lọc theo 1 sự kiện cụ thể
    if (event_id) {
      whereClause = {
        AND: [
          { ticket: { event_id: event_id } },
          {
            OR: [
              { staff_id: staffId },
              { ticket: { event_id: { in: assignedEventIds } } }
            ]
          }
        ]
      };
    }

    const logs = await prisma.scanHistory.findMany({
      where: whereClause,
      include: {
        ticket: { 
          include: { 
            event: true,
            ticket_tier: true,
            order: {
              include: {
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
      select: { event_id: true }
    });
    const assignedEventIds = assignments.map(a => a.event_id);

    const baseEvents = await prisma.event.findMany({
      where: { id: { in: assignedEventIds } },
      select: {
        id: true,
        title: true,
        event_date: true,
        event_time: true,
        location_address: true,
        image_url: true
      }
    });

    const eventsWithStats = await Promise.all(baseEvents.map(async (event) => {
      // 1. Thống kê vé
      const totalTickets = await prisma.ticket.count({
        where: { event_id: event.id }
      });
      const scannedTickets = await prisma.ticket.count({
        where: { event_id: event.id, is_used: true }
      });

      // 2. Thống kê sản phẩm (Tính theo tổng quantity của các order item đã thanh toán thuộc sự kiện này)
      const merchandiseStats = await prisma.merchandiseOrderItem.aggregate({
        where: {
          order: { 
            event_id: event.id,
            status: 'paid' 
          }
        },
        _sum: { quantity: true }
      });

      const redeemedStats = await prisma.merchandiseOrderItem.aggregate({
        where: {
          order: { 
            event_id: event.id,
            status: 'paid' 
          },
          is_redeemed: true
        },
        _sum: { quantity: true }
      });

      return {
        ...event,
        scanned_count: scannedTickets,
        total_tickets: totalTickets,
        redeemed_merchandise_count: redeemedStats._sum.quantity || 0,
        total_merchandise: merchandiseStats._sum.quantity || 0
      };
    }));

    res.status(200).json({ data: eventsWithStats });
  } catch (error) {
    console.error('Get My Events Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_32] Quét mã QR nhận sản phẩm
const scanProductQr = async (req, res) => {
  try {
    const staffId = req.user.userId;
    let { qr_hash } = req.body;

    if (!qr_hash) {
      return res.status(400).json({ error: 'Dữ liệu quét không hợp lệ' });
    }

    qr_hash = qr_hash.trim();
    
    // Xử lý nếu chuỗi bị bao bởi dấu nháy kép (do một số scanner tự thêm)
    if (qr_hash.startsWith('"') && qr_hash.endsWith('"')) {
      qr_hash = qr_hash.substring(1, qr_hash.length - 1);
    }
    // Xử lý ký tự thoát \" -> "
    qr_hash = qr_hash.replace(/\\"/g, '"');

    console.log('[ProductScan] Cleaned Hash:', qr_hash);

    let pickupCode = qr_hash;
    let orderItemId = null;

    // 1. Thử parse JSON
    try {
      const parsed = JSON.parse(qr_hash);
      console.log('[ProductScan] Parsed JSON:', parsed);
      pickupCode = parsed.pickup_code || parsed.pickupCode || qr_hash;
      orderItemId = parsed.order_item_id || parsed.orderItemId || null;
    } catch (e) {
      // 2. Nếu không phải JSON, thử trích xuất bằng Regex
      console.log('[ProductScan] Not a valid JSON, trying regex extraction');
      
      // Tìm UUID (ID sản phẩm)
      const uuidMatch = qr_hash.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (uuidMatch) orderItemId = uuidMatch[0];

      // Tìm Pickup Code hoặc Order Number (Dạng BT-XXXX hoặc ORDXXXX)
      const codeMatch = qr_hash.match(/(BT-[A-Z0-9]+|ORD[0-9]+|#ORD[0-9]+)/i);
      if (codeMatch) pickupCode = codeMatch[0];
    }

    console.log(`[ProductScan] Final resolution: pickupCode="${pickupCode}", orderItemId="${orderItemId}"`);

    // Chuẩn hóa chuỗi nhập vào: trim, viết hoa
    const cleanHash = qr_hash.toUpperCase();
    const cleanWithPrefix = cleanHash.startsWith('BT-') ? cleanHash : `BT-${cleanHash}`;

    console.log('[ProductScan] Normalized inputs:', { cleanHash, cleanWithPrefix, orderItemId });

    // Tìm MerchandiseOrderItem theo pickup_code, ID hoặc order_number (Không phân biệt hoa thường)
    const item = await prisma.merchandiseOrderItem.findFirst({
      where: {
        OR: [
          { pickup_code: { equals: cleanHash, mode: 'insensitive' } },
          { pickup_code: { equals: cleanWithPrefix, mode: 'insensitive' } },
          orderItemId ? { id: orderItemId } : null,
          { id: { equals: qr_hash, mode: 'insensitive' } }, // Thử tìm trực tiếp ID
          { 
            order: { 
              order_number: { 
                equals: qr_hash.startsWith('#') ? qr_hash : `#${qr_hash}`,
                mode: 'insensitive'
              } 
            } 
          }
        ].filter(Boolean)
      },
      include: {
        merchandise: true,
        order: {
          include: {
            customer: { select: { full_name: true } }
          }
        }
      }
    });

    let isSuccess = false;
    let failureReason = '';
    let itemId = item ? item.id : null;

    if (!item) {
      failureReason = 'Mã nhận hàng không tồn tại trên hệ thống';
    } else if (item.is_redeemed) {
      failureReason = 'Sản phẩm này đã được nhận rồi';
    } else {
      // Kiểm tra Staff có quyền scan tại sự kiện này không
      const targetEventId = item.merchandise.event_id || item.order.event_id;
      
      // [MỚI] Kiểm tra sản phẩm có thuộc sự kiện đang chọn không (nếu có truyền event_id từ app)
      const { event_id: selectedEventId } = req.body;
      if (selectedEventId && targetEventId && targetEventId !== selectedEventId) {
        failureReason = 'Sản phẩm này không thuộc về sự kiện bạn đang quét';
      } else if (targetEventId) {
        const assignment = await prisma.eventStaffAssignment.findFirst({
          where: { staff_id: staffId, event_id: targetEventId }
        });
        if (!assignment) {
          failureReason = 'Nhân viên không được phân công cho sự kiện này';
        } else {
          isSuccess = true;
        }
      } else {
        isSuccess = true;
      }
    }

    // Ghi log lịch sử
    if (itemId) {
      await prisma.$transaction(async (tx) => {
        await tx.merchandiseScanHistory.create({
          data: {
            order_item_id: itemId,
            staff_id: staffId,
            is_success: isSuccess,
            failure_reason: failureReason || null
          }
        });

        if (isSuccess) {
          await tx.merchandiseOrderItem.update({
            where: { id: itemId },
            data: {
              is_redeemed: true,
              redeemed_at: new Date()
            }
          });
        }
      });
    }

    if (isSuccess) {
      return res.status(200).json({ 
        message: 'Xác nhận nhận hàng thành công', 
        data: {
          product_name: item.merchandise.name,
          customer_name: item.order.customer.full_name,
          quantity: item.quantity
        }
      });
    } else {
      return res.status(400).json({ error: failureReason });
    }
  } catch (error) {
    console.error('Scan Product Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_33] Xem lịch sử quét sản phẩm
const getProductScanHistory = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const { event_id } = req.query;

    // 1. Lấy danh sách sự kiện được phân công
    const assignments = await prisma.eventStaffAssignment.findMany({
      where: { staff_id: staffId },
      select: { event_id: true }
    });
    const assignedEventIds = assignments.map(a => a.event_id);

    // 2. Xây dựng điều kiện lọc
    let whereClause = {
      OR: [
        { staff_id: staffId },
        { 
          order_item: { 
            order: { event_id: { in: assignedEventIds } } 
          } 
        }
      ]
    };

    if (event_id) {
      whereClause = {
        AND: [
          { order_item: { order: { event_id: event_id } } },
          {
            OR: [
              { staff_id: staffId },
              { 
                order_item: { 
                  order: { event_id: { in: assignedEventIds } } 
                } 
              }
            ]
          }
        ]
      };
    }

    const logs = await prisma.merchandiseScanHistory.findMany({
      where: whereClause,
      include: {
        order_item: {
          include: {
            merchandise: {
              include: { event: true }
            },
            order: {
              include: {
                customer: { select: { full_name: true } },
                event: true
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
    console.error('Get Product History Error:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  scanQr,
  getScanHistory,
  getMyEvents,
  scanProductQr,
  getProductScanHistory
};
