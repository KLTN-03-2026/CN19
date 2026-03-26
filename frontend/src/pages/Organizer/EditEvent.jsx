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
    const [targetStatus, setTargetStatus] = useState('pending');

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
            royalty_fee_percent: 5,
            refund_deadline_days: 7,
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
                setValue('refund_deadline_days', eventData.refund_deadline_days);
                
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
                setTargetStatus(eventData.status);

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
            await organizerService.updateEvent(id, { ...data, status: targetStatus });
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
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu sự kiện...</p>
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
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 dark:bg-white/5 -translate-y-1/2 z-0"></div>
                {steps.map((s, i) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center group">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                            step >= s.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-gray-100 dark:bg-[#1a1a1e] text-gray-400'
                        }`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <span className={`absolute -bottom-8 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            step >= s.id ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            {s.name}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight uppercase">CHỈNH SỬA SỰ KIỆN</h1>
                    <p className="text-gray-400 font-medium mt-1">Cập nhật thông tin chi tiết cho sự kiện của bạn.</p>
                </div>
            </div>

            {renderStepHeader()}

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl p-8 lg:p-12 relative overflow-hidden transition-colors">
                
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Tên sự kiện <span className="text-red-500">*</span></label>
                                <input 
                                    {...register('title', { required: true })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Danh mục <span className="text-red-500">*</span></label>
                                <select 
                                    {...register('category_id', { required: true })}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Mô tả sự kiện</label>
                            <textarea 
                                {...register('description')}
                                rows={4}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-600 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ảnh Banner Sự kiện <span className="text-red-500">*</span></label>
                                <div className="relative group">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-white/[0.02] group-hover:bg-blue-600/5 group-hover:border-blue-600 transition-all overflow-hidden relative min-h-[160px]">
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
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Video giới thiệu (Tùy chọn)</label>
                                <div className="relative group">
                                    <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-white/[0.02] group-hover:bg-purple-600/5 group-hover:border-purple-600 transition-all overflow-hidden relative min-h-[160px]">
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
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                                    <Calendar className="w-3 h-3 mr-2 text-blue-600" /> Ngày diễn ra <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input type="date" {...register('event_date', { required: true })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                                    <Clock className="w-3 h-3 mr-2 text-blue-600" /> Giờ bắt đầu
                                </label>
                                <input type="time" {...register('event_time')} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                                    <Calendar className="w-3 h-3 mr-2 text-red-600" /> Ngày kết thúc
                                </label>
                                <input type="date" {...register('end_date')} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                                    <Clock className="w-3 h-3 mr-2 text-red-600" /> Giờ kết thúc
                                </label>
                                <input type="time" {...register('end_time')} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                                <MapPin className="w-3 h-3 mr-2 text-blue-600" /> Địa điểm tổ chức <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative group cursor-pointer" onClick={() => setIsMapModalOpen(true)}>
                                <input {...register('location_address', { required: true })} readOnly className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all cursor-pointer pr-12" />
                                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 animate-pulse w-5 h-5" />
                            </div>
                        </div>

                        {watch('location_address') && (
                            <div className="space-y-2">
                                <div className="w-full h-[250px] bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
                                    <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={`https://maps.google.com/maps?q=${watch('latitude')},${watch('longitude')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}></iframe>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">Cấu hình hạng vé</h3>
                            <button type="button" onClick={() => append({ tier_name: '', price: '', quantity_total: '', section_name: '', benefits: '' })} className="flex items-center text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-4 py-2 rounded-lg hover:brightness-110 shadow-lg shadow-blue-600/20">
                                <PlusCircle className="w-4 h-4 mr-2" /> Thêm hạng vé
                            </button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-6 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl relative group-item hover:border-blue-600/30">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Tên hạng vé</label>
                                            <input {...register(`ticket_tiers.${index}.tier_name`, { required: true })} className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Giá vé (VNĐ)</label>
                                            <input type="number" {...register(`ticket_tiers.${index}.price`, { required: true })} className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Số lượng</label>
                                            <input type="number" {...register(`ticket_tiers.${index}.quantity_total`, { required: true })} className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <input {...register(`ticket_tiers.${index}.section_name`)} placeholder="Khu vực" className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600" />
                                        <input {...register(`ticket_tiers.${index}.benefits`)} placeholder="Quyền lợi" className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-medium focus:outline-none focus:border-blue-600" />
                                    </div>
                                    {fields.length > 1 && (
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
                                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600">Quy định giao dịch</h4>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/5">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase italic">Cho phép bán lại</p>
                                    <input type="checkbox" {...register('allow_resale')} className="w-5 h-5 accent-blue-600" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/5">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase italic">Cho phép chuyển nhượng</p>
                                    <input type="checkbox" {...register('allow_transfer')} className="w-5 h-5 accent-blue-600" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600">Phí và thời hạn</h4>
                                <input type="number" {...register('royalty_fee_percent')} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold" />
                                <input type="number" {...register('refund_deadline_days')} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all border border-transparent px-6 py-3 rounded-xl">
                            <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
                        </button>
                    ) : <div />}

                    {step < 4 ? (
                        <button type="button" onClick={nextStep} className="flex items-center bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 group">
                            Tiếp theo <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button type="submit" disabled={isSubmitting} onClick={() => setTargetStatus('draft')} className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50">
                                {isSubmitting && targetStatus === 'draft' ? 'Đang lưu...' : 'Lưu bản nháp'}
                            </button>
                            <button type="submit" disabled={isSubmitting} onClick={() => setTargetStatus('pending')} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50">
                                {isSubmitting && targetStatus === 'pending' ? 'Đang gửi...' : 'Cập nhật sự kiện'}
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
