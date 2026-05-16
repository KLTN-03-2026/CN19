const prisma = require('../config/prisma');

/**
 * Service quản lý cấu hình hệ thống động
 */
const SystemConfigService = {
  // Bộ nhớ đệm (Cache) để tránh truy vấn DB quá nhiều lần
  cache: null,
  lastFetched: null,
  CACHE_TTL: 60 * 1000, // 1 phút

  /**
   * Lấy toàn bộ cấu hình hệ thống
   */
  getConfig: async () => {
    const now = Date.now();
    if (this.cache && this.lastFetched && (now - this.lastFetched < this.CACHE_TTL)) {
      return this.cache;
    }

    try {
      const settings = await prisma.systemSetting.findMany();
      const config = settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});

      // Giá trị mặc định nếu DB chưa có
      const defaults = {
        site_name: 'BASTICKET',
        support_email: 'support@basticket.com',
        maintenance_mode: 'false',
        event_platform_fee_percent: '5',
        withdrawal_fee_percent: '2'
      };

      this.cache = { ...defaults, ...config };
      this.lastFetched = now;
      return this.cache;
    } catch (error) {
      console.error('[SystemConfigService] Error fetching config:', error);
      return {
        site_name: 'BASTICKET',
        support_email: 'support@basticket.com'
      };
    }
  },

  /**
   * Lấy một giá trị cấu hình cụ thể
   */
  get: async (key, defaultValue = null) => {
    const config = await SystemConfigService.getConfig();
    return config[key] || defaultValue;
  }
};

module.exports = SystemConfigService;
