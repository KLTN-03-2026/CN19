import React, { useState } from 'react';
import { 
  Heart,
  X, 
  Image as ImageIcon, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Calendar,
  Send,
  Loader2,
  CheckCircle2,
  Globe,
  Sparkles,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  CornerDownRight,
  Link as LinkIcon,
  Flag,
  Eye,
  EyeOff,
  Bookmark
} from 'lucide-react';
import axios from 'axios';
import { communityService } from '../../services/community.service';
import blogService from '../../services/blog.service';
import { formatDistanceToNow, format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import SocialImageGrid from './SocialImageGrid';

const UnifiedPostCard = ({ 
  post, 
  onLike, 
  onComment, 
  isOfficial = false,
  isAuthenticated = false,
  currentUser = null,
  variant = 'standard', // 'standard' or 'discussion'
  onStatusChange = null
}) => {
  const { t, i18n } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Advanced Comment States
  const [replyingToId, setReplyingToId] = useState(null);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(null); // commentId
  const [likersModal, setLikersModal] = useState({ show: false, list: [], title: '', isLoading: false });
  
  // Normalize data between Blog and Community schemas
  const author = post.author || post.user || { full_name: 'BASTICKET Team' };
  const date = post.created_at || post.date;
  const content = post.content || post.excerpt;
  
  // Robust image normalization
  const images = (post.images && post.images.length > 0) 
    ? post.images 
    : (post.image_url || post.thumbnail || post.cover || post.image) 
      ? [post.image_url || post.thumbnail || post.cover || post.image] 
      : [];
  const likesCount = post._count?.likes || post.likes || 0;
  const commentsCount = post._count?.comments || post.comments?.length || 0;
  const isLiked = post.is_liked || false;

  const toggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      await fetchComments();
    }
  };

  const fetchComments = async () => {
    try {
      setIsCommentsLoading(true);
      const res = await communityService.getComments(post.id);
      if (res.success) {
        setComments(res.data);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleImageUpload = async (e, isReply = false) => {
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
      
      if (isReply) {
        setReplyImage(res.data.secure_url);
      } else {
        setCommentImage(res.data.secure_url);
      }
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const internalOnComment = async (parentId = null) => {
    const text = parentId ? replyText : commentText;
    const image = parentId ? replyImage : commentImage;
    
    if (!text.trim() && !image) return;
    
    try {
      const newComment = await onComment(text, image, parentId);
      if (newComment) {
        setComments(prev => [...prev, newComment]);
        if (parentId) {
            setReplyText('');
            setReplyImage(null);
            setReplyingToId(null);
        } else {
            setCommentText('');
            setCommentImage(null);
        }
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!isAuthenticated) return toast.error(t('reviews.loginToDiscuss')); // Use Discussion key as fallback
    try {
      const res = await communityService.toggleCommentLike(commentId);
      if (res.success) {
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, is_liked: res.is_liked, likes_count: res.likes_count } 
            : c
        ));
      }
    } catch (error) {
      console.error('Like comment error:', error);
    }
  };

  const fetchBlogLikers = async () => {
    try {
      setLikersModal({ show: true, list: [], title: t('blog.post.view_likers'), isLoading: true });
      const res = await communityService.getLikers(post.id);
      if (res.success) {
        setLikersModal(prev => ({ ...prev, list: res.data, isLoading: false }));
      }
    } catch (error) {
      setLikersModal(prev => ({ ...prev, isLoading: false }));
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

  const handleToggleSave = async () => {
    if (!isAuthenticated) return toast.error(t('reviews.loginToInteract'));
    try {
      const res = await blogService.toggleSave(post.id);
      if (res.success) {
        setIsSaved(res.is_saved);
        toast.success(res.is_saved ? (t('blog.post.save_success') || 'Đã lưu bài viết!') : (t('blog.post.unsave_success') || 'Đã gỡ lưu!'));
      }
    } catch (error) {
      toast.error(t('common.error'));
    }
    setShowTopMenu(false);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group bg-white dark:bg-[#111114] rounded-2xl md:rounded-[1.75rem] border transition-all duration-500 overflow-hidden ${
        isOfficial 
          ? 'border-neon-green/30 shadow-[0_0_40px_rgba(82,196,45,0.05)] ring-1 ring-neon-green/10' 
          : 'border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Premium Glow for Official Posts */}
      {isOfficial && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 blur-[50px] -z-1 pointer-events-none"></div>
      )}

      {/* Header */}
      <div className="p-4 md:p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 transition-transform duration-500 group-hover:scale-105 border-gray-50 dark:border-white/10 shadow-sm">
            <img 
              src={author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.full_name}`} 
              className="w-full h-full object-cover" 
              alt="avatar"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">
                {author.full_name}
              </h4>
              {(author.is_verified || isOfficial) && (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isOfficial ? 'text-neon-green' : 'text-blue-500'}`} />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 mt-0.5">
              <Globe className="w-2.5 h-2.5" />
              <span>
                {(() => {
                  const now = new Date();
                  const postDate = new Date(date);
                  const diff = Math.floor((now - postDate) / (1000 * 60 * 60 * 24));
                  if (diff <= 3) {
                    return formatDistanceToNow(postDate, { addSuffix: true, locale: i18n.language === 'en' ? enUS : vi });
                  } else {
                    return format(postDate, 'dd/MM/yyyy');
                  }
                })()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
           {post.slug && (
             <Link to={`/blog/${post.slug}`} className="p-2 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-neon-green transition-all">
                <ExternalLink className="w-3.5 h-3.5" />
             </Link>
           )}
            <div className="relative group/topmenu">
              <button 
                onClick={() => setShowTopMenu(!showTopMenu)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 transition-all"
              >
                <MoreHorizontal className="w-4.5 h-4.5" />
              </button>

              <AnimatePresence>
                {showTopMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTopMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                    >
                      <button 
                        onClick={handleToggleSave}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left border-b border-gray-50 dark:border-white/5"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'text-neon-green fill-current' : 'text-gray-400'}`} />
                        {isSaved ? t('blog.post.unsave_post') : t('blog.post.save_post')}
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug || post.id}`);
                          toast.success(t('blog.post.link_copied') || 'Đã sao chép liên kết');
                          setShowTopMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left"
                      >
                        <LinkIcon className="w-3.5 h-3.5" /> {t('blog.post.copy_link') || 'Sao chép liên kết'}
                      </button>

                      {/* Owner Actions */}
                      {author.id === currentUser?.id ? (
                        <>
                          <button 
                            onClick={() => {
                              if (onStatusChange) onStatusChange();
                              setShowTopMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left border-t border-gray-50 dark:border-white/5"
                          >
                            {post.status === 'hidden' ? (
                                <>
                                    <Eye className="w-3.5 h-3.5 text-neon-green" /> 
                                    {t('blog.post.unhide') || 'Bỏ ẩn bài viết'}
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-3.5 h-3.5" /> 
                                    {t('blog.post.hide') || 'Ẩn bài viết'}
                                </>
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              toast.success('Chế độ chỉnh sửa đang được phát triển');
                              setShowTopMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-500" /> 
                            {t('blog.post.edit') || 'Chỉnh sửa bài viết'}
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
                                toast.success('Đã xóa bài viết');
                              }
                              setShowTopMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 
                            {t('blog.post.delete') || 'Xóa bài viết'}
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                             toast.success('Đã gửi báo cáo');
                             setShowTopMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left border-t border-gray-50 dark:border-white/5"
                        >
                          <Flag className="w-3.5 h-3.5 text-orange-400" /> {t('blog.post.report') || 'Báo cáo bài viết'}
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
        </div>
      </div>
 
      {/* Content */}
      <div className="px-4 md:px-5 pb-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
            {post.category && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg font-bold text-[9px] text-gray-400">
                    <Sparkles className="w-3 h-3 text-orange-400" />
                    {post.category}
                </div>
            )}

            {post.status === 'hidden' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded-lg font-black text-[9px] text-red-500 uppercase tracking-wider">
                    <EyeOff className="w-3 h-3" />
                    {t('blog.post.status_hidden') || 'Đã ẩn'}
                </div>
            )}
        </div>

        {post.title && (
          <Link to={`/blog/${post.slug || post.id}`}>
            <h2 className={`${variant === 'discussion' ? 'text-[18px] md:text-[22px] font-black tracking-tight mb-1.5 md:mb-2 text-gray-900 dark:text-white leading-tight' : 'text-[16px] md:text-[20px] font-black mb-1.5 md:mb-2 text-gray-900 dark:text-white leading-tight'} group-hover:text-neon-green transition-colors duration-300 cursor-pointer`}>
              {post.title}
            </h2>
          </Link>
        )}

        {content && (content.includes('</p>') || content.includes('</div>')) ? (
          <div 
            className="text-[14px] font-medium text-gray-800 dark:text-gray-200 leading-relaxed prose dark:prose-invert max-w-none prose-p:my-0" 
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        ) : (
          <p className="text-[14px] font-medium text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>

      {/* Linked Event Card */}
      {post.event && (
        <div className="px-4 md:px-5 pb-4">
          <Link 
            to={`/events/${post.event.slug || post.event.id}`}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all group/event shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="px-2 py-0.5 bg-neon-green/10 border border-neon-green/20 text-neon-green text-[8px] font-black uppercase tracking-wider rounded-md">
                  Sự kiện liên kết
                </div>
                {post.event.event_date && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(post.event.event_date).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
              <h4 className="text-[14px] font-black text-gray-900 dark:text-white truncate group-hover/event:text-neon-green transition-colors leading-none">
                {post.event.title}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 text-neon-green font-bold text-[10px] whitespace-nowrap ml-4 group-hover/event:translate-x-1 transition-all">
                {t('blog.post.view_event') || 'Xem chi tiết'} 
                <ExternalLink className="w-3 h-3" />
            </div>
          </Link>
        </div>
      )}

      {/* Smart Gallery */}
      <div className="px-4 md:px-5 pb-4">
         <SocialImageGrid images={images} />
      </div>

      {/* Stats Summary */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="px-6 py-2 flex items-center justify-between text-[11px] font-medium text-gray-400 border-t border-gray-50 dark:border-white/5">
            <div className="flex items-center gap-1.5">
                <button 
                  onClick={fetchBlogLikers}
                  className="flex items-center hover:bg-rose-500/10 px-2 py-0.5 rounded-full transition-all group/stats"
                >
                    <Heart className="w-3 h-3 text-rose-500 fill-current mr-1 group-hover/stats:scale-110" />
                    <span className="text-rose-500 font-bold">{likesCount.toLocaleString()}</span>
                </button>
            </div>
            <div className="hover:underline cursor-pointer font-bold" onClick={toggleComments}>
                {commentsCount} {t('blog.post.comments_count')}
            </div>
        </div>
      )}

      {/* Interaction Bar */}
      <div className="px-3 py-1.5 flex items-center border-t border-gray-50 dark:border-white/5 mb-1">
        <button 
          onClick={onLike}
          className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 rounded-xl transition-all duration-300 ${
            isLiked 
              ? 'text-rose-500' 
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'}`} />
          <span className="text-[10px] md:text-[11px] font-bold">
            {isLiked ? t('blog.post.liked') : t('blog.post.like')}
          </span>
        </button>

        <button 
          onClick={toggleComments}
          className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 rounded-xl transition-all ${
            showComments ? 'text-neon-green bg-neon-green/5' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="text-[10px] md:text-[11px] font-bold">{t('blog.post.comment')}</span>
        </button>

        <div className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 text-gray-600 dark:text-gray-400">
          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="text-[10px] md:text-[11px] font-bold">
            {(post.views || 0).toLocaleString()} {t('blog.post.views') || 'lượt xem'}
          </span>
        </div>
      </div>

      {/* Quick Comment Input (Facebook style) */}
      <AnimatePresence>
        {showComments && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-5 pb-5 border-t border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]"
            >
                {/* Comment List */}
                <div className="pt-4 space-y-4 mb-4">
                    {isCommentsLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-neon-green/20" />
                        </div>
                    ) : comments.length > 0 ? (
                        // Render Top-level comments first
                        comments.filter(c => !c.parent_id).map((comment) => (
                          <div key={comment.id} className="space-y-3">
                            <div className="flex gap-3 group/comment animate-in slide-in-from-bottom-2 duration-300">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                                    <img 
                                        src={comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.full_name}`} 
                                        className="w-full h-full object-cover" 
                                        alt=""
                                    />
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="relative group/actions">
                                        <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-3 border border-gray-100 dark:border-white/5">
                                            <div className="flex justify-between items-start mb-0.5">
                                              <h5 className="text-[12px] font-bold text-gray-900 dark:text-white tracking-tight">{comment.user?.full_name}</h5>
                                              
                                              {/* 3-dot Action Menu for Owner */}
                                              {currentUser?.id === comment.user_id && (
                                                <div className="relative">
                                                  <button 
                                                    onClick={() => setShowActionMenu(showActionMenu === comment.id ? null : comment.id)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all opacity-0 group-hover/comment:opacity-100"
                                                  >
                                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                                  </button>
                                                  
                                                  {showActionMenu === comment.id && (
                                                    <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-[#1c1c21] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl py-1.5 w-32 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                      <button 
                                                        onClick={() => {
                                                          setEditingCommentId(comment.id);
                                                          setEditText(comment.content);
                                                          setShowActionMenu(null);
                                                        }}
                                                        className="w-full px-3 py-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                                                      >
                                                        <Edit2 className="w-3 h-3" /> {t('blog.post.edit')}
                                                      </button>
                                                      <button 
                                                        onClick={() => {
                                                          handleDeleteComment(comment.id);
                                                          setShowActionMenu(null);
                                                        }}
                                                        className="w-full px-3 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                                                      >
                                                        <Trash2 className="w-3 h-3" /> {t('blog.post.delete')}
                                                      </button>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>

                                            {editingCommentId === comment.id ? (
                                              <div className="space-y-2">
                                                <textarea 
                                                  value={editText}
                                                  onChange={(e) => setEditText(e.target.value)}
                                                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-neon-green"
                                                  rows={2}
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <button onClick={() => setEditingCommentId(null)} className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase">{t('blog.post.cancel')}</button>
                                                  <button onClick={() => handleUpdateComment(comment.id)} className="px-2 py-1 bg-neon-green text-white text-[9px] font-bold rounded-md uppercase">{t('blog.post.save')}</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                            )}
                                            
                                            {comment.image_url && !editingCommentId && (
                                              <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 max-w-[200px]">
                                                <img src={comment.image_url} className="w-full h-auto cursor-pointer hover:scale-105 transition-transform duration-500" alt="comment-attachment" onClick={() => window.open(comment.image_url, '_blank')} />
                                              </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 px-1">
                                        <button 
                                          onClick={() => handleToggleCommentLike(comment.id)}
                                          className={`text-[10px] font-bold transition-colors ${comment.is_liked ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                          {comment.is_liked ? t('blog.post.liked') : t('blog.post.like')}
                                        </button>
                                        {comment.likes_count > 0 && (
                                          <button 
                                            onClick={() => fetchCommentLikers(comment.id)}
                                            className="text-[10px] font-bold text-rose-500/70 hover:underline"
                                          >
                                            {comment.likes_count}
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => {
                                            if (replyingToId === comment.id) {
                                              setReplyingToId(null);
                                              setReplyText('');
                                            } else {
                                              setReplyingToId(comment.id);
                                              setReplyText(`@${comment.user?.full_name} `);
                                            }
                                          }}
                                          className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                                        >
                                          {t('blog.post.reply')}
                                        </button>
                                        <span className="text-[9px] font-medium text-gray-400">
                                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: i18n.language === 'en' ? enUS : vi })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Self-replies (Nested Rendering) */}
                             {comments.filter(r => r.parent_id === comment.id).map(reply => (
                                <div key={reply.id} className="ml-11 flex flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                  <div className="flex gap-3">
                                    <CornerDownRight className="w-4 h-4 text-gray-300 mt-2 flex-shrink-0" />
                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img src={reply.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user?.full_name}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                       <div className="relative group/reply">
                                          <div className="bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl p-2.5 border border-gray-100 dark:border-white/5">
                                             <h5 className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5 tracking-tight">{reply.user?.full_name}</h5>
                                             
                                             {editingCommentId === reply.id ? (
                                                <div className="space-y-2 py-1">
                                                   <textarea 
                                                     value={editText}
                                                     onChange={(e) => setEditText(e.target.value)}
                                                     className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-neon-green"
                                                     rows={2}
                                                   />
                                                   <div className="flex justify-end gap-2">
                                                     <button onClick={() => setEditingCommentId(null)} className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase">{t('blog.post.cancel')}</button>
                                                     <button onClick={() => handleUpdateComment(reply.id)} className="px-2 py-1 bg-neon-green text-white text-[9px] font-bold rounded-md uppercase">{t('blog.post.save')}</button>
                                                   </div>
                                                </div>
                                             ) : (
                                                <p className="text-[12px] font-medium text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                                  {reply.content.split(' ').map((word, i) => 
                                                    word.startsWith('@') ? <span key={i} className="text-neon-green font-bold mr-1">{word} </span> : word + ' '
                                                  )}
                                                </p>
                                             )}
                                             
                                             {reply.image_url && !editingCommentId && (
                                               <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 max-w-[180px]">
                                                 <img 
                                                   src={reply.image_url} 
                                                   className="w-full h-auto cursor-pointer hover:scale-105 transition-transform duration-500" 
                                                   alt="reply-attachment" 
                                                   onClick={() => window.open(reply.image_url, '_blank')} 
                                                 />
                                               </div>
                                             )}
                                          </div>

                                          {/* Action Menu for Reply */}
                                          {currentUser && reply.user?.id === currentUser.id && !editingCommentId && (
                                            <div className="absolute -right-2 top-2 opacity-0 group-hover/reply:opacity-100 transition-all">
                                              <button 
                                                onClick={() => setShowActionMenu(showActionMenu === reply.id ? null : reply.id)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400"
                                              >
                                                <MoreHorizontal className="w-3.5 h-3.5" />
                                              </button>
                                              
                                              <AnimatePresence>
                                                {showActionMenu === reply.id && (
                                                  <>
                                                    <div 
                                                      className="fixed inset-0 z-10" 
                                                      onClick={() => setShowActionMenu(null)}
                                                    />
                                                    <motion.div 
                                                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                      className="absolute right-0 mt-1 w-28 bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-20 overflow-hidden"
                                                    >
                                                      <button 
                                                        onClick={() => {
                                                          setEditingCommentId(reply.id);
                                                          setEditText(reply.content);
                                                          setShowActionMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left"
                                                      >
                                                        <Edit2 className="w-3 h-3" /> {t('blog.post.edit')}
                                                      </button>
                                                      <button 
                                                        onClick={() => {
                                                          handleDeleteComment(reply.id);
                                                          setShowActionMenu(null);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5 transition-all text-left"
                                                      >
                                                        <Trash2 className="w-3 h-3" /> {t('blog.post.delete')}
                                                      </button>
                                                    </motion.div>
                                                  </>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          )}
                                       </div>

                                       <div className="flex items-center gap-4 px-1">
                                          <button 
                                            onClick={() => handleToggleCommentLike(reply.id)}
                                            className={`text-[10px] font-bold transition-colors ${reply.is_liked ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
                                          >
                                            {reply.is_liked ? t('blog.post.liked') : t('blog.post.like')}
                                          </button>
                                          {reply.likes_count > 0 && (
                                            <button 
                                              onClick={() => fetchCommentLikers(reply.id)}
                                              className="text-[10px] font-bold text-rose-500/70 hover:underline"
                                            >
                                              {reply.likes_count}
                                            </button>
                                          )}
                                          <button 
                                            onClick={() => {
                                              setReplyingToId(comment.id);
                                              setReplyText(`@${reply.user?.full_name} `);
                                            }}
                                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                                          >
                                            {t('blog.post.reply')}
                                          </button>
                                          <span className="text-[9px] font-medium text-gray-400">
                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: i18n.language === 'en' ? enUS : vi })}
                                          </span>
                                       </div>
                                    </div>
                                  </div>
                                </div>
                             ))}

                            {/* Reply Input for this comment */}
                            {replyingToId === comment.id && (
                              <div className="ml-11 pt-2 flex flex-col gap-2 animate-in zoom-in-95 duration-200">
                                {/* Image Preview for Reply */}
                                {replyImage && (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-neon-green/20 group">
                                        <img src={replyImage} className="w-full h-full object-cover" alt="reply-preview" />
                                        <button 
                                            onClick={() => setReplyImage(null)}
                                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                                      <img src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 relative">
                                      <input 
                                        autoFocus
                                        type="text"
                                        placeholder={t('blog.post.replying_to') + ` ${comment.user?.full_name}...`}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && internalOnComment(comment.id)}
                                        className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/10 rounded-xl py-1.5 px-3 pr-16 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-neon-green"
                                      />
                                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        <label className="p-1 px-1.5 text-gray-400 hover:text-neon-green transition-all cursor-pointer">
                                            {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, true)} disabled={isUploadingImage} />
                                        </label>
                                        <button onClick={() => internalOnComment(comment.id)} className="p-1 text-neon-green">
                                          <Send className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                    ) : (
                        <div className="text-center py-4 text-[10px] font-medium text-gray-400 tracking-widest">{t('blog.post.no_comments_yet')}</div>
                    )}
                </div>

                {/* Comment Input Area */}
                <div className="pt-4 flex flex-col gap-3 border-t border-gray-50 dark:border-white/5">
                    {/* Image Preview in Input */}
                    {commentImage && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-neon-green/20 group">
                            <img src={commentImage} className="w-full h-full object-cover" alt="upload-preview" />
                            <button 
                                onClick={() => setCommentImage(null)}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                            <img 
                                src={currentUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                                className="w-full h-full object-cover" 
                                alt=""
                            />
                        </div>
                        <div className="flex-1 relative">
                            <input 
                                type="text"
                                placeholder={t('blog.post.write_comment')}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        internalOnComment();
                                    }
                                }}
                                className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-4 pr-20 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-neon-green transition-all"
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                <label className="p-1.5 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-full transition-all cursor-pointer">
                                    {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                                </label>
                                <button 
                                   onClick={internalOnComment}
                                   className="p-1.5 text-neon-green hover:bg-neon-green/10 rounded-full transition-all"
                                >
                                    <Send className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

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
                    likersModal.list.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all cursor-pointer">
                         <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-white/10">
                            <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <h4 className="text-[13px] font-bold text-gray-900 dark:text-white">{user.full_name}</h4>
                            <p className="text-[10px] text-gray-400 font-medium">Bản tin xã hội</p>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-[12px]">Chưa có ai thích cả.</div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UnifiedPostCard;
