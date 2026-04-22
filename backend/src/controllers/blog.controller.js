const prisma = require('../config/prisma');
const slugify = require('slugify');
const notificationService = require('../services/notification.service');

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

            // Lấy thông tin Organizer của sự kiện để gắn tag BTC
            const event = await prisma.event.findUnique({
                where: { id: eventId },
                include: { organizer: { select: { user_id: true } } }
            });
            const organizerUserId = event?.organizer?.user_id;

            const data = reviews.map(r => ({
                ...r,
                is_liked: r.likes ? r.likes.length > 0 : false,
                likes: undefined,
                has_ticket: usersWithTickets.has(r.author_id),
                is_organizer: r.author_id === organizerUserId,
                comments: r.comments ? r.comments.map(cmt => ({
                    ...cmt,
                    has_ticket: usersWithTickets.has(cmt.user_id),
                    is_organizer: cmt.user_id === organizerUserId
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

            let isLiked = false;
            if (existingLike) {
                await prisma.like.delete({
                    where: { id: existingLike.id }
                });
                isLiked = false;
            } else {
                await prisma.like.create({
                    data: { blog_id: blogId, user_id: user_id }
                });
                isLiked = true;
                
                // --- THÔNG BÁO ---
                try {
                    const blog = await prisma.blog.findUnique({
                        where: { id: blogId },
                        select: { title: true, author_id: true, slug: true }
                    });
                    const liker = await prisma.user.findUnique({
                        where: { id: user_id },
                        select: { full_name: true }
                    });

                    // THỬ NGHIỆM: Cho phép cả tự thông báo để test
                    if (blog) {
                        const fs = require('fs');
                        const logDir = require('path').join(__dirname, '../../logs');
                        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
                        fs.appendFileSync(require('path').join(logDir, 'notif_debug.log'), `[${new Date().toISOString()}] BlogID: ${blogId}, Slug: ${blog.slug}, Author: ${blog.author_id}\n`);
                        
                        console.log(`[DEBUG NOTIF] Creating like notification for blog: ${blog.slug}`);
                        await notificationService.createNotification(
                            blog.author_id,
                            'like',
                            'Lượt thích mới',
                            `${liker.full_name} đã thích bài viết của bạn: "${blog.title}"`,
                            blog.slug,
                            blogId
                        );
                    }
                } catch (notiError) {
                    console.error('Notification Error (Like):', notiError);
                }
                // ------------------
            }

            // Lấy lại số lượng like mới nhất
            const likesCount = await prisma.like.count({
                where: { blog_id: blogId }
            });

            return res.status(200).json({ 
                success: true, 
                is_liked: isLiked, 
                likes_count: likesCount 
            });
        } catch (error) {
            console.error('toggleLike error:', error);
            res.status(500).json({ error: 'Lỗi khi thực hiện tương tác.' });
        }
    },

    // 4. Thêm bình luận
    addComment: async (req, res) => {
        try {
            const { blogId } = req.params;
            const { content, image_url, parent_id } = req.body;
            const user_id = req.user.userId;

            if (!content && !image_url) return res.status(400).json({ error: 'Bình luận không được để trống.' });

            const comment = await prisma.comment.create({
                data: {
                    blog_id: blogId,
                    user_id: user_id,
                    content: content || '',
                    image_url: image_url || null,
                    parent_id: parent_id || null
                },
                include: {
                    user: {
                        select: { id: true, full_name: true, avatar_url: true }
                    }
                }
            });

            // --- THÔNG BÁO ---
            try {
                const blog = await prisma.blog.findUnique({
                    where: { id: blogId },
                    select: { title: true, author_id: true, slug: true }
                });
                const commenter = await prisma.user.findUnique({
                    where: { id: user_id },
                    select: { full_name: true }
                });

                if (blog) {
                    if (parent_id) {
                        // Phản hồi bình luận
                        const parentComment = await prisma.comment.findUnique({
                            where: { id: parent_id },
                            select: { user_id: true, content: true }
                        });
                        
                        if (parentComment && parentComment.user_id !== user_id) {
                            const shortContent = parentComment.content.length > 30 
                                ? parentComment.content.substring(0, 30) + '...' 
                                : parentComment.content;

                            await notificationService.createNotification(
                                parentComment.user_id,
                                'comment',
                                'Phản hồi bình luận mới',
                                `${commenter.full_name} đã phản hồi bình luận của bạn: "${shortContent}"`,
                                blog.slug,
                                blogId
                            );
                        }
                    } else {
                        // Bình luận bài viết
                        if (blog.author_id !== user_id) {
                            await notificationService.createNotification(
                                blog.author_id,
                                'comment',
                                'Bình luận mới',
                                `${commenter.full_name} đã bình luận về bài viết của bạn: "${blog.title}"`,
                                blog.slug,
                                blogId
                            );
                        }
                    }
                }
            } catch (notiError) {
                console.error('Notification Error (Comment):', notiError);
            }
            // ------------------

            res.status(201).json({ success: true, message: 'Đã thêm bình luận.', data: comment });
        } catch (error) {
            console.error('addComment error:', error);
            res.status(500).json({ error: 'Lỗi khi thêm bình luận.' });
        }
    },

    // 4.1 Lấy danh sách bình luận (Mới)
    getComments: async (req, res) => {
        try {
            const { blogId } = req.params;
            
            // Check current user if logged in
            const authHeader = req.headers.authorization;
            let currentUserId = null;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
                    currentUserId = decoded.userId || decoded.id;
                    // Log to verify
                    console.log('getComments identified user:', currentUserId);
                } catch (e) {
                    console.log('getComments token error:', e.message);
                }
            }

            const comments = await prisma.comment.findMany({
                where: { blog_id: blogId },
                include: {
                    user: {
                        select: { id: true, full_name: true, avatar_url: true }
                    }
                },
                orderBy: { created_at: 'asc' }
            });

            const processedComments = comments.map(c => ({
                ...c,
                likes_count: c.like_user_ids?.length || 0,
                is_liked: currentUserId ? (c.like_user_ids || []).includes(currentUserId) : false
            }));

            res.status(200).json({ success: true, data: processedComments });
        } catch (error) {
            console.error('getComments error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách bình luận.' });
        }
    },

    // 4.2 Thích/Bỏ thích bình luận (Mới - Không dùng bảng mới)
    toggleCommentLike: async (req, res) => {
        try {
            const { id } = req.params;
            const user_id = req.user.userId;

            const comment = await prisma.comment.findUnique({ where: { id } });
            if (!comment) return res.status(404).json({ error: 'Không tìm thấy bình luận.' });

            let updatedIds = [...(comment.like_user_ids || [])];
            const index = updatedIds.indexOf(user_id);
            
            if (index > -1) {
                updatedIds.splice(index, 1); // Unlike
            } else {
                updatedIds.push(user_id); // Like
            }

            const updated = await prisma.comment.update({
                where: { id },
                data: { like_user_ids: updatedIds }
            });

            // --- THÔNG BÁO ---
            if (index === -1) { // Chỉ thông báo khi nhấn "Thích"
                try {
                    const liker = await prisma.user.findUnique({
                        where: { id: user_id },
                        select: { full_name: true }
                    });

                    // Lấy slug bài viết để điều hướng
                    const blog = await prisma.blog.findFirst({
                        where: { id: comment.blog_id },
                        select: { slug: true }
                    });

                    if (comment.user_id !== user_id) { // Không thông báo khi tự thích bài của mình
                        await notificationService.createNotification(
                            comment.user_id,
                            'like',
                            'Lượt thích bình luận',
                            `${liker.full_name} đã thích bình luận của bạn.`,
                            blog?.slug,
                            comment.blog_id
                        );
                    }
                } catch (notiError) {
                    console.error('Notification Error (Like Comment):', notiError);
                }
            }
            // ------------------

            res.json({ 
                success: true, 
                is_liked: index === -1,
                likes_count: updated.like_user_ids.length 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi khi thực hiện thích bình luận.' });
        }
    },

    // 5. Lấy danh sách blog công khai (Hỗ trợ phân trang, lọc loại)
    getPublicBlogs: async (req, res) => {
        try {
            const { type, search, authorId, page = 1, limit = 9 } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const authHeader = req.headers.authorization;
            let currentUserId = null;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const jwt = require('jsonwebtoken');
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
                    currentUserId = decoded.userId || decoded.id;
                    console.log('getPublicBlogs identified user:', currentUserId);
                } catch (e) {
                    console.log('getPublicBlogs token error:', e.message);
                }
            }

            const where = {};
            // Nếu người gọi là tác giả và đang xem tab của chính mình, cho phép xem cả bài hidden
            if (authorId && currentUserId === authorId) {
                where.status = { in: ['published', 'hidden'] };
            } else {
                where.status = 'published';
            }

            if (authorId) where.author_id = authorId;
            
            // Lọc theo loại bài viết
            if (type && type !== 'all') {
                if (type === 'community') {
                    where.type = 'COMMUNITY_POST';
                } else if (type === 'discussion') {
                    where.type = 'DISCUSSION';
                } else {
                    where.type = type;
                }
            } else {
                // Mặc định tab "Khám phá" cho hiện News và Community? 
                // Thường "Khám phá" là hiện tất cả nhưng ưu tiên News
            }

            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                    { event: { title: { contains: search, mode: 'insensitive' } } },
                    { author: { full_name: { contains: search, mode: 'insensitive' } } }
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
                    likes: currentUserId ? { where: { user_id: currentUserId } } : false,
                    _count: { select: { likes: true, comments: true } }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: parseInt(limit)
            });

            const processedBlogs = blogs.map(b => ({
                ...b,
                is_liked: b.likes?.length > 0,
                is_saved: currentUserId ? (b.saved_user_ids || []).includes(currentUserId) : false,
                likes: undefined // Hide the likes array to keep response clean
            }));

            // Sắp xếp lại để SYSTEM_NEWS lên đầu (Featured)
            const sortedBlogs = [...processedBlogs].sort((a, b) => {
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
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
                    currentUserId = decoded.userId || decoded.id;
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
    },

    updateReview: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, content, image_url } = req.body;
            
            const review = await prisma.blog.findUnique({ where: { id } });
            if (!review) return res.status(404).json({ error: 'Không tìm thấy thảo luận.' });
            if (review.author_id !== req.user.userId) return res.status(403).json({ error: 'Không có quyền chỉnh sửa.' });

            const updated = await prisma.blog.update({
                where: { id },
                data: { title, content, image_url }
            });
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi server khi cập nhật thảo luận.' });
        }
    },

    deleteReview: async (req, res) => {
        try {
            const { id } = req.params;
            const review = await prisma.blog.findUnique({ where: { id } });
            if (!review) return res.status(404).json({ error: 'Không tìm thấy thảo luận.' });
            // Cả tác giả và event organizer đều có quyền xóa (có thể cải tiến thêm quyền của event organizer)
            if (review.author_id !== req.user.userId && req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền xóa.' });

            await prisma.blog.delete({ where: { id } });
            res.json({ success: true, message: 'Đã xóa thảo luận thành công.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi server khi xóa thảo luận.' });
        }
    },

    updateComment: async (req, res) => {
        try {
            const { id } = req.params;
            const { content, image_url } = req.body;
            
            const comment = await prisma.comment.findUnique({ where: { id } });
            if (!comment) return res.status(404).json({ error: 'Không tìm thấy phản hồi.' });
            if (comment.user_id !== req.user.userId) return res.status(403).json({ error: 'Không có quyền chỉnh sửa.' });

            const updated = await prisma.comment.update({
                where: { id },
                data: { 
                    content: content || comment.content,
                    image_url: image_url === undefined ? comment.image_url : image_url
                }
            });
            res.json({ success: true, data: updated });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi server khi cập nhật phản hồi.' });
        }
    },

    deleteComment: async (req, res) => {
        try {
            const { id } = req.params;
            const comment = await prisma.comment.findUnique({ where: { id } });
            if (!comment) return res.status(404).json({ error: 'Không tìm thấy phản hồi.' });
            if (comment.user_id !== req.user.userId && req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền xóa.' });

            await prisma.comment.delete({ where: { id } });
            res.json({ success: true, message: 'Đã xóa phản hồi thành công.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi server khi xóa phản hồi.' });
        }
    },

    // 4.3 Lấy danh sách người thích bài viết (Mới)
    getLikers: async (req, res) => {
        try {
            const { id } = req.params;
            const likes = await prisma.like.findMany({
                where: { blog_id: id },
                include: {
                    user: {
                        select: { id: true, full_name: true, avatar_url: true }
                    }
                }
            });
            res.json({ success: true, data: likes.map(l => l.user) });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách người thích.' });
        }
    },

    // 4.4 Lấy danh sách người thích bình luận (Mới)
    getCommentLikers: async (req, res) => {
        try {
            const { id } = req.params;
            const comment = await prisma.comment.findUnique({ where: { id } });
            if (!comment) return res.status(404).json({ error: 'Không tìm thấy bình luận.' });

            const users = await prisma.user.findMany({
                where: { id: { in: comment.like_user_ids || [] } },
                select: { id: true, full_name: true, avatar_url: true }
            });
            res.json({ success: true, data: users });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách người thích bình luận.' });
        }
    },

    // 5. Lưu hoặc bỏ lưu bài viết (Mới - Không dùng bảng phụ)
    toggleSaveBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId || req.user.id;

            const blog = await prisma.blog.findUnique({ where: { id } });
            if (!blog) return res.status(404).json({ error: 'Không tìm thấy bài viết.' });

            let updatedIds = [...(blog.saved_user_ids || [])];
            const index = updatedIds.indexOf(userId);

            if (index === -1) {
                updatedIds.push(userId);
            } else {
                updatedIds.splice(index, 1);
            }

            await prisma.blog.update({
                where: { id },
                data: { saved_user_ids: updatedIds }
            });

            res.json({ 
                success: true, 
                is_saved: index === -1,
                message: index === -1 ? 'Đã lưu bài viết.' : 'Đã bỏ lưu bài viết.'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi khi thực hiện lưu bài viết.' });
        }
    },

    // 6. Lấy danh sách bài viết đã lưu (Mới)
    getSavedBlogs: async (req, res) => {
        try {
            const userId = req.user.userId || req.user.id;
            const blogs = await prisma.blog.findMany({
                where: { 
                    saved_user_ids: { has: userId },
                    status: 'published'
                },
                include: {
                    author: {
                        select: { id: true, full_name: true, avatar_url: true }
                    },
                    likes: {
                        where: { user_id: userId }
                    },
                    _count: {
                        select: { comments: true, likes: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            const formatted = blogs.map(blog => ({
                ...blog,
                is_liked: blog.likes?.length > 0,
                is_saved: true
            }));

            res.json({ success: true, data: formatted });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách bài viết đã lưu.' });
        }
    },

    // 6. Ẩn/Hiện bài viết (Mới)
    toggleHideBlog: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.userId || req.user.id;

            const blog = await prisma.blog.findUnique({ where: { id } });
            if (!blog) return res.status(404).json({ error: 'Không tìm thấy bài viết.' });
            
            // Chỉ tác giả mới có quyền ẩn/hiện
            if (blog.author_id !== userId) {
                return res.status(403).json({ error: 'Bạn không có quyền thay đổi trạng thái bài viết này.' });
            }

            const newStatus = blog.status === 'hidden' ? 'published' : 'hidden';
            
            const updated = await prisma.blog.update({
                where: { id },
                data: { status: newStatus }
            });

            res.json({ 
                success: true, 
                status: updated.status,
                message: updated.status === 'hidden' ? 'Đã ẩn bài viết thành công.' : 'Đã hiển thị bài viết thành công.'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Lỗi server khi thay đổi trạng thái bài viết.' });
        }
    },
    // 7. Lấy danh sách sự kiện đang được thảo luận nhiều nhất (Dựa trên số Blog và Bình luận)
    getTrendingEvents: async (req, res) => {
        try {
            const trendingEvents = await prisma.event.findMany({
                where: {
                    status: 'active',
                    blogs: { some: { status: 'published' } }
                },
                take: 10, // Lấy dư ra tí để sort chính xác hơn sau khi join
                select: {
                    id: true,
                    title: true,
                    image_url: true,
                    event_date: true,
                    _count: {
                        select: {
                            blogs: { where: { status: 'published' } }
                        }
                    },
                    blogs: {
                        where: { status: 'published' },
                        select: {
                            _count: {
                                select: { comments: true }
                            }
                        }
                    }
                }
            });

            // Tính toán tổng Discussion (Blogs + Comments)
            const result = trendingEvents.map(event => {
                const blogCount = event._count.blogs;
                const commentCount = event.blogs.reduce((sum, blog) => sum + (blog._count?.comments || 0), 0);
                return {
                    id: event.id,
                    title: event.title,
                    image_url: event.image_url,
                    event_date: event.event_date,
                    blog_count: blogCount,
                    comment_count: commentCount,
                    total_discussion: blogCount + commentCount
                };
            });

            // Sắp xếp theo tổng thảo luận giảm dần
            result.sort((a, b) => b.total_discussion - a.total_discussion);

            res.json({ success: true, data: result.slice(0, 5) });
        } catch (error) {
            console.error('getTrendingEvents error:', error);
            res.status(500).json({ error: 'Lỗi khi lấy danh sách xu hướng.' });
        }
    }
};

module.exports = blogController;
