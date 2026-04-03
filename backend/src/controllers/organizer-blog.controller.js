const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slugify = require('slugify');

const organizerBlogController = {
    // Tạo bài viết mới
    createBlog: async (req, res) => {
        try {
            const { title, content, image_url, event_id, status } = req.body;
            const author_id = req.user.id || req.user.userId;

            if (!title || !content) {
                return res.status(400).json({ error: 'Tiêu đề và nội dung không được để trống.' });
            }

            // Tạo slug từ tiêu đề
            const slug = slugify(title, { lower: true, strict: true, locale: 'vi' }) + '-' + Date.now();

            const blog = await prisma.blog.create({
                data: {
                    title,
                    content,
                    image_url,
                    slug,
                    status: status || 'published',
                    author_id,
                    event_id: event_id || null,
                    type: 'ORGANIZER_NEWS'
                }
            });

            res.status(201).json({ message: 'Tạo bài viết thành công!', data: blog });
        } catch (error) {
            console.error('Create Blog Error:', error);
            res.status(500).json({ error: 'Đã xảy ra lỗi khi tạo bài viết.' });
        }
    },

    // Lấy danh sách bài viết của BTC hiện tại
    getOrganizerBlogs: async (req, res) => {
        try {
            const author_id = req.user.id || req.user.userId;
            const blogs = await prisma.blog.findMany({
                where: { author_id },
                include: {
                    event: {
                        select: { title: true }
                    },
                    _count: {
                        select: { comments: true, likes: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            res.status(200).json({ data: blogs });
        } catch (error) {
            console.error('Get Blogs Error:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách bài viết.' });
        }
    },

    // Lấy chi tiết bài viết
    getBlogById: async (req, res) => {
        try {
            const { id } = req.params;
            const blog = await prisma.blog.findUnique({
                where: { id },
                include: {
                    event: {
                        select: { title: true, id: true }
                    }
                }
            });

            if (!blog) {
                return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
            }

            res.status(200).json({ data: blog });
        } catch (error) {
            console.error('Get Blog Error:', error);
            res.status(500).json({ error: 'Đã xảy ra lỗi khi tải bài viết.' });
        }
    },

    // Cập nhật bài viết
    updateBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, content, image_url, event_id, status } = req.body;
            const author_id = req.user.id || req.user.userId;

            // Kiểm tra quyền sở hữu
            const existingBlog = await prisma.blog.findUnique({ where: { id } });
            if (!existingBlog || existingBlog.author_id !== author_id) {
                return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này.' });
            }

            const updateData = {
                title,
                content,
                image_url,
                event_id: event_id || null,
                status
            };

            // Nếu đổi tiêu đề thì cập nhật lại slug
            if (title && title !== existingBlog.title) {
                updateData.slug = slugify(title, { lower: true, strict: true, locale: 'vi' }) + '-' + Date.now();
            }

            const updatedBlog = await prisma.blog.update({
                where: { id },
                data: updateData
            });

            res.status(200).json({ message: 'Cập nhật bài viết thành công!', data: updatedBlog });
        } catch (error) {
            console.error('Update Blog Error:', error);
            res.status(500).json({ error: 'Lỗi khi cập nhật bài viết.' });
        }
    },

    // Xóa bài viết
    deleteBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const author_id = req.user.id || req.user.userId;

            const existingBlog = await prisma.blog.findUnique({ where: { id } });
            if (!existingBlog || existingBlog.author_id !== author_id) {
                return res.status(403).json({ error: 'Bạn không có quyền xóa bài viết này.' });
            }

            await prisma.blog.delete({ where: { id } });
            res.status(200).json({ message: 'Đã xóa bài viết thành công.' });
        } catch (error) {
            console.error('Delete Blog Error:', error);
            res.status(500).json({ error: 'Lỗi khi xóa bài viết.' });
        }
    },

    // Lấy danh sách review từ khách hàng cho các sự kiện của BTC này
    getCustomerReviews: async (req, res) => {
        try {
            const author_id = req.user.id || req.user.userId;
            
            const organizer = await prisma.organizer.findUnique({
                where: { user_id: author_id }
            });

            if (!organizer) {
                // Thay vì trả về 404, hãy trả về mảng rỗng nếu chưa có thông tin BTC
                return res.status(200).json({ data: [] });
            }

            const reviews = await prisma.blog.findMany({
                where: {
                    type: 'CUSTOMER_REVIEW',
                    event: {
                        organizer_id: organizer.id
                    }
                },
                include: {
                    author: {
                        select: { full_name: true, avatar_url: true }
                    },
                    event: {
                        select: { title: true }
                    },
                    _count: {
                        select: { comments: true, likes: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            res.status(200).json({ data: reviews });
        } catch (error) {
            console.error('Get Customer Reviews Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách review khách hàng.' });
        }
    },

    // Quản lý (Moderation) bài viết của khách hàng
    moderateBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'published', 'hidden'
            const author_id = req.user.id || req.user.userId;

            const organizer = await prisma.organizer.findUnique({
                where: { user_id: author_id }
            });

            const blog = await prisma.blog.findUnique({
                where: { id },
                include: { event: true }
            });

            if (!blog || !blog.event || blog.event.organizer_id !== organizer.id) {
                return res.status(403).json({ error: 'Bạn không có quyền quản lý bài viết này.' });
            }

            const updatedBlog = await prisma.blog.update({
                where: { id },
                data: { status }
            });

            res.status(200).json({ message: 'Cập nhật trạng thái bài viết thành công!', data: updatedBlog });
        } catch (error) {
            console.error('Moderate Blog Error:', error);
            res.status(500).json({ error: 'Lỗi khi xử lý bài viết.' });
        }
    }
};

module.exports = organizerBlogController;
