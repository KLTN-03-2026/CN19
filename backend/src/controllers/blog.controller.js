const prisma = require('../config/prisma');
const slugify = require('slugify');

const blogController = {
    // 1. Tạo Review từ khách hàng (Có ràng buộc thời gian & vé)
    createReview: async (req, res) => {
        try {
            const { event_id, title, content, image_url } = req.body;
            const user_id = req.user.userId;

            if (!event_id || !title || !content) {
                return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
            }

            // 1. Kiểm tra sự kiện
            const event = await prisma.event.findUnique({
                where: { id: event_id }
            });

            if (!event) {
                return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
            }

            const now = new Date();
            const eventEndTime = new Date(event.end_date || event.event_date);
            const isEventEnded = now > eventEndTime;

            // 2. KIỂM TRA QUYỀN THEO THỜI GIAN
            // Nếu sự kiện đã kết thúc -> Đây là ĐÁNH GIÁ (Review) -> Bắt buộc phải có vé
            if (isEventEnded) {
                const ticket = await prisma.ticket.findFirst({
                    where: {
                        current_owner_id: user_id,
                        event_id: event_id,
                        status: { not: 'refunded' } // Vé không bị hoàn trả
                    }
                });

                if (!ticket) {
                    return res.status(403).json({ error: 'Sự kiện đã kết thúc, bạn phải từng sở hữu vé vé mới có thể viết đánh giá.' });
                }
            }
            // Nếu sự kiện chưa diễn ra -> Đây là THẢO LUẬN (Discussion) -> Ai cũng được đăng bài

            // --- TẠO BLOG ---
            const slug = slugify(title, { lower: true, strict: true, locale: 'vi' }) + '-' + Date.now();

            const blog = await prisma.blog.create({
                data: {
                    author_id: user_id,
                    event_id: event_id,
                    title,
                    content,
                    image_url,
                    slug,
                    type: 'CUSTOMER_REVIEW',
                    status: 'published' // Review khách hàng mặc định hiển thị
                }
            });

            res.status(201).json({ 
                message: isEventEnded ? 'Cảm ơn bạn đã chia sẻ cảm nhận!' : 'Đã đăng bài thảo luận thành công!', 
                data: blog 
            });
        } catch (error) {
            console.error('Create Review Error:', error);
            res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng bài viết.' });
        }
    },

    // 2. Lấy danh sách review của một sự kiện
    getEventReviews: async (req, res) => {
        try {
            const { eventId } = req.params;
            const authHeader = req.headers.authorization;
            let currentUserId = null;

            // Kiểm tra user ID nếu có token (Optional auth)
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    currentUserId = decoded.id;
                } catch (e) {
                    // Token lỗi thì coi như khách vãng lai
                }
            }

            const reviews = await prisma.blog.findMany({
                where: {
                    event_id: eventId,
                    status: 'published'
                },
                include: {
                    author: {
                        select: { full_name: true, avatar_url: true }
                    },
                    likes: currentUserId ? { where: { user_id: currentUserId } } : false,
                    comments: {
                        include: {
                            user: { select: { id: true, full_name: true, avatar_url: true } }
                        },
                        orderBy: { created_at: 'asc' }
                    },
                    _count: {
                        select: { comments: true, likes: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            // Lấy danh sách user_id của tác giả bài viết
            const userIds = reviews.map(r => r.author_id);
            
            // Lấy thêm user_id của những người phản hồi (comment)
            reviews.forEach(r => {
                if (r.comments) {
                    r.comments.forEach(c => userIds.push(c.user_id));
                }
            });
            const uniqueUserIds = [...new Set(userIds)];

            // Kiểm tra xem ai đã sở hữu vé sự kiện này
            const tickets = await prisma.ticket.findMany({
                where: {
                    event_id: eventId,
                    current_owner_id: { in: uniqueUserIds },
                    status: { not: 'refunded' }
                },
                select: { current_owner_id: true }
            });
            
            const usersWithTickets = new Set(tickets.map(t => t.current_owner_id));

            const data = reviews.map(r => ({
                ...r,
                is_liked: r.likes ? r.likes.length > 0 : false,
                likes: undefined,
                has_ticket: usersWithTickets.has(r.author_id),
                comments: r.comments ? r.comments.map(cmt => ({
                    ...cmt,
                    has_ticket: usersWithTickets.has(cmt.user_id)
                })) : []
            }));

            res.status(200).json({ data });
        } catch (error) {
            console.error('Get Reviews Error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách cảm nhận.' });
        }
    },

    // 3. Like/Unlike bài viết
    toggleLike: async (req, res) => {
        try {
            const { blogId } = req.params;
            const user_id = req.user.userId;

            const existingLike = await prisma.like.findUnique({
                where: {
                    blog_id_user_id: {
                        blog_id: blogId,
                        user_id: user_id
                    }
                }
            });

            if (existingLike) {
                await prisma.like.delete({
                    where: { id: existingLike.id }
                });
                return res.status(200).json({ message: 'Đã bỏ thích.', liked: false });
            } else {
                await prisma.like.create({
                    data: { blog_id: blogId, user_id: user_id }
                });
                return res.status(201).json({ message: 'Đã thích bài viết.', liked: true });
            }
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi thực hiện tương tác.' });
        }
    },

    // 4. Thêm bình luận
    addComment: async (req, res) => {
        try {
            const { blogId } = req.params;
            const { content } = req.body;
            const user_id = req.user.userId;

            if (!content) return res.status(400).json({ error: 'Nội dung bình luận không được để trống.' });

            const comment = await prisma.comment.create({
                data: {
                    blog_id: blogId,
                    user_id: user_id,
                    content: content
                },
                include: {
                    user: {
                        select: { full_name: true, avatar_url: true }
                    }
                }
            });

            res.status(201).json({ message: 'Đã thêm bình luận.', data: comment });
        } catch (error) {
            res.status(500).json({ error: 'Lỗi khi thêm bình luận.' });
        }
    },

    // 5. Lấy danh sách blog công khai (Hỗ trợ phân trang, lọc loại)
    getPublicBlogs: async (req, res) => {
        try {
            const { type, search, page = 1, limit = 9 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where = { status: 'published' };
            
            // Nếu không yêu cầu type cụ thể, mặc định chỉ lấy tin Admin & BTC cho trang Blog
            if (type && type !== 'all') {
                where.type = type;
            } else {
                where.type = { in: ['SYSTEM_NEWS', 'ORGANIZER_NEWS'] };
            }
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } }
                ];
            }

            const blogs = await prisma.blog.findMany({
                where,
                include: {
                    author: { 
                        select: { 
                            id: true, 
                            full_name: true, 
                            avatar_url: true, 
                            role: true, 
                            date_of_birth: true,
                            organizer_profile: {
                                select: { organization_name: true }
                            }
                        } 
                    },
                    event: { select: { id: true, title: true } },
                    _count: { select: { likes: true, comments: true } }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: parseInt(limit)
            });

            // Sắp xếp lại để SYSTEM_NEWS lên đầu (Featured)
            const sortedBlogs = [...blogs].sort((a, b) => {
                if (a.type === 'SYSTEM_NEWS' && b.type !== 'SYSTEM_NEWS') return -1;
                if (a.type !== 'SYSTEM_NEWS' && b.type === 'SYSTEM_NEWS') return 1;
                return 0;
            });

            const total = await prisma.blog.count({ where });

            res.json({
                success: true,
                data: sortedBlogs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('getPublicBlogs error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách bài viết.' });
        }
    },

    // 6. Lấy chi tiết bài viết theo Slug
    getBlogBySlug: async (req, res) => {
        try {
            const { slug } = req.params;
            const authHeader = req.headers.authorization;
            let currentUserId = null;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    currentUserId = decoded.id;
                } catch (e) {}
            }

            const blog = await prisma.blog.findUnique({
                where: { slug },
                include: {
                    author: { 
                        select: { 
                            id: true, 
                            full_name: true, 
                            avatar_url: true, 
                            role: true,
                            organizer_profile: {
                                select: { organization_name: true }
                            }
                        } 
                    },
                    event: { select: { id: true, title: true, image_url: true } },
                    comments: {
                        include: {
                            user: { select: { id: true, full_name: true, avatar_url: true } }
                        },
                        orderBy: { created_at: 'desc' }
                    },
                    likes: currentUserId ? { where: { user_id: currentUserId } } : false,
                    _count: { select: { likes: true } }
                }
            });

            if (!blog || blog.status !== 'published') {
                return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
            }

            // Tăng lượt xem
            await prisma.blog.update({
                where: { id: blog.id },
                data: { views: { increment: 1 } }
            });

            const result = {
                ...blog,
                is_liked: blog.likes ? blog.likes.length > 0 : false,
                likes: undefined
            };

            res.json({ success: true, data: result });
        } catch (error) {
            console.error('getBlogBySlug error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy chi tiết bài viết.' });
        }
    }
};

module.exports = blogController;
