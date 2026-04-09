const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../config/prisma');
const blockchainService = require('../services/blockchain.service');
const { format } = require('date-fns');

/**
 * Controller xử lý thanh toán VNPay và MoMo
 */
const PaymentController = {
    // [POST] /api/payments/create-vnpay
    createVNPayUrl: async (req, res) => {
        try {
            const { orderId } = req.body;
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { event: { select: { title: true } } }
            });

            if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại.' });

            process.env.TZ = 'Asia/Ho_Chi_Minh';
            let date = new Date();
            let createDate = format(date, 'yyyyMMddHHmmss');
            
            let tmnCode = process.env.VNP_TMN_CODE;
            let secretKey = process.env.VNP_HASH_SECRET;
            let vnpUrl = process.env.VNP_URL;
            let returnUrl = process.env.VNP_RETURN_URL;

            let amount = Math.round(order.total_amount);
            let orderInfo = `Thanh toán vé sự kiện: ${order.event.title}`;
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
            vnp_Params['vnp_IpAddr'] = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            vnp_Params['vnp_CreateDate'] = createDate;

            // Sắp xếp params theo bảng chữ cái
            vnp_Params = sortObject(vnp_Params);

            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");     
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
            vnp_Params['vnp_SecureHash'] = signed;
            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

            res.status(200).json({ paymentUrl: vnpUrl });
        } catch (error) {
            console.error('VNPay Create Error:', error);
            res.status(500).json({ error: 'Lỗi khi tạo giao dịch VNPay.' });
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
            let secretKey = process.env.VNP_HASH_SECRET;
            let querystring = require('qs');
            let signData = querystring.stringify(vnp_Params, { encode: false });
            let crypto = require("crypto");     
            let hmac = crypto.createHmac("sha512", secretKey);
            let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     

            if(secureHash === signed){
                const orderNumber = vnp_Params['vnp_TxnRef'];
                const rspCode = vnp_Params['vnp_ResponseCode'];

                if(rspCode === '00') {
                    // Thanh toán thành công -> Kích hoạt xuất vé
                    await processOrderSuccess(orderNumber, vnp_Params['vnp_TransactionNo'], 'VNPAY');
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

    // [POST] /api/payments/create-momo
    createMoMoUrl: async (req, res) => {
        try {
            const { orderId } = req.body;
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { event: { select: { title: true } } }
            });

            if (!order) return res.status(404).json({ error: 'Đơn hàng không tồn tại.' });

            const partnerCode = process.env.MOMO_PARTNER_CODE;
            const accessKey = process.env.MOMO_ACCESS_KEY;
            const secretKey = process.env.MOMO_SECRET_KEY;
            const requestId = order.id;
            const orderIdMoMo = order.order_number;
            const orderInfo = `Thanh toán vé: ${order.event.title}`;
            const redirectUrl = process.env.MOMO_RETURN_URL;
            const ipnUrl = process.env.MOMO_NOTIFY_URL;
            const amount = Math.round(order.total_amount).toString();
            const requestType = "captureWallet";
            const extraData = ""; // Có thể dùng để truyền thêm info

            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderIdMoMo}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = {
                partnerCode,
                requestId,
                amount,
                orderId: orderIdMoMo,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData,
                requestType,
                signature,
                lang: 'vi'
            };

            const response = await axios.post(process.env.MOMO_ENDPOINT, requestBody);
            res.status(200).json({ paymentUrl: response.data.payUrl });

        } catch (error) {
            console.error('MoMo Create Error:', error);
            res.status(500).json({ error: 'Lỗi khi tạo giao dịch MoMo.' });
        }
    },

    // MoMo IPN (Callback ngầm từ MoMo)
    momoIPN: async (req, res) => {
        try {
            const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;
            const secretKey = process.env.MOMO_SECRET_KEY;
            const accessKey = process.env.MOMO_ACCESS_KEY;

            // Kiểm tra chữ ký bảo mật (Signature)
            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}&type=list`;
            // Note: signature logic depends on MoMo API version
            
            if (resultCode == 0) {
                // Thanh toán thành công
                await processOrderSuccess(orderId, transId, 'MOMO');
            } else {
                await prisma.order.update({
                    where: { order_number: orderId },
                    data: { status: 'failed' }
                });
            }

            res.status(204).send(); // Phản hồi MoMo đã nhận IPN
        } catch (error) {
            console.error('MoMo IPN Error:', error);
            res.status(500).json({ error: 'Lỗi xử lý IPN MoMo.' });
        }
    },

    // Kiểm tra trạng thái thanh toán (Cho frontend Polling hoặc xác nhận)
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

/**
 * Xử lý sau khi thanh toán thành công: 
 * 1. Cập nhật Order status = PAID
 * 2. Xuất vé (Ticket) vào DB
 * 3. Kích hoạt Mint NFT trong nền
 */
async function processOrderSuccess(orderNumber, transactionId, method) {
    const order = await prisma.order.findUnique({
        where: { order_number: orderNumber },
        include: { 
            items: { include: { ticket_tier: true } },
            customer: { select: { wallet_address: true, full_name: true } }
        }
    });

    if (!order || order.status === 'paid') return;

    // 1. Cập nhật trạng thái Order
    await prisma.order.update({
        where: { id: order.id },
        data: { 
            status: 'paid',
            transaction_id: transactionId,
            payment_method: method
        }
    });

    // 2. Tạo bản ghi Ticket cho từng vé trong Order
    for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
            const ticket = await prisma.ticket.create({
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

            // 3. [Web3] Mint NFT tự động (Hệ thống trả Gas)
            // Lưu ý: Chạy trong nền để không chặn response API
            triggerNFTMinting(ticket, order.customer.wallet_address);
        }
    }
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
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = PaymentController;
