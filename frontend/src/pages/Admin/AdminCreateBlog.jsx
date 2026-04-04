import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Send,
    Clock,
    Layout
} from 'lucide-react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import toast from 'react-hot-toast';
import axios from 'axios';
import { adminService } from '../../services/admin.service';

const AdminCreateBlog = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const editorRef = useRef(null);
    const quillInstance = useRef(null);
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image_url: '',
        images: [],
        event_id: '',
        status: 'published'
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Khởi tạo Quill thủ công để tránh lỗi findDOMNode của ReactQuill trên React 19
    useEffect(() => {
        if (editorRef.current && !quillInstance.current) {
            quillInstance.current = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image', 'video'],
                        ['clean'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }]
                    ]
                },
                placeholder: 'Viết nội dung tin tức tại đây...'
            });

            // Lắng nghe sự thay đổi nội dung
            quillInstance.current.on('text-change', () => {
                setFormData(prev => ({
                    ...prev,
                    content: quillInstance.current.root.innerHTML
                }));
            });
        }
    }, []);

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
            setUploadProgress(0);
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        try {
            setIsLoading(true);
            const uploadPromises = files.map(file => {
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                uploadFormData.append('upload_preset', uploadPreset);
                return axios.post(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    uploadFormData
                );
            });

            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(res => res.data.secure_url);
            
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newUrls]
            }));
            toast.success(`Đã tải lên ${newUrls.length} ảnh gallery!`);
        } catch (error) {
            toast.error('Lỗi khi tải ảnh gallery.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeGalleryImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content || formData.content === '<p><br></p>') {
            toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
            return;
        }

        try {
            setIsLoading(true);
            const response = await adminService.createBlog(formData);
            if (response.success) {
                toast.success('Đăng bài viết hệ thống thành công!');
                navigate('/admin/blog');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi lưu bài viết.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 p-1">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate('/admin/blog')}
                    className="flex items-center text-gray-500 hover:text-neon-green font-black uppercase text-[10px] tracking-widest transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Quay lại danh sách
                </button>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-6 py-2 rounded-full border border-neon-green/20 bg-neon-green/5 font-black uppercase text-[10px] tracking-wider text-neon-green`}>
                        <Layout className="w-3 h-3" />
                        Soạn thảo tin tức hệ thống
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6 text-gray-900 dark:text-white">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tiêu đề bài viết</label>
                            <input 
                                type="text"
                                placeholder="Tiêu đề thông báo hệ thống..."
                                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-lg font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green transition-all uppercase leading-tight placeholder:opacity-50"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Rich Text Editor */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nội dung chi tiết</label>
                            <div className="quill-modern-container min-h-[400px]">
                                <div ref={editorRef}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Image Upload Card */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4 text-gray-900 dark:text-white">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center">
                            <ImageIcon className="w-4 h-4 mr-2 text-neon-green" />
                            Ảnh đại diện bài viết
                        </h3>
                        
                        <div className="relative group aspect-video rounded-3xl overflow-hidden bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-neon-green/50 transition-all">
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
                                    <div className="p-4 bg-neon-green/10 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-neon-green" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-gray-400">Tải ảnh đại diện</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
                            
                            {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gray-100">
                                    <div className="h-full bg-neon-green transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Gallery Card */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4 text-gray-900 dark:text-white">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span className="flex items-center">
                                <ImageIcon className="w-4 h-4 mr-2 text-neon-green" />
                                Thư viện ảnh (Gallery)
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold">{formData.images.length} ảnh</span>
                        </h3>

                        <div className="grid grid-cols-3 gap-2">
                            {formData.images.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 dark:border-white/5">
                                    <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeGalleryImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-neon-green/50 transition-all group">
                                <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-neon-green transition-colors" />
                                <span className="text-[8px] font-black uppercase text-gray-400 mt-1">Thêm</span>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Blog Settings Card */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6 text-gray-900 dark:text-white">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-neon-green" />
                            Thiết lập đăng
                        </h3>

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
                                className="w-full py-4 bg-neon-green text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-neon-green/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Đăng tin tức ngay
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate('/admin/blog')}
                                className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 dark:hover:bg-white/10 transition-all font-bold"
                            >
                                Hủy bỏ
                            </button>
                        </div>
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
                .dark .ql-editor {
                    color: inherit;
                }
                .dark .ql-snow .ql-stroke { stroke: #9ca3af; }
                .dark .ql-snow .ql-fill { fill: #9ca3af; }
                .dark .ql-snow .ql-picker { color: #9ca3af; }
                .dark .ql-editor.ql-blank::before { color: #4b5563; }
            ` }} />
        </div>
    );
};

export default AdminCreateBlog;
