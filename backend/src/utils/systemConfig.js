const prisma = require('../config/prisma');

/**
 * Lấy cấu hình hệ thống từ database kèm theo giá trị mặc định
 * @returns {Promise<Object>} Đối tượng chứa toàn bộ cấu hình
 */
const getSystemConfig = async () => {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    const config = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    const defaults = {
      // Phí sự kiện & vé (Lần đầu)
      event_platform_fee_percent: '5',
      event_transaction_fee_percent: '3',
      system_gas_fee: '10000',

      // Phí sản phẩm (Merchandise)
      product_platform_fee_percent: '5',
      product_transaction_fee_percent: '3',

      // Phí chợ bán lại (Resale)
      resale_transaction_fee_percent: '1',
      resale_price_cap_percent: '8',
      default_royalty_percent: '3',

      // Phí rút tiền & tài chính
      withdrawal_fee_percent: '2',
      min_withdrawal_amount: '100000',

      // Cấu hình khác
      smart_contract_address: '0x1234567890abcdef',
      rpc_url: 'https://rpc-mumbai.matic.today',
      site_name: 'BASTICKET',
      support_email: 'support@basticket.com',
      maintenance_mode: 'false',
      bot_risk_threshold: '0.7'
    };

    return { ...defaults, ...config };
  } catch (error) {
    console.error('Error fetching system config:', error);
    // Trả về defaults nếu có lỗi truy vấn DB
    return {
      event_platform_fee_percent: '5',
      product_platform_fee_percent: '3',
      event_marketplace_fee_percent: '5',
      product_marketplace_fee_percent: '2',
      withdrawal_fee_percent: '2',
      min_withdrawal_amount: '100000',
      default_royalty_percent: '3',
      system_gas_fee: '10000'
    };
  }
};

module.exports = { getSystemConfig };
