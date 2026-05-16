const axios = require('axios');

/**
 * Service xử lý Thanh toán (Payout) và tích hợp VietQR
 */
const PayoutService = {
    /**
     * Sinh link ảnh mã VietQR để Admin quét trả tiền
     * @param {Object} payoutData - { bankCode, accountNo, accountName, amount, description }
     */
    generateVietQR: (payoutData) => {
        const { bankCode, accountNo, accountName, amount, description } = payoutData;
        
        // Sử dụng template 'compact2' của VietQR để hiển thị gọn đẹp
        // Link format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<NAME>
        
        const template = 'compact2';
        const encodedName = encodeURIComponent(accountName);
        const encodedInfo = encodeURIComponent(description);
        
        const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodedInfo}&accountName=${encodedName}`;
        
        return qrUrl;
    },

    /**
     * Mapping tên ngân hàng sang mã BIN (Bank Identification Number) của Napas
     * Dùng cho API VietQR
     */
    getBankBin: (bankName) => {
        if (!bankName) return '970436'; // Mặc định Vietcombank nếu không có tên

        const searchName = bankName.toLowerCase();
        
        const bankMap = {
            'vietcombank': '970436',
            'vietinbank': '970415',
            'bidv': '970418',
            'agribank': '970405',
            'mbbank': '970422',
            'mb bank': '970422',
            'techcombank': '970407',
            'acb': '970416',
            'tpbank': '970423',
            'vpbank': '970432',
            'sacombank': '970403',
            'hdbank': '970437',
            'vib': '970441',
            'shb': '970443',
            'eximbank': '970431',
            'msb': '970426',
            'seabank': '970440',
            'bacabank': '970409',
            'namabank': '970428',
            'pvcombank': '970412',
            'oceanbank': '970414',
            'ncb': '970419',
            'shinhanbank': '970424',
            'wooribank': '970438',
            'publicbank': '970439',
            'ocb': '970448',
            'baovietbank': '970435',
            'gpbank': '970408',
            'kienlongbank': '970452',
            'lienvietpostbank': '970449',
            'pgbank': '970430',
            'saigonbank': '970400',
            'uob': '970458',
            'vab': '970427',
            'vccb': '970454',
            'vrb': '970421'
        };

        // Tìm kiếm khớp một phần
        for (const key in bankMap) {
            if (searchName.includes(key)) {
                return bankMap[key];
            }
        }

        return '970436'; // Mặc định Vietcombank nếu không tìm thấy
    }
};

module.exports = PayoutService;
