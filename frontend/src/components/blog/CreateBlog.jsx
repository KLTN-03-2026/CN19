import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    ArrowLeft, 
    Image as ImageIcon, 
    X, 
    Loader2, 
    Send,
    Edit3,
    Play
} from 'lucide-react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import toast from 'react-hot-toast';
import axios from 'axios';
import blogService from '../../services/blog.service';
import eventService from '../../services/event.service';

const CreateBlog = () => {
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('eventId');
    const blogIdFromQuery = searchParams.get('blogId');
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [event, setEvent] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingBlogId, setExistingBlogId] = useState(blogIdFromQuery);
    
    const editorRef = useRef(null);
    const quillInstance = useRef(null);
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        image_url: '',
        images: [],
        event_id: eventId || ''
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const init = async () => {
            setIsFetching(true);
            if (eventId) {
                await fetchEventDetail();
                // Nếu có eventId mà chưa có blogId từ query, thử tìm xem user đã viết chưa
                if (!existingBlogId) {
                    await checkExistingBlog();
                }
            }
            
            // Nếu đã xác định được blogId (từ query hoặc sau khi check), load data
            if (existingBlogId) {
                await loadBlogData(existingBlogId);
            }
            setIsFetching(false);
        };
        init();
    }, [eventId, blogIdFromQuery, existingBlogId]);

    const fetchEventDetail = async () => {
        try {
            const res = await eventService.getEventById(eventId);
            setEvent(res.data);
            setFormData(prev => ({ ...prev, event_id: res.data.id }));
        } catch (error) {
            console.error('Fetch Event Error:', error);
        }
    };

    const checkExistingBlog = async () => {
        try {
            const res = await blogService.getEventReviews(eventId);
            // Vì API getEventReviews trả về list, ta tìm bài của mình (nếu API có trả về is_author hoặc so khớp ID)
            // Tuy nhiên, backend vừa được update getMyTickets trả về has_blog, nên blogId thường sẽ có từ Link.
            // Để chắc chắn, nếu lọt vào đây, ta có thể dùng một service lấy "My Review" nếu có.
        } catch (error) {
            console.error('Check existing blog error:', error);
        }
    };

    const loadBlogData = async (id) => {
        try {
            // Lấy danh sách blog công khai và tìm theo ID (hoặc dùng API lấy chi tiết nếu có)
            // Ở đây ta có getBlogBySlug, nhưng ta cần lấy theo ID để edit.
            // Tạm thời giả định blogService.getBlogBySlug có thể dùng hoặc ta dùng list reviews.
            const reviewsRes = await blogService.getEventReviews(eventId);
            const myReview = reviewsRes.data.find(r => r.id === id);
            
            if (myReview) {
                setIsEditMode(true);
                setExistingBlogId(myReview.id);
                setFormData({
                    title: myReview.title,
                    content: myReview.content,
                    image_url: myReview.image_url || '',
                    images: myReview.images || [],
                    event_id: eventId
                });
                setPreviewImage(myReview.image_url);
                if (quillInstance.current) {
                    quillInstance.current.root.innerHTML = myReview.content;
                }
            }
        } catch (error) {
            console.error('Load blog data error:', error);
        }
    };

    // Khởi tạo Quill editor
    useEffect(() => {
        if (editorRef.current && !quillInstance.current) {
            quillInstance.current = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                },
                placeholder: 'Chia sẻ trải nghiệm và cảm xúc của bạn về sự kiện này...'
            });

            quillInstance.current.on('text-change', () => {
                setFormData(prev => ({
                    ...prev,
                    content: quillInstance.current.root.innerHTML
                }));
            });
        }
        
        // Nếu đã có dữ liệu content (khi load edit), cập nhật editor
        if (quillInstance.current && formData.content && quillInstance.current.root.innerHTML === '<p><br></p>') {
            quillInstance.current.root.innerHTML = formData.content;
        }
    }, [formData.content]);

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
            toast.success('Tải ảnh bìa thành công!');
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên.');
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
                const isVideo = file.type.startsWith('video/');
                const uploadFormData = new FormData();
                uploadFormData.append('file', file);
                uploadFormData.append('upload_preset', uploadPreset);
                // Sử dụng endpoint auto để Cloudinary tự nhận diện
                return axios.post(
                    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                    uploadFormData
                );
            });

            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(res => res.data.secure_url);
            
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newUrls]
            }));
            toast.success(`Đã tải lên ${newUrls.length} tệp kỉ niệm!`);
        } catch (error) {
            toast.error('Lỗi khi tải ảnh gallery.');
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

    const isVideoUrl = (url) => {
        if (!url) return false;
        return url.includes('/video/') || url.match(/\.(mp4|webm|ogg|mov)$/i);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content || formData.content === '<p><br></p>') {
            toast.error('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
            return;
        }

        try {
            setIsLoading(true);
            if (isEditMode) {
                await blogService.updateReview(existingBlogId, formData);
                toast.success('Cập nhật bài chia sẻ thành công!');
            } else {
                await blogService.createReview(formData);
                toast.success('Đăng bài chia sẻ thành công!');
            }
            navigate('/blog');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Đã xảy ra lỗi.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
                <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] pb-6 pt-1">
            <div className="max-w-7xl mx-auto px-4 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3">
                    <div className="space-y-0.5">
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center text-gray-500 hover:text-neon-green font-bold text-[10px] transition-colors group mb-1"
                        >
                            <ArrowLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Quay lại
                        </button>
                        <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                            {isEditMode ? 'Chỉnh sửa' : 'Chia sẻ'} <span className="text-neon-hover dark:text-neon-green">Khoảnh khắc</span>
                        </h1>
                    </div>
                    
                    {event && (
                        <div className="flex items-center gap-2 p-2 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <img src={event.image_url} className="w-12 h-12 rounded-lg object-cover border border-white/10" alt="" />
                            <div>
                                <p className="text-[10px] font-black text-neon-hover dark:text-neon-green mb-0">Sự kiện tham gia</p>
                                <h4 className="text-[11px] font-black text-gray-900 dark:text-white line-clamp-1 max-w-[180px]">{event.title}</h4>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-3">
                        <div className="bg-white dark:bg-[#111114] p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Tiêu đề bài viết</label>
                                <input 
                                    type="text"
                                    placeholder="Nhập tiêu đề bài viết của bạn..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-100 dark:border-white/5 rounded-xl py-3 px-5 text-base font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Nội dung chi tiết</label>
                                <div className="quill-modern-container min-h-[350px] text-gray-900 dark:text-white">
                                    <div ref={editorRef}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Thumbnail Card */}
                        <div className="bg-white dark:bg-[#111114] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase flex items-center">
                                <ImageIcon className="w-3.5 h-3.5 mr-2 text-neon-green" />
                                Ảnh đại diện bài viết
                            </h3>
                            
                            <div className="relative group aspect-video rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-neon-green/50 transition-all">
                                {previewImage ? (
                                    <>
                                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => { setPreviewImage(null); setFormData({ ...formData, image_url: '' }); }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all">
                                        <div className="p-3 bg-neon-green/10 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-5 h-5 text-neon-green" />
                                        </div>
                                        <p className="text-[12px] font-bold text-gray-400 text-center">Tải ảnh bìa bài viết</p>
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
                        <div className="bg-white dark:bg-[#111114] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-3">
                            <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase flex items-center justify-between">
                                <span className="flex items-center">
                                    <ImageIcon className="w-3.5 h-3.5 mr-2 text-neon-green" />
                                    Ảnh & Video kỉ niệm
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold">{formData.images.length} tệp</span>
                            </h3>

                            <div className="grid grid-cols-3 gap-1.5">
                                {formData.images.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-100 dark:border-white/5 bg-black/5">
                                        {isVideoUrl(url) ? (
                                            <div className="w-full h-full relative">
                                                <video src={url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                    <Play className="w-4 h-4 text-white fill-current" />
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => removeGalleryImage(index)}
                                            className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-neon-green/50 transition-all group">
                                    <div className="relative">
                                        <ImageIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-neon-green transition-colors" />
                                        <Play className="w-2 h-2 text-gray-400 group-hover:text-neon-green transition-colors absolute -bottom-1 -right-1" />
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleGalleryUpload} />
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white dark:bg-[#111114] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-3">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-neon-green text-black rounded-xl text-[10px] font-black uppercase shadow-lg shadow-neon-green/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isEditMode ? <Edit3 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />)}
                                {isEditMode ? 'Cập nhật bài viết' : 'Đăng bài ngay'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .quill-modern-container .ql-container {
                    border-bottom-left-radius: 1.2rem !important;
                    border-bottom-right-radius: 1.2rem !important;
                    border: 1px solid rgba(0,0,0,0.05) !important;
                    min-height: 350px;
                    font-family: inherit;
                    font-size: 14px;
                    background: transparent;
                }
                .dark .quill-modern-container .ql-container {
                    border-color: rgba(255,255,255,0.05) !important;
                    color: white;
                }
                .quill-modern-container .ql-toolbar {
                    border-top-left-radius: 1.2rem !important;
                    border-top-right-radius: 1.2rem !important;
                    border: 1px solid rgba(0,0,0,0.05) !important;
                    background: rgba(0,0,0,0.02);
                    padding: 0.75rem !important;
                }
                .dark .quill-modern-container .ql-toolbar {
                    border-color: rgba(255,255,255,0.05) !important;
                    background: rgba(255,255,255,0.02);
                }
                .dark .ql-editor.ql-blank::before { color: #4b5563; }
                .dark .ql-snow .ql-stroke { stroke: #9ca3af; }
                .dark .ql-snow .ql-fill { fill: #9ca3af; }
                .dark .ql-snow .ql-picker { color: #9ca3af; }
            ` }} />
        </div>
    );
};

export default CreateBlog;
