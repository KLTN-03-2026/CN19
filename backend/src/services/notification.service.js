const prisma = require('../config/prisma');

/**
 * Service quản lý thông báo người dùng
 */
const notificationService = {
  /**
   * Tạo thông báo mới cho người dùng
   * @param {string} userId - ID người nhận thông báo
   * @param {string} type - Loại thông báo (LIKE, COMMENT, REPLY, SYSTEM, etc.)
   * @param {string} title - Tiêu đề thông báo
   * @param {string} message - Nội dung chi tiết
   * @param {string} targetId - ID hoặc Slug mục tiêu (để điều hướng)
   */
  createNotification: async (userId, type, title, message, targetId = null, blogId = null) => {
    try {
      if (!userId) {
        console.log('Notification skipped: No userId');
        return null;
      }

      console.log(`Creating notification - Type: ${type}, TargetUser: ${userId}, TargetId: ${targetId}, BlogId: ${blogId}`);

      const notification = await prisma.notification.create({
        data: {
          user_id: userId,
          type,
          title,
          message,
          target_id: targetId,
          blog_id: blogId,
          is_read: false
        }
      });
      return notification;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }
};

module.exports = notificationService;
