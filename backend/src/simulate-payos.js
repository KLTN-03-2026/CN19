const axios = require('axios');
require('dotenv').config();

async function simulateWebhook() {
    const payload = {
        error: 0,
        message: "success",
        data: {
            orderCode: 123456,
            amount: 9800,
            description: "BASTICKET WITHDRAW d86f6f2b", // Mã ID thực tế đang pending trong DB Supabase
            accountNumber: "0349480914",
            reference: "MB_TEST_99999",
            transactionDateTime: "2026-05-18 23:50:00"
        }
    };

    try {
        console.log("🚀 Đang bắn Webhook mô phỏng giao dịch ngân hàng thành công...");
        const res = await axios.post('http://localhost:5000/api/webhooks/casso', payload, {
            headers: {
                'secure-token': process.env.PAYOS_CHECKSUM_KEY || 'test-token'
            }
        });
        
        console.log("✅ Kết quả phản hồi từ Backend:", res.data);
        console.log("=> THÀNH CÔNG! Đơn rút tiền trong DB đã được tự động chuyển sang APPROVED!");
    } catch (error) {
        console.error("❌ Lỗi:", error.response?.data || error.message);
    }
}

simulateWebhook();
