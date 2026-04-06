import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  MapPin,
  Calendar,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { communityService } from '../../services/community.service';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const PostCard = ({ post, onLike }) => {
    const { isAuthenticated, user } = useAuthStore();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.comments || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [totalComments, setTotalComments] = useState(post._count?.comments || 0);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để bình luận!');
            return;
        }
        if (!commentText.trim()) return;

        try {
            setIsSubmitting(true);
            const res = await communityService.addComment(post.id, commentText);
            if (res.success) {
                setComments(prev => [res.data, ...prev]);
                setCommentText('');
                setTotalComments(prev => prev + 1);
                toast.success('Đã đăng bình luận!');
            }
        } catch (error) {
            toast.error('Lỗi khi đăng bình luận.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#111114] rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-2xl"
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neon-green/20">
                        <img 
                            src={post.author?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.full_name}`} 
                            className="w-full h-full object-cover" 
                            alt="avatar"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {post.author?.full_name}
                            </h4>
                            {post.author?.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}
                        </p>
                    </div>
                </div>
                <button className="w-10 h-10 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 transition-all">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-4 space-y-4">
                {post.event && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-green/10 border border-neon-green/20 rounded-full">
                        <Calendar className="w-3 h-3 text-neon-green" />
                        <span className="text-[9px] font-black text-neon-green uppercase tracking-widest">
                            @{post.event.title}
                        </span>
                    </div>
                )}
                
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </p>
            </div>

            {/* Images Gallery */}
            {(post.images?.length > 0 || post.image_url) && (
                <div className={`grid gap-1 px-6 pb-4 ${post.images?.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {(post.images?.length > 0 ? post.images : [post.image_url]).map((img, idx) => (
                        <div 
                            key={idx} 
                            className={`rounded-2xl overflow-hidden cursor-pointer ${post.images?.length === 3 && idx === 0 ? 'row-span-2 h-full' : 'h-64'}`}
                        >
                            <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="post content" />
                        </div>
                    ))}
                </div>
            )}

            {/* Interaction Bar */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onLike}
                        className={`flex items-center gap-2 group transition-all ${post.is_liked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}
                    >
                        <div className={`p-2 rounded-full transition-all ${post.is_liked ? 'bg-rose-500/10' : 'group-hover:bg-rose-500/10'}`}>
                            <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                        </div>
                        <span className="text-xs font-black tracking-widest">{post._count?.likes || 0}</span>
                    </button>

                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 group text-gray-500 hover:text-neon-green transition-all"
                    >
                        <div className="p-2 rounded-full group-hover:bg-neon-green/10 transition-all">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black tracking-widest">{totalComments}</span>
                    </button>
                </div>

                <button className="p-2 rounded-full text-gray-500 hover:bg-blue-500/10 hover:text-blue-500 transition-all">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
                {showComments && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-50 dark:border-white/5 overflow-hidden"
                    >
                        <div className="p-6 space-y-6">
                            {/* Comment Input */}
                            <form onSubmit={handleAddComment} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                    <img 
                                        src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed= Felix'} 
                                        className="w-full h-full object-cover" 
                                        alt="user"
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <input 
                                        type="text"
                                        placeholder="Viết bình luận..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/10 rounded-full py-2.5 pl-5 pr-12 text-sm font-medium focus:outline-none focus:border-neon-green transition-all"
                                    />
                                    <button 
                                        disabled={isSubmitting}
                                        type="submit"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-neon-green text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </form>

                            {/* Comment List */}
                            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                            <img 
                                                src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.full_name}`} 
                                                className="w-full h-full object-cover" 
                                                alt="avatar"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white dark:bg-white/5 rounded-[1.25rem] px-4 py-2 border border-gray-100 dark:border-white/5">
                                                <div className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">
                                                    {comment.user?.full_name}
                                                </div>
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {comment.content}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 ml-2">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                    {formatDistanceToNow(new Date(comment.created_at), { locale: vi })}
                                                </span>
                                                <button className="text-[9px] font-black text-gray-400 uppercase hover:text-neon-green transition-colors">Thích</button>
                                                <button className="text-[9px] font-black text-gray-400 uppercase hover:text-neon-green transition-colors">Phản hồi</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PostCard;
