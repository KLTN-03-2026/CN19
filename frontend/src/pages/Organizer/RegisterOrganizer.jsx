import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Building2, Briefcase, Mail, Phone, MapPin, UploadCloud, FileText, 
  Lock as LockIcon, ArrowRight, ArrowLeft, X, ShieldCheck, CheckCircle2,
  RefreshCw, Camera
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AddressMapModal from '../../components/AddressMapModal';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';
import WebcamCapture from '../../components/KYC/WebcamCapture';
import axios from 'axios';
import api from '../../services/api';

const RegisterOrganizer = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm({ mode: 'onChange' });
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // --- Pre-fill nếu là Customer đã đăng nhập ---
  const isCustomerUpgrade = isAuthenticated && user?.role === 'customer';
  useEffect(() => {
    if (isCustomerUpgrade && user) {
      setValue('email', user.email || '');
      setValue('phone', user.phone_number || '');
    }
  }, [isCustomerUpgrade, user, setValue]);

  // --- State cho Modal Bản Đồ Địa chỉ ---
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [latLng, setLatLng] = useState(null);

  // --- State cho eKYC ---
  const [kycUrls, setKycUrls] = useState({ front: '', back: '', selfie: '', license: '' });
  const [ocrData, setOcrData] = useState(null);
  const [biometricResult, setBiometricResult] = useState(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // --- State cho OTP ---
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(59);
  const otpInputs = useRef([]);

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await trigger(isCustomerUpgrade ? ['organizerName', 'address'] : ['organizerName', 'email', 'password', 'phone', 'address']);
      if (isValid) setStep(2);
      else toast.error(t('org.error_fill'));
    } else if (step === 2) {
      if (!kycUrls.front || !kycUrls.back || !ocrData || !kycUrls.license) {
        toast.error("Vui lòng tải lên đủ CCCD (đã bóc tách) và Giấy phép kinh doanh.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!kycUrls.selfie || !biometricResult) {
        toast.error("Vui lòng hoàn tất xác thực khuôn mặt.");
        return;
      }
      handleSendRequest();
    }
  };

  // Dùng ref để tránh vòng lặp vô hạn khi gọi API lỗi
  const lastProcessedUrls = useRef("");

  // Tự động kích hoạt OCR khi đã có đủ 2 mặt ảnh
  useEffect(() => {
    const currentUrls = `${kycUrls.front}-${kycUrls.back}`;
    // Chỉ kích hoạt nếu: có đủ 2 mặt, chưa có ocrData, không đang xử lý, và chưa từng gọi cho cặp URL này
    if (kycUrls.front && kycUrls.back && !ocrData && !isProcessingAI && lastProcessedUrls.current !== currentUrls) {
      console.log('--- useEffect trigger OCR ---', currentUrls);
      lastProcessedUrls.current = currentUrls;
      triggerOCR(kycUrls.front, kycUrls.back);
    }
  }, [kycUrls.front, kycUrls.back, ocrData, isProcessingAI]);

  const triggerOCR = async (front, back) => {
    if (!front || !back) {
      console.warn("Dữ liệu ảnh không đủ để bóc tách OCR.");
      return;
    }
    const toastId = toast.loading("Đang bóc tách dữ liệu AI...");
    try {
      console.log('--- Bắt đầu gọi API OCR ---');
      console.log('Front URL:', front);
      console.log('Back URL:', back);
      setIsProcessingAI(true);
      const res = await api.post('/kyc/ocr', { front_url: front, back_url: back });
      console.log('Kết quả OCR thành công:', res.data);
      setOcrData(res.data.data);
      toast.success("Xác thực thông tin thẻ thành công!", { id: toastId });
    } catch (error) {
      console.error('Lỗi OCR chi tiết:', error.response?.data || error.message);
      const errMsg = error.response?.data?.error || "Không thể bóc tách thông tin thẻ.";
      toast.error(errMsg, { id: toastId });
      // Đảm bảo ocrData vẫn null để nút TIẾP TỤC bị mờ
      setOcrData(null);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const uploadToCloudinary = async (side, selectedFile) => {
    if (!selectedFile) return;
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', uploadPreset);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
      const url = res.data.secure_url;
      setKycUrls(prev => ({ ...prev, [side]: url }));
    } catch (error) {
      toast.error("Lỗi khi tải ảnh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfieCapture = async (dataUri) => {
    if (!dataUri) return;
    setIsLoading(true);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const formData = new FormData();
    formData.append('file', dataUri);
    formData.append('upload_preset', uploadPreset);
    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData);
      const selfieUrl = res.data.secure_url;
      setKycUrls(prev => ({ ...prev, selfie: selfieUrl }));
      setIsProcessingAI(true);
      const bioRes = await api.post('/kyc/verify-biometric', { 
        id_card_face_url: kycUrls.front, 
        captured_face_url: selfieUrl 
      });
      setBiometricResult(bioRes.data.data);
      toast.success("Xác thực sinh trắc học thành công!");
    } catch (error) {
      console.error('Lỗi Biometric:', error.response?.data || error.message);
      const errMsg = error.response?.data?.error || "Lỗi xác thực sinh trắc học.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
      setIsProcessingAI(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      setIsLoading(true);
      const values = watch();
      await authService.sendOrganizerOtp({
        email: values.email, 
        phone_number: values.phone, 
        full_name: values.organizerName, 
        password: values.password || undefined, 
        organization_name: values.organizerName, 
        address: values.address, // Địa chỉ ngoại trú / nơi ở hiện tại
        description: values.description, // Mô tả ban tổ chức
        latitude: latLng?.lat,
        longitude: latLng?.lng,
        existing_user_id: isCustomerUpgrade ? user?.id : undefined,
        business_license: kycUrls.license, 
        kyc_data: {
          ...ocrData, 
          front_image_url: kycUrls.front, 
          back_image_url: kycUrls.back, 
          face_image_url: kycUrls.selfie, 
          facematch_score: biometricResult?.similarity, 
          liveness_score: biometricResult?.is_live ? 100 : 0
        }
      });
      setStep(4);
      setCountdown(59);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi gửi OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (step === 4 && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const verifyOTPAndSubmit = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) return;
    try {
      setIsLoading(true);
      await authService.verifyOrganizerOtp({ email: watch('email'), otp: otpCode });
      toast.success(t('org.success_submit') || 'Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xác thực OTP thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.organizer_profile?.kyc_status === 'pending') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[600px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl p-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('org.pending_title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{t('org.pending_desc')}</p>
          <div className="w-full h-px bg-gray-100 dark:bg-dark-border my-4" />
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl font-bold transition-all">Quay lại Trang chủ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-[1100px] min-h-[600px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row transition-colors z-20">
        
        {/* CỘT TRÁI - COPY Y NGUYÊN CLASS */}
        <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-gray-900 to-black text-white p-12 flex-col justify-between relative overflow-hidden border-r border-dark-border">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-neon-green rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
          <div className="relative z-10">
            <Building2 className="w-14 h-14 text-neon-green mb-6" />
            <h2 className="text-3xl font-black mb-4 leading-snug">{t('org.partner_with')}<br/><span className="text-neon-green">BASTICKET</span></h2>
            <p className="text-gray-400 mb-8 leading-relaxed font-normal">{t('org.desc')}</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-300">
                <ShieldCheck className="w-5 h-5 text-neon-green" />
                <span>{t('org.benefit1')}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <ShieldCheck className="w-5 h-5 text-neon-green" />
                <span>{t('org.benefit2')}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-300">
                <ShieldCheck className="w-5 h-5 text-neon-green" />
                <span>{t('org.benefit3')}</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 text-xs text-gray-500">{t('org.footer')}</div>
        </div>

        {/* CỘT PHẢI - COPY Y NGUYÊN CLASS, KHÔNG THÊM BẤT CỨ GÌ */}
        <div className="w-full md:w-[55%] p-8 md:p-12 relative flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-neon-green' : 'text-gray-400'}`}>{t('org.step1')}</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-neon-green' : 'text-gray-400'}`}>{t('org.step2')}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-neon-green transition-all duration-500 ease-out" style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}></div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {step === 1 ? t('org.setup_acc') : step === 2 ? 'Tải lên CCCD' : step === 3 ? 'Xác thực sinh trắc' : 'Xác thực OTP'}
          </h3>

          <form className="flex-1 flex flex-col justify-between" onSubmit={(e) => e.preventDefault()}>
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{t('org.name_label')}</label>
                  <input type="text" {...register("organizerName", { required: true })}
                    className={`w-full pl-4 pr-10 py-3 bg-white border ${errors.organizerName ? 'border-red-500' : 'border-gray-300'} text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green transition-colors`}
                    placeholder={t('org.name_placeholder')}
                  />
                  <div className="absolute top-[32px] right-0 pr-3 flex items-center pointer-events-none text-gray-400"><Briefcase className="w-5 h-5" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      {t('auth.email')} (*)
                      {isCustomerUpgrade && <span className="ml-2 text-[10px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded-full normal-case font-bold">Từ tài khoản</span>}
                    </label>
                    <input type="email" {...register("email", { required: !isCustomerUpgrade })}
                      readOnly={isCustomerUpgrade}
                      className={`w-full pl-4 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green ${isCustomerUpgrade ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400"><Mail className="w-5 h-5" /></div>
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      {t('auth.pass')} (*)
                      {isCustomerUpgrade && <span className="ml-2 text-[10px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded-full normal-case font-bold">Từ tài khoản</span>}
                    </label>
                    <input type="password" {...(isCustomerUpgrade ? {} : register("password", { required: true, minLength: 6 }))}
                      readOnly={isCustomerUpgrade}
                      defaultValue={isCustomerUpgrade ? '99999999' : undefined}
                      className={`w-full pl-4 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green ${isCustomerUpgrade ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400"><LockIcon className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      {t('auth.phone')} (*)
                      {isCustomerUpgrade && user?.phone_number && <span className="ml-2 text-[10px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded-full normal-case font-bold">Từ tài khoản</span>}
                    </label>
                    <input type="text" {...register("phone", { required: true })}
                      readOnly={isCustomerUpgrade && !!user?.phone_number}
                      className={`w-full pl-4 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green ${isCustomerUpgrade && user?.phone_number ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400"><Phone className="w-5 h-5" /></div>
                  </div>
                  <div className="relative cursor-pointer" onClick={() => setIsMapModalOpen(true)}>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('org.address_label')}</label>
                    <input type="text" {...register("address", { required: true })}
                      readOnly
                      placeholder={t('map.click_to_pin')}
                      className="w-full pl-4 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green cursor-pointer"
                    />
                    <div className="absolute top-[32px] right-0 pr-3 flex items-center text-neon-green"><MapPin className="w-5 h-5 animate-bounce" /></div>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{t('org.desc_label')}</label>
                  <textarea {...register("description")} rows="2"
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green resize-none"
                    placeholder={t('org.desc_placeholder')}
                  ></textarea>
                </div>

                <button type="button" onClick={handleNextStep}
                  className="w-full py-4 mt-4 bg-neon-green hover:bg-neon-hover text-black font-bold rounded-xl flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(82,196,45,0.4)] transition-all"
                >
                  <span>{t('org.continue')}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full overflow-y-auto pr-1 custom-scrollbar">
                
                {/* 1. Phần CCCD (eKYC) */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Xác thực ID (CCCD/CMND)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['front', 'back'].map((side) => (
                      <div key={side} className="relative group">
                        <div onClick={() => !kycUrls[side] && document.getElementById(`file-${side}`).click()}
                          className={`relative w-full h-[140px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                            kycUrls[side] 
                              ? 'border-neon-green bg-green-50/5' 
                              : 'border-gray-300 hover:border-neon-green cursor-pointer'
                          }`}
                        >
                          <input id={`file-${side}`} type="file" className="hidden" accept="image/*" onChange={(e) => uploadToCloudinary(side, e.target.files[0])} />
                          {kycUrls[side] ? (
                            <img src={kycUrls[side]} alt={side} className="w-full h-full object-cover rounded-2xl shadow-sm" />
                          ) : (
                            <><UploadCloud className="w-8 h-8 mb-2 text-gray-400" /><p className="text-[10px] font-bold text-gray-400 uppercase">Mặt {side === 'front' ? 'trước' : 'sau'}</p></>
                          )}
                        </div>
                        {kycUrls[side] && (
                          <button 
                            type="button"
                            onClick={() => removeImage(side)}
                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Phần Giấy phép kinh doanh (License) */}
                <div className="relative group">
                  <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Giấy phép kinh doanh / Pháp lý</label>
                  <div onClick={() => !kycUrls.license && document.getElementById('file-license').click()}
                    className={`relative w-full h-[120px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                      kycUrls.license 
                        ? 'border-neon-green bg-green-50/5' 
                        : 'border-gray-300 hover:border-neon-green cursor-pointer'
                    }`}
                  >
                    <input id="file-license" type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => uploadToCloudinary('license', e.target.files[0])} />
                    {kycUrls.license ? (
                      <div className="flex items-center space-x-3 p-4">
                        <FileText className="w-10 h-10 text-neon-green" />
                        <span className="text-xs font-bold text-gray-700 dark:text-white truncate max-w-[200px]">Đã tải lên giấy tờ</span>
                      </div>
                    ) : (
                      <><UploadCloud className="w-8 h-8 mb-2 text-gray-400" /><p className="text-[10px] font-bold text-gray-400 uppercase">Tải lên Giấy phép (.png, .jpg, .pdf)</p></>
                    )}
                  </div>
                  {kycUrls.license && (
                    <button 
                      type="button"
                      onClick={() => removeImage('license')}
                      className="absolute top-[28px] -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Trạng thái AI */}
                {isProcessingAI ? (
                  <div className="flex items-center justify-center space-x-2 p-3 bg-neon-green/5 border border-dashed border-neon-green/30 rounded-xl animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-neon-green" />
                    <span className="text-[10px] font-bold text-neon-green uppercase tracking-wider">Đang bóc tách AI...</span>
                  </div>
                ) : (
                  !ocrData && kycUrls.front && kycUrls.back && (
                    <div className="flex flex-col items-center space-y-1">
                       <button type="button" onClick={() => { lastProcessedUrls.current = ""; triggerOCR(kycUrls.front, kycUrls.back); }}
                        className="text-[10px] font-black text-red-500 uppercase hover:underline"
                       >
                         Thử lại bóc tách
                       </button>
                    </div>
                  )
                )}

                {ocrData && (
                  <div className="px-5 py-4 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-dark-border rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-2">
                       <p className="text-[10px] font-black text-neon-green uppercase tracking-widest">THÔNG TIN TRÍCH XUẤT</p>
                       <span className="text-[9px] bg-neon-green/10 text-neon-green px-2 py-0.5 rounded-full font-bold">XÁC MINH AI</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Họ và Tên</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase leading-tight">{ocrData.full_name}</p>
                      </div>
                      
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Số CCCD</p>
                        <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{ocrData.id_number}</p>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Ngày sinh</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{ocrData.dob}</p>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Giới tính</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{ocrData.sex || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Quốc tịch</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{ocrData.nationality || 'VIỆT NAM'}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Quê quán</p>
                        <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 leading-normal">{ocrData.home || 'N/A'}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Địa chỉ thường trú</p>
                        <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 leading-normal">{ocrData.address}</p>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Ngày hết hạn</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{ocrData.doe || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Ngày cấp</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{ocrData.issue_date || 'N/A'}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Nơi cấp</p>
                        <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 leading-normal">{ocrData.issue_loc || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 mt-auto pt-2">
                  <button type="button" onClick={() => setStep(1)} className="px-5 py-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={handleNextStep} disabled={!ocrData || !kycUrls.license || isProcessingAI || isLoading} 
                    className="flex-1 py-4 bg-neon-green text-black font-bold rounded-xl disabled:opacity-50 tracking-wider uppercase flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(82,196,45,0.4)] transition-all"
                  >
                    TIẾP TỤC
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300 flex flex-col items-center">
                <WebcamCapture onCapture={handleSelfieCapture} />
                {biometricResult && (
                  <div className={`w-full p-4 rounded-2xl border-2 flex justify-between items-center ${biometricResult.similarity >= 80 ? 'border-neon-green bg-green-50/5' : 'border-red-500 bg-red-50'}`}>
                    <span className="text-xs font-bold text-gray-500 uppercase">Khớp: {biometricResult.similarity.toFixed(2)}%</span>
                    <ShieldCheck className={biometricResult.similarity >= 80 ? 'text-neon-green' : 'text-red-500'} />
                  </div>
                )}
                <div className="flex space-x-3 w-full mt-auto">
                  <button type="button" onClick={() => setStep(2)} className="px-5 py-4 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                  <button type="button" onClick={handleNextStep} disabled={!biometricResult || biometricResult.similarity < 80 || isLoading} className="flex-1 py-4 bg-neon-green hover:bg-neon-hover text-black font-bold rounded-xl shadow-[0_0_15px_rgba(82,196,45,0.4)] transition-all">GỬI OTP</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {step === 4 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"></div>
          <div className="relative bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-8 max-w-[420px] w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
            <button onClick={() => setStep(3)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            <ShieldCheck className="w-16 h-16 text-neon-green mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('org.otp_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">{t('org.otp_desc')}</p>
            <div className="flex justify-center space-x-2 sm:space-x-3 mb-6">
              {otp.map((digit, i) => (
                <input key={i} type="text" maxLength="1" value={digit} ref={(el) => otpInputs.current[i] = el} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} className="w-12 h-14 bg-white border border-gray-300 text-gray-900 text-center text-xl font-black rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green transition-all" />
              ))}
            </div>
            <button onClick={verifyOTPAndSubmit} disabled={isLoading} className="w-full py-4 bg-neon-green hover:bg-neon-hover text-black font-bold rounded-xl shadow-[0_0_15px_rgba(82,196,45,0.4)] transition-all">Xác thực</button>
            <div className="mt-4 text-sm font-medium text-gray-500">
              {countdown > 0 ? <span>{t('org.resend_in')} <span className="text-neon-green font-bold">{countdown}s</span></span> : <button onClick={handleSendRequest} className="text-neon-green font-bold hover:underline">Gửi lại</button>}
            </div>
          </div>
        </div>
      )}

      <AddressMapModal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)} onConfirm={(data) => {
         setValue('address', data.text, { shouldValidate: true });
         setLatLng({ lat: data.lat, lng: data.lng }); // Lưu tọa độ vào state
      }} />
    </div>
  );
};

export default RegisterOrganizer;
