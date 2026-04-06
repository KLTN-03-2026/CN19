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
import { communityService } from '../../services/community.service';
import { useAuthStore } from '../../store/useAuthStore';

const CreatePostModal = ({ onClose, onSuccess }) => {
    const { user } = useAuthStore();
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
            toast.success(`Đã tải lên ${files.length} ảnh!`);
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
        if (!content.trim() && images.length === 0) {
            toast.error('Vui lòng nhập nội dung hoặc chọn ảnh!');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await communityService.createPost({
                content,
                images,
                event_id: selectedEventId || null
            });

            if (res.success) {
                toast.success('Đã đăng bài viết của bạn!');
                onSuccess(res.data);
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
                className="relative w-full max-w-[600px] bg-white dark:bg-[#111114] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest text-center flex-1 ml-10">
                        Tạo bài viết mới
                    </h3>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:rotate-90 transition-all duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User Info */}
                <div className="p-6 pb-2 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neon-green/20">
                        <img 
                            src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed= Felix'} 
                            className="w-full h-full object-cover" 
                            alt="avatar"
                        />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                            {user?.full_name}
                        </h4>
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/5">
                            <Globe className="w-3 h-3 text-gray-400" />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Công khai</span>
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Body / Input */}
                <div className="p-6 pt-4 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                    <textarea 
                        className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400 min-h-[120px] resize-none"
                        placeholder={`${user?.full_name?.split(' ').pop()} ơi, bạn đang nghĩ gì thế?`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />

                    {/* Image Preview */}
                    {images.length > 0 && (
                        <div className={`grid gap-2 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {images.map((url, idx) => (
                                <div key={idx} className="relative group rounded-2xl overflow-hidden h-48 border border-gray-100 dark:border-white/5">
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
                                <div className="h-48 bg-gray-50 dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 animate-pulse">
                                    <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Đang tải...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Linked Event Tag */}
                {selectedEvent && (
                    <div className="px-6 mb-4">
                        <div className="flex items-center justify-between p-3 bg-neon-green/5 border border-neon-green/20 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden">
                                    <img src={selectedEvent.image_url} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neon-green uppercase tracking-widest">Đang gắn thẻ sự kiện</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{selectedEvent.title}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedEventId('')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer / Actions */}
                <div className="p-6 pt-0 space-y-4">
                    <div className="p-4 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Thêm vào bài viết</span>
                        <div className="flex items-center gap-1">
                            <label className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-neon-green transition-all cursor-pointer">
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" multiple hidden onChange={handleImageUpload} accept="image/*" />
                            </label>
                            <button 
                                onClick={() => setShowEventPicker(!showEventPicker)}
                                className={`p-2.5 rounded-full transition-all ${showEventPicker ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-blue-500'}`}
                            >
                                <Calendar className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-orange-400 transition-all">
                                <Smile className="w-5 h-5" />
                            </button>
                            <button className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-red-500 transition-all">
                                <MapPin className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Event Picker Dropdown (Simple version) */}
                    <AnimatePresence>
                        {showEventPicker && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar p-2 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Chọn sự kiện bạn đã tham gia</p>
                                    {myEvents.length > 0 ? myEvents.map(ev => (
                                        <button
                                            key={ev.id}
                                            onClick={() => {
                                                setSelectedEventId(ev.id);
                                                setShowEventPicker(false);
                                            }}
                                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${selectedEventId === ev.id ? 'bg-neon-green/10 border border-neon-green/20' : 'hover:bg-white dark:hover:bg-white/10'}`}
                                        >
                                            <div className="w-8 h-8 rounded overflow-hidden">
                                                <img src={ev.image_url} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 text-left line-clamp-1">{ev.title}</span>
                                        </button>
                                    )) : (
                                        <p className="text-[10px] p-2 text-gray-500 italic">Bạn chưa tham gia sự kiện nào.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || isUploading || (!content.trim() && images.length === 0)}
                        className="w-full h-12 bg-neon-green text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-neon-green/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng ngay'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default CreatePostModal;
