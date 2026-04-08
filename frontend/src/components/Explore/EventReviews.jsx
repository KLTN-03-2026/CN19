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
    X,
    MoreHorizontal
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
    const [activeMenuId, setActiveMenuId] = useState(null);
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
        let finalTitle = newReview.title;
        if (!isEventEnded && !finalTitle) {
            finalTitle = "Thảo luận của " + (user?.full_name || 'Thành viên');
        }
        if (!finalTitle || !newReview.content) return toast.error('Vui lòng điền đủ nội dung.');
        createReviewMutation.mutate({ ...newReview, title: finalTitle, event_id: eventId });
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
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-4">
                <div className="w-1.5 h-8 bg-neon-green rounded-full shadow-[0_0_15px_rgba(82,196,45,0.6)]"></div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">
                    {isEventEnded ? 'Cảm nhận cộng đồng' : 'Thảo luận & Giao lưu'} ({reviews.length})
                </h3>
            </div>

            {/* Inline Posting Form (FB Style) */}
            {isAuthenticated ? (
                <div className="flex gap-3 md:gap-4 mb-6">
                    <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'M'}&background=111&color=fff`} className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 shrink-0 object-cover mt-1" />
                    <form onSubmit={handleSubmitReview} className="flex-1 relative">
                        <div className={isEventEnded ? "block mb-2" : "hidden"}>
                            <input 
                                type="text"
                                placeholder="Tiêu đề cảm nhận của bạn..."
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-neon-green outline-none text-gray-900 dark:text-white font-bold transition-all"
                                value={newReview.title}
                                onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                                required={isEventEnded}
                            />
                        </div>
                        <div className="relative bg-gray-50 dark:bg-[#1a1a1d] border border-gray-200 dark:border-white/10 rounded-[1.5rem] overflow-hidden focus-within:border-neon-green transition-colors">
                            <textarea 
                                required
                                rows={isEventEnded ? 2 : 1}
                                placeholder={isEventEnded ? "Viết chi tiết cảm nhận của bạn về sự kiện này..." : "Nhập bình luận, tìm vé, rủ rê đi chung..."}
                                className={`w-full bg-transparent outline-none text-gray-900 dark:text-white text-sm resize-none px-4 pt-3 ${isEventEnded ? 'pb-10' : 'pb-3 pr-12'} ${!isEventEnded && newReview.content.length === 0 ? 'overflow-hidden' : ''}`}
                                value={newReview.content}
                                onChange={(e) => {
                                    if (!isEventEnded) {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }
                                    setNewReview({...newReview, content: e.target.value});
                                }}
                                onKeyPress={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmitReview(e);
                                        if(!isEventEnded && e.target) {
                                            e.target.style.height = 'auto';
                                        }
                                    }
                                }}
                                style={!isEventEnded ? { minHeight: '44px', maxHeight: '120px' } : {}}
                            />
                            
                            {/* Actions / Toolbar */}
                            {isEventEnded ? (
                                <div className="absolute bottom-1 left-2 right-1 flex items-center justify-between bg-gray-50 dark:bg-[#1a1a1d] pt-1">
                                    <div className="relative group/img flex-1 max-w-[200px]">
                                        <ImageIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/img:text-neon-green" />
                                        <input 
                                            type="url"
                                            placeholder="Gắn link ảnh lịch sự..."
                                            className="w-full bg-transparent border-none focus:ring-0 text-[11px] pl-8 pr-2 py-1 outline-none text-gray-700 dark:text-gray-300"
                                            value={newReview.image_url}
                                            onChange={(e) => setNewReview({...newReview, image_url: e.target.value})}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={createReviewMutation.isPending || !newReview.content.trim()}
                                        className="p-2 bg-neon-green hover:bg-neon-hover text-black rounded-full shadow-md transition-all disabled:opacity-50 disabled:bg-gray-300"
                                    >
                                        {createReviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="submit"
                                    disabled={createReviewMutation.isPending || !newReview.content.trim()}
                                    className="absolute right-1.5 bottom-1.5 p-2 bg-neon-green hover:bg-neon-hover text-black rounded-full shadow-md transition-all disabled:opacity-50 disabled:bg-gray-300"
                                >
                                    {createReviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-center border py-6 border-dashed border-gray-200 dark:border-white/10 mb-8">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vui lòng đăng nhập để tham gia thảo luận.</p>
                </div>
            )}

            {/* Danh sách bài viết */}
            {isLoading ? (
                <div className="flex flex-col items-center py-10 gap-4">
                    <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Đang tải...</p>
                </div>
            ) : reviews.length > 0 ? (
                <div className="flex flex-col space-y-6">
                    {reviews.map((rev) => (
                        <div key={rev.id} className="flex gap-3 md:gap-4 group">
                            {/* Avatar */}
                            <div className="w-10 h-10 mt-1 rounded-full border border-gray-200 dark:border-white/10 overflow-hidden shrink-0 shadow-sm">
                                <img src={rev.author?.avatar_url || `https://ui-avatars.com/api/?name=${rev.author?.full_name}&background=111&color=fff`} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Comment Bubble */}
                                <div className="flex items-center gap-2 group/revblock relative">
                                    <div className="bg-gray-50 dark:bg-[#1a1a1d] rounded-[1.5rem] p-3 md:p-4 inline-block min-w-[200px] max-w-[90%] border border-gray-100 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="font-bold text-gray-900 dark:text-white text-[13px] hover:underline cursor-pointer">{rev.author?.full_name}</p>
                                        {rev.has_ticket ? (
                                            <div className="flex items-center text-[10px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                {isEventEnded ? 'Đã tham gia' : 'Có vé'}
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-[10px] text-gray-500 font-bold bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                                {isEventEnded ? 'Quan tâm' : 'Đang hóng hớt'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {rev.title && rev.title.indexOf('Thảo luận của') === -1 && (
                                        <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1">{rev.title}</h4>
                                    )}
                                    <div className="text-gray-800 dark:text-gray-300 text-[14px] leading-relaxed break-words whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: rev.content }} />
                                    
                                    {rev.image_url && (
                                        <div className="w-full max-w-xs md:max-w-md mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                                            <img src={rev.image_url} className="w-full object-cover max-h-60" />
                                        </div>
                                    )}
                                    </div>

                                    {/* 3 Dots Menu */}
                                    {rev.author_id === user?.id && (
                                        <div className="relative">
                                            <button 
                                                onClick={() => setActiveMenuId(activeMenuId === rev.id ? null : rev.id)}
                                                onBlur={() => setTimeout(() => setActiveMenuId(null), 200)}
                                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all xl:opacity-0 xl:group-hover/revblock:opacity-100"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            
                                            {activeMenuId === rev.id && (
                                                <div className="absolute left-full top-0 ml-1 bg-white dark:bg-[#1a1a1d] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg w-36 py-1.5 z-20 animate-in fade-in zoom-in-95">
                                                    <button onClick={() => {toast.info('Chức năng sửa đang phát triển'); setActiveMenuId(null);}} className="w-full text-left px-4 py-2 flex items-center text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                        Chỉnh sửa
                                                    </button>
                                                    <button onClick={() => {toast.info('Chức năng xóa đang phát triển'); setActiveMenuId(null);}} className="w-full text-left px-4 py-2 flex items-center text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                        Xóa bình luận
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* FB-style Interaction actions */}
                                <div className="flex items-center gap-4 mt-1.5 ml-3">
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        {new Date(rev.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                                    </span>
                                    <button 
                                        onClick={() => handleLike(rev.id)}
                                        className={`text-[12px] font-bold transition-colors ${rev.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:underline'}`}
                                    >
                                        Thích {rev._count?.likes > 0 && `(${rev._count.likes})`}
                                    </button>

                                    <button 
                                        onClick={() => setActiveCommentBlog(activeCommentBlog === rev.id ? null : rev.id)}
                                        className="text-[12px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:underline transition-colors"
                                    >
                                        Phản hồi {rev._count?.comments > 0 && `(${rev._count.comments})`}
                                    </button>
                                </div>

                                {/* Nested Comments (Inline) */}
                                {activeCommentBlog === rev.id && (
                                    <div className="mt-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 ml-6 border-l-2 border-gray-100 dark:border-white/5 pl-4">
                                        {rev.comments && rev.comments.map(cmt => (
                                            <div key={cmt.id} className="flex gap-2 group/cmt">
                                                <img src={cmt.user?.avatar_url || `https://ui-avatars.com/api/?name=${cmt.user?.full_name || 'M'}&background=111&color=fff`} className="w-7 h-7 rounded-full mt-1 shrink-0" />
                                                <div className="flex flex-col items-start w-full min-w-0">
                                                    <div className="flex items-center gap-2 group/cmtblock relative">
                                                        <div className="bg-gray-100 dark:bg-white/5 rounded-[1rem] px-3 py-2 text-[13px] inline-block max-w-full border border-transparent dark:border-white/5">
                                                            <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                                                <span className="font-bold text-gray-900 dark:text-white leading-none">{cmt.user?.full_name}</span>
                                                                {cmt.has_ticket ? (
                                                                    <div className="flex items-center text-[9px] text-blue-500 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                                                                        {isEventEnded ? 'Đã tham gia' : 'Có vé'}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center text-[9px] text-gray-500 font-bold bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                                                        {isEventEnded ? 'Quan tâm' : 'Đang hóng hớt'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed inline break-words">{cmt.content}</span>
                                                        </div>
                                                        
                                                        {/* 3 Dots Menu for nested comments */}
                                                        {cmt.user_id === user?.id && (
                                                            <div className="relative">
                                                                <button 
                                                                    onClick={() => setActiveMenuId(activeMenuId === cmt.id ? null : cmt.id)}
                                                                    onBlur={() => setTimeout(() => setActiveMenuId(null), 200)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all xl:opacity-0 xl:group-hover/cmtblock:opacity-100"
                                                                >
                                                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                                                </button>
                                                                
                                                                {activeMenuId === cmt.id && (
                                                                    <div className="absolute left-full top-0 ml-1 bg-white dark:bg-[#1a1a1d] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg w-36 py-1.5 z-20 animate-in fade-in zoom-in-95">
                                                                        <button onClick={() => {toast.info('Chức năng sửa đang phát triển'); setActiveMenuId(null);}} className="w-full text-left px-4 py-2 flex items-center text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                                            Chỉnh sửa
                                                                        </button>
                                                                        <button onClick={() => {toast.info('Chức năng xóa đang phát triển'); setActiveMenuId(null);}} className="w-full text-left px-4 py-2 flex items-center text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                                            Xóa phản hồi
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Thích & Phản hồi action bar for nested comments */}
                                                    <div className="flex items-center gap-3 mt-1 ml-3">
                                                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                            {new Date(cmt.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - {new Date(cmt.created_at).toLocaleDateString('vi-VN')}
                                                        </span>
                                                        <button 
                                                            className="text-[11px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:underline transition-colors"
                                                            onClick={null}
                                                        >
                                                            Thích
                                                        </button>
                                                        <button 
                                                            className="text-[11px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:underline transition-colors"
                                                            onClick={(e) => {
                                                                const input = e.target.closest('.animate-in').querySelector('input');
                                                                if(input) {
                                                                    input.focus();
                                                                    setCommentText(`@${cmt.user?.full_name} `);
                                                                }
                                                            }}
                                                        >
                                                            Phản hồi
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="flex gap-2">
                                            <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'M'}&background=111&color=fff`} className="w-7 h-7 rounded-full border border-gray-200 dark:border-white/10 shrink-0" />
                                            <div className="flex-1 relative bg-gray-50 dark:bg-[#1a1a1d] border border-gray-200 dark:border-white/10 rounded-[1.5rem] overflow-hidden focus-within:border-neon-green transition-colors flex items-center min-h-[36px]">
                                                <input 
                                                    type="text"
                                                    placeholder="Viết phản hồi của bạn..."
                                                    className="w-full bg-transparent outline-none text-xs text-gray-900 dark:text-white px-3 pr-10 py-2 h-full"
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleComment(rev.id)}
                                                />
                                                <button 
                                                    onClick={() => handleComment(rev.id)}
                                                    disabled={!commentText.trim()}
                                                    className="absolute right-1 w-7 h-7 flex items-center justify-center bg-neon-green hover:bg-neon-hover text-black rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all disabled:opacity-50 disabled:bg-gray-300"
                                                >
                                                    <Send className="w-3 h-3 -ml-0.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-[#1a1a1d] rounded-2xl p-10 border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-white/20 mb-2" />
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase">
                        {isEventEnded ? 'Chưa có cảm nhận nào' : 'Hãy là người mở bát!'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {isEventEnded 
                            ? 'Chia sẻ trải nghiệm của bạn sau khi sự kiện kết thúc nhé.' 
                            : 'Đăng bình luận tìm vé, tìm người đi cùng để sự kiện thêm xôm tụ nha!'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default EventReviews;
