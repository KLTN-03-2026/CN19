const { getSystemConfig } = require('../utils/systemConfig');

/**
 * Middleware kiểm tra chế độ bảo trì hệ thống
 */
const maintenanceMiddleware = async (req, res, next) => {
    try {
        const config = await getSystemConfig();
        
        // Nếu đang bật chế độ bảo trì
        if (config.maintenance_mode === 'true') {
            // Cho phép Admin và các route Admin/Auth đi qua để có thể tắt bảo trì
            const isAdminRoute = req.path.startsWith('/api/admin');
            const isAuthRoute = req.path.startsWith('/api/auth');
            const isSystemRoute = req.path.startsWith('/api/system');

            if (isAdminRoute || isAuthRoute || isSystemRoute) {
                return next();
            }

            // Chặn các request khác
            return res.status(503).json({
                error: 'Hệ thống đang bảo trì.',
                message: 'Chúng tôi đang nâng cấp hệ thống để phục vụ bạn tốt hơn. Vui lòng quay lại sau ít phút.',
                maintenance: true
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance Middleware Error:', error);
        next();
    }
};

module.exports = maintenanceMiddleware;
