import React, { useState, useEffect } from 'react';
import { 
    User, 
    Building2, 
    Mail, 
    Phone, 
    MapPin, 
    Globe, 
    Camera, 
    ShieldCheck, 
    ShieldAlert, 
    Clock,
    Save,
    Loader2,
    Info
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import { organizerService } from '../../services/organizer.service';
import { useAuthStore } from '../../store/useAuthStore';

const OrganizerProfile = () => {
    const { user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [previewLogo, setPreviewLogo] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const res = await organizerService.getSelfProfile();
            const data = res.data;
            setProfileData(data);
            
            // Set form values
            setValue('organization_name', data.organization_name);
            setValue('description', data.description || '');
            setValue('address_raw', data.address_raw || '');
            setValue('full_name', data.user.full_name || '');
            setValue('avatar_url', data.user.avatar_url || '');
            
            setPreviewLogo(data.user.avatar_url);
        } catch (error) {
            toast.error('Không thể tải thông tin hồ sơ.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        setPreviewLogo(URL.createObjectURL(file));
        setUploadProgress(10);

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
            setValue('avatar_url', res.data.secure_url, { shouldDirty: true });
            toast.success("Tải logo lên thành công!");
        } catch (error) {
            toast.error("Lỗi khi tải logo lên.");
        } finally {
            setUploadProgress(0);
        }
    };

    const onSubmit = async (data) => {
        try {
            setIsSaving(true);
            const response = await organizerService.updateProfile(data);
            
            if (response.success || response.message) {
                // Update local auth store only if user exists
                updateUser({
                    full_name: data.full_name,
                    avatar_url: data.avatar_url
                });
                
                toast.success('Cập nhật hồ sơ thành công!');
                // Wait a bit before fetching to ensure DB consistency
                setTimeout(() => fetchProfile(), 500);
            }
        } catch (error) {
            console.error('Lỗi khi submit hồ sơ:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Lỗi không xác định khi cập nhật hồ sơ.';
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Đang tải hồ sơ...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase">Hồ sơ tổ chức</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-[11px] md:text-xs">Quản lý danh tính và thông tin hiển thị của đơn vị tổ chức.</p>
                </div>
                <div className="flex items-center gap-3">
                     <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        profileData?.is_verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                        {profileData?.is_verified ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        {profileData?.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Avatar & KYC */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm text-center">
                        <div className="relative w-28 h-28 mx-auto mb-4">
                            <div className="w-full h-full rounded-3xl overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 shadow-inner flex items-center justify-center">
                                {previewLogo ? (
                                    <img src={previewLogo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="w-10 h-10 text-gray-300" />
                                )}
                                {uploadProgress > 0 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
                                        <span className="text-white text-xs font-black">{uploadProgress}%</span>
                                    </div>
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-all active:scale-95">
                                <Camera className="w-3.5 h-3.5" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase truncate px-2">{profileData?.organization_name}</h3>
                        <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-tight">ID: {profileData?.id}</p>
                        
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                    <Mail className="w-3 h-3 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Email đăng ký</p>
                                    <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">{profileData?.user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                    <Clock className="w-3 h-3 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tight">Ngày gia nhập</p>
                                    <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                                        {new Date(profileData?.user?.created_at).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl text-white shadow-lg shadow-blue-600/20">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <h4 className="font-black uppercase text-xs tracking-tight">Trạng thái KYC</h4>
                        </div>
                        <p className="text-[10px] text-white/80 leading-relaxed font-medium">
                            Xác minh danh tính giúp tăng hạn mức rút tiền và tạo sự tin tưởng tuyệt đối với khách hàng.
                        </p>
                        <div className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase">Trạng thái:</span>
                                <span className="text-[9px] font-black uppercase bg-white text-blue-600 px-2 py-0.5 rounded-md">
                                    {profileData?.is_verified ? 'Đã duyệt' : (profileData?.kyc_status === 'pending' ? 'Chờ duyệt' : 'Chưa bắt đầu')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form Fields */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-[#111114] p-6 md:p-8 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
                            <div className="p-2.5 bg-blue-600/10 rounded-xl">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Thông tin chi tiết</h3>
                                <p className="text-[10px] font-black text-blue-600 mt-0.5">Vui lòng cung cấp thông tin chính xác</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                                        <Building2 className="w-2.5 h-2.5" /> Tên tổ chức / Thương hiệu
                                    </label>
                                    <input 
                                        {...register('organization_name', { required: 'Vui lòng nhập tên tổ chức' })}
                                        placeholder="Ví dụ: Vieon Entertainment"
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all dark:text-white"
                                    />
                                    {errors.organization_name && <p className="text-[9px] text-red-500 font-bold italic ml-1">{errors.organization_name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                                        <User className="w-2.5 h-2.5" /> Người đại diện (Hệ thống)
                                    </label>
                                    <input 
                                        {...register('full_name', { required: 'Vui lòng nhập tên người đại diện' })}
                                        placeholder="Họ và tên"
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all dark:text-white"
                                    />
                                    {errors.full_name && <p className="text-[9px] text-red-500 font-bold italic ml-1">{errors.full_name.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                                    <Info className="w-2.5 h-2.5" /> Giới thiệu đơn vị tổ chức
                                </label>
                                <textarea 
                                    {...register('description')}
                                    rows={3}
                                    placeholder="Mô tả ngắn gọn về kinh nghiệm, quy mô và các lĩnh vực sự kiện của bạn..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 px-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all dark:text-white resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                                        <MapPin className="w-2.5 h-2.5" /> Địa chỉ trụ sở
                                    </label>
                                    <input 
                                        {...register('address_raw')}
                                        placeholder="Số nhà, Tên đường, Quận/Huyện..."
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                                        <Phone className="w-2.5 h-2.5" /> Hotline liên hệ
                                    </label>
                                    <input 
                                        type="tel"
                                        placeholder="0123 456 789"
                                        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-5 text-sm font-bold focus:outline-none cursor-not-allowed opacity-70 dark:text-white"
                                        defaultValue={profileData?.user?.phone_number}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">Hiển thị công khai</p>
                                    <p className="text-[9px] font-bold text-gray-400">Thông tin này sẽ hiện trên trang chi tiết sự kiện.</p>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSaving || !isDirty}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2.5 active:scale-95"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default OrganizerProfile;
