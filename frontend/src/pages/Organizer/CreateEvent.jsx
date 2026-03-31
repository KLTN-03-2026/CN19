import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import AddressMapModal from '../../components/AddressMapModal';
import axios from 'axios';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [previewSeatingCharts, setPreviewSeatingCharts] = useState([]);
  const [isSeatingChartsUploading, setIsSeatingChartsUploading] = useState(false);
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
      location_address: '', // Địa điểm chi tiết
      latitude: '',
      longitude: '',
      allow_resale: true,
      allow_transfer: true,
      royalty_fee_percent: 5,
      refund_deadline_days: 7,
      seating_charts: [],
      ticket_tiers: [{ tier_name: 'Vé Thường', price: '', quantity_total: '', section_name: 'Khán đài A', benefits: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticket_tiers"
  });

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await organizerService.getCategories();
        setCategories(res.data);
      } catch (err) {
        toast.error('Không thể tải danh mục.');
      }
    };
    fetchCats();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || cloudName === 'your_cloud_name') {
      toast.error("Cloudinary chưa được cấu hình trong .env");
      return;
    }

    // Preview
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
      console.error(error);
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

    if (!cloudName || cloudName === 'your_cloud_name') {
      toast.error("Cloudinary chưa được cấu hình trong .env");
      return;
    }

    // Preview
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
      console.error(error);
    } finally {
      setIsVideoUploading(false);
    }
  };
  
  const handleSeatingChartsUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || cloudName === 'your_cloud_name') {
      toast.error("Cloudinary chưa được cấu hình.");
      return;
    }

    setIsSeatingChartsUploading(true);
    const newUrls = [...watch('seating_charts')];
    const newPreviews = [...previewSeatingCharts];

    try {
      for (const file of files) {
        // Local preview for immediate feedback
        const previewUrl = URL.createObjectURL(file);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData
        );
        
        newUrls.push(res.data.secure_url);
        newPreviews.push(res.data.secure_url);
      }
      
      setValue('seating_charts', newUrls);
      setPreviewSeatingCharts(newPreviews);
      toast.success(`Đã tải lên ${files.length} ảnh sơ đồ!`);
    } catch (error) {
      toast.error("Lỗi khi tải ảnh sơ đồ lên.");
      console.error(error);
    } finally {
      setIsSeatingChartsUploading(false);
    }
  };

  const removeSeatingChart = (index) => {
    const newUrls = watch('seating_charts').filter((_, i) => i !== index);
    const newPreviews = previewSeatingCharts.filter((_, i) => i !== index);
    setValue('seating_charts', newUrls);
    setPreviewSeatingCharts(newPreviews);
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

    // Validation bổ sung cho hạng vé
    if (!data.ticket_tiers || data.ticket_tiers.length === 0) {
      toast.error('Vui lòng thêm ít nhất một hạng vé.');
      return;
    }

    for (const tier of data.ticket_tiers) {
        if (!tier.tier_name || !tier.price || !tier.quantity_total) {
            toast.error(`Vui lòng điền đầy đủ thông tin cho hạng vé "${tier.tier_name || ''}"`);
            return;
        }
    }
    try {
      setIsSubmitting(true);
      await organizerService.createEvent({ ...data, status: targetStatus });
      toast.success(targetStatus === 'draft' ? 'Đã lưu bản nháp thành công!' : 'Gửi yêu cầu tạo sự kiện thành công! Vui lòng chờ Admin duyệt.');
      navigate('/organizer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đã xảy ra lỗi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStep(step + 1);
  };
  const prevStep = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setStep(step - 1);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight uppercase">TẠO SỰ KIỆN MỚI</h1>
          <p className="text-gray-400 font-medium mt-1">Hoàn thành các bước dưới đây để gửi yêu cầu phê duyệt sự kiện.</p>
        </div>
      </div>

      {renderStepHeader()}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl p-8 lg:p-12 relative overflow-hidden transition-colors">
        
        {/* Step 1: Thông tin chung */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Tên sự kiện <span className="text-red-500">*</span></label>
                    <input 
                        {...register('title', { required: true })}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                        placeholder="VD: Crypto Night 2026"
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
                    placeholder="Giới thiệu chi tiết về sự kiện của bạn..."
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ảnh Banner Sự kiện <span className="text-red-500">*</span></label>
                    <div className="relative group group-hover:border-blue-600 transition-all">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-white/[0.02] group-hover:bg-blue-600/5 group-hover:border-blue-600 transition-all overflow-hidden relative min-h-[160px]">
                            {previewImage ? (
                                <img src={previewImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 group-hover:text-blue-600 transition-all" />
                            )}
                            <div className="text-center relative z-10">
                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">Nhấn để tải ảnh</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter italic">JPG, PNG, WEBP (Tối đa 5MB)</p>
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
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }}></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Video giới thiệu (Tùy chọn)</label>
                    <div className="relative group group-hover:border-purple-600 transition-all">
                        <input 
                            type="file" 
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-white/[0.02] group-hover:bg-purple-600/5 group-hover:border-purple-600 transition-all overflow-hidden relative min-h-[160px]">
                            {previewVideo ? (
                                <video 
                                    src={previewVideo} 
                                    className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-70" 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline
                                />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 group-hover:text-purple-600 transition-all" />
                            )}
                            <div className="text-center relative z-10">
                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">Nhấn để tải video</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter italic">MP4, MOV (Tối đa 100MB)</p>
                            </div>
                            {previewVideo && (
                                <button 
                                    type="button"
                                    onClick={removeVideo}
                                    className="absolute top-2 right-2 z-20 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            {videoProgress > 0 && videoProgress < 100 && (
                                <div className="absolute bottom-0 left-0 h-1 bg-purple-600 transition-all" style={{ width: `${videoProgress}%` }}></div>
                            )}
                        </div>
                    </div>
                </div>
             </div>
              
              {/* Sơ đồ sự kiện (Multi-upload) */}
              <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                     <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Sơ đồ sự kiện / Sơ đồ chỗ ngồi (Tải lên nhiều ảnh) <span className="text-red-500">*</span></label>
                     <span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Tải lên ít nhất 1 ảnh</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {previewSeatingCharts.map((url, index) => (
                          <div key={index} className="relative aspect-video md:aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 group">
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
                          <div className="relative aspect-video md:aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-blue-600 dark:hover:border-blue-600 transition-all bg-gray-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center space-y-2 cursor-pointer group">
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
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">Thêm ảnh sơ đồ</span>
                                  </>
                              )}
                          </div>
                      )}
                  </div>
              </div>
           </div>
        )}

        {/* Step 2: Thời gian & Địa điểm */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-blue-600" />
                        Ngày diễn ra <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                        type="date"
                        {...register('event_date', { required: true })}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-2 text-blue-600" />
                        Giờ bắt đầu
                    </label>
                    <input 
                        type="time"
                        {...register('event_time')}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                    />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-red-600" />
                        Ngày kết thúc
                    </label>
                    <input 
                        type="date"
                        {...register('end_date')}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-2 text-red-600" />
                        Giờ kết thúc
                    </label>
                    <input 
                        type="time"
                        {...register('end_time')}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white"
                    />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                    <MapPin className="w-3 h-3 mr-2 text-blue-600" />
                    Địa điểm tổ chức <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative group cursor-pointer" onClick={() => setIsMapModalOpen(true)}>
                    <input 
                        {...register('location_address', { required: true })}
                        readOnly
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all cursor-pointer pr-12"
                        placeholder="Nhấn để chọn địa điểm từ bản đồ..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 animate-pulse" />
                    </div>
                </div>
             </div>

             {/* Map Preview */}
             {watch('location_address') && (
                <div className="space-y-2 animate-in fade-in duration-500">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center">
                        Vị trí đã chọn
                    </label>
                    <div className="w-full h-[250px] bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            scrolling="no" 
                            marginHeight="0" 
                            marginWidth="0" 
                            src={`https://maps.google.com/maps?q=${watch('latitude')},${watch('longitude')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        ></iframe>
                    </div>
                </div>
             )}

             <div className="p-6 bg-blue-600/5 rounded-2xl border border-blue-600/10 flex items-start space-x-4">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed italic">
                    <b>Lưu ý:</b> Thời gian sự kiện sau khi đã được Admin duyệt và mở bán sẽ khó có thể thay đổi. Hãy đảm bảo thông tin chính xác tuyệt đối.
                </div>
             </div>
          </div>
        )}

        {/* Step 3: Hạng vé */}
        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">Cấu hình hạng vé</h3>
                <button 
                    type="button"
                    onClick={() => append({ tier_name: '', price: '', quantity_total: '', section_name: '', benefits: '' })}
                    className="flex items-center text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-blue-600/20"
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Thêm hạng vé
                </button>
             </div>

             <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-6 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl relative group-item transition-all hover:border-blue-600/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Tên hạng vé</label>
                                <input 
                                    {...register(`ticket_tiers.${index}.tier_name`, { required: true })}
                                    className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                                    placeholder="VD: Early Bird"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Giá vé (VNĐ)</label>
                                <input 
                                    type="number"
                                    {...register(`ticket_tiers.${index}.price`, { required: true })}
                                    className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                                    placeholder="VD: 500000"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Số lượng</label>
                                <input 
                                    type="number"
                                    {...register(`ticket_tiers.${index}.quantity_total`, { required: true })}
                                    className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                                    placeholder="VD: 100"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Khu vực / Chỗ ngồi (Tùy chọn)</label>
                                <input 
                                    {...register(`ticket_tiers.${index}.section_name`)}
                                    className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                                    placeholder="VD: Zone A - Block 1"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Quyền lợi (Tùy chọn)</label>
                                <input 
                                    {...register(`ticket_tiers.${index}.benefits`)}
                                    className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm font-medium focus:outline-none focus:border-blue-600 transition-all"
                                    placeholder="VD: Tặng kèm nước uống, Sticker"
                                />
                            </div>
                        </div>

                        {fields.length > 1 && (
                            <button 
                                type="button"
                                onClick={() => remove(index)}
                                className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-item-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* Step 4: Chính sách & Hoàn tất */}
        {step === 4 && (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600">Quy định giao dịch</h4>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase italic">Cho phép bán lại</p>
                            <p className="text-[10px] text-gray-400 font-medium">Người dùng có thể bán lại vé trên Marketplace</p>
                        </div>
                        <input type="checkbox" {...register('allow_resale')} className="w-5 h-5 accent-blue-600" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase italic">Cho phép chuyển nhượng</p>
                            <p className="text-[10px] text-gray-400 font-medium">Người dùng có thể tặng hoặc gửi vé cho người khác</p>
                        </div>
                        <input type="checkbox" {...register('allow_transfer')} className="w-5 h-5 accent-blue-600" />
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600">Phí và thời hạn</h4>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Phí bản quyền (%)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                {...register('royalty_fee_percent')}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 italic">Hạn cuối hoàn tiền (Ngày trước sự kiện)</label>
                        <input 
                            type="number"
                            {...register('refund_deadline_days')}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-600 transition-all"
                        />
                    </div>
                </div>
             </div>

             <div className="p-8 bg-black rounded-3xl border border-blue-600/20 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto" />
                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Mọi thứ đã sẵn sàng!</h3>
                <p className="text-sm text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
                    Sau khi nhấn <b>"Gửi yêu cầu"</b>, sự kiện sẽ được chuyển trạng thái chờ duyệt. Admin sẽ kiểm tra thông tin và kích hoạt mở bán trên nền tảng.
                </p>
             </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          {step > 1 ? (
            <button 
                type="button"
                onClick={(e) => prevStep(e)}
                className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10 px-6 py-3 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Quay lại
            </button>
          ) : <div></div>}

          {step < 4 ? (
            <button 
                type="button"
                onClick={(e) => nextStep(e)}
                className="flex items-center bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:brightness-110 transition-all active:scale-95 group"
            >
              Tiếp theo
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setTargetStatus('draft')}
                  className="flex items-center bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 border border-gray-200 dark:border-white/10"
              >
                {isSubmitting && targetStatus === 'draft' ? 'Đang lưu...' : 'Lưu bản nháp'}
              </button>
              
              <button 
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setTargetStatus('pending')}
                  className={`flex items-center bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-blue-600/60 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting && targetStatus === 'pending' ? 'Đang gửi...' : 'Gửi yêu cầu phê duyệt'}
                {!isSubmitting && <CheckCircle2 className="w-5 h-5 ml-2" />}
              </button>
            </div>
          )}
        </div>
      </form>
      
      <AddressMapModal 
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={(data) => {
            setValue('location_address', data.text, { shouldValidate: true });
            setValue('latitude', data.lat);
            setValue('longitude', data.lng);
        }}
      />
    </div>
  );
};

export default CreateEvent;
