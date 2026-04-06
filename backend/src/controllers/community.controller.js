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

            // Tìm tất cả các đơn hàng thành công của người dùng
            const orders = await prisma.order.findMany({
                where: {
                    customer_id: userId,
                    status: 'completed'
                },
                select: {
                    event: {
                        select: { id: true, title: true, image_url: true, event_date: true }
                    }
                }
            });

            // Lấy danh sách sự kiện duy nhất
            const events = Array.from(new Set(orders.map(o => o.event.id)))
                .map(id => orders.find(o => o.event.id === id).event);

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

            // Nếu có event_id, kiểm tra xem người dùng có quyền đăng (đã mua vé chưa)
            if (event_id) {
                const hasOrder = await prisma.order.findFirst({
                    where: {
                        customer_id: userId,
                        event_id: event_id,
                        status: 'completed'
                    }
                });

                if (!hasOrder) {
                    return res.status(403).json({ 
                        success: false, 
                        message: 'Bạn chỉ có thể đăng bài gắn thẻ sự kiện mà bạn đã tham gia/đặt vé.' 
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
    }
};

module.exports = communityController;
