import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    MessageSquare, 
    Heart, 
    Send, 
    Star, 
    PlusCircle, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    Loader2,
    Share2,
    Image as ImageIcon,
    X
} from 'lucide-react';
import blogService from '../../services/blog.service';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const EventReviews = ({ eventId, eventEndTime }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { user, isAuthenticated } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newReview, setNewReview] = useState({ title: '', content: '', image_url: '' });
    const [submitting, setSubmitting] = useState(false);
    const [activeCommentBlog, setActiveCommentBlog] = useState(null);
    const [commentText, setCommentText] = useState('');

    const isEventEnded = new Date() > new Date(eventEndTime);

    // 1. Lấy danh sách reviews
    const { data: reviews = [], isLoading } = useQuery({
        queryKey: ['event-reviews', eventId],
        queryFn: () => blogService.getEventReviews(eventId),
        select: (res) => res.data
    });

    // 2. Mutation: Tạo Review
    const createReviewMutation = useMutation({
        mutationFn: blogService.createReview,
        onSuccess: () => {
            queryClient.invalidateQueries(['event-reviews', eventId]);
            toast.success('Cảm ơn bạn đã chia sẻ cảm nhận!');
            setIsModalOpen(false);
            setNewReview({ title: '', content: '', image_url: '' });
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Lỗi khi đăng bài.');
        }
    });

    // 3. Mutation: Like
    const toggleLikeMutation = useMutation({
        mutationFn: blogService.toggleLike,
        onSuccess: () => {
            queryClient.invalidateQueries(['event-reviews', eventId]);
        }
    });

    // 4. Mutation: Comment
    const addCommentMutation = useMutation({
        mutationFn: ({ blogId, content }) => blogService.addComment(blogId, content),
        onSuccess: () => {
            queryClient.invalidateQueries(['event-reviews', eventId]);
            setCommentText('');
            toast.success('Đã nhận bình luận của bạn!');
        }
    });

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!newReview.title || !newReview.content) return toast.error('Vui lòng điền đủ tiêu đề và nội dung.');
        createReviewMutation.mutate({ ...newReview, event_id: eventId });
    };

    const handleLike = (blogId) => {
        if (!isAuthenticated) return toast.error('Vui lòng đăng nhập để tương tác.');
        toggleLikeMutation.mutate(blogId);
    };

    const handleComment = (blogId) => {
        if (!isAuthenticated) return toast.error('Vui lòng đăng nhập để bình luận.');
        if (!commentText.trim()) return;
        addCommentMutation.mutate({ blogId, content: commentText });
    };

    return (
        <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header reviews */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-neon-green rounded-full shadow-[0_0_15px_rgba(82,196,45,0.6)]"></div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                        Cảm nhận cộng đồng ({reviews.length})
                    </h3>
                </div>
                
                {isEventEnded && isAuthenticated && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-neon-green text-gray-900 dark:text-white rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-xl group"
                    >
                        <PlusCircle className="w-4 h-4 text-neon-green group-hover:rotate-90 transition-transform" />
                        Viết cảm nhận của bạn
                    </button>
                )}
            </div>

            {/* Thông báo nếu chưa kết thúc */}
            {!isEventEnded && (
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-4 transition-all">
                    <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-blue-700 dark:text-blue-400 font-bold uppercase tracking-widest text-[10px] mb-1">Coming Soon</p>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            Bạn có thể chia sẻ cảm nhận và hình ảnh thực tế ngay sau khi sự kiện này kết thúc. Hãy đón chờ nhé!
                        </p>
                    </div>
                </div>
            )}

            {/* Danh sách review */}
            {isLoading ? (
                <div className="flex flex-col items-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Đang tải cảm nhận...</p>
                </div>
            ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reviews.map((rev) => (
                        <div key={rev.id} className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6 lg:p-8 hover:shadow-2xl hover:shadow-neon-green/5 transition-all duration-500 group relative flex flex-col h-full">
                            {/* Author header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full border-2 border-neon-green/30 overflow-hidden shrink-0 group-hover:scale-110 transition-transform shadow-xl">
                                    <img src={rev.author?.avatar_url || `https://ui-avatars.com/api/?name=${rev.author?.full_name}&background=111&color=fff`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight truncate">{rev.author?.full_name}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                                        <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                        Đã tham gia sự kiện
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-500 font-bold">
                                    {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                                </div>
                            </div>

                            {/* Content body */}
                            <div className="flex-1 space-y-4 mb-6">
                                {rev.image_url && (
                                    <div className="w-full aspect-video rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 mb-4">
                                        <img src={rev.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                )}
                                <h4 className="font-black text-gray-900 dark:text-white text-base lg:text-lg uppercase leading-tight group-hover:text-neon-green transition-colors">{rev.title}</h4>
                                <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-medium line-clamp-4 italic" dangerouslySetInnerHTML={{ __html: rev.content }} />
                            </div>

                            {/* Actions Interaction */}
                            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <button 
                                        onClick={() => handleLike(rev.id)}
                                        className="flex items-center gap-2 group/btn transition-colors"
                                    >
                                        <div className={`p-2 rounded-xl transition-all ${rev.is_liked ? 'bg-red-500/10 text-red-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover/btn:text-red-500'}`}>
                                            <Heart className={`w-4 h-4 ${rev.is_liked ? 'fill-current' : ''}`} />
                                        </div>
                                        <span className="text-xs font-black text-gray-500 dark:text-gray-400">{rev._count?.likes || 0}</span>
                                    </button>

                                    <button 
                                        onClick={() => setActiveCommentBlog(activeCommentBlog === rev.id ? null : rev.id)}
                                        className="flex items-center gap-2 group/btn transition-colors"
                                    >
                                        <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-400 group-hover/btn:text-neon-green transition-all">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-black text-gray-500 dark:text-gray-400">{rev._count?.comments || 0}</span>
                                    </button>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Comment Section (Inline) */}
                            {activeCommentBlog === rev.id && (
                                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-white/5 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="flex gap-3">
                                        <input 
                                            type="text"
                                            placeholder="Bạn nghĩ sao về cảm nhận này?"
                                            className="flex-1 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-neon-green outline-none text-gray-900 dark:text-white font-medium"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleComment(rev.id)}
                                        />
                                        <button 
                                            onClick={() => handleComment(rev.id)}
                                            className="p-2.5 bg-neon-green hover:bg-neon-hover text-black rounded-xl shadow-lg transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-white/5 rounded-[2.5rem] p-20 border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center text-gray-300 dark:text-white/20">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase italic">Chưa có cảm nhận nào</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Hãy là người đầu tiên chia sẻ cảm xúc sau sự kiện này!</p>
                    </div>
                </div>
            )}

            {/* Modal Viết Review */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-white dark:bg-[#111114] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
                                <Star className="w-6 h-6 text-neon-green" /> Chia sẻ cảm nhận
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 bg-gray-100 dark:bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-gray-200 dark:border-white/10"
                            >
                                <X className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReview} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Tiêu đề bài viết</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Điểm nhấn lớn nhất là gì?"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green outline-none text-gray-900 dark:text-white font-black uppercase text-sm tracking-tight transition-all"
                                    value={newReview.title}
                                    onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nội dung chi tiết</label>
                                <textarea 
                                    required
                                    rows="5"
                                    placeholder="Âm thanh, ánh sáng, không khí... Mọi thứ diễn ra như thế nào?"
                                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-3xl px-5 py-4 focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green outline-none text-gray-900 dark:text-white font-medium text-sm leading-relaxed transition-all resize-none"
                                    value={newReview.content}
                                    onChange={(e) => setNewReview({...newReview, content: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Link hình ảnh (Nếu có)</label>
                                <div className="relative group">
                                    <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon-green transition-colors" />
                                    <input 
                                        type="url"
                                        placeholder="Để lại một tấm ảnh đẹp làm kỷ niệm nhé..."
                                        className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-3xl pl-14 pr-5 py-4 focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green outline-none text-gray-900 dark:text-white font-medium text-sm transition-all"
                                        value={newReview.image_url}
                                        onChange={(e) => setNewReview({...newReview, image_url: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={createReviewMutation.isPending}
                                    className="w-full py-5 bg-neon-green hover:bg-neon-hover text-black font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-[0_10px_40px_rgba(82,196,45,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createReviewMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Đang chia sẻ...
                                        </>
                                    ) : (
                                        <>
                                            Đăng bài cảm nhận ngay <Send className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventReviews;
