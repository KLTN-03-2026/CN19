const NotificationService = require('../services/notification.service');

const getMyNotifications = async (req, res) => {
    try {
        const notifications = await NotificationService.getUserNotifications(req.user.userId);
        const unreadCount = notifications.filter(n => !n.is_read).length;
        
        return res.status(200).json({
            notifications,
            unreadCount
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        await NotificationService.markAsRead(id);
        return res.status(200).json({ message: 'Đã đánh dấu là đã đọc' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const markAllRead = async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user.userId);
        return res.status(200).json({ message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMyNotifications,
    markRead,
    markAllRead
};
