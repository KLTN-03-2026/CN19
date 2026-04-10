const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../config/prisma');
const blockchainService = require('../services/blockchain.service');
const { format } = require('date-fns');

/**
 * Controller xử lý thanh toán VNPay và MoMo
 */
const PaymentController = {
    // [POST] /api/payments/create-url
    createPaymentUrl: async (req, res) => {
        try {
            const { ma_don_hang, phuong_thuc } = req.body;
            const order = await prisma.order.findUnique({
                where: { order_number: ma_don_hang },
                include: { event: { select: { title: true } } }
            });

            if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại.' });
            if (order.status === 'paid') return res.status(400).json({ error: 'Đơn hàng này đã được thanh toán.' });

            // Kiểm tra xem đơn hàng đã hết hạn chưa (10 phút giữ vé)
            if (new Date() > order.expires_at) {
                return res.status(400).json({ error: 'Đơn hàng đã hết hạn giữ vé. Vui lòng đặt lại vé mới.' });
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

                if (rspCode === '00') {
                    await processOrderSuccess(orderNumber, vnp_Params['vnp_TransactionNo'], 'VNPAY', vnp_Params);
                    return res.status(200).json({ message: 'Thanh toán VNPay thành công' });
                }
                return res.status(400).json({ error: 'Thanh toán VNPay thất bại' });
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
    return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { order_number: orderNumber },
            include: { 
                items: { include: { ticket_tier: true } },
                customer: { select: { wallet_address: true, full_name: true } }
            }
        });

        if (!order || order.status === 'paid') return;

        // 1. Cập nhật trạng thái Order
        await tx.order.update({
            where: { id: order.id },
            data: { 
                status: 'paid',
                transaction_id: transactionId,
                payment_method: method.toLowerCase()
            }
        });

        // 2. Tạo bản ghi Payment (ThanhToan)
        await tx.payment.create({
            data: {
                order_id: order.id,
                method: method.toLowerCase(),
                transaction_id: transactionId,
                amount: order.total_amount,
                status: 'thanh_cong',
                response_data: payload,
                paid_at: new Date()
            }
        });

        // 3. Tạo bản ghi Ticket cho từng vé trong Order
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

                // 4. [Web3] Mint NFT tự động (Hệ thống trả Gas)
                triggerNFTMinting(ticket, order.customer.wallet_address);
            }
        }
    });
}

/**
 * Gọi Blockchain Service để đúc vé lên chuỗi
 */
async function triggerNFTMinting(ticket, walletAddress) {
    try {
        // Chỉ Mint nếu khách hàng đã liên kết ví
        const toAddress = walletAddress || "0x0000000000000000000000000000000000000000"; 
        
        // Metadata URI (Ví dụ mẫu, thực tế sẽ cần upload lên IPFS)
        const tokenURI = `https://api.basticket.site/metadata/${ticket.id}`; 
        
        const { tokenId, txHash } = await blockchainService.mintTicket(toAddress, tokenURI);
        
        // Cập nhật lại vé với thông tin Blockchain
        await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
                nft_token_id: tokenId,
                nft_mint_tx_hash: txHash
            }
        });
    } catch (e) {
        console.error(`[Error] Minting failed for Ticket ${ticket.id}:`, e);
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

module.exports = PaymentController;
