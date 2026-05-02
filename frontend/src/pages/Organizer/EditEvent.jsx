import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PlusCircle, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Info, 
  CheckCircle2,
  AlertCircle,
  Settings,
  Loader2
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import AddressMapModal from '../../components/AddressMapModal';
import axios from 'axios';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [videoProgress, setVideoProgress] = useState(0);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [previewSeatingCharts, setPreviewSeatingCharts] = useState([]);
    const [isSeatingChartsUploading, setIsSeatingChartsUploading] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState('pending');
    const [originalStatus, setOriginalStatus] = useState(null);

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            category_id: '',
            description: '',
            image_url: '',
            video_url: '',
            event_date: '',
            event_time: '',
            end_date: '',
            end_time: '',
            location_address: '',
            latitude: '',
            longitude: '',
            allow_resale: true,
            allow_transfer: true,
            royalty_fee_percent: 3,
            resale_price_limit_percent: 108,
            refund_deadline_days: 0,
            seating_charts: [],
            ticket_tiers: []
        }
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "ticket_tiers"
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [catRes, eventRes] = await Promise.all([
                    organizerService.getCategories(),
                    organizerService.getEventById(id)
                ]);

                setCategories(catRes.data);
                
                const eventData = eventRes.data;
                // Pre-fill form
                setValue('title', eventData.title);
                setValue('category_id', eventData.category_id);
                setValue('description', eventData.description);
                setValue('image_url', eventData.image_url);
                setValue('video_url', eventData.video_url || '');
                setValue('event_date', eventData.event_date ? new Date(eventData.event_date).toISOString().split('T')[0] : '');
                setValue('event_time', eventData.event_time);
                setValue('end_date', eventData.end_date ? new Date(eventData.end_date).toISOString().split('T')[0] : '');
                setValue('end_time', eventData.end_time || '');
                setValue('location_address', eventData.location_address);
                setValue('latitude', eventData.latitude);
                setValue('longitude', eventData.longitude);
                setValue('allow_resale', eventData.allow_resale);
                setValue('allow_transfer', eventData.allow_transfer);
                setValue('royalty_fee_percent', eventData.royalty_fee_percent);
                setValue('resale_price_limit_percent', eventData.resale_price_limit_percent || 108);
                setValue('refund_deadline_days', 0);
                
                // Map ticket tiers (backend fields might be tier_name, price, quantity_total)
                if (eventData.ticket_tiers) {
                    replace(eventData.ticket_tiers.map(t => ({
                        tier_name: t.tier_name,
                        price: t.price,
                        quantity_total: t.quantity_total,
                        section_name: t.section_name || '',
                        benefits: t.benefits || ''
                    })));
                }

                if (eventData.image_url) setPreviewImage(eventData.image_url);
                if (eventData.video_url) setPreviewVideo(eventData.video_url);
                if (eventData.seating_charts) {
                    setValue('seating_charts', eventData.seating_charts);
                    setPreviewSeatingCharts(eventData.seating_charts);
                }
                setTargetStatus(eventData.status);
                setOriginalStatus(eventData.status);

            } catch (err) {
                toast.error('Không thể tải dữ liệu sự kiện.');
                console.error(err);
                navigate('/organizer/my-events');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, setValue, replace, navigate]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        setPreviewImage(URL.createObjectURL(file));
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                }
            );
            setValue('image_url', res.data.secure_url);
            toast.success("Tải ảnh lên thành công!");
        } catch (error) {
            toast.error("Lỗi khi tải ảnh lên Cloudinary.");
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 100 * 1024 * 1024) {
            toast.error("Video quá lớn (Tối đa 100MB).");
            return;
        }

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        setPreviewVideo(URL.createObjectURL(file));
        setIsVideoUploading(true);
        setVideoProgress(0);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setVideoProgress(progress);
                    }
                }
            );
            setValue('video_url', res.data.secure_url);
            toast.success("Tải video lên thành công!");
        } catch (error) {
            toast.error("Lỗi khi tải video lên Cloudinary.");
        } finally {
            setIsVideoUploading(false);
        }
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setPreviewImage(null);
        setUploadProgress(0);
        setValue('image_url', '');
    };

    const removeVideo = (e) => {
        e.stopPropagation();
        setPreviewVideo(null);
        setVideoProgress(0);
        setValue('video_url', '');
    };

    const handleSeatingChartsUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        setIsSeatingChartsUploading(true);
        try {
            const uploadPromises = files.map(file => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);
                return axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
            });

            const results = await Promise.all(uploadPromises);
            const newUrls = results.map(res => res.data.secure_url);
            
            const currentUrls = watch('seating_charts') || [];
            const updatedUrls = [...currentUrls, ...newUrls];
            
            setValue('seating_charts', updatedUrls, { shouldValidate: true });
            setPreviewSeatingCharts(updatedUrls);
            toast.success(`Đã tải lên ${files.length} ảnh sơ đồ!`);
        } catch (error) {
            toast.error("Lỗi khi tải ảnh sơ đồ lên.");
            console.error(error);
        } finally {
            setIsSeatingChartsUploading(false);
        }
    };

    const removeSeatingChart = (index) => {
        const currentUrls = watch('seating_charts') || [];
        const newUrls = currentUrls.filter((_, i) => i !== index);
        setValue('seating_charts', newUrls, { shouldValidate: true });
        setPreviewSeatingCharts(newUrls);
    };

    const onSubmit = async (data) => {
        if (!data.image_url) {
            toast.error('Vui lòng tải ảnh banner sự kiện.');
            return;
        }

        if (!data.ticket_tiers || data.ticket_tiers.length === 0) {
            toast.error('Vui lòng thêm ít nhất một hạng vé.');
            return;
        }

        try {
            setIsSubmitting(true);
            const finalStatus = originalStatus === 'active' ? 'active' : targetStatus;
            await organizerService.updateEvent(id, { ...data, status: finalStatus });
            toast.success('Cập nhật sự kiện thành công!');
            navigate(`/organizer/events/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Đã xảy ra lỗi khi cập nhật.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = (e) => { e.preventDefault(); setStep(step + 1); };
    const prevStep = (e) => { e.preventDefault(); setStep(step - 1); };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-700 dark:text-white font-bold uppercase text-xs">Đang tải dữ liệu sự kiện...</p>
            </div>
        );
    }

    const renderStepHeader = () => {
        const steps = [
            { id: 1, name: 'Thông tin chung', icon: Info },
            { id: 2, name: 'Thời gian & Địa điểm', icon: Calendar },
            { id: 3, name: 'Hạng vé', icon: Tag },
            { id: 4, name: 'Chính sách & Hoàn tất', icon: Settings },
        ];

        return (
            <div className="flex items-center justify-between mb-16 relative px-2">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 dark:bg-white/5 -translate-y-1/2 z-0"></div>
                {steps.map((s, i) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center group">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                            step >= s.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                        }`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        {/* Desktop Label */}
                        <span className={`absolute -bottom-10 whitespace-nowrap text-[10px] font-bold uppercase transition-colors hidden md:block ${
                            step >= s.id ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                            {s.name}
                        </span>

                        {/* Mobile Label (Active only) */}
                        <div className={`md:hidden absolute -bottom-12 w-20 text-center flex flex-col items-center transition-all duration-300 ${
                            step === s.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                        }`}>
                            <span className="text-[8px] font-black leading-[1.1] text-blue-600 uppercase">
                                {s.name.split(' & ').map((part, idx, arr) => (
                                    <span key={idx}>
                                        {part}
                                        {idx < arr.length - 1 && <><br />& </>}
                                    </span>
                                ))}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-white hover:text-blue-600 transition-all shadow-sm group"
                    title="Quay lại"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase">CHỈNH SỬA SỰ KIỆN</h1>
                    <p className="text-gray-700 dark:text-white font-medium text-xs mt-1">Cập nhật thông tin chi tiết cho sự kiện của bạn.</p>
                </div>
            </div>

            {originalStatus === 'active' && (
                <div className="mb-8 p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-blue-600 uppercase ">Sự kiện đang trong quá trình bán vé</h4>
                        <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-1 font-medium leading-relaxed">
                            Để đảm bảo quyền lợi khách hàng, bạn chỉ có thể chỉnh sửa các thông tin bổ trợ (mô tả, hình ảnh, video). 
                            Các thông tin cốt lõi như thời gian, địa điểm và giá vé đã được khóa lại.
                        </p>
                    </div>
                </div>
            )}

            {renderStepHeader()}

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl p-5 md:p-8 relative overflow-hidden transition-colors">
                {/* Hidden Registered Fields for Validation */}
                <input type="hidden" {...register('image_url', { required: true })} />
                <input type="hidden" {...register('location_address', { required: true })} />
                <input type="hidden" {...register('latitude')} />
                <input type="hidden" {...register('longitude')} />
                <input type="hidden" {...register('seating_charts')} />
                
                {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400">Tên sự kiện <span className="text-red-500">*</span></label>
                                <input 
                                    {...register('title', { required: true })}
                                    readOnly={originalStatus === 'active'}
                                    className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-xs font-bold  text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400">Danh mục <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <button 
                                        type="button"
                                        onClick={() => originalStatus !== 'active' && setIsCategoryOpen(!isCategoryOpen)}
                                        className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-left flex items-center justify-between placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        <span>{categories.find(c => c.id === watch('category_id'))?.name || 'Chọn danh mục'}</span>
                                        {originalStatus !== 'active' && <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCategoryOpen ? 'rotate-90' : 'rotate-0'}`} />}
                                    </button>
                                    
                                    {isCategoryOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)}></div>
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="max-h-60 overflow-y-auto py-2">
                                                    <div 
                                                        className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer uppercase text-[10px]"
                                                        onClick={() => {
                                                            setValue('category_id', '', { shouldValidate: true });
                                                            setIsCategoryOpen(false);
                                                        }}
                                                    >
                                                        Chọn danh mục
                                                    </div>
                                                    {categories.map(cat => (
                                                        <div 
                                                            key={cat.id} 
                                                            onClick={() => {
                                                                setValue('category_id', cat.id, { shouldValidate: true });
                                                                setIsCategoryOpen(false);
                                                            }}
                                                            className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors flex items-center justify-between ${
                                                                watch('category_id') === cat.id 
                                                                ? 'bg-blue-600 text-white' 
                                                                : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                                            }`}
                                                        >
                                                            {cat.name}
                                                            {watch('category_id') === cat.id && <CheckCircle2 className="w-4 h-4" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400">Mô tả sự kiện</label>
                            <textarea 
                                {...register('description')}
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400">Ảnh Banner Sự kiện <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="border-2 border-dashed border-gray-200 dark:border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-white/[0.02] group-hover:bg-blue-600/5 group-hover:border-blue-600 transition-all overflow-hidden relative min-h-[160px]">
                                        {previewImage ? (
                                            <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 transition-all" />
                                        )}
                                        <div className="text-center relative z-10">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">Nhấn để thay đổi ảnh</p>
                                        </div>
                                        {previewImage && (
                                            <button 
                                                type="button" 
                                                onClick={removeImage} 
                                                className="absolute top-3 right-3 z-30 w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all shadow-xl border-2 border-white/20"
                                                title="Xóa ảnh và chọn lại"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400">Video giới thiệu (Tùy chọn)</label>
                                <div className="relative group">
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="border-2 border-dashed border-gray-200 dark:border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-white/[0.02] group-hover:bg-purple-600/5 group-hover:border-purple-600 transition-all overflow-hidden relative min-h-[160px]">
                                        {previewVideo ? (
                                            <video src={previewVideo} className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-70" autoPlay muted loop playsInline />
                                        ) : (
                                            <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 group-hover:text-purple-600 transition-all" />
                                        )}
                                        <div className="text-center relative z-10">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">Nhấn để thay đổi video</p>
                                        </div>
                                        {previewVideo && (
                                            <button 
                                                type="button" 
                                                onClick={removeVideo} 
                                                className="absolute top-3 right-3 z-30 w-10 h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all shadow-xl border-2 border-white/20"
                                                title="Xóa video và chọn lại"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sơ đồ sự kiện (Multi-upload) */}
                        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400">Sơ đồ sự kiện / Sơ đồ chỗ ngồi (Tải lên nhiều ảnh) <span className="text-red-500">*</span></label>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-0.5 rounded-full uppercase er">Tải lên ít nhất 1 ảnh</span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {previewSeatingCharts.map((url, index) => (
                                    <div key={index} className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-white/20 group">
                                        <img src={url} alt={`Layout ${index}`} className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => removeSeatingChart(index)}
                                            className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                
                                {previewSeatingCharts.length < 10 && (
                                    <div className="relative aspect-video md:aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/20 hover:border-blue-600 transition-all bg-gray-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center space-y-2 cursor-pointer group">
                                        <input 
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleSeatingChartsUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            disabled={isSeatingChartsUploading}
                                        />
                                        {isSeatingChartsUploading ? (
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <PlusCircle className="w-6 h-6 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 transition-colors" />
                                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Thêm ảnh sơ đồ</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400 flex items-center">
                                    <Calendar className="w-3 h-3 mr-2 text-blue-600" /> Ngày diễn ra <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    min={new Date().toISOString().split('T')[0]}
                                    {...register('event_date', { 
                                        required: 'Vui lòng chọn ngày diễn ra',
                                        validate: (value) => {
                                            const selected = new Date(value);
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            if (selected < today) return 'Ngày diễn ra không được ở quá khứ';
                                            return true;
                                        }
                                    })} 
                                    readOnly={originalStatus === 'active'} 
                                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.event_date ? 'border-red-500' : 'border-gray-200 dark:border-white/20'} rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                                />
                                {errors.event_date && <p className="text-[10px] text-red-500 font-bold italic mt-1">{errors.event_date.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase  text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400 flex items-center">
                                    <Clock className="w-3 h-3 mr-2 text-blue-600" /> Giờ bắt đầu
                                </label>
                                <input 
                                    type="time" 
                                    {...register('event_time', {
                                        validate: (value) => {
                                            if (!value) return true;
                                            const eventDate = watch('event_date');
                                            if (!eventDate) return true;
                                            
                                            const combined = new Date(`${eventDate}T${value}`);
                                            if (combined <= new Date()) return 'Thời gian bắt đầu phải ở tương lai';
                                            return true;
                                        }
                                    })} 
                                    readOnly={originalStatus === 'active'} 
                                    className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                                />
                                {errors.event_time && <p className="text-[10px] text-red-500 font-bold italic mt-1">{errors.event_time.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400 flex items-center">
                                    <Calendar className="w-3 h-3 mr-2 text-red-600" /> Ngày kết thúc <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    min={watch('event_date') || new Date().toISOString().split('T')[0]}
                                    {...register('end_date', { 
                                        required: 'Vui lòng chọn ngày kết thúc',
                                        validate: (value) => {
                                            const startDate = watch('event_date');
                                            if (!startDate) return true;
                                            const startObj = new Date(startDate);
                                            const endObj = new Date(value);
                                            if (startObj > endObj) return 'Ngày kết thúc không được trước ngày diễn ra';
                                            return true;
                                        }
                                    })} 
                                    readOnly={originalStatus === 'active'} 
                                    className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.end_date ? 'border-red-500' : 'border-gray-200 dark:border-white/20'} rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} 
                                />
                                {errors.end_date && <p className="text-[10px] text-red-500 font-bold italic mt-1">{errors.end_date.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400 flex items-center">
                                    <Clock className="w-3 h-3 mr-2 text-red-600" /> Giờ kết thúc
                                </label>
                                <input type="time" {...register('end_time', {
                                    validate: (value) => {
                                        const event_date = watch('event_date');
                                        const end_date = watch('end_date');
                                        const event_time = watch('event_time');
                                        if (!event_date || !end_date || !event_time || !value) return true;
                                        
                                        const startObj = new Date(event_date);
                                        const endObj = new Date(end_date);
                                        startObj.setHours(0,0,0,0);
                                        endObj.setHours(0,0,0,0);
                                        
                                        if (startObj.getTime() === endObj.getTime()) {
                                            const [startH, startM] = event_time.split(':').map(Number);
                                            const [endH, endM] = value.split(':').map(Number);
                                            if (startH * 60 + startM >= endH * 60 + endM) {
                                                return 'Nếu trùng ngày, giờ kết thúc phải sau giờ diễn ra';
                                            }
                                        }
                                        return true;
                                    }
                                })} readOnly={originalStatus === 'active'} className={`w-full bg-gray-50 dark:bg-white/5 border ${errors.end_time ? 'border-red-500' : 'border-gray-200 dark:border-white/20'} rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                {errors.end_time && <p className="text-[10px] text-red-500 font-bold italic mt-1">{errors.end_time.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-700 dark:text-white dark:text-gray-600 dark:text-gray-400 flex items-center">
                                <MapPin className="w-3 h-3 mr-2 text-blue-600" /> Địa điểm tổ chức <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative group cursor-pointer" onClick={() => originalStatus !== 'active' && setIsMapModalOpen(true)}>
                                <input {...register('location_address', { required: true })} readOnly className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all cursor-pointer pr-12 ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                <MapPin className={`absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 w-5 h-5 ${originalStatus !== 'active' ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>

                        {watch('location_address') && (
                            <div className="space-y-2">
                                <div className="w-full h-[250px] bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/20">
                                    <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={`https://maps.google.com/maps?q=${watch('latitude')},${watch('longitude')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}></iframe>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase  text-blue-600">Cấu hình hạng vé</h3>
                            {originalStatus !== 'active' && (
                                <button type="button" onClick={() => append({ tier_name: '', price: '', quantity_total: '', section_name: '', benefits: '' })} className="flex items-center text-[10px] font-bold uppercase bg-blue-600 text-white px-4 py-2 rounded-lg hover:brightness-110 shadow-lg shadow-blue-600/20">
                                    <PlusCircle className="w-4 h-4 mr-2" /> Thêm hạng vé
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-6 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl relative group-item hover:border-blue-600/30">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 italic">Tên hạng vé</label>
                                            <input {...register(`ticket_tiers.${index}.tier_name`, { required: true })} readOnly={originalStatus === 'active'} className={`w-full bg-transparent border-b border-gray-200 dark:border-white/20 py-1 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase  text-gray-600 dark:text-gray-400 italic">Giá vé (VNĐ)</label>
                                            <input type="number" {...register(`ticket_tiers.${index}.price`, { required: true })} readOnly={originalStatus === 'active'} className={`w-full bg-transparent border-b border-gray-200 dark:border-white/20 py-1 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                                                * Bạn nhận về: {Math.max(0, watch(`ticket_tiers.${index}.price`) * 0.92 - 10000).toLocaleString()} VNĐ (Đã trừ: 8% phí sàn/giao dịch & 10,000đ phí Blockchain/AI)
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 italic">Số lượng</label>
                                            <input type="number" {...register(`ticket_tiers.${index}.quantity_total`, { required: true })} readOnly={originalStatus === 'active'} className={`w-full bg-transparent border-b border-gray-200 dark:border-white/20 py-1 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <input {...register(`ticket_tiers.${index}.section_name`)} readOnly={originalStatus === 'active'} placeholder="Khu vực" className={`w-full bg-transparent border-b border-gray-200 dark:border-white/20 py-1 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                        <input {...register(`ticket_tiers.${index}.benefits`)} readOnly={originalStatus === 'active'} placeholder="Quyền lợi" className={`w-full bg-transparent border-b border-gray-200 dark:border-white/20 py-1 text-sm font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 ${originalStatus === 'active' ? 'opacity-60 cursor-not-allowed' : ''}`} />
                                    </div>
                                    {fields.length > 1 && originalStatus !== 'active' && (
                                        <button type="button" onClick={() => remove(index)} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-item-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase  text-blue-600">Quy định giao dịch</h4>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/5">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase italic">Cho phép bán lại</p>
                                    <input type="checkbox" {...register('allow_resale')} disabled={originalStatus === 'active'} className={`w-5 h-5 accent-blue-600 ${originalStatus === 'active' ? 'cursor-not-allowed opacity-50' : ''}`} />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/5">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase italic">Cho phép chuyển nhượng</p>
                                    <input type="checkbox" {...register('allow_transfer')} disabled={originalStatus === 'active'} className={`w-5 h-5 accent-blue-600 ${originalStatus === 'active' ? 'cursor-not-allowed opacity-50' : ''}`} />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase  text-blue-600">Phí bản quyền</h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 italic">Phí bản quyền (%)</label>
                                    <div className="relative">
                                        <input type="number" {...register('royalty_fee_percent')} readOnly className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none cursor-not-allowed opacity-70" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 font-bold">%</span>
                                    </div>
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-2 italic">* BTC nhận phần trăm hoa hồng trên phần LỢI NHUẬN mỗi khi vé được bán lại trên Marketplace.</p>
                                </div>

                                {watch('allow_resale') && (
                                    <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                                        <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 italic">Giới hạn giá bán lại tối đa (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                {...register('resale_price_limit_percent', { 
                                                    required: 'Vui lòng nhập giới hạn giá',
                                                    max: { value: 108, message: 'Tối đa 108% để tránh đầu cơ' },
                                                    min: { value: 100, message: 'Tối thiểu 100% (bằng giá gốc)' },
                                                    valueAsNumber: true
                                                })}
                                                disabled={originalStatus === 'active'}
                                                className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-all ${originalStatus === 'active' ? 'cursor-not-allowed opacity-50' : ''}`}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 font-bold">%</span>
                                        </div>
                                        {errors.resale_price_limit_percent && (
                                            <p className="text-[10px] text-red-500 font-bold italic">{errors.resale_price_limit_percent.message}</p>
                                        )}
                                        <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic">
                                            * Luật Smart Contract: Giá bán lại không được vượt quá {watch('resale_price_limit_percent')}% giá gốc để ngăn chặn đầu cơ.
                                        </p>
                                    </div>
                                )}
                                
                                <div className="p-4 bg-blue-600/5 rounded-xl border border-blue-600/10 space-y-4 mt-4">
                                     <div className="flex items-center space-x-2 pb-2 border-b border-blue-600/10">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                        <h5 className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase ">Phân bổ dòng tiền Resale</h5>
                                    </div>
                                    <div className="space-y-2">
                                         <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-700 dark:text-white">Người mua trả:</span>
                                            <span className="font-bold dark:text-white">Giá niêm yết + Phí sàn + Phí Gas (10k)</span>
                                         </div>
                                         <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-700 dark:text-white">Người bán nhận:</span>
                                            <span className="font-bold text-green-600">Giá bán - {watch('royalty_fee_percent')}% Bản quyền lợi nhuận</span>
                                         </div>
                                         <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-700 dark:text-white">BTC nhận (Bản quyền):</span>
                                            <span className="font-bold text-blue-600">+{watch('royalty_fee_percent')}% Lợi nhuận (về ví BTC)</span>
                                         </div>
                                         <div className="flex justify-between items-center text-[10px]">
                                            <span className="text-gray-700 dark:text-white">Hệ thống nhận:</span>
                                            <span className="font-bold text-purple-600">Phí sàn (3%) + Phí Blockchain/AI (10k)</span>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-black rounded-3xl border border-blue-600/20 text-center space-y-4">
                            <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto" />
                            <h3 className="text-xl font-bold text-white uppercase er">Mọi thứ đã sẵn sàng!</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
                                Cập nhật thông tin sự kiện của bạn và gửi đi. Các thay đổi sẽ được cập nhật đồng bộ lên hệ thống.
                            </p>
                            <div className="mt-6 p-4 bg-red-600/10 rounded-2xl border border-red-600/20 text-left">
                                <p className="text-[10px] text-red-500 font-bold uppercase mb-1">Quy định bồi hoàn & Trách nhiệm:</p>
                                <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic">
                                    Nếu sự kiện bị hủy/dời lịch, bạn có nghĩa vụ hoàn trả <b>100% tiền khách đã trả</b>. Phí Xác thực 10.000đ (đã dùng cho Blockchain/AI) sẽ không được hoàn lại cho BTC.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    {step < 4 ? (
                        <>
                            {step > 1 ? (
                                <button 
                                    type="button" 
                                    onClick={prevStep} 
                                    className="w-full md:w-auto flex items-center justify-center text-xs font-bold uppercase text-gray-600 dark:text-gray-400 hover:text-white transition-all border border-gray-200 dark:border-white/10 md:border-transparent px-6 py-4 md:py-3 rounded-xl"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
                                </button>
                            ) : <div className="hidden md:block" />}

                            <button 
                                type="button" 
                                onClick={nextStep} 
                                className="w-full md:w-auto flex items-center justify-center bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-xs uppercase shadow-lg hover:brightness-110 active:scale-95 group"
                            >
                                Tiếp theo <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full justify-between">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button 
                                    type="button" 
                                    onClick={prevStep} 
                                    className="flex-1 md:flex-none flex items-center justify-center text-xs font-bold uppercase text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 px-6 py-4 rounded-xl"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
                                </button>
                                {originalStatus !== 'active' && (
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting} 
                                        onClick={() => setTargetStatus('draft')} 
                                        className="flex-1 md:flex-none flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white px-6 py-4 rounded-xl font-bold text-xs uppercase hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 border border-gray-200 dark:border-white/10"
                                    >
                                        {isSubmitting && targetStatus === 'draft' ? 'Đang lưu...' : 'Lưu bản nháp'}
                                    </button>
                                )}
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                onClick={() => setTargetStatus(originalStatus === 'active' ? 'active' : 'pending')} 
                                className="w-full md:w-auto flex items-center justify-center bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-xs uppercase shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Đang gửi...' : originalStatus === 'active' ? 'Cập nhật thay đổi' : 'Cập nhật sự kiện'}
                                {!isSubmitting && <CheckCircle2 className="w-5 h-5 ml-2" />}
                            </button>
                        </div>
                    )}
                </div>
            </form>

            <AddressMapModal 
                isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)}
                onConfirm={(data) => {
                    setValue('location_address', data.text, { shouldValidate: true });
                    setValue('latitude', data.lat);
                    setValue('longitude', data.lng);
                }}
            />
        </div>
    );
};

export default EditEvent;
