import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Save, 
    Image as ImageIcon, 
    X, 
    Loader2, 
    Calendar, 
    FileText, 
    Eye,
    CheckCircle2,
    Send
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import toast from 'react-hot-toast';
import axios from 'axios';
import { organizerService } from '../../services/organizer.service';

const CreateBlog = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditMode);
    const [events, setEvents] = useState([]);
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image_url: '',
        event_id: '',
        status: 'published'
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        fetchEvents();
        if (isEditMode) {
            fetchBlogDetail();
        }
    }, [id]);

    const fetchEvents = async () => {
        try {
            const res = await organizerService.getMyEvents();
            setEvents(res.data || []);
        } catch (error) {
            console.error('Fetch Events Error:', error);
        }
    };

    const fetchBlogDetail = async () => {
        try {
            const res = await organizerService.getBlogById(id);
            const blog = res.data;
            setFormData({
                title: blog.title,
                content: blog.content,
                image_url: blog.image_url,
                event_id: blog.event_id || '',
                status: blog.status
            });
            setPreviewImage(blog.image_url);
        } catch (error) {
            toast.error('Không thể tải chi tiết bài viết.');
            navigate('/organizer/blog');
        } finally {
            setIsFetching(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('upload_preset', uploadPreset);

        try {
            setIsLoading(true);
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                uploadFormData,
                {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                }
            );
            setFormData({ ...formData, image_url: res.data.secure_url });
            setPreviewImage(res.data.secure_url);
            toast.success('Tải ảnh đại diện thành công!');
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên Cloudinary.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
            return;
        }

        try {
            setIsLoading(true);
            if (isEditMode) {
                await organizerService.updateBlog(id, formData);
                toast.success('Cập nhật bài viết thành công!');
            } else {
                await organizerService.createBlog(formData);
                toast.success('Tạo bài viết thành công!');
            }
            navigate('/organizer/blog');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Đã xảy ra lỗi khi lưu bài viết.');
        } finally {
            setIsLoading(false);
        }
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'video'],
            ['clean'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }]
        ],
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate('/organizer/blog')}
                    className="flex items-center text-gray-500 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Quay lại danh sách
                </button>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-6 py-2 rounded-full border border-blue-600/20 bg-blue-600/5 font-black uppercase text-[10px] tracking-wider`}>
                        <FileText className="w-3 h-3 text-blue-600" />
                        {isEditMode ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tiêu đề bài viết</label>
                            <input 
                                type="text"
                                placeholder="Nhập tiêu đề ấn tượng cho bài viết..."
                                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all uppercase leading-tight placeholder:opacity-50"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Rich Text Editor */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nội dung bài viết</label>
                            <div className="quill-modern-container">
                                <ReactQuill 
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    modules={quillModules}
                                    placeholder="Viết nội dung bài viết tại đây..."
                                    className="dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Settings Area */}
                <div className="space-y-6">
                    {/* Image Upload Card */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center">
                            <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                            Ảnh đại diện bài viết
                        </h3>
                        
                        <div className="relative group aspect-video rounded-3xl overflow-hidden bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-blue-600/50 transition-all">
                            {previewImage ? (
                                <>
                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => { setPreviewImage(null); setFormData({ ...formData, image_url: '' }); }}
                                        className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all">
                                    <div className="p-4 bg-blue-600/10 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-gray-400">Tải ảnh lên</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
                            
                            {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-100">
                                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}
                        </div>
                        <p className="text-[9px] text-gray-500 italic text-center">Khuyến nghị tỉ lệ 16:9, tối đa 5MB.</p>
                    </div>

                    {/* Blog Settings Card */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                            Thiết lập bài viết
                        </h3>

                        {/* Event Link Select */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Gắn với sự kiện (Tùy chọn)</label>
                            <select 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-xs font-bold dark:text-white"
                                value={formData.event_id}
                                onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                            >
                                <option value="">Không gắn sự kiện</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Select */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Trạng thái bài đăng</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'published' })}
                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${formData.status === 'published' ? 'bg-green-500/10 border-green-500 text-green-500 shadow-sm' : 'border-gray-100 dark:border-white/10 text-gray-400'}`}
                                >
                                    <CheckCircle2 className="w-3 h-3" /> Xuất bản
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'draft' })}
                                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${formData.status === 'draft' ? 'bg-gray-500/10 border-gray-400 text-gray-600 dark:text-gray-400 shadow-sm' : 'border-gray-100 dark:border-white/10 text-gray-400'}`}
                                >
                                    <Clock className="w-3 h-3" /> Lưu nháp
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditMode ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                                {isEditMode ? 'Cập nhật bài viết' : 'Đăng bài viết ngay'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate('/organizer/blog')}
                                className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-bold"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>

                    {/* Preview Hint */}
                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-3">
                        <Eye className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium leading-relaxed italic">
                            Bài viết sẽ được hiển thị công khai trên sự kiện của bạn và trang Blog chung sau khi nhấn "Đăng bài viết".
                        </p>
                    </div>
                </div>
            </form>

            <style dangerouslySetInnerHTML={{ __html: `
                .quill-modern-container .ql-container {
                    border-bottom-left-radius: 1.5rem !important;
                    border-bottom-right-radius: 1.5rem !important;
                    border: 1px solid rgba(0,0,0,0.05) !important;
                    min-height: 400px;
                    font-family: inherit;
                    font-size: 15px;
                    background: transparent;
                }
                .dark .quill-modern-container .ql-container {
                    border-color: rgba(255,255,255,0.05) !important;
                }
                .quill-modern-container .ql-toolbar {
                    border-top-left-radius: 1.5rem !important;
                    border-top-right-radius: 1.5rem !important;
                    border: 1px solid rgba(0,0,0,0.05) !important;
                    background: rgba(0,0,0,0.02);
                    padding: 1rem !important;
                }
                .dark .quill-modern-container .ql-toolbar {
                    border-color: rgba(255,255,255,0.05) !important;
                    background: rgba(255,255,255,0.02);
                }
                .dark .ql-snow .ql-stroke { stroke: #9ca3af; }
                .dark .ql-snow .ql-fill { fill: #9ca3af; }
                .dark .ql-snow .ql-picker { color: #9ca3af; }
                .dark .ql-editor.ql-blank::before { color: #4b5563; }
            ` }} />
        </div>
    );
};

export default CreateBlog;
