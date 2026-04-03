const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slugify = require('slugify');

const blogController = {
    // 1. Tạo Review từ khách hàng (Có ràng buộc thời gian & vé)
    createReview: async (req, res) => {
        try {
            const { event_id, title, content, image_url } = req.body;
            const user_id = req.user.id;

            if (!event_id || !title || !content) {
                return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin.' });
            }

            // --- KIỂM TRA QUYỀN VIẾT REVIEW ---
            // 1. Kiểm tra xem người dùng có sở hữu vé của sự kiện này không
            const ticket = await prisma.ticket.findFirst({
                where: {
                    current_owner_id: user_id,
                    event_id: event_id,
                    status: { not: 'refunded' } // Vé không bị hoàn trả
                }
            });

            if (!ticket) {
                return res.status(403).json({ error: 'Bạn phải sở hữu vé của sự kiện này mới có thể viết cảm nhận.' });
            }

            // 2. Kiểm tra thời gian sự kiện (Chỉ được viết sau khi kết thúc)
            const event = await prisma.event.findUnique({
                where: { id: event_id }
            });

            if (!event) {
                return res.status(404).json({ error: 'Không tìm thấy sự kiện.' });
            }

            const now = new Date();
            const eventEndTime = event.end_date || event.event_date;

            if (now < eventEndTime) {
                return res.status(400).json({ 
                    error: 'Sự kiện chưa kết thúc. Bạn chỉ có thể viết cảm nhận sau khi sự kiện đã diễn ra xong.' 
                });
            }

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
                    status: 'published' // Review khách hàng mặc định hiển thị (hoặc có thể để chờ duyệt tùy bạn)
                }
            });

            res.status(201).json({ message: 'Cảm ơn bạn đã chia sẻ cảm nhận!', data: blog });
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
                    _count: {
                        select: { comments: true, likes: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            const data = reviews.map(r => ({
                ...r,
                is_liked: r.likes ? r.likes.length > 0 : false,
                likes: undefined
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
            const user_id = req.user.id;

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
            const user_id = req.user.id;

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
    }
};

module.exports = blogController;
