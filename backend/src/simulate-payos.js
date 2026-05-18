const axios = require('axios');
require('dotenv').config();

async function simulateWebhook() {
    const payload = {
        error: 0,
        message: "success",
        data: {
            orderCode: 123456,
            amount: 9800,
            description: "BASTICKET WITHDRAW b1a1e41d", // Giả lập nội dung CK
            accountNumber: "0349480914",
            reference: "MB_TEST_99999",
            transactionDateTime: "2026-05-18 22:24:00"
        }
    };

    try {
        console.log("Đang giả lập payOS bắn Webhook về hệ thống...");
        const res = await axios.post('http://localhost:5000/api/webhooks/casso', payload, {
            headers: {
                'secure-token': process.env.PAYOS_CHECKSUM_KEY || '5714060a8166fa9586c7c1d8bfd55bb2e6bf0698af78f280c96b6e5ffa58c1f4'
            }
        });
        
        console.log("Kết quả từ Backend:", res.data);
        console.log("=> THÀNH CÔNG! Hãy nhìn sang màn hình trình duyệt Web, đơn hàng sẽ tự động nảy sang Xanh lá!");
    } catch (error) {
        console.error("Lỗi:", error.response?.data || error.message);
    }
}

simulateWebhook();
