const prisma = require('../config/prisma');
const slugify = require('slugify');

const adminBlogController = {
  // Lấy toàn bộ bài viết trên hệ thống
  getAllBlogs: async (req, res) => {
    try {
      const { status, type, search } = req.query;

      const where = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { full_name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const blogs = await prisma.blog.findMany({
        where,
        include: {
          author: {
            select: { id: true, full_name: true, email: true, role: true, avatar_url: true }
          },
          event: {
            select: { id: true, title: true }
          },
          _count: {
            select: { comments: true, likes: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      res.json({ success: true, data: blogs });
    } catch (error) {
      console.error('getAllBlogs error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy danh sách bài viết.' });
    }
  },

  // Lấy chi tiết bài viết
  getBlogById: async (req, res) => {
    try {
      const { id } = req.params;

      const blog = await prisma.blog.findUnique({
        where: { id },
        include: {
          author: {
            select: { id: true, full_name: true, email: true, avatar_url: true }
          },
          event: {
            select: { id: true, title: true, image_url: true }
          },
          comments: {
            include: {
              user: { select: { id: true, full_name: true, avatar_url: true } }
            },
            orderBy: { created_at: 'desc' }
          },
          _count: {
            select: { likes: true }
          }
        }
      });

      if (!blog) {
        return res.status(404).json({ success: false, message: 'Bài viết không tồn tại.' });
      }

      res.json({ success: true, data: blog });
    } catch (error) {
      console.error('getBlogById error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy chi tiết bài viết.' });
    }
  },

  // Admin tạo bài viết mới (Tin tức hệ thống)
  createBlog: async (req, res) => {
    try {
      const { title, content, image_url, images, event_id, status } = req.body;
      const author_id = req.user.id || req.user.userId;

      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc.' });
      }

      const slug = slugify(title, { lower: true, strict: true, locale: 'vi' }) + '-' + Date.now();

      const blog = await prisma.blog.create({
        data: {
          title,
          content,
          image_url,
          images: images || [],
          slug,
          status: status || 'published',
          author_id,
          event_id: event_id || null,
          type: 'SYSTEM_NEWS' 
        }
      });

      res.status(201).json({ success: true, data: blog, message: 'Tạo bài viết hệ thống thành công!' });
    } catch (error) {
      console.error('createBlogAdmin error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo bài viết.' });
    }
  },

  // Admin ẩn/hiện bài viết
  toggleBlogStatus: async (req, res) => {
    try {
      const { id } = req.params;

      const blog = await prisma.blog.findUnique({ where: { id } });
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Bài viết không tồn tại.' });
      }

      const newStatus = blog.status === 'published' ? 'hidden' : 'published';

      const updated = await prisma.blog.update({
        where: { id },
        data: { status: newStatus }
      });

      res.json({
        success: true,
        message: updated.status === 'published' ? 'Đã hiển thị bài viết.' : 'Đã ẩn bài viết thành công.',
        data: updated
      });
    } catch (error) {
      console.error('toggleBlogStatus error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái bài viết.' });
    }
  },

  // Admin xóa bài viết
  deleteBlog: async (req, res) => {
    try {
      const { id } = req.params;

      const blog = await prisma.blog.findUnique({ where: { id } });
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Bài viết không tồn tại.' });
      }

      await prisma.blog.delete({ where: { id } });

      res.json({
        success: true,
        message: 'Đã xóa bài viết thành công.'
      });
    } catch (error) {
      console.error('deleteBlogAdmin error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xóa bài viết.' });
    }
  }
};

module.exports = adminBlogController;
