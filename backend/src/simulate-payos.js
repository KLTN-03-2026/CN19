const axios = require('axios');
require('dotenv').config();

async function simulateWebhook() {
    const payload = {
        error: 0,
        message: "success",
        data: {
            orderCode: 999888,
            amount: 9800,
            description: "BASTICKET WITHDRAW 7d2b611b", // Mã ID đơn rút tiền mới nhất của bạn (tạo lúc 23:56)
            accountNumber: "105875958530",
            reference: "MB_LOCAL_TEST_777",
            transactionDateTime: "2026-05-18 23:58:00"
        }
    };

    try {
        console.log("🚀 Đang bắn Webhook kiểm tra trực tiếp vào Local Backend Server...");
        const res = await axios.post('http://localhost:5000/api/webhooks/casso', payload, {
            headers: {
                'secure-token': process.env.PAYOS_CHECKSUM_KEY || 'test-token',
                'Content-Type': 'application/json'
            }
        });
        
        console.log("✅ Kết quả phản hồi từ Local Backend Server:", res.data);
        console.log("=> HOÀN HẢO! Đơn rút tiền trong DB đã được duyệt thành công!");
    } catch (error) {
        console.error("❌ Lỗi Local Server:", error.response?.data || error.message);
    }
}

simulateWebhook();
