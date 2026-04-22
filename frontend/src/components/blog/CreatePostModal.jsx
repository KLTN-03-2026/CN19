import React, { useState, useEffect } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Smile, 
  MapPin, 
  Calendar, 
  Loader2, 
  Globe, 
  ChevronDown,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { communityService } from '../../services/community.service';
import { useAuthStore } from '../../store/useAuthStore';

const CreatePostModal = ({ onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEventPicker, setShowEventPicker] = useState(false);

    useEffect(() => {
        fetchMyEvents();
    }, []);

    const fetchMyEvents = async () => {
        try {
            const res = await communityService.getMyEvents();
            if (res.success) {
                setMyEvents(res.data);
            }
        } catch (error) {
            console.error('Fetch My Events Error:', error);
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        setIsUploading(true);
        const uploadedUrls = [...images];

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);

                const res = await axios.post(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    formData
                );
                uploadedUrls.push(res.data.secure_url);
            }
            setImages(uploadedUrls);
            toast.success(t('blog.create_post.uploading_success', { count: files.length }) || `Đã tải lên ${files.length} ảnh!`);
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error('Vui lòng nhập tiêu đề cho bài viết.');
            return;
        }
        if (!content.trim() && images.length === 0) {
            toast.error(t('blog.create_post.error_empty'));
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await communityService.createPost({
                title,
                content,
                images,
                event_id: selectedEventId || null
            });

            if (res.success) {
                toast.success(t('blog.create_post.success'));
                onSuccess(res.data);
                onClose();
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi đăng bài.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEvent = myEvents.find(e => e.id === selectedEventId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[600px] bg-white dark:bg-[#111114] rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-[13px] font-black text-gray-900 dark:text-white uppercase text-center flex-1 ml-9">
                        {t('blog.create_post.title') || 'Tạo bài viết Blog'}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:rotate-90 transition-all duration-300"
                    >
                        <X className="w-4.5 h-4.5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {/* User Info */}
                    <div className="p-5 pb-2 flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-neon-green/20">
                            <img 
                                src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} 
                                className="w-full h-full object-cover" 
                                alt="avatar"
                            />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-black text-gray-900 dark:text-white uppercase leading-none mb-1">
                                {user?.full_name}
                            </h4>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5">
                                <Globe className="w-2.5 h-2.5 text-gray-400" />
                                <span className="text-[8px] font-black text-gray-400 uppercase">{t('blog.create_post.public')}</span>
                                <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    {/* Body / Input */}
                    <div className="p-5 pt-3 space-y-4">
                        {/* Blog Title Input */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">{t('blog.create_post.post_title')}</label>
                            <input 
                                type="text"
                                className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl px-4 py-3 text-[15px] font-black text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-neon-green transition-all"
                                placeholder={t('blog.create_post.post_title_placeholder')}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Blog Content Input */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">{t('blog.create_post.post_content')}</label>
                            <textarea 
                                className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl px-4 py-3 text-[14px] font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400 min-h-[150px] resize-none focus:ring-1 focus:ring-neon-green transition-all"
                                placeholder={t('blog.create_post.placeholder', { name: user?.full_name?.split(' ').pop() })}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>

                        {/* Image Preview */}
                        {images.length > 0 && (
                            <div className={`grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {images.map((url, idx) => (
                                    <div key={idx} className="relative group rounded-xl overflow-hidden h-44 border border-gray-100 dark:border-white/5">
                                        <img src={url} className="w-full h-full object-cover" alt="preview" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {isUploading && (
                                    <div className="h-44 bg-gray-50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center gap-2 animate-pulse">
                                        <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
                                        <span className="text-[9px] font-black text-gray-400 uppercase">{t('blog.create_post.uploading')}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Linked Event Tag */}
                        {selectedEvent && (
                            <div className="p-3 bg-neon-green/5 border border-neon-green/20 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-neon-green/10">
                                        <img src={selectedEvent.image_url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neon-green uppercase tracking-[0.2em] mb-0.5">{t('blog.create_post.tag_event') || 'SỰ KIỆN LIÊN KẾT'}</p>
                                        <p className="text-[13px] font-black text-gray-900 dark:text-white line-clamp-1">{selectedEvent.title}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedEventId('')}
                                    className="w-8 h-8 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="p-5 border-t border-gray-50 dark:border-white/5 space-y-4 bg-gray-50/30 dark:bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <label className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-neon-green transition-all cursor-pointer group" title="Thêm ảnh">
                                <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <input type="file" multiple hidden onChange={handleImageUpload} accept="image/*" />
                            </label>
                            <button 
                                onClick={() => setShowEventPicker(!showEventPicker)}
                                className={`p-2.5 rounded-xl transition-all group ${showEventPicker ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-blue-500'}`}
                                title="Gắn thẻ sự kiện đã tham gia"
                            >
                                <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-orange-400 transition-all group">
                                <Smile className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                            <button className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-red-500 transition-all group">
                                <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting || isUploading || !title.trim() || (!content.trim() && images.length === 0)}
                            className="h-12 px-8 bg-neon-green text-black font-black uppercase tracking-[0.1em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-neon-green/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 text-[12px]"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    {t('blog.create_post.btn_post') || 'Đăng bài'}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Event Picker Dropdown Component */}
                    <AnimatePresence>
                        {showEventPicker && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="p-3 bg-white dark:bg-[#1a1a1e] rounded-2xl border border-gray-100 dark:border-white/5 shadow-2xl max-h-[200px] overflow-y-auto no-scrollbar"
                            >
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 mb-3">{t('blog.create_post.select_event') || 'SỰ KIỆN ĐÃ MUA VÉ'}</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {myEvents.length > 0 ? myEvents.map(ev => (
                                        <button
                                            key={ev.id}
                                            onClick={() => {
                                                setSelectedEventId(ev.id);
                                                setShowEventPicker(false);
                                            }}
                                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all border ${selectedEventId === ev.id ? 'bg-neon-green/10 border-neon-green/30' : 'bg-gray-50 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10'}`}
                                        >
                                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={ev.image_url} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[11px] font-black text-gray-900 dark:text-white line-clamp-1">{ev.title}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase">{new Date(ev.event_date).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="py-8 text-center bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                                            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase px-4">{t('blog.create_post.empty_events') || 'Bạn chưa mua vé sự kiện nào'}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default CreatePostModal;
