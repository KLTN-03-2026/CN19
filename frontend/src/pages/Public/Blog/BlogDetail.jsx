import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Heart, 
    MessageSquare, 
    Share2, 
    User, 
    Clock, 
    TrendingUp, 
    Send, 
    Loader2,
    Sparkles,
    ArrowRight,
    CornerDownRight,
    Trash2,
    LayoutDashboard,
    Bell,
    Bookmark,
    Search,
    Eye,
    Image as ImageIcon,
    X,
    MoreHorizontal,
    Edit2
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import blogService from '../../../services/blog.service';
import { communityService } from '../../../services/community.service';
import { userService } from '../../../services/user.service';
import { useAuthStore } from '../../../store/useAuthStore';
import SocialImageGrid from '../../../components/blog/SocialImageGrid';
import NotificationsModal from '../../../components/blog/NotificationsModal';

const BlogDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, i18n } = useTranslation();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [comments, setComments] = useState([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Advanced Comment States
    const [commentImage, setCommentImage] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState('');
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [likersModal, setLikersModal] = useState({ show: false, list: [], title: '', isLoading: false });
    
    // Inline Reply States
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState(null);
    const [isUploadingReplyImage, setIsUploadingReplyImage] = useState(false);
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

    // Fetch Notifications for unread count
    const { data: notifData } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => userService.getNotifications(),
        enabled: !!isAuthenticated,
    });

    // Fetch Trending Events for Sidebar
    const { data: trendingEventsData, isLoading: trendingLoading } = useQuery({
        queryKey: ['trending-events'],
        queryFn: () => blogService.getTrendingEvents(),
    });

    const notifications = Array.isArray(notifData) ? notifData : (notifData?.data || []);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const trendingEvents = trendingEventsData?.data || [];
    
    // Normalize images array: Combine image_url and images array, removing duplicates
    const images = blog ? (
        [...new Set([
            ...(blog.image_url ? [blog.image_url] : []),
            ...(Array.isArray(blog.images) ? blog.images : [])
        ])]
    ) : [];

    useEffect(() => {
        if (slug) {
            fetchBlogDetail();
            window.scrollTo(0, 0);
        }
    }, [slug]);

    const fetchBlogDetail = async () => {
        try {
            setLoading(true);
            const res = await blogService.getBlogBySlug(slug);
            if (res.success) {
                setBlog(res.data);
                setIsLiked(res.data.is_liked);
                setIsSaved(res.data.is_saved || false);
                setLikeCount(res.data._count?.likes || 0);
                await fetchComments(res.data.id);
            }
        } catch (error) {
            console.error('Fetch Blog Error:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (blogId) => {
        try {
            setIsCommentsLoading(true);
            const res = await communityService.getComments(blogId || blog.id);
            if (res.success) {
                setComments(res.data);
            }
        } catch (error) {
            console.error('Fetch comments error:', error);
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) return toast.error(t('reviews.loginToDiscuss'));
        try {
            const res = await blogService.toggleLike(blog.id);
            if (res.success) {
                setIsLiked(res.is_liked);
                setLikeCount(prev => res.is_liked ? prev + 1 : prev - 1);
                // Sync notifications badge
                queryClient.invalidateQueries(['notifications']);
            }
        } catch (error) {
            console.error('Like error:', error);
            toast.error(t('common.error'));
        }
    };

    const handleSave = async () => {
        if (!isAuthenticated) return toast.error(t('reviews.loginToDiscuss'));
        try {
            const res = await blogService.toggleSave(blog.id);
            if (res.success) {
                setIsSaved(res.is_saved);
                toast.success(res.is_saved ? t('blog.post.saved_success') || 'Đã lưu bài viết' : t('blog.post.unsaved_success') || 'Đã bỏ lưu');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(t('common.error'));
        }
    };

    const fetchBlogLikers = async () => {
        try {
            setLikersModal({ show: true, list: [], title: t('blog.post.likers_title') || 'Người đã thích', isLoading: true });
            const res = await communityService.getLikers(blog.id);
            if (res.success) {
                setLikersModal(prev => ({ ...prev, list: res.data, isLoading: false }));
            }
        } catch (error) {
            console.error('Fetch likers error:', error);
            setLikersModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleComment = async (e, parentId = null, textOverride = null, imageOverride = null) => {
        if (e) e.preventDefault();
        
        const text = textOverride !== null ? textOverride : comment;
        const image = imageOverride !== null ? imageOverride : commentImage;
        
        if (!text.trim() && !image) return;
        if (!isAuthenticated) return toast.error(t('reviews.loginToDiscuss'));

        try {
            setSubmittingComment(true);
            const res = await communityService.addComment(
                blog.id, 
                text, 
                image, 
                parentId || (replyTo ? replyTo.id : null)
            );
            
            if (res.success) {
                await fetchComments(blog.id);
                // Sync notifications badge
                queryClient.invalidateQueries(['notifications']);
                
                // Clear the correct input fields
                if (parentId || replyTo) {
                    setReplyText('');
                    setReplyImage(null);
                    setReplyTo(null);
                } else {
                    setComment('');
                    setCommentImage(null);
                }
                
                toast.success(t('blog.create_post.comment_success') || 'Đã gửi bình luận!');
            }
        } catch (error) {
            console.error('Comment error:', error);
            toast.error(t('common.error'));
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleReplyImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        try {
            setIsUploadingReplyImage(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);
            const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
            setReplyImage(res.data.secure_url);
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên.');
        } finally {
            setIsUploadingReplyImage(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        try {
            setIsUploadingImage(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                formData
            );
            
            setCommentImage(res.data.secure_url);
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleToggleCommentLike = async (commentId) => {
        if (!isAuthenticated) return toast.error(t('reviews.loginToDiscuss'));
        try {
            const res = await communityService.toggleCommentLike(commentId);
            if (res.success) {
                setComments(prev => prev.map(c => 
                    c.id === commentId 
                    ? { ...c, is_liked: res.is_liked, likes_count: res.likes_count } 
                    : c
                ));
                // Sync notifications badge
                queryClient.invalidateQueries(['notifications']);
            }
        } catch (error) {
            console.error('Like comment error:', error);
        }
    };

    const fetchCommentLikers = async (commentId) => {
        try {
            setLikersModal({ show: true, list: [], title: t('blog.post.view_likers'), isLoading: true });
            const res = await communityService.getCommentLikers(commentId);
            if (res.success) {
                setLikersModal(prev => ({ ...prev, list: res.data, isLoading: false }));
            }
        } catch (error) {
            setLikersModal(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleReplyAction = (cmt) => {
        setReplyTo(cmt);
        setReplyText(`@${cmt.user?.full_name} `);
        // We will now handle focusing the specific inline textarea in the JSX
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm(t('reviews.confirmDeleteComment'))) return;
        try {
            const res = await communityService.deleteComment(commentId);
            if (res.success) {
                setComments(prev => prev.filter(c => c.id !== commentId));
                toast.success(t('reviews.commentDeleted') || 'Đã xóa bình luận');
            }
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editText.trim()) return;
        try {
            const res = await communityService.updateComment(commentId, { content: editText });
            if (res.success) {
                setComments(prev => prev.map(c => 
                    c.id === commentId ? { ...c, content: editText } : c
                ));
                setEditingCommentId(null);
                setEditText('');
            }
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleNavToBlog = (tab) => {
        if (tab === 'notif') {
            setIsNotifModalOpen(true);
            return;
        }
        navigate('/blog', { state: { activeTab: tab } });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate('/blog', { state: { searchQuery: searchQuery.trim() } });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0c]">
                <div className="w-10 h-10 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!blog) return null;

    return (
        <div className="min-h-screen bg-transparent pt-6 pb-16 font-sans selection:bg-neon-green/30 px-6 md:px-12 xl:px-20">
            <div className="max-w-[1050px] mx-auto">
                
                {/* Mobile Navigation & Search */}
                <div className="lg:hidden space-y-3 mb-6">
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar px-1">
                        {[
                            { id: 'explorer', icon: LayoutDashboard, label: t('blog.nav.feed_explorer') },
                            { id: 'profile', icon: User, label: t('blog.nav.my_posts'), auth: true },
                            { id: 'saved', icon: Bookmark, label: t('blog.nav.saved'), auth: true },
                            { id: 'notif', icon: Bell, label: t('blog.nav.notifications'), auth: true }
                        ].filter(item => !item.auth || isAuthenticated).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavToBlog(item.id)}
                                className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-black uppercase transition-all bg-white dark:bg-[#111114] text-gray-500 border border-gray-100 dark:border-white/5 shadow-sm"
                            >
                                <item.icon className="w-3.5 h-3.5" />
                                {item.label}
                                {item.id === 'notif' && unreadCount > 0 && (
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-[#111114] rounded-2xl p-3 border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder={t('blog.quick_post.placeholder_search') || 'Tìm kiếm bài viết...'}
                                className="w-full pl-11 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-[12px] focus:ring-1 focus:ring-neon-green outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4 px-1">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center mt-2 gap-2 text-gray-900 dark:text-gray-400 hover:text-neon-green transition-all text-[13px] font-bold group"
                    >
                        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                        {t('blog.nav.back', 'Quay lại')}
                    </button>
                    <div className="px-3 py-1 mt-2 bg-neon-green/10 text-neon-green rounded-lg text-[10px] font-bold uppercase border border-neon-green/20">
                        {blog.category || (blog.type === 'SYSTEM_NEWS' ? (t('blog.post.system') || 'Hệ thống') : (t('blog.post.community') || 'Cộng đồng'))}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    <div className="flex-1 min-w-0">
                        <article className="bg-white dark:bg-[#111114] rounded-2xl md:rounded-[1.75rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
                            
                            {images.length > 0 && (
                                <div className="bg-white dark:bg-white/[0.01] border-b border-gray-100 dark:border-white/5 p-1.5 md:p-3">
                                    <SocialImageGrid images={images} variant="grid" />
                                </div>
                            )}

                            <div className="p-4 md:p-10">
                                <header className="mb-6 md:mb-8">
                                    <h1 className="text-[18px] md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                                        {blog.title}
                                    </h1>
                                    
                                    <div className="flex flex-wrap items-center gap-4 md:gap-8 py-4 border-y border-gray-50 dark:border-white/5 text-gray-400">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center border border-gray-200 dark:border-white/10 overflow-hidden shrink-0 shadow-sm">
                                                {blog.author?.avatar_url ? (
                                                    <img src={blog.author.avatar_url} className="w-full h-full object-cover" alt="author" />
                                                ) : (
                                                    <User className="w-4 h-4" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-500 leading-none mb-1">{t('blog.profile.author')}</p>
                                                <p className="text-[12px] md:text-[13px] font-black text-gray-900 dark:text-white leading-none">{blog.author?.full_name || 'BASTICKET'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 md:gap-8 ml-auto md:ml-0">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-500 leading-none mb-1">{t('blog.profile.published')}</p>
                                                <p className="text-[11px] md:text-[12px] font-black text-gray-900 dark:text-gray-300 leading-none">
                                                    {new Date(blog.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'vi-VN', { 
                                                        day: 'numeric', month: 'long', year: 'numeric' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </header>

                                <div 
                                    className="prose dark:prose-invert max-w-none 
                                             prose-p:text-[15px] md:prose-p:text-[16px] prose-p:leading-relaxed prose-p:font-medium prose-p:text-gray-800 dark:prose-p:text-gray-300 prose-p:mb-5
                                             prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-black prose-headings:mt-8 prose-headings:mb-4
                                             prose-img:rounded-2xl prose-img:my-8 prose-img:shadow-xl
                                             prose-blockquote:border-l-4 prose-blockquote:border-neon-green prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/5 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:font-bold prose-blockquote:italic prose-blockquote:text-gray-900 dark:prose-blockquote:text-gray-200"
                                    dangerouslySetInnerHTML={{ __html: blog.content }} 
                                />

                                <div className="mt-6 pt-2 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div className="flex flex-col gap-3">
                                        {/* Likers Summary Tag - Clickable */}
                                        <button 
                                            onClick={fetchBlogLikers}
                                            className="flex items-center gap-1.5 px-1 py-1 hover:opacity-80 transition-opacity w-fit group"
                                        >
                                            <div className="flex -space-x-1.5">
                                                <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center border-2 border-white dark:border-[#111114] shadow-sm z-10">
                                                    <Heart className="w-2.5 h-2.5 text-white fill-current" />
                                                </div>
                                            </div>
                                            <span className="text-[12px] font-black text-rose-500 group-hover:underline underline-offset-2">
                                                {likeCount}
                                            </span>
                                        </button>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={handleLike}
                                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black uppercase text-[10px] transition-all active:scale-95 border ${
                                                    isLiked 
                                                    ? ' border-rose-500/50 text-rose-500' 
                                                    : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-800 hover:text-rose-500 hover:bg-rose-500/5'
                                                }`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isLiked ? 'fill-current' : ''}`} />
                                                {isLiked ? t('blog.post.liked') : t('blog.post.like')}
                                            </button>

                                            <button 
                                                onClick={handleSave}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                                                    isSaved 
                                                    ? 'bg-neon-green text-black shadow-neon-green/20' 
                                                    : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-400 hover:text-neon-green hover:bg-neon-green/5'
                                                }`}
                                            >
                                                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                            </button>

                                            <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-800 dark:text-gray-400 hover:text-neon-green hover:bg-neon-green/5 transition-all shadow-sm">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 text-[10px] md:text-[11px] font-black text-gray-800 dark:text-gray-400 uppercase bg-gray-50 dark:bg-white/[0.03] px-4 py-2 rounded-full border border-gray-100 dark:border-white/5">
                                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-neon-green" />
                                        {blog.views || 0} {t('blog.post.views') || 'lượt xem'}
                                    </div>
                                </div>
                            </div>
                        </article>

                        <section className="mt-6 bg-white dark:bg-[#111114] rounded-2xl md:rounded-[1.75rem] border border-gray-100 dark:border-white/5 p-3 md:p-4 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50 dark:border-white/5">
                                <h3 className="text-[16px] md:text-lg font-black text-gray-900 dark:text-white uppercase flex items-center gap-3">
                                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-neon-green" /> 
                                    {t('blog.post.comment') || 'Bình luận'} ({comments.length})
                                </h3>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-800 dark:text-gray-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></div>
                                    {t('blog.post.active_now') || 'Hoạt động ngay'}
                                </div>
                            </div>
                            

                            {/* Comments List */}
                            <div className="space-y-3">
                                {isCommentsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-neon-green" />
                                        <p className="text-[10px] font-black text-gray-800 dark:text-gray-400 uppercase tracking-widest">{t('blog.post.loading') || 'Đang tải...'}</p>
                                    </div>
                                ) : comments.length > 0 ? (
                                    comments.filter(c => !c.parent_id).map((cmt) => (
                                        <div key={cmt.id} className="group/comment animate-in fade-in slide-in-from-bottom-1 duration-400">
                                            <div className="flex gap-2.5 items-start">
                                                <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 shrink-0 shadow-sm">
                                                    <img 
                                                        src={cmt.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cmt.user?.full_name}`} 
                                                        className="w-full h-full object-cover" 
                                                        alt="avatar"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-0.5 min-w-0">
                                                    <div className="relative group/actions inline-block max-w-full">
                                                        <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-2 md:p-2.5 border border-gray-100 dark:border-white/5 shadow-sm transition-all group-hover/comment:border-neon-green/20">
                                                            <div className="flex justify-between items-start mb-0.5 gap-4">
                                                                <h5 className="text-[12px] md:text-[13px] font-black text-gray-900 dark:text-white tracking-tight">{cmt.user?.full_name}</h5>
                                                                
                                                                {currentUser?.id === cmt.user_id && (
                                                                    <div className="relative">
                                                                        <button 
                                                                            onClick={() => setShowActionMenu(showActionMenu === cmt.id ? null : cmt.id)}
                                                                            className="p-1 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all opacity-0 group-hover/comment:opacity-100"
                                                                        >
                                                                            <MoreHorizontal className="w-4 h-4" />
                                                                        </button>
                                                                        
                                                                        {showActionMenu === cmt.id && (
                                                                            <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-[#1c1c21] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl py-1.5 w-32 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        setEditingCommentId(cmt.id);
                                                                                        setEditText(cmt.content);
                                                                                        setShowActionMenu(null);
                                                                                    }}
                                                                                    className="w-full px-3 py-1.5 text-[11px] font-bold text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                                                                >
                                                                                    <Edit2 className="w-3.5 h-3.5" /> {t('blog.post.edit')}
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        handleDeleteComment(cmt.id);
                                                                                        setShowActionMenu(null);
                                                                                    }}
                                                                                    className="w-full px-3 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" /> {t('blog.post.delete')}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {editingCommentId === cmt.id ? (
                                                                <div className="space-y-1.5 min-w-[200px]">
                                                                    <textarea 
                                                                        value={editText}
                                                                        onChange={(e) => setEditText(e.target.value)}
                                                                        className="w-full bg-gray-50 dark:bg-black/20 border border-neon-green/30 rounded-xl p-2 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-neon-green resize-none"
                                                                        rows={2}
                                                                    />
                                                                    <div className="flex justify-end gap-1.5">
                                                                        <button onClick={() => setEditingCommentId(null)} className="px-2 py-1 text-[9px] font-black text-gray-800 dark:text-gray-400 hover:text-gray-600 uppercase transition-colors">{t('blog.post.cancel')}</button>
                                                                        <button onClick={() => handleUpdateComment(cmt.id)} className="px-3 py-1 bg-neon-green text-black text-[9px] font-black rounded-lg uppercase transition-transform active:scale-95">{t('blog.post.save')}</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[12px] md:text-[13px] font-medium text-gray-800 dark:text-gray-300 whitespace-pre-wrap leading-tight">
                                                                    {cmt.content}
                                                                </p>
                                                            )}
                                                            
                                                            {cmt.image_url && !editingCommentId && (
                                                                <div className="mt-2 rounded-xl border border-gray-100 dark:border-white/10 max-w-[240px] shadow-sm">
                                                                    <img 
                                                                        src={cmt.image_url} 
                                                                        className="w-full h-auto cursor-pointer hover:scale-105 transition-transform duration-500" 
                                                                        alt="attachment" 
                                                                        onClick={() => window.open(cmt.image_url, '_blank')} 
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 px-2 text-[10px] md:text-[11px] font-black uppercase tracking-tight">
                                                        <button 
                                                            onClick={() => handleToggleCommentLike(cmt.id)}
                                                            className={`transition-all active:scale-90 ${cmt.is_liked ? 'text-rose-500' : 'text-gray-800 dark:text-gray-400 hover:text-rose-500'}`}
                                                        >
                                                            {cmt.is_liked ? t('blog.post.liked') : t('blog.post.like')}
                                                        </button>
                                                        {cmt.likes_count > 0 && (
                                                            <button 
                                                                onClick={() => fetchCommentLikers(cmt.id)}
                                                                className="text-rose-500/70 hover:underline flex items-center gap-1"
                                                            >
                                                                <Heart className="w-2.5 h-2.5 fill-current" />
                                                                {cmt.likes_count}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleReplyAction(cmt)}
                                                            className="text-gray-800 dark:text-gray-400 hover:text-neon-green transition-all"
                                                        >
                                                            {t('blog.post.reply')}
                                                        </button>
                                                        <span className="text-[10px] font-bold text-gray-800/60 dark:text-gray-400/60 lowercase font-sans">
                                                            {formatDistanceToNow(new Date(cmt.created_at), { addSuffix: true, locale: i18n.language === 'en' ? enUS : vi })}
                                                        </span>
                                                    </div>

                                                    {/* Replies List */}
                                                    <div className="mt-1 space-y-1.5">
                                                        {comments.filter(r => r.parent_id === cmt.id).map(reply => (
                                                            <div key={reply.id} className="flex gap-2 group/reply animate-in fade-in slide-in-from-left-1 duration-200">
                                                                <CornerDownRight className="w-3.5 h-3.5 text-gray-300 dark:text-white/10 shrink-0 mt-2.5" />
                                                                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 shrink-0 shadow-sm">
                                                                    <img 
                                                                        src={reply.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user?.full_name}`} 
                                                                        className="w-full h-full object-cover" 
                                                                        alt="avatar"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 space-y-0.5 min-w-0">
                                                                    <div className="relative inline-block max-w-full">
                                                                        <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-xl p-1.5 md:py-2 border border-gray-100 dark:border-white/5 transition-all group-hover/reply:border-neon-green/20">
                                                                            
                                                                            {editingCommentId === reply.id ? (
                                                                                <div className="space-y-2 min-w-[180px] py-1">
                                                                                    <textarea 
                                                                                        value={editText}
                                                                                        onChange={(e) => setEditText(e.target.value)}
                                                                                        className="w-full bg-gray-50 dark:bg-black/20 border border-neon-green/30 rounded-xl p-2 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-neon-green resize-none"
                                                                                        rows={2}
                                                                                    />
                                                                                    <div className="flex justify-end gap-2">
                                                                                        <button onClick={() => setEditingCommentId(null)} className="px-2 py-1 text-[9px] font-black text-gray-800 dark:text-gray-400 uppercase">{t('blog.post.cancel')}</button>
                                                                                        <button onClick={() => handleUpdateComment(reply.id)} className="px-3 py-1 bg-neon-green text-black text-[9px] font-black rounded-lg uppercase">{t('blog.post.save')}</button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-[11px] md:text-[12px] font-medium text-gray-900 dark:text-gray-400 whitespace-pre-wrap leading-tight">
                                                                                    {reply.content.split(' ').map((word, i) => 
                                                                                        word.startsWith('@') ? <span key={i} className="text-neon-green font-black mr-1">{word} </span> : word + ' '
                                                                                    )}
                                                                                </p>
                                                                            )}
                                                                            
                                                                            {reply.image_url && !editingCommentId && (
                                                                                <div className="mt-1.5 rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden max-w-[180px]">
                                                                                    <img src={reply.image_url} className="w-full h-auto cursor-pointer" alt="" onClick={() => window.open(reply.image_url, '_blank')} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {currentUser?.id === reply.user_id && !editingCommentId && (
                                                                            <div className="absolute -right-8 top-1 opacity-0 group-hover/reply:opacity-100 transition-all flex flex-col gap-1">
                                                                                <button onClick={() => { setEditingCommentId(reply.id); setEditText(reply.content); }} className="p-1.5 text-gray-400 hover:text-neon-green hover:bg-neon-green/5 rounded-full"><Edit2 className="w-3 h-3" /></button>
                                                                                <button onClick={() => handleDeleteComment(reply.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-full"><Trash2 className="w-3 h-3" /></button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-4 px-2 text-[10px] font-black uppercase tracking-tight">
                                                                        <button 
                                                                            onClick={() => handleToggleCommentLike(reply.id)}
                                                                            className={`transition-all ${reply.is_liked ? 'text-rose-500' : 'text-gray-800 dark:text-gray-400 hover:text-rose-500'}`}
                                                                        >
                                                                            {reply.is_liked ? t('blog.post.liked') : t('blog.post.like')}
                                                                        </button>
                                                                        {reply.likes_count > 0 && (
                                                                            <button 
                                                                                onClick={() => fetchCommentLikers(reply.id)}
                                                                                className="text-rose-500/70 hover:underline flex items-center gap-1"
                                                                            >
                                                                                <Heart className="w-2.5 h-2.5 fill-current" />
                                                                                {reply.likes_count}
                                                                            </button>
                                                                        )}
                                                                        <button 
                                                                            onClick={() => handleReplyAction(cmt)}
                                                                            className="text-gray-800 dark:text-gray-400 hover:text-neon-green transition-all"
                                                                        >
                                                                            {t('blog.post.reply')}
                                                                        </button>
                                                                        <span className="text-[9px] font-bold text-gray-800/60 dark:text-gray-400/60 lowercase">
                                                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: i18n.language === 'en' ? enUS : vi })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Inline Reply Input (Pill Style) */}
                                                    <AnimatePresence>
                                                        {replyTo?.id === cmt.id && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, y: 5 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 5 }}
                                                                className="mt-2 ml-8"
                                                            >
                                                                {replyImage && (
                                                                    <div className="mb-2 pl-9 animate-in slide-in-from-bottom-2 duration-300">
                                                                        <div className="relative inline-block group/img">
                                                                            <img src={replyImage} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-neon-green/30 shadow-lg" alt="" />
                                                                            <button onClick={() => setReplyImage(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border border-white dark:border-black hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 shrink-0 shadow-sm">
                                                                        <img src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.full_name}`} className="w-full h-full object-cover" alt="" />
                                                                    </div>
                                                                    <div className="flex-1 relative flex items-center bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/5 rounded-full px-4 py-1.5 focus-within:border-neon-green/30 focus-within:ring-1 focus-within:ring-neon-green/10 transition-all shadow-sm">
                                                                        <textarea 
                                                                           autoFocus
                                                                           value={replyText}
                                                                           onChange={(e) => setReplyText(e.target.value)}
                                                                           rows={1}
                                                                           className="flex-1 bg-transparent border-none text-[12px] font-medium focus:ring-0 outline-none resize-none py-0 placeholder:text-gray-400"
                                                                           placeholder={`${t('blog.post.replying_to')}...`}
                                                                           onKeyDown={(e) => {
                                                                               if (e.key === 'Enter' && !e.shiftKey) {
                                                                                   e.preventDefault();
                                                                                   handleComment(e, cmt.id, replyText, replyImage);
                                                                               }
                                                                           }}
                                                                        />
                                                                        <div className="flex items-center gap-2 ml-2 border-l border-gray-200 dark:border-white/10 pl-3">
                                                                            <label className="text-gray-400 hover:text-neon-green cursor-pointer transition-colors">
                                                                                {isUploadingReplyImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                                                                <input type="file" hidden accept="image/*" onChange={handleReplyImageUpload} />
                                                                            </label>
                                                                            <button 
                                                                                onClick={(e) => handleComment(e, cmt.id, replyText, replyImage)}
                                                                                disabled={submittingComment || (!replyText.trim() && !replyImage)}
                                                                                className="text-neon-green hover:scale-125 active:scale-95 transition-all disabled:opacity-50"
                                                                            >
                                                                                <Send className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-16 opacity-30">
                                        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4 stroke-[1.5]" />
                                        <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('blog.post.no_comments_yet') || 'Chưa có thảo luận'}</p>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Main Input Area */}
                            <div className="sticky bottom-0 left-0 right-0 z-30 -mx-4 md:-mx-4 px-4 pt-4 pb-2 bg-gradient-to-t from-white dark:from-[#111114] via-white/95 dark:via-[#111114]/95 to-transparent backdrop-blur-sm pointer-events-none">
                                <div className="max-w-4xl mx-auto pointer-events-auto">
                                    <div className="relative group flex flex-col gap-2">
                                        {/* Image Preview above Main Pill */}
                                        {commentImage && (
                                            <div className="mb-2 pl-12 animate-in zoom-in duration-300">
                                                <div className="relative inline-block group/preview">
                                                    <img src={commentImage} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-neon-green shadow-2xl" alt="" />
                                                    <button onClick={() => setCommentImage(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-black hover:scale-110 transition-transform"><X className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 md:gap-3">
                                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 shrink-0 shadow-sm">
                                                <img src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.full_name || ' Felix'}`} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            
                                            <div className="flex-1 relative flex items-center bg-gray-50/90 dark:bg-white/[0.05] border border-gray-100 dark:border-white/5 rounded-full px-4 py-2 md:py-2.5 transition-all focus-within:border-neon-green/30 focus-within:ring-1 focus-within:ring-neon-green/10 shadow-lg group-hover:bg-gray-100 dark:group-hover:bg-white/[0.08]">
                                                <textarea 
                                                    id="comment-textarea"
                                                    disabled={!isAuthenticated || submittingComment}
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    rows={1}
                                                    placeholder={isAuthenticated ? t('blog.quick_post.placeholder_comment') : t('blog.quick_post.login_required_comment')}
                                                    className="flex-1 bg-transparent border-none text-[13px] md:text-[14px] font-medium focus:ring-0 outline-none resize-none py-0 placeholder:text-gray-400 group-hover:placeholder:text-gray-500 transition-colors"
                                                />
                                                
                                                <div className="flex items-center gap-2 ml-2 border-l border-gray-200 dark:border-white/10 pl-3">
                                                    <label className="text-gray-400 hover:text-neon-green cursor-pointer transition-colors p-1">
                                                        <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                                                        <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                                                    </label>
                                                    <button 
                                                        onClick={handleComment} 
                                                        disabled={submittingComment || (!comment.trim() && !commentImage)} 
                                                        className="w-8 h-8 md:w-9 md:h-9 bg-neon-green text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-lg shadow-neon-green/20 disabled:grayscale disabled:opacity-50"
                                                    >
                                                        <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
                        {/* Desktop Notifications Card */}
                        {isAuthenticated && (
                            <div className="bg-white dark:bg-[#111114] rounded-[1.75rem] border border-gray-100 dark:border-white/5 p-6 shadow-sm overflow-hidden relative group/notif-card">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-neon-green/5 blur-2xl group-hover/notif-card:scale-150 transition-transform duration-700"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${unreadCount > 0 ? 'bg-neon-green/20 text-neon-green' : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-gray-400'}`}>
                                            <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                                        </div>
                                        <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                            {t('blog.nav.notifications_title') || 'Thông báo mới'}
                                        </span>
                                    </div>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-lg shadow-lg shadow-red-500/20">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setIsNotifModalOpen(true)}
                                    className="w-full py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-neon-green hover:text-black border border-gray-100 dark:border-white/10 rounded-xl text-[10px] font-black text-gray-500 uppercase transition-all duration-300 relative z-10"
                                >
                                    {t('blog.nav.view_all_notifs') || 'Xem tất cả'}
                                </button>
                            </div>
                        )}

                        <div className="bg-white dark:bg-[#111114] rounded-[1.75rem] border border-gray-100 dark:border-white/5 p-6 shadow-sm sticky top-24 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 blur-[50px] -z-10"></div>
                            
                            <div className="relative mb-6 pb-4 border-b border-gray-50 dark:border-white/5">
                                <h4 className="text-[11px] font-black text-neon-green uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    {t('blog.nav.trending_title') || 'Sự kiện thảo luận sôi nổi'}
                                </h4>
                                <Sparkles className="absolute top-0 right-0 w-3.5 h-3.5 text-neon-green opacity-20" />
                            </div>
                            
                            <div className="space-y-4">
                                {trendingLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3 animate-pulse">
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
                                                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : trendingEvents.length > 0 ? (
                                    trendingEvents.map((ev, index) => (
                                        <Link 
                                            key={ev.id} 
                                            to={`/events/${ev.id}`}
                                            className="flex items-center gap-3 group/trend"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 group-hover/trend:border-neon-green/30 transition-colors">
                                                    <img src={ev.image_url} className="w-full h-full object-cover group-hover/trend:scale-110 transition-transform duration-500" alt="" />
                                                </div>
                                                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-gray-900 text-white text-[9px] font-black flex items-center justify-center rounded-lg border border-white/20 shadow-lg group-hover/trend:bg-neon-green group-hover/trend:text-black transition-colors">
                                                    {index + 1}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="text-[12px] font-black text-gray-900 dark:text-white truncate group-hover/trend:text-neon-green transition-colors">
                                                    {ev.title}
                                                </h5>
                                                <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                                    <MessageSquare className="w-2.5 h-2.5 text-neon-green" />
                                                    <span className="text-[9px] font-bold uppercase tracking-tight text-gray-400">
                                                        {ev.total_discussion} {t('blog.post.comments_count') || 'thảo luận'}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-gray-800 dark:text-gray-500 italic font-medium">{t('blog.nav.no_trending') || 'Không có sự kiện sôi nổi'}</p>
                                )}
                            </div>

                            <div className="mt-8 p-6 bg-gray-900 rounded-3xl relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-20 h-20 bg-neon-green/20 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                <h4 className="text-[16px] font-black text-white mb-2 relative z-10 leading-tight">
                                    {t('blog.nav.nft_beta_title') || 'NFT Ticketing Beta'}
                                </h4>
                                <p className="text-[11px] text-gray-400 mb-6 relative z-10 leading-relaxed">
                                    {t('blog.nav.nft_beta_desc') || 'Tham gia trải nghiệm công nghệ vé hiện đại nhất.'}
                                </p>
                                <Link 
                                    to="/marketplace" 
                                    className="relative z-10 w-full inline-flex items-center justify-center p-3 bg-neon-green text-black font-black uppercase text-[10px] rounded-xl hover:bg-neon-hover transition-all"
                                >
                                    {t('common.explore_now') || 'Khám phá ngay'} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Link>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                                <p className="text-[9px] font-black text-gray-800 dark:text-gray-400 uppercase mb-4 text-center">{t('blog.post.share_now') || 'Chia sẻ bài viết'}</p>
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success(t('blog.post.link_copied') || 'Đã sao chép liên kết');
                                        }}
                                        className="w-full py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl text-[9px] font-black text-gray-500 uppercase hover:text-neon-green transition-all shadow-sm"
                                    >
                                        Copy URL
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Likers Modal */}
            <AnimatePresence>
                {likersModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setLikersModal({ ...likersModal, show: false })}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-[#111114] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10"
                        >
                            <div className="p-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                                <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">{likersModal.title}</h3>
                                <button onClick={() => setLikersModal({ ...likersModal, show: false })} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto p-2">
                                {likersModal.isLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-neon-green" />
                                    </div>
                                ) : likersModal.list.length > 0 ? (
                                    likersModal.list.map(u => (
                                        <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all cursor-pointer">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-white/10">
                                                <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">{u.full_name}</h4>
                                                <p className="text-[10px] text-gray-700 dark:text-gray-400 font-bold">{t('blog.post.community_member') || 'Thành viên cộng đồng'}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-[12px] font-medium uppercase tracking-widest">{t('blog.post.no_likers') || 'Chưa có ai thích cả.'}</div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Notifications Modal */}
            <NotificationsModal 
                isOpen={isNotifModalOpen} 
                onClose={() => setIsNotifModalOpen(false)} 
            />
        </div>
    );
};

export default BlogDetail;
