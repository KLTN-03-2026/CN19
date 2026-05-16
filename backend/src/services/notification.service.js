const prisma = require('../config/prisma');

/**
 * Service xử lý thông báo hệ thống
 */
const NotificationService = {
    /**
     * Tạo thông báo mới
     * @param {Object} data { user_id, type, title, message, target_id }
     */
    create: async (data) => {
        try {
            return await prisma.notification.create({
                data: {
                    user_id: data.user_id,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    target_id: data.target_id || null
                }
            });
        } catch (error) {
            console.error('[NotificationService] Error creating notification:', error);
            return null;
        }
    },

    /**
     * Thông báo cho tất cả Admin
     */
    notifyAdmins: async (data) => {
        try {
            const admins = await prisma.user.findMany({
                where: {
                    role: { in: ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'] }
                },
                select: { id: true, email: true }
            });

            console.log(`[NotificationService] Found ${admins.length} admins to notify:`, admins.map(a => a.email));

            const notifications = admins.map(admin => ({
                user_id: admin.id,
                type: data.type,
                title: data.title,
                message: data.message,
                target_id: data.target_id || null
            }));

            if (notifications.length === 0) {
                console.warn('[NotificationService] No admins found to notify!');
                return null;
            }

            const result = await prisma.notification.createMany({
                data: notifications
            });
            console.log(`[NotificationService] Created ${result.count} notifications for admins.`);
            return result;
        } catch (error) {
            console.error('[NotificationService] Error notifying admins:', error);
            return null;
        }
    },

    /**
     * Lấy danh sách thông báo của user
     */
    getUserNotifications: async (userId, limit = 20) => {
        return await prisma.notification.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit
        });
    },

    /**
     * Đánh dấu đã đọc
     */
    markAsRead: async (notificationId) => {
        return await prisma.notification.update({
            where: { id: notificationId },
            data: { is_read: true }
        });
    },

    /**
     * Đánh dấu tất cả là đã đọc
     */
    markAllAsRead: async (userId) => {
        return await prisma.notification.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true }
        });
    }
};

module.exports = NotificationService;
