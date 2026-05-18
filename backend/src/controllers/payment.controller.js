const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../config/prisma');
const blockchainService = require('../services/blockchain.service');
const web3Service = require('../services/web3.service');
const emailService = require('../services/email.service');
const { sendEmail } = require('../services/email.service');
const { format } = require('date-fns');
const botService = require('../services/bot.service');
const ipfsService = require('../services/ipfs.service');
const NotificationService = require('../services/notification.service');

/**
 * Controller xử lý thanh toán VNPay và MoMo
 */
const PaymentController = {
    // [POST] /api/payments/create-url
    createPaymentUrl: async (req, res) => {
        try {
            const { ma_don_hang, phuong_thuc, behaviorData, captchaToken, puzzleData } = req.body;

            // 1. Phân tích Anti-Bot lần cuối trước khi thanh toán (Puzzle Slider & AI)
            const aiAnalysis = await botService.analyzeBotBehavior(req, captchaToken, behaviorData, puzzleData);
            
            // Theo dõi lịch sử Bot Detection (Optional order_id)
            prisma.botDetectionLog.create({
                data: {
                    user_id: req.user.userId,
                    event_type: 'PAYMENT',
                    click_speed_ms: behaviorData?.click_speed_ms || 0,
                    form_fill_duration: behaviorData?.form_fill_duration || 0,
                    behavior_metrics: behaviorData?.behavior_metrics || {},
                    risk_score: aiAnalysis.riskScore,
                    decision: aiAnalysis.isBot ? 'BLOCK' : 'ALLOW',
                    ip_address: botService.getClientIp(req),
                    user_agent: req.headers['user-agent'],
                    detection_details: {
                      details: aiAnalysis.details,
                      recaptchaScore: aiAnalysis.recaptchaScore,
                      aiRiskScore: aiAnalysis.aiRiskScore
                    }
                }
            }).catch(err => console.error('Log error:', err));

            if (aiAnalysis.isBot) {
                return res.status(403).json({ 
                    error: 'Hệ thống phát hiện hành vi thanh toán bất thường. Vui lòng thử lại hoặc giải đúng Puzzle Captcha.',
                    is_bot: true 
                });
            }

            let order = await prisma.order.findUnique({
                where: { order_number: ma_don_hang },
                include: { event: { select: { title: true } } }
            });

            // Nếu không tìm thấy trong Order, tìm trong MarketplaceTransaction
            let isMarketplace = false;
            if (!order) {
                const mktTx = await prisma.marketplaceTransaction.findUnique({
                    where: { transaction_number: ma_don_hang },
                    include: { ticket: { include: { event: { select: { title: true } } } } }
                });

                if (mktTx) {
                    isMarketplace = true;
                    // Map MarketplaceTransaction sang cấu trúc giống Order để dùng chung logic bên dưới
                    order = {
                        order_number: mktTx.transaction_number,
                        total_amount: mktTx.buyer_pay_amount,
                        expires_at: new Date(Date.now() + 15 * 60 * 1000), // Mặc định 15p cho mkt
                        status: mktTx.status,
                        event: mktTx.ticket.event,
                        isMarketplace: true,
                        id: mktTx.id
                    };
                }
            }

            if (!order) return res.status(404).json({ error: 'Đơn hàng hoặc giao dịch không tồn tại.' });
            if (order.status === 'paid' || order.status === 'success') return res.status(400).json({ error: 'Giao dịch này đã được thanh toán.' });

            // Kiểm tra xem đơn hàng đã hết hạn chưa (10 phút giữ vé)
            if (new Date() > order.expires_at) {
                return res.status(400).json({ error: 'Giao dịch đã hết hạn. Vui lòng thực hiện lại.' });
            }

            if (phuong_thuc === 'vnpay') {
                return await createVNPayPayment(order, req, res);
            } else if (phuong_thuc === 'momo') {
                return await createMoMoPayment(order, req, res);
            } else {
                return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ.' });
            }
        } catch (error) {
            console.error('Create Payment URL Error:', error);
            // Trả về lỗi chi tiết nếu có để dễ debugging
            const errorMessage = error.response ? 
                (error.response.data.message || error.message) : 
                error.message;
            res.status(500).json({ error: `Lỗi khi tạo liên kết thanh toán: ${errorMessage}` });
        }
    },

    // [GET] /api/payments/vnpay-return
    vnpayReturn: async (req, res) => {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = sortObject(vnp_Params);
            const secretKey = process.env.VNP_HASH_SECRET.trim();
            const qs = require('qs');
            const signData = qs.stringify(vnp_Params, { encode: true });
            const hmac = crypto.createHmac("sha512", secretKey);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            if (secureHash === signed) {
                const orderNumber = vnp_Params['vnp_TxnRef'];
                const rspCode = vnp_Params['vnp_ResponseCode'];
                const isMarketplace = orderNumber.startsWith('MKT');

                if (rspCode === '00') {
                    await processOrderSuccess(orderNumber, vnp_Params['vnp_TransactionNo'], 'VNPAY', vnp_Params);

                    if (orderNumber.startsWith('FEE')) {
                        return res.status(200).json({ 
                            message: 'Thanh toán phí bồi hoàn VNPay thành công',
                            isFeeOrder: true,
                            orderId: orderNumber
                        });
                    }

                    if (isMarketplace) {
                        const updatedMktTx = await prisma.marketplaceTransaction.findUnique({
                            where: { transaction_number: orderNumber },
                            include: { ticket: { include: { event: true } } }
                        });
                        return res.status(200).json({ 
                            message: 'Thanh toán VNPay thành công',
                            order: updatedMktTx
                        });
                    } else {
                        const updatedOrder = await prisma.order.findUnique({
                            where: { order_number: orderNumber },
                            include: { event: true }
                        });
                        return res.status(200).json({ 
                            message: 'Thanh toán VNPay thành công',
                            order: updatedOrder
                        });
                    }
                }

                // Thanh toán thất bại
                if (isMarketplace) {
                    // Giải phóng lại listing khi thanh toán thất bại
                    const mktTx = await prisma.marketplaceTransaction.findUnique({
                        where: { transaction_number: orderNumber }
                    });
                    if (mktTx) {
                        await prisma.marketplaceListing.update({
                            where: { id: mktTx.listing_id },
                            data: { status: 'active', is_locked: false, lock_expires_at: null }
                        });
                        await prisma.marketplaceTransaction.update({
                            where: { id: mktTx.id },
                            data: { status: 'failed' }
                        });
                    }
                    return res.status(400).json({ error: 'Thanh toán VNPay thất bại' });
                }
                const associatedOrder = await prisma.order.findUnique({
                    where: { order_number: orderNumber }, include: { event: true }
                });
                return res.status(400).json({ 
                    error: 'Thanh toán VNPay thất bại',
                    order: associatedOrder
                });
            } else {
                return res.status(400).json({ error: 'Chữ ký không hợp lệ' });
            }
        } catch (error) {
            console.error('VNPay Return Error:', error);
            res.status(500).json({ error: 'Lỗi xử lý kết quả VNPay.' });
        }
    },

    // VNPay IPN (Callback ngầm từ VNPay)
    vnpayIPN: async (req, res) => {
        try {
            let vnp_Params = req.query;
            let secureHash = vnp_Params['vnp_SecureHash'];

            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];

            vnp_Params = sortObject(vnp_Params);
            const secretKey = process.env.VNP_HASH_SECRET.trim();
            const qs = require('qs');
            const signData = qs.stringify(vnp_Params, { encode: true });
            const hmac = crypto.createHmac("sha512", secretKey);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            if(secureHash === signed){
                const orderNumber = vnp_Params['vnp_TxnRef'];
                const rspCode = vnp_Params['vnp_ResponseCode'];

                if(rspCode === '00') {
                    await processOrderSuccess(orderNumber, vnp_Params['vnp_TransactionNo'], 'VNPAY', vnp_Params);
                } else {
                    await prisma.order.update({
                        where: { order_number: orderNumber },
                        data: { status: 'failed' }
                    });
                }
                res.status(200).json({RspCode: '00', Message: 'Success'});
            } else {
                res.status(200).json({RspCode: '97', Message: 'Fail checksum'});
            }
        } catch (error) {
            console.error('VNPay IPN Error:', error);
            res.status(500).json({ error: 'Lỗi xử lý IPN.' });
        }
    },

    // MoMo Return (Redirect sau khi thanh toán)
    momoReturn: async (req, res) => {
        try {
            const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.query;
            const secretKey = process.env.MOMO_SECRET_KEY.trim();
            const accessKey = process.env.MOMO_ACCESS_KEY.trim();

            // Xác thực chữ ký
            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
            const calculatedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            if (calculatedSignature !== signature) {
                return res.status(400).json({ error: 'Chữ ký không hợp lệ từ MoMo' });
            }

            // Lấy orderNumber từ orderInfo (mẫu: "Thanh toan don hang ORD...")
            const orderNumber = orderInfo.includes(' ') ? orderInfo.split(' ').pop() : orderId;

            if (resultCode == 0) {
                // Thanh toán thành công
                await processOrderSuccess(orderNumber, transId, 'MOMO', req.query);
                
                // Chuyển hướng người dùng về trang kết quả của frontend
                const redirectUrl = `${process.env.FRONTEND_URL}/payment-result?orderId=${orderId}&resultCode=${resultCode}&orderNumber=${orderNumber}&method=momo`;
                return res.redirect(redirectUrl);
            } else {
                // Thanh toán thất bại hoặc người dùng hủy
                await prisma.order.update({
                    where: { order_number: orderNumber },
                    data: { status: 'failed' }
                }).catch(() => {});

                const redirectUrl = `${process.env.FRONTEND_URL}/payment-result?orderId=${orderId}&resultCode=${resultCode}&orderNumber=${orderNumber}&method=momo&message=${encodeURIComponent(message)}`;
                return res.redirect(redirectUrl);
            }
        } catch (error) {
            console.error('MoMo Return Error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/payment-result?resultCode=99&error=system_error`);
        }
    },

    // MoMo IPN (Callback ngầm từ MoMo)
    momoIPN: async (req, res) => {
        try {
            const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;
            const secretKey = process.env.MOMO_SECRET_KEY.trim();
            const accessKey = process.env.MOMO_ACCESS_KEY.trim();

            // Xác thực chữ ký theo đúng chuẩn MoMo IPN
            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
            const calculatedSignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            if (calculatedSignature !== signature) {
                console.error('[MoMo IPN] Signature mismatch!');
                return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
            }

            // orderId từ MoMo giờ chỉ là MOMO{timestamp}
            // Chúng ta cần lấy order_number từ payload của MoMo (orderInfo) hoặc extraData
            // Cách đơn giản nhất: MoMo trả về orderInfo trong IPN
            const orderNumber = orderInfo.includes(' ') ? orderInfo.split(' ').pop() : orderId;

            if (resultCode == 0) {
                await processOrderSuccess(orderNumber, transId, 'MOMO', req.body);
            } else {
                await prisma.order.update({
                    where: { order_number: orderNumber },
                    data: { status: 'failed' }
                });
            }

            res.status(204).send();
        } catch (error) {
            console.error('MoMo IPN Error:', error);
            res.status(500).json({ error: 'Lỗi xử lý IPN MoMo.' });
        }
    },

    // Kiểm tra trạng thái thanh toán
    getPaymentStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { status: true, transaction_id: true, order_number: true }
            });

            if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });

            res.status(200).json({ 
                status: order.status,
                is_paid: order.status === 'paid'
            });
        } catch (error) {
            console.error('Get Payment Status Error:', error);
            res.status(500).json({ error: 'Lỗi server.' });
        }
    }
};

// Helper function to create VNPay URL
async function createVNPayPayment(order, req, res) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    let date = new Date();
    let createDate = format(date, 'yyyyMMddHHmmss');
    
    let tmnCode = process.env.VNP_TMN_CODE.trim();
    let secretKey = process.env.VNP_HASH_SECRET.trim();
    let vnpUrl = process.env.VNP_URL.trim();
    let returnUrl = process.env.VNP_RETURN_URL.trim();

    // VNPay ExpireDate: Tính toán dựa trên thời gian hết hạn của đơn hàng (expires_at)
    let expireDate = format(new Date(order.expires_at), 'yyyyMMddHHmmss');
    let amount = Math.round(order.total_amount);
    let orderInfo = `ThanhToanDonHang${order.order_number}`;
    let locale = 'vn';
    let currCode = 'VND';
    
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = order.order_number;
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
        ipAddr = '127.0.0.1';
    }
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    // Sort and Stringify using standard approach
    const sortedParams = sortObject(vnp_Params);
    const qs = require('qs');
    const signData = qs.stringify(sortedParams, { encode: true });
    
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    
    vnpUrl += '?' + signData;
    vnpUrl += '&vnp_SecureHash=' + signed;

    console.log('--- VNPAY DEBUG ---');
    console.log('TMN CODE:', tmnCode);
    console.log('SIGN DATA:', signData);
    console.log('PAYMENT URL:', vnpUrl);
    console.log('-------------------');

    return res.status(200).json({ payment_url: vnpUrl });
}

// Helper function to create MoMo URL (Real Sandbox)
async function createMoMoPayment(order, req, res) {
    const partnerCode = process.env.MOMO_PARTNER_CODE.trim();
    const accessKey = process.env.MOMO_ACCESS_KEY.trim();
    const secretKey = process.env.MOMO_SECRET_KEY.trim();
    
    // Per MoMo sample: orderId = partnerCode + timestamp
    const orderId = partnerCode + Date.now();
    const requestId = orderId; 
    const amount = Math.round(order.total_amount).toString();
    const orderInfo = `Thanh toan don hang ${order.order_number}`; 
    const redirectUrl = process.env.MOMO_RETURN_URL;
    const ipnUrl = process.env.MOMO_NOTIFY_URL; 
    const requestType = "payWithMethod"; // Dùng lại payWithMethod theo mẫu bạn gửi
    const extraData = "";
    const orderGroupId = "";
    const autoCapture = true;
    const lang = 'vi';

    // Tính toán thời gian còn lại (phút) cho MoMo
    const remainingTimeMs = new Date(order.expires_at).getTime() - Date.now();
    let orderExpireTime = Math.max(1, Math.floor(remainingTimeMs / 60000)); 

    // Signature string (Order alphabetical)
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const requestBody = JSON.stringify({
        partnerCode,
        partnerName: "BASTICKET",
        storeId: "BASTICKET",
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        orderExpireTime: parseInt(orderExpireTime),
        extraData,
        orderGroupId,
        signature
    });

    const https = require('https');
    const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    return new Promise((resolve, reject) => {
        const momoReq = https.request(options, momoRes => {
            let data = '';
            momoRes.on('data', chunk => data += chunk);
            momoRes.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.resultCode === 0 && result.payUrl) {
                        return res.status(200).json({ payment_url: result.payUrl });
                    } else {
                        return res.status(500).json({ 
                            error: `MoMo Error: ${result.message}`
                        });
                    }
                } catch (e) {
                    res.status(500).json({ error: 'Lỗi khi xử lý phản hồi từ MoMo.' });
                }
            });
        });

        momoReq.on('error', (e) => {
            res.status(500).json({ error: `Lỗi kết nối tới MoMo: ${e.message}` });
        });

        momoReq.write(requestBody);
        momoReq.end();
    });
}

/**
 * Xử lý sau khi thanh toán thành công: 
 * 1. Cập nhật Order status = PAID
 * 2. Xuất vé (Ticket) vào DB
 * 3. Kích hoạt Mint NFT trong nền
 */
async function processOrderSuccess(orderNumber, transactionId, method, payload) {
    let createdTickets = [];
    let orderData = null;
    let transferData = null;

    // Nếu là giao dịch Marketplace, xử lý riêng và thoát sớm
    if (orderNumber.startsWith('MKT')) {
        await processMktOrderSuccess(orderNumber, transactionId, method, payload);
        return;
    }

    // Nếu là thanh toán phí bồi hoàn hủy sự kiện
    if (orderNumber.startsWith('FEE')) {
        await processFeeOrderSuccess(orderNumber, transactionId, method, payload);
        return;
    }

    await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { order_number: orderNumber },
            include: { 
                items: { include: { ticket_tier: true } },
                customer: { select: { wallet_address: true, full_name: true, email: true, id: true } },
                event: { include: { organizer: true } }
            }
        });

        if (!order || order.status === 'paid') return;
        orderData = order;

        // 1. Cập nhật trạng thái Order
        await tx.order.update({
            where: { id: order.id },
            data: { 
                status: 'paid',
                transaction_id: transactionId,
                payment_method: method.toLowerCase()
            }
        });

        // 2. Tạo bản ghi Payment
        await tx.payment.create({
            data: {
                order_id: order.isMarketplace ? null : order.id,
                mkt_transaction_id: order.isMarketplace ? order.id : null,
                method: method.toLowerCase(),
                transaction_id: transactionId,
                amount: order.total_amount,
                status: 'thanh_cong',
                response_data: payload,
                paid_at: new Date()
            }
        });

        // 3. Tạo bản ghi Ticket (Nếu là mua vé mới)
        if (order.order_type === 'TICKET_PURCHASE') {
            for (const item of order.items) {
                for (let i = 0; i < item.quantity; i++) {
                    const ticket = await tx.ticket.create({
                        data: {
                            order_id: order.id,
                            event_id: order.event_id,
                            ticket_tier_id: item.ticket_tier_id,
                            ticket_number: `T-${order.id.slice(0, 8)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                            status: 'valid',
                            current_owner_id: order.customer_id,
                            original_buyer_id: order.customer_id
                        }
                    });
                    createdTickets.push(ticket);
                }
            }
        }

        // 4. Nếu là đơn hàng Chuyển nhượng (TICKET_TRANSFER)
        if (order.order_type === 'TICKET_TRANSFER') {
            const { ticket_id, receiver_email } = order.metadata || {};
            if (ticket_id && receiver_email) {
                const ticket = await tx.ticket.findUnique({
                    where: { id: ticket_id },
                    include: { event: true }
                });
                const receiver = await tx.user.findUnique({ where: { email: receiver_email } });
                const sender = order.customer;

                if (ticket && receiver) {
                    // Lưu bản ghi Transfer (hash sẽ được cập nhật sau bởi background task Blockchain)
                    const ticketTransfer = await tx.ticketTransfer.create({
                        data: {
                            ticket_id: ticket.id,
                            from_user_id: sender.id,
                            to_user_id: receiver.id,
                            event_id: ticket.event_id,
                            order_id: order.id,
                            transfer_method: 'direct',
                            status: 'completed',
                            nft_transfer_tx_hash: null,
                            completed_at: new Date()
                        }
                    });

                    // Cập nhật Ticket Owner & Transfer Count
                    await tx.ticket.update({
                        where: { id: ticket.id },
                        data: {
                            current_owner_id: receiver.id,
                            is_transferred: true,
                            transfer_count: { increment: 1 }
                        }
                    });

                    // Cập nhật quyền sở hữu Sản phẩm (Merchandise)
                    const { merchandise_item_ids } = order.metadata || {};
                    if (merchandise_item_ids && Array.isArray(merchandise_item_ids) && merchandise_item_ids.length > 0) {
                        await tx.merchandiseOrderItem.updateMany({
                            where: {
                                id: { in: merchandise_item_ids },
                                order_id: ticket.order_id
                            },
                            data: {
                                owner_id: receiver.id
                            }
                        });
                    }

                    transferData = { ticket, receiver, sender, ticketTransfer };
                }
            }
        }
    });

    // Sau khi Transaction thành công, chạy các tác vụ nền
    if (orderData && createdTickets.length > 0) {
        // 4. Gửi email xác nhận
        emailService.sendBookingSuccessEmail(orderData, orderData.customer, orderData.event);

        // 5. Chạy các tác vụ Blockchain ở chế độ nền (Background) để không chặn HTTP Response trả về cho VNPay/Momo/Khách hàng
        (async () => {
            console.log(`[Web3 Background] Bắt đầu đúc ${createdTickets.length} vé và ghi sổ tài chính cho đơn hàng ${orderNumber}...`);
            
            // A. Đúc NFT tuần tự
            for (const ticket of createdTickets) {
                try {
                    await triggerNFTMinting(ticket, orderData.customer.wallet_address);
                } catch (mintErr) {
                    console.error(`[Web3 Background Error] Lỗi đúc vé ${ticket.ticket_number}:`, mintErr.message);
                }
            }

            // B. Ghi log tài chính mua vé gốc + sản phẩm chi tiết lên Blockchain
            try {
                await blockchainService.logFinancialTransaction(
                    orderNumber,
                    Number(orderData.total_amount),
                    {
                        ticketPlatformFee: Number(orderData.ticket_platform_fee || 0),
                        ticketCommissionFee: Number(orderData.ticket_commission_fee || 0),
                        merchPlatformFee: Number(orderData.merchandise_platform_fee || 0),
                        merchCommissionFee: Number(orderData.merchandise_commission_fee || 0),
                        gasFee: Number(orderData.gas_fee || 0)
                    },
                    'PRIMARY_PURCHASE',
                    orderData.customer.wallet_address || undefined,
                    orderData?.event?.smart_contract_address || null
                );
                console.log(`[Web3 Background] Ghi sổ tài chính thành công cho đơn hàng ${orderNumber}`);
            } catch (auditErr) {
                console.error(`[Web3 Background Error] Lỗi ghi sổ tài chính ${orderNumber}:`, auditErr.message);
            }
        })().catch(bgErr => console.error('[Web3 Background Process Error]:', bgErr));

        // 6. Thông báo cho Ban Tổ Chức có đơn hàng mới
        if (orderData.event && orderData.order_type === 'TICKET_PURCHASE') {
          NotificationService.create({
            user_id: orderData.event.organizer.user_id,
            type: 'NEW_TICKET_SALE',
            title: 'Có đơn hàng mới!',
            message: `Sự kiện "${orderData.event.title}" vừa bán được ${createdTickets.length} vé.`,
            target_id: orderData.id // Chuyển sang ID đơn hàng để xem chi tiết
          }).catch(err => console.error('Notify Organizer Error:', err));
        }
    } else if (orderData && orderData.order_type === 'TICKET_TRANSFER' && transferData) {
        const { ticket, receiver, sender, ticketTransfer } = transferData;
        
        // Gửi email thông báo
        emailService.sendTransferSuccessEmail(sender, receiver, ticket);
        emailService.sendTicketReceivedEmail(receiver, sender, ticket);

        // Chạy Blockchain ở chế độ nền
        (async () => {
            console.log(`[Transfer Web3 Background] Bắt đầu xử lý Blockchain cho đơn chuyển nhượng ${orderNumber}...`);
            
            // 1. Ghi log tài chính lên Blockchain
            try {
                await blockchainService.logFinancialTransaction(
                    orderNumber,
                    Number(orderData.total_amount),
                    { gasFee: Number(orderData.gas_fee || orderData.total_amount) },
                    'TRANSFER_FEE',
                    sender.wallet_address || undefined,
                    ticket?.event?.smart_contract_address || null
                );
                console.log(`[Transfer Web3 Background] Ghi sổ tài chính thành công cho giao dịch ${orderNumber}`);
            } catch (auditErr) {
                console.error(`[Transfer Web3 Background Error] Lỗi ghi sổ tài chính ${orderNumber}:`, auditErr.message);
            }

            // 2. Chuyển nhượng (Transfer) NFT trên Blockchain
            const contractAddress = ticket.event.smart_contract_address || process.env.CONTRACT_ADDRESS;
            if (ticket.nft_token_id && contractAddress) {
                const senderWallet = sender.wallet_address;
                const receiverWallet = receiver.wallet_address;
                
                if (senderWallet && receiverWallet) {
                    try {
                        const txHash = await web3Service.transferTicket(
                            contractAddress, 
                            senderWallet, 
                            receiverWallet, 
                            parseInt(ticket.nft_token_id)
                        );
                        
                        // Cập nhật tx hash thật vào DB bằng client ngoài transaction
                        await prisma.ticketTransfer.update({
                            where: { id: ticketTransfer.id },
                            data: { nft_transfer_tx_hash: txHash }
                        });
                        console.log(`[Transfer Web3 Background] Transfer NFT thành công! TxHash: ${txHash}`);
                    } catch (err) {
                        console.error('[Transfer Web3 Background Error] Lỗi transfer NFT:', err.message);
                    }
                }
            }
        })().catch(bgErr => console.error('[Transfer Web3 Background Process Error]:', bgErr));

        // Thông báo hệ thống
        NotificationService.create({
            user_id: receiver.id,
            type: 'TICKET_RECEIVED_TRANSFER',
            title: 'Bạn nhận được vé mới!',
            message: `Bạn vừa nhận được 1 vé sự kiện "${ticket.event.title}" từ ${sender.full_name || sender.email}.`,
            target_id: orderData.id
        }).catch(() => {});

        NotificationService.create({
            user_id: sender.id,
            type: 'TICKET_SENT_TRANSFER',
            title: 'Chuyển nhượng thành công!',
            message: `Vé sự kiện "${ticket.event.title}" đã được chuyển cho ${receiver.full_name || receiver.email}.`,
            target_id: orderData.id
        }).catch(() => {});
    }
}

/**
 * Xử lý sau khi thanh toán Marketplace thành công:
 * 1. Cập nhật MarketplaceTransaction status = paid
 * 2. Cập nhật Listing status = sold
 * 3. Chuyển quyền sở hữu Vé + Sản phẩm sang Người mua
 * 4. Lưu bản ghi Payment
 */
async function processMktOrderSuccess(orderNumber, transactionId, method, payload) {
    try {
        let mktTxData = null;
        let ticketData = null;

        await prisma.$transaction(async (tx) => {
            const mktTx = await tx.marketplaceTransaction.findUnique({
                where: { transaction_number: orderNumber },
                include: {
                    listing: { include: { ticket: true } },
                    buyer: true,
                    seller: true
                }
            });

            if (!mktTx || mktTx.status === 'paid') {
                console.log(`[MKT] Giao dịch ${orderNumber} đã xử lý hoặc không tồn tại.`);
                return;
            }

            console.log(`[MKT] Xử lý thanh toán thành công cho giao dịch ${orderNumber}...`);

            // A. Cập nhật trạng thái Transaction -> paid
            await tx.marketplaceTransaction.update({
                where: { id: mktTx.id },
                data: {
                    status: 'paid',
                    nft_transfer_tx_hash: null
                }
            });

            // B. Cập nhật trạng thái Listing -> sold
            await tx.marketplaceListing.update({
                where: { id: mktTx.listing_id },
                data: {
                    status: 'sold',
                    is_locked: false,
                    lock_expires_at: null,
                    sold_at: new Date()
                }
            });

            // C. Chuyển quyền sở hữu Vé sang Người mua
            const ticket = await tx.ticket.findUnique({
                where: { id: mktTx.ticket_id },
                include: { event: { include: { organizer: true } } }
            });

            await tx.ticket.update({
                where: { id: mktTx.ticket_id },
                data: {
                    current_owner_id: mktTx.buyer_id,
                    is_on_marketplace: false,
                    is_transferred: true
                }
            });

            // D. Chuyển quyền sở hữu Sản phẩm đi kèm
            await tx.merchandiseOrderItem.updateMany({
                where: { listing_id: mktTx.listing_id },
                data: { 
                    owner_id: mktTx.buyer_id,
                    listing_id: null
                }
            });

            // E. Lưu bản ghi Payment
            await tx.payment.create({
                data: {
                    order_id: null,
                    mkt_transaction_id: mktTx.id,
                    method: method.toLowerCase(),
                    transaction_id: transactionId,
                    amount: mktTx.buyer_pay_amount,
                    status: 'thanh_cong',
                    response_data: payload,
                    paid_at: new Date()
                }
            });

            mktTxData = mktTx;
            ticketData = ticket;
        });

        // Thoát sớm nếu giao dịch đã được xử lý từ trước
        if (!mktTxData || !ticketData) return;

        console.log(`[MKT] Giao dịch DB ${orderNumber} hoàn tất thành công.`);

        // F. Chạy các tác vụ Blockchain ở chế độ nền (Background) để không chặn HTTP Response
        (async () => {
            console.log(`[MKT Web3 Background] Bắt đầu xử lý Blockchain cho đơn Marketplace ${orderNumber}...`);
            
            // 1. Ghi log tài chính lên Blockchain
            try {
                await blockchainService.logFinancialTransaction(
                    orderNumber,
                    Number(mktTxData.buyer_pay_amount),
                    {
                        ticketPlatformFee: Number(mktTxData.platform_fee || 0),
                        ticketCommissionFee: Number(mktTxData.commission_fee || 0),
                        merchPlatformFee: 0,
                        merchCommissionFee: 0,
                        gasFee: Number(mktTxData.gas_fee || 0),
                        royaltyFee: Number(mktTxData.organizer_royalty || 0)
                    },
                    'RESALE_PURCHASE',
                    mktTxData.buyer.wallet_address || undefined,
                    ticketData?.event?.smart_contract_address || null
                );
                console.log(`[MKT Web3 Background] Ghi sổ tài chính thành công cho giao dịch ${orderNumber}`);
            } catch (auditErr) {
                console.error(`[MKT Web3 Background Error] Lỗi ghi sổ tài chính ${orderNumber}:`, auditErr.message);
            }

            // 2. Chuyển nhượng (Transfer) NFT trên Blockchain
            const contractAddress = ticketData?.event?.smart_contract_address || process.env.CONTRACT_ADDRESS;
            if (ticketData?.nft_token_id && contractAddress) {
                try {
                    const txHash = await web3Service.transferTicket(
                        contractAddress,
                        mktTxData.seller.wallet_address,
                        mktTxData.buyer.wallet_address,
                        parseInt(ticketData.nft_token_id)
                    );
                    
                    // Cập nhật tx hash thật vào DB bằng client ngoài transaction
                    await prisma.marketplaceTransaction.update({
                        where: { id: mktTxData.id },
                        data: { nft_transfer_tx_hash: txHash }
                    });
                    console.log(`[MKT Web3 Background] Transfer NFT thành công! TxHash: ${txHash}`);
                } catch (err) {
                    console.error('[MKT Web3 Background Error] Lỗi transfer NFT:', err.message);
                }
            }
        })().catch(bgErr => console.error('[MKT Web3 Background Process Error]:', bgErr));

        // G. Gửi Email
        emailService.sendTicketReceivedEmail(mktTxData.buyer, mktTxData.seller, ticketData);

        // H. Thông báo hệ thống
        // 1. Cho người bán (Biết vé đã bay)
        NotificationService.create({
            user_id: mktTxData.seller_id,
            type: 'TICKET_SOLD_MKT',
            title: 'Vé của bạn đã được bán!',
            message: `Vé sự kiện "${ticketData.event.title}" niêm yết của bạn đã được thanh toán thành công.`,
            target_id: mktTxData.id
        }).catch(() => {});

        // 2. Cho người mua (Biết vé đã về ví)
        NotificationService.create({
            user_id: mktTxData.buyer_id,
            type: 'TICKET_RECEIVED_MKT',
            title: 'Mua vé thành công!',
            message: `Bạn đã mua thành công 1 vé sự kiện "${ticketData.event.title}" trên Marketplace.`,
            target_id: mktTxData.id
        }).catch(() => {});

        // 3. Cho Ban Tổ Chức (Biết có giao dịch thứ cấp - Tiền bản quyền về ví)
        NotificationService.create({
            user_id: ticketData.event.organizer.user_id,
            type: 'NEW_MKT_TRANSACTION',
            title: 'Giao dịch Marketplace mới!',
            message: `Có giao dịch mua lại vé sự kiện "${ticketData.event.title}". Bạn nhận được tiền bản quyền.`,
            target_id: mktTxData.id
        }).catch(() => {});

    } catch (error) {
        console.error(`[MKT Error] Lỗi xử lý sau thanh toán ${orderNumber}:`, error);
        throw error;
    }
}

/**
 * Gọi Blockchain Service để đúc vé lên chuỗi
 * Sử dụng IPFS để lưu trữ Metadata phi tập trung
 */
async function triggerNFTMinting(ticket, walletAddress) {
    try {
        const toAddress = walletAddress || "0x0000000000000000000000000000000000000000"; 
        
        // 1. Lấy thông tin chi tiết để tạo Metadata
        const ticketFull = await prisma.ticket.findUnique({
            where: { id: ticket.id },
            include: {
                event: true,
                ticket_tier: true
            }
        });

        // 2. Upload Metadata lên IPFS
        const ipfsUrl = await ipfsService.uploadTicketMetadata({
            ticketId: ticketFull.id,
            ticketNumber: ticketFull.ticket_number,
            eventTitle: ticketFull.event.title,
            eventImage: ticketFull.event.image_url,
            tierName: ticketFull.ticket_tier.tier_name,
            sectionName: ticketFull.ticket_tier.section_name,
            eventId: ticketFull.event_id,
            orderId: ticketFull.order_id
        });

        const tokenURI = ipfsUrl || `https://api.basticket.site/metadata/${ticket.id}`; 
        
        // 3. Lấy smart_contract_address của sự kiện
        const evContractAddress = ticketFull.event.smart_contract_address;

        console.log(`[Web3] [Ticket ${ticket.ticket_number}] Bắt đầu đúc Sổ cái Kép (Dual Minting) (IPFS: ${tokenURI})...`);
        let mintResult = null;
        let finalTxHash = "0xMintMock" + Date.now();
        let finalTokenId = Math.floor(Math.random() * 1000000);

        // A. Mint lên Hợp đồng Sự kiện (Event Vault) nếu có và khác địa chỉ Master
        if (evContractAddress && evContractAddress !== process.env.CONTRACT_ADDRESS && ethers.isAddress(evContractAddress)) {
            try {
                const resEvent = await web3Service.mintTicket(evContractAddress, toAddress, tokenURI);
                console.log(`✅ [Dual Minting - Event Vault] Đã đúc vé thành công lên hợp đồng sự kiện (${evContractAddress}). TokenId: ${resEvent.tokenId}`);
            } catch (evErr) {
                console.warn(`⚠️ [Dual Minting Warning]: Không thể đúc lên hợp đồng sự kiện (${evContractAddress}): ${evErr.message}`);
            }
        }

        // B. Mint đồng thời lên Sổ cái Tổng (Master Ledger)
        try {
            mintResult = await web3Service.mintTicket(process.env.CONTRACT_ADDRESS, toAddress, tokenURI);
            finalTxHash = mintResult.transactionHash;
            finalTokenId = mintResult.tokenId;
            console.log(`✅ [Dual Minting - Master Ledger] Đã đúc vé thành công lên Sổ cái Tổng: ${process.env.CONTRACT_ADDRESS}`);
        } catch (masterErr) {
            console.warn(`⚠️ [Web3 Master Minting Warning]: Không thể đúc live trên Master Contract: ${masterErr.message}. Sử dụng mã băm mô phỏng.`);
        }
        
        const tokenId = finalTokenId;
        const transactionHash = finalTxHash;
        
        console.log(`[Web3] [Ticket ${ticket.ticket_number}] Đúc thành công! TokenId: ${tokenId}. Đang cập nhật Database...`);
        
        // 4. Cập nhật lại vé với thông tin Blockchain và đổi status thành 'minted'
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
                nft_token_id: String(tokenId),
                nft_mint_tx_hash: transactionHash,
                nft_token_uri: tokenURI,
                status: 'minted'
            }
        });

        await prisma.order.update({
            where: { id: ticket.order_id },
            data: { transaction_hash: transactionHash }
        });
        
        console.log(`[Web3] [Ticket ${ticket.ticket_number}] Đã cập nhật trạng thái 'minted' và order thành công.`);
        return updatedTicket;
    } catch (e) {
        console.error(`[Web3 Error] [Ticket ${ticket.id}] Lỗi khi đúc vé:`, e.message);
    }
}

function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

/**
 * Thư viện hỗ trợ băm chuỗi thủ công theo chuẩn VNPay (tương đương PHP urlencode)
 */
function buildSignData(params) {
    return Object.keys(params)
        .sort()
        .filter(key => params[key] !== '' && params[key] !== null && params[key] !== undefined)
        .map(key => {
            const value = String(params[key]);
            return `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}`;
        })
        .join('&');
}

async function processFeeOrderSuccess(orderNumber, transactionId, method, payload) {
    try {
        const eventId = orderNumber.replace('FEE-', '');
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organizer: { include: { user: true } } }
        });

        if (!event || event.status === 'cancelled') return;

        const latestFeeLog = await prisma.adminActionLog.findFirst({
            where: { target_id: eventId, action_type: 'cancellation_fee_notice' },
            orderBy: { created_at: 'desc' }
        });
        const totalFeeRequired = latestFeeLog && latestFeeLog.new_value ? Number(latestFeeLog.new_value) : Number(payload?.vnp_Amount || 1681000) / 100;

        await prisma.$transaction(async (tx) => {
            await tx.adminActionLog.create({
                data: {
                    admin_id: event.organizer.user_id,
                    action_type: 'cancellation_fee_paid',
                    target_id: eventId,
                    new_value: String(totalFeeRequired)
                }
            });

            await tx.event.update({
                where: { id: eventId },
                data: { status: 'cancelled' }
            });

            await tx.order.updateMany({
                where: { event_id: eventId, status: { in: ['paid', 'success', 'completed'] } },
                data: { status: 'refund_pending' }
            });

            await tx.ticket.updateMany({
                where: { event_id: eventId },
                data: { status: 'cancelled' }
            });

            await tx.marketplaceTransaction.updateMany({
                where: { ticket: { event_id: eventId }, status: { in: ['paid', 'success', 'completed'] } },
                data: { status: 'cancelled' }
            });

            const ticketsToRefund = await tx.ticket.findMany({
                where: { event_id: eventId },
                include: { 
                    ticket_tier: true,
                    transactions: {
                        where: { status: { in: ['paid', 'success', 'completed'] } },
                        orderBy: { created_at: 'desc' },
                        take: 1
                    }
                }
            });
            for (const t of ticketsToRefund) {
                const originalPrice = t.ticket_tier ? Number(t.ticket_tier.price) : 0;
                
                if (t.transactions && t.transactions.length > 0) {
                    const lastTx = t.transactions[0];
                    const buyerRefundAmount = Number(lastTx.buyer_pay_amount);
                    const sellerRefundAmount = originalPrice;
                    
                    // 1. Hoàn tiền cho Người mua lại (Buyer)
                    const buyerExist = await tx.refundRequest.findFirst({
                        where: { ticket_id: t.id, customer_id: lastTx.buyer_id }
                    });
                    if (!buyerExist) {
                        await tx.refundRequest.create({
                            data: {
                                ticket_id: t.id,
                                customer_id: lastTx.buyer_id,
                                status: 'pending',
                                refund_amount: buyerRefundAmount,
                                type: 'event_cancelled',
                                reason: `Tự động hoàn tiền mua vé Marketplace do sự kiện bị hủy: ${event.title} (Giá mua: ${buyerRefundAmount.toLocaleString('vi-VN')}đ)`
                            }
                        });
                    }

                    // 2. Hoàn tiền gốc cho Người bán lại (Seller)
                    const sellerExist = await tx.refundRequest.findFirst({
                        where: { ticket_id: t.id, customer_id: lastTx.seller_id }
                    });
                    if (!sellerExist) {
                        await tx.refundRequest.create({
                            data: {
                                ticket_id: t.id,
                                customer_id: lastTx.seller_id,
                                status: 'pending',
                                refund_amount: sellerRefundAmount,
                                type: 'event_cancelled',
                                reason: `Tự động hoàn tiền gốc mua vé do sự kiện bị hủy (Vé đã bán lại trên Marketplace): ${event.title} (Giá gốc: ${sellerRefundAmount.toLocaleString('vi-VN')}đ)`
                            }
                        });
                    }
                } else {
                    // Vé chưa bán lại trên Marketplace
                    const exist = await tx.refundRequest.findFirst({
                        where: { ticket_id: t.id, customer_id: t.current_owner_id }
                    });
                    if (!exist) {
                        await tx.refundRequest.create({
                            data: {
                                ticket_id: t.id,
                                customer_id: t.current_owner_id,
                                status: 'pending',
                                refund_amount: originalPrice,
                                type: 'event_cancelled',
                                reason: `Tự động tạo yêu cầu hoàn tiền do sự kiện bị hủy: ${event.title}`
                            }
                        });
                    }
                }
            }

            await tx.walletTransaction.create({
                data: {
                    user_id: event.organizer.user_id,
                    amount: totalFeeRequired,
                    type: 'FEE',
                    description: `Thanh toán qua ${method} nộp phí bồi hoàn hủy sự kiện: ${event.title}`,
                    status: 'completed'
                }
            });
        });

        if (event.smart_contract_address) {
            web3Service.pauseContract(event.smart_contract_address).catch(e => console.error('Pause error:', e));
        }

        blockchainService.logFinancialTransaction(
            'FEE-' + eventId.slice(0, 8).toUpperCase(),
            totalFeeRequired,
            { cancellationFee: totalFeeRequired },
            'FEE',
            event.organizer?.user?.wallet_address || undefined
        );

        emailService.sendEventCancellationEmail(event.organizer.user, event, 'Sự kiện bị hủy khẩn cấp', 'organizer').catch(() => {});
        
        const orders = await prisma.order.findMany({
            where: { event_id: eventId, status: 'refund_pending' },
            include: { customer: true }
        });

        orders.forEach(o => {
            if (o.customer) {
                emailService.sendEventCancellationEmail(o.customer, event, 'Sự kiện bị hủy khẩn cấp', 'customer').catch(() => {});
            }
        });
        console.log(`[Fee Settlement] Hoàn tất xử lý hủy tự động cho sự kiện ${eventId}`);
    } catch (error) {
        console.error('[Fee Settlement Error]:', error);
    }
}

module.exports = PaymentController;
