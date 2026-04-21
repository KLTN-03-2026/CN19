import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  ArrowLeft, 
  MessageSquare, 
  Heart, 
  Share2, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Sparkles,
  Send,
  Loader2,
  ArrowRight
} from 'lucide-react';
import blogService from '../../../services/blog.service';
import { useAuthStore } from '../../../store/useAuthStore';
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
            // navigate('/blog');
            // For demo if API fails
            setBlog({
                id: 1,
                title: "Tương lai của Vé Sự kiện: Tại sao NFT là chìa khóa cho sự minh bạch?",
                content: `<p>Blockchain đang thay đổi hoàn toàn cách chúng ta định nghĩa về sở hữu số. Trong lĩnh vực sự kiện, vé NFT không chỉ là một tấm vé vào cửa, mà nó là một tài sản số có thể xác thực nguồn gốc 100%.</p>
                         <h3>Tại sao nên dùng NFT?</h3>
                         <p>Hợp đồng thông minh giúp tự động hóa việc chia sẻ doanh thu và ngăn chặn tuyệt đối các hành vi gian lận từ thị trường chợ đen.</p>
                         <blockquote>"NFT không chỉ là một xu hướng, nó là một chuẩn mực mới cho sự an toàn trong kỷ nguyên số."</blockquote>`,
                type: 'SYSTEM_NEWS',
                created_at: new Date(),
                author: { full_name: "BASTICKET Team", avatar_url: null },
                views: 1250,
                _count: { likes: 45 },
                comments: []
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) return toast.error('Vui lòng đăng nhập để thích bài viết!');
        try {
            const res = await blogService.toggleLike(blog.id);
            if (res.liked) {
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            } else {
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            }
        } catch (error) {
            toast.error('Lỗi tương tác');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return toast.error('Vui lòng đăng nhập để bình luận!');
        if (!comment.trim()) return;
        setSubmittingComment(true);
        setTimeout(() => {
            toast.success('Bình luận đã được gửi!');
            setComment('');
            setSubmittingComment(false);
        }, 1000);
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
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500 font-sans selection:bg-neon-green/30 px-4 sm:px-6">
            
            {/* 🧭 NAVIGATION BREADCRUMBS */}
            <nav className="max-w-[1400px] mx-auto pt-10 pb-6 border-b border-gray-50 dark:border-white/5 mb-10 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/blog')}
                    className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-neon-green transition-all text-xs font-black uppercase tracking-widest group"
                >
                    <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                    Quay lại Blog
                </button>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-neon-green/10 text-neon-green rounded-lg text-[9px] font-black uppercase tracking-widest border border-neon-green/20">
                        {blog.type === 'SYSTEM_NEWS' ? 'Hệ thống' : 'Thông báo'}
                    </div>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto pb-24">
                <div className="flex flex-col lg:flex-row gap-12">
                    
                    {/* 📜 MAIN ARTICLE AREA (Flexible-1) */}
                    <div className="flex-1 max-w-4xl mx-auto lg:mx-0">
                        
                        {/* Article Header */}
                        <header className="mb-12 space-y-6">
                            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.2] tracking-tight">
                                {blog.title}
                            </h1>
                            
                            <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-gray-50 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tác giả</p>
                                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{blog.author.full_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Xuất bản</p>
                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                            {new Date(blog.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                        <Clock className="w-3.5 h-3.5 text-neon-green" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase">5 phút đọc</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Featured Image */}
                        <div className="mb-12 aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5">
                            <img 
                                src={blog.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600&auto=format&fit=crop'} 
                                className="w-full h-full object-cover" 
                                alt={blog.title} 
                            />
                        </div>

                        {/* Article Prose (High Readability) */}
                        <article className="prose dark:prose-invert max-w-none 
                                         prose-p:text-sm sm:prose-p:text-base prose-p:leading-[1.8] prose-p:font-medium prose-p:text-gray-600 dark:prose-p:text-gray-400
                                         prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                                         prose-img:rounded-3xl prose-img:shadow-xl
                                         prose-blockquote:border-neon-green prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/5 prose-blockquote:rounded-2xl prose-blockquote:p-8 prose-blockquote:font-black prose-blockquote:text-lg prose-blockquote:italic prose-blockquote:text-gray-900 dark:prose-blockquote:text-white">
                            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                        </article>

                        {/* Actions */}
                        <div className="mt-16 pt-8 border-t border-gray-50 dark:border-white/5 flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleLike}
                                    className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${
                                        isLiked 
                                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
                                        : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-500 hover:text-pink-500'
                                    }`}
                                >
                                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                    Yêu thích ({likeCount})
                                </button>
                                <button className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 hover:text-neon-green transition-all">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <TrendingUp className="w-4 h-4 text-neon-green" />
                                {blog.views || 0} lượt đọc
                            </div>
                        </div>

                        {/* Comments Section */}
                        <section className="mt-20 space-y-8">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-neon-green" /> Bình luận
                            </h3>
                            <form onSubmit={handleComment} className="relative">
                                <textarea 
                                    disabled={!isAuthenticated}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={isAuthenticated ? "Chia sẻ cảm nghĩ của bạn..." : "Vui lòng đăng nhập để bình luận"}
                                    className="w-full h-32 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-6 text-sm font-medium focus:border-neon-green outline-none transition-all resize-none shadow-inner"
                                />
                                {isAuthenticated && (
                                    <button 
                                        type="submit"
                                        disabled={submittingComment || !comment.trim()}
                                        className="absolute bottom-4 right-4 px-6 py-2.5 bg-neon-green text-black font-black uppercase text-[10px] rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neon-green/20 disabled:opacity-50"
                                    >
                                        {submittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                        Gửi phản hồi
                                    </button>
                                )}
                            </form>
                        </section>
                    </div>

                    {/* 🌟 SIDEBAR (Strict 350px Width) */}
                    <aside className="w-full lg:w-[350px] shrink-0 space-y-6">
                        
                        {/* Stats Card */}
                        <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm sticky top-24">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 dark:border-white/5 pb-4">
                                Thông tin bổ sung
                            </h4>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">Trạng thái</span>
                                    <span className="text-[10px] font-black text-neon-green uppercase px-3 py-1 bg-neon-green/10 rounded-full border border-neon-green/20">Chính thức</span>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase">Bản quyền</span>
                                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">BASTICKET 2026</span>
                                </div>
                            </div>

                            {/* Promotional Card */}
                            <div className="mt-8 p-8 bg-gray-900 rounded-[2rem] relative overflow-hidden group">
                                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-neon-green opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                                <h4 className="text-xl font-black text-white uppercase tracking-tight mb-4 relative z-10 leading-tight">Gia nhận cộng đồng Web3 âm nhạc</h4>
                                <p className="text-xs text-gray-400 font-medium mb-8 relative z-10 leading-relaxed">Khám phá và sở hữu những tấm vé NFT độc bản ngay hôm nay.</p>
                                <Link 
                                    to="/marketplace" 
                                    className="relative z-10 w-full inline-flex items-center justify-center p-4 bg-neon-green text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:scale-105 transition-transform"
                                >
                                    Khám phá ngay <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* Share Article Floating (Desktop Only) */}
                        <div className="hidden lg:block p-6 bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Chia sẻ cảm hứng</p>
                            <div className="flex justify-center gap-3">
                                {[1, 2, 3].map(i => (
                                    <button key={i} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-400 hover:text-neon-green transition-all">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default BlogDetail;
