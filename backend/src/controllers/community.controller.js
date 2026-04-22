const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slugify = require('slugify');

const communityController = {
    // 1. Lấy danh sách bài viết cộng đồng (Feed)
    getFeed: async (req, res) => {
        try {
            const { page = 1, limit = 10, eventId } = req.query;
            const skip = (page - 1) * limit;
            const currentUserId = req.user ? req.user.userId : null;

            const where = {
                status: 'published',
                type: { in: ['CUSTOMER_REVIEW', 'COMMUNITY_POST'] }
            };

            if (eventId) {
                where.event_id = eventId;
            }

            const posts = await prisma.blog.findMany({
                where,
                include: {
                    author: {
                        select: { id: true, full_name: true, avatar_url: true }
                    },
                    event: {
                        select: { id: true, title: true }
                    },
                    comments: {
                        take: 3,
                        orderBy: { created_at: 'desc' },
                        include: {
                            user: { select: { full_name: true, avatar_url: true } }
                        }
                    },
                    likes: currentUserId ? { where: { user_id: currentUserId } } : false,
                    _count: {
                        select: { comments: true, likes: true }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip: parseInt(skip),
                take: parseInt(limit)
            });

            // Map lại để có is_liked
            const formattedPosts = posts.map(p => ({
                ...p,
                is_liked: p.likes ? p.likes.length > 0 : false,
                likes: undefined // Ẩn mảng likes đi để giảm size JSON
            }));

            res.json({ success: true, data: formattedPosts });
        } catch (error) {
            console.error('Get Feed Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bài viết.' });
        }
    },

    // 2. Lấy danh sách sự kiện người dùng đã mua (để link vào bài viết)
    getMyBookedEvents: async (req, res) => {
        try {
            const userId = req.user.userId;

            // Tìm tất cả các vé mà người dùng đang sở hữu (bao gồm vé mua và vé được tặng/chuyển nhượng)
            const tickets = await prisma.ticket.findMany({
                where: {
                    current_owner_id: userId,
                    status: { notIn: ['refunded', 'cancelled'] } // Chỉ lấy vé hợp lệ
                },
                select: {
                    event: {
                        select: { id: true, title: true, image_url: true, event_date: true }
                    }
                }
            });

            // Lọc ra danh sách các sự kiện duy nhất
            const uniqueEventsMap = new Map();
            tickets.forEach(t => {
                if (t.event && !uniqueEventsMap.has(t.event.id)) {
                    uniqueEventsMap.set(t.event.id, t.event);
                }
            });

            const events = Array.from(uniqueEventsMap.values());

            res.json({ success: true, data: events });
        } catch (error) {
            console.error('Get My Events Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách sự kiện.' });
        }
    },

    // 3. Tạo bài viết cộng đồng
    createPost: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { title, content, image_url, images, event_id } = req.body;

            if (!content) {
                return res.status(400).json({ success: false, message: 'Nội dung không được để trống.' });
            }

            // Nếu có event_id, kiểm tra xem người dùng có quyền đăng (phải sở hữu vé hợp lệ)
            if (event_id) {
                const hasTicket = await prisma.ticket.findFirst({
                    where: {
                        current_owner_id: userId,
                        event_id: event_id,
                        status: { notIn: ['refunded', 'cancelled'] }
                    }
                });

                if (!hasTicket) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Bạn chỉ có thể đăng bài gắn thẻ sự kiện mà bạn đã tham gia hoặc đang sở hữu vé.' 
                    });
                }
            }

            // Tạo slug duy nhất
            const baseTitle = title || content.slice(0, 30);
            const slug = slugify(baseTitle, { lower: true, strict: true, locale: 'vi' }) + '-' + Date.now();

            const post = await prisma.blog.create({
                data: {
                    author_id: userId,
                    title: baseTitle,
                    slug,
                    content,
                    image_url: image_url || (images && images.length > 0 ? images[0] : null),
                    images: images || [],
                    event_id: event_id || null,
                    type: 'COMMUNITY_POST',
                    status: 'published'
                },
                include: {
                    author: { select: { full_name: true, avatar_url: true } },
                    event: { select: { title: true } }
                }
            });

            res.status(201).json({ success: true, message: 'Đăng bài thành công!', data: post });
        } catch (error) {
            console.error('Create Post Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi đăng bài.' });
        }
    },

    // 4. Cập nhật bài viết cộng đồng
    updatePost: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const { title, content, images, event_id } = req.body;

            const post = await prisma.blog.findUnique({ where: { id } });
            if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });
            if (post.author_id !== userId) return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa bài viết này.' });

            const updated = await prisma.blog.update({
                where: { id },
                data: {
                    title: title || post.title,
                    content: content || post.content,
                    images: images || post.images,
                    image_url: (images && images.length > 0) ? images[0] : post.image_url,
                    event_id: event_id === undefined ? post.event_id : event_id
                },
                include: {
                    author: { select: { full_name: true, avatar_url: true } },
                    event: { select: { title: true } }
                }
            });

            res.json({ success: true, message: 'Cập nhật bài viết thành công!', data: updated });
        } catch (error) {
            console.error('Update Post Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bài viết.' });
        }
    },

    // 5. Xóa bài viết cộng đồng
    deletePost: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            const post = await prisma.blog.findUnique({ where: { id } });
            if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết.' });

            // Quyền xóa: Tác giả hoặc Admin
            if (post.author_id !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Không có quyền xóa bài viết này.' });
            }

            await prisma.blog.delete({ where: { id } });
            res.json({ success: true, message: 'Đã xóa bài viết thành công.' });
        } catch (error) {
            console.error('Delete Post Error:', error);
            res.status(500).json({ success: false, message: 'Lỗi khi xóa bài viết.' });
        }
    }
};

module.exports = communityController;
