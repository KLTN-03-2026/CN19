import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  ArrowLeft, 
  MessageSquare, 
  Heart, 
  Share2, 
  Clock, 
  Bookmark,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Ticket,
  Send,
  Loader2
} from 'lucide-react';
import blogService from '../../services/blog.service';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const BlogDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuthStore();
    
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        fetchBlogDetail();
        window.scrollTo(0, 0);
    }, [slug]);

    const fetchBlogDetail = async () => {
        try {
            setLoading(true);
            const res = await blogService.getBlogBySlug(slug);
            if (res.success) {
                setBlog(res.data);
                setIsLiked(res.data.is_liked);
                setLikeCount(res.data._count?.likes || 0);
            }
        } catch (error) {
            console.error('Fetch Blog Error:', error);
            toast.error('Không tìm thấy bài viết');
            navigate('/blog');
        } finally {
            setLoading(true);
            // Thêm độ trễ để hiệu ứng mượt hơn
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) return toast.error('Vui lòng đăng nhập để thích bài viết!');
        try {
            const res = await blogService.toggleLike(blog.id);
            if (res.liked) {
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
                toast.success('Đã thích bài viết!');
            } else {
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            }
        } catch (error) {
            toast.error('Lỗi khi thực hiện tương tác');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return toast.error('Vui lòng đăng nhập để bình luận!');
        if (!comment.trim()) return;

        try {
            setSubmittingComment(true);
            const res = await blogService.addComment(blog.id, comment);
            toast.success('Đã gửi bình luận!');
            setComment('');
            // Update local UI
            setBlog(prev => ({
                ...prev,
                comments: [res.data, ...prev.comments]
            }));
        } catch (error) {
            toast.error('Lỗi khi gửi bình luận');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0c]">
                <div className="w-16 h-16 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-black uppercase tracking-widest text-sm">Đang mở trang nội dung...</p>
            </div>
        );
    }

    if (!blog) return null;

    return (
        <div className="min-h-screen bg-transparent pt-32 pb-20 px-4 md:px-8 selection:bg-neon-green/30 transition-colors duration-500">
            <div className="max-w-4xl mx-auto">
                
                {/* 🌟 1. BACK BUTTON & CATEGORY */}
                <div className="mb-10 flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/blog')}
                        className="flex items-center gap-3 text-gray-500 dark:text-gray-400 hover:text-neon-green transition-all font-black uppercase text-xs tracking-widest group"
                    >
                        <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center group-hover:border-neon-green group-hover:bg-neon-green/10 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Quay lại danh sách
                    </button>
                    <div className="px-4 py-1.5 bg-neon-green/10 text-neon-green rounded-full text-[10px] font-black uppercase tracking-widest border border-neon-green/20">
                        {blog.type === 'SYSTEM_NEWS' ? 'Tin hệ thống' : blog.type === 'ORGANIZER_NEWS' ? 'Thông báo BTC' : 'Cảm nhận k.hàng'}
                    </div>
                </div>

                {/* 🌟 2. ARTICLE HEADER */}
                <div className="space-y-6 mb-12">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-[1.1]"
                    >
                        {blog.title}
                    </motion.h1>
                    
                    <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-neon-green overflow-hidden shadow-xl">
                                <img src={blog.author.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed= Felix'} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tác giả</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white uppercase">{blog.author.full_name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Ngày đăng</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {new Date(blog.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Đọc khoảng</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-neon-green" /> 5 phút
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🌟 3. MAIN PREVIEW IMAGE */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-16 relative aspect-[16/9] rounded-[3rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl group"
                >
                    <img 
                        src={blog.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop'} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                        alt="featured" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </motion.div>

                {/* 🌟 4. ARTICLE CONTENT */}
                <div className="flex flex-col lg:flex-row gap-16">
                    <div className="flex-1">
                        <div 
                            className="prose dark:prose-invert max-w-none prose-emerald
                                       prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter 
                                       prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-[1.8] prose-p:text-lg
                                       prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-black
                                       prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:border prose-img:border-gray-200 dark:prose-img:border-white/5
                                       prose-blockquote:border-neon-green prose-blockquote:bg-neon-green/5 prose-blockquote:p-8 prose-blockquote:rounded-[2rem]"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                        />

                        {/* Event Link Card (if related event exists) */}
                        {blog.event && (
                            <div className="mt-16 p-8 bg-gray-900 dark:bg-[#111114] border border-gray-800 dark:border-white/5 rounded-[3rem] relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 p-24 bg-neon-green/10 blur-[80px] group-hover:bg-neon-green/20 transition-all opacity-50"></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-full md:w-48 aspect-square rounded-[2rem] overflow-hidden border-2 border-neon-green/30">
                                        <img src={blog.event.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left space-y-4">
                                        <div className="inline-flex items-center gap-2 text-neon-green text-[10px] font-black uppercase tracking-widest">
                                            <Sparkles className="w-4 h-4" /> Sự kiện liên quan
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-neon-green transition-colors">
                                            {blog.event.title}
                                        </h3>
                                        <Link 
                                            to={`/event/${blog.event.id}`}
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-neon-green text-black font-black uppercase text-xs rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neon-green/20"
                                        >
                                            Đặt vé ngay <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 🌟 5. ARTICLE ACTIONS */}
                        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleLike}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-black uppercase text-xs uppercase tracking-widest transition-all ${
                                        isLiked 
                                        ? 'bg-pink-500 text-white shadow-xl shadow-pink-500/30' 
                                        : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-pink-500 hover:border-pink-500'
                                    }`}
                                >
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                    Yêu thích ({likeCount})
                                </button>
                                <button className="w-12 h-12 flex items-center justify-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-neon-green hover:border-neon-green rounded-full transition-all">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                <TrendingUp className="w-4 h-4 text-neon-green" />
                                {blog.views || 0} lượt xem truyền cảm hứng
                            </div>
                        </div>

                        {/* 🌟 6. COMMENTS SECTION */}
                        <div className="mt-20 space-y-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                                    <MessageSquare className="w-6 h-6 text-neon-green" /> 
                                    Bình luận ({blog.comments?.length || 0})
                                </h3>
                            </div>

                            {/* Comment Form */}
                            <form onSubmit={handleComment} className="relative">
                                {isAuthenticated ? (
                                    <>
                                        <textarea 
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                                            className="w-full h-32 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-6 text-sm font-medium focus:border-neon-green outline-none transition-all resize-none shadow-sm dark:shadow-none"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={submittingComment || !comment.trim()}
                                            className="absolute bottom-4 right-4 px-6 py-2.5 bg-neon-green text-black font-black uppercase text-[10px] rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neon-green/20 disabled:opacity-50"
                                        >
                                            {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            Gửi bình luận
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] text-center bg-gray-50 dark:bg-white/5">
                                        <p className="text-gray-500 font-bold mb-4">Vui lòng đăng nhập để tham gia thảo luận</p>
                                        <Link to="/login" className="px-8 py-3 bg-neon-green text-black font-black uppercase text-xs rounded-full">Đăng nhập ngay</Link>
                                    </div>
                                )}
                            </form>

                            {/* Comment List */}
                            <div className="space-y-8 mt-12">
                                {blog.comments && blog.comments.length > 0 ? (
                                    blog.comments.map((cmt, idx) => (
                                        <motion.div 
                                            key={cmt.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex gap-4"
                                        >
                                            <div className="w-12 h-12 rounded-full border border-neon-green/30 overflow-hidden shrink-0">
                                                <img src={cmt.user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg'} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="flex-1 bg-gray-50 dark:bg-white/5 p-6 rounded-3xl rounded-tl-none border border-gray-100 dark:border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider">{cmt.user.full_name}</h4>
                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                        {new Date(cmt.created_at).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                                                    {cmt.content}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-400 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 🌟 7. SIDEBAR (Related Articles / Stats) */}
                    <aside className="w-full lg:w-[320px] shrink-0 space-y-12">
                        {/* Summary Stats */}
                        <div className="p-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2.5rem]">
                            <h4 className="text-xs font-black text-neon-green uppercase mb-6 tracking-widest flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Thống kê bài viết
                            </h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                                    <span className="text-sm font-bold text-gray-400">Yêu thích</span>
                                    <span className="text-lg font-black text-pink-500">{likeCount}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                                    <span className="text-sm font-bold text-gray-400">Lượt xem</span>
                                    <span className="text-lg font-black text-neon-green">{blog.views || 0}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                                    <span className="text-sm font-bold text-gray-400">Trạng thái</span>
                                    <span className="text-[10px] font-black text-blue-500 uppercase px-3 py-1 bg-blue-500/10 rounded-full">Đã xác minh</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick CTA */}
                        <div className="p-10 bg-neon-green rounded-[3rem] relative overflow-hidden group">
                           <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-125 transition-all"></div>
                           <h4 className="text-2xl font-black text-black uppercase tracking-tighter leading-none mb-4 relative z-10">Bắt đầu sưu tập vé NFT của bạn!</h4>
                           <p className="text-black/70 text-sm font-bold mb-8 relative z-10">Tham gia cộng đồng Web3 âm nhạc lớn nhất ngay hôm nay.</p>
                           <Link to="/events" className="relative z-10 w-full inline-flex items-center justify-center px-8 py-4 bg-black text-white font-black uppercase text-[10px] rounded-2xl hover:scale-105 transition-all">
                                Xem sự kiện <ArrowRight className="w-4 h-4 ml-2" />
                           </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default BlogDetail;
