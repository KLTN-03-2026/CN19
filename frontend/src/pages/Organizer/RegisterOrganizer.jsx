import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, Briefcase, Mail, Phone, MapPin, UploadCloud, FileText, Lock, ArrowRight, ArrowLeft, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AddressMapModal from '../../components/AddressMapModal';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';

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

  // --- State cho Bước 2: Upload ---
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);

  // --- State cho Bước 3: OTP ---
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(59);
  const otpInputs = useRef([]);

  // Hàm chuyển bước an toàn (Validate trước khi qua Bước 2)
  const handleNextStep = async () => {
    if (step === 1) {
      // Nếu là Customer upgrade thì chỉ cần validate organizerName
      const fieldsToValidate = isCustomerUpgrade 
        ? ['organizerName', 'address']
        : ['organizerName', 'email', 'password', 'phone', 'address'];
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setStep(2);
      else toast.error(t('org.error_fill'));
    }
  };

  // --- Xử lý Drag & Drop (Bước 2) ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error(t('org.error_file_type'));
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error(t('org.error_file_size'));
      return;
    }
    
    setFile(selectedFile);
    setUploadProgress(0);
    
    // Giả lập Progress bar
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 100);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // --- Xử lý Submit Step 2 -> Gửi OTP Step 3 ---
  const handleSendRequest = async () => {
    if (!file) {
      toast.error(t('org.error_missing_file'));
      return;
    }
    try {
      setIsLoading(true);
      const values = watch();
      await authService.sendOrganizerOtp({
        email: values.email,
        phone_number: values.phone,
        full_name: values.organizerName,
        password: values.password || undefined,
        organization_name: values.organizerName,
        address: values.address,
        existing_user_id: isCustomerUpgrade ? user?.id : undefined
      });
      toast.success(t('org.otp_sent') || 'Đã gửi OTP đến email!');
      setStep(3);
      setCountdown(59);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi gửi OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Xử lý OTP (Bước 3) ---
  useEffect(() => {
    let timer;
    if (step === 3 && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Tự nhảy focus sang ô tiếp theo
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
    if (otpCode.length < 6) {
      toast.error(t('org.error_otp_length'));
      return;
    }
    try {
      setIsLoading(true);
      const emailVal = watch('email');
      await authService.verifyOrganizerOtp({ email: emailVal, otp: otpCode });
      toast.success(t('org.success_submit') || 'Hồ sơ đã gửi thành công! Vui lòng chờ Admin duyệt.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xác thực OTP thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy ra giá trị để xem file tải lên là Image hay PDF
  const previewUrl = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  if (user?.organizer_profile?.kyc_status === 'pending') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[600px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl p-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('org.pending_title') || 'Hồ sơ đang chờ duyệt'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            {t('org.pending_desc') || 'Hệ thống đã nhận được hồ sơ của bạn. Ban quản trị BASTICKET đang tiến hành kiểm tra thông tin và sẽ phản hồi trong vòng 24h làm việc.'}
          </p>
          <div className="w-full h-px bg-gray-100 dark:bg-dark-border my-4" />
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white rounded-xl font-bold transition-all"
          >
            Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      
      {/* Wrapper 2 cột */}
      <div className="w-full max-w-[1100px] min-h-[600px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row transition-colors z-20">
        
        {/* CỘT TRÁI: Hình ảnh & Lợi ích */}
        <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-gray-900 to-black text-white p-12 flex-col justify-between relative overflow-hidden border-r border-dark-border">
          {/* Lưới nền trang trí */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-neon-green rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40"></div>

          <div className="relative z-10">
            <Building2 className="w-14 h-14 text-neon-green mb-6" />
            <h2 className="text-3xl font-black mb-4 leading-snug">{t('org.partner_with')}<br/><span className="text-neon-green">BASTICKET</span></h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              {t('org.desc')}
            </p>
            
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
          
          <div className="relative z-10 text-xs text-gray-500">
            {t('org.footer')}
          </div>
        </div>

        {/* CỘT PHẢI: Form Đăng Ký */}
        <div className="w-full md:w-[55%] p-8 md:p-12 relative flex flex-col justify-center">
          
          {/* Thanh Tiến Trình */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-neon-green' : 'text-gray-400'}`}>{t('org.step1')}</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-neon-green' : 'text-gray-400'}`}>{t('org.step2')}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-neon-green transition-all duration-500 ease-out" 
                style={{ width: step === 1 ? '50%' : '100%' }}
              ></div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {step === 1 ? t('org.setup_acc') : t('org.upload_kyc')}
          </h3>

          <form className="flex-1 flex flex-col justify-between" onSubmit={(e) => e.preventDefault()}>
            
            {/* --- BƯỚC 1: THÔNG TIN TÀI KHOẢN --- */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <div className="relative">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">{t('org.name_label')}</label>
                  <input type="text" {...register("organizerName", { required: true })}
                    className={`w-full pl-4 pr-10 py-3 bg-white border ${errors.organizerName ? 'border-red-500' : 'border-gray-300'} text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green transition-colors`}
                    placeholder={t('org.name_placeholder')}
                  />
                  <div className="absolute top-[32px] right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      {t('auth.email')} (*)
                      {isCustomerUpgrade && <span className="ml-2 text-[10px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded-full normal-case font-bold">Từ tài khoản</span>}
                    </label>
                    <input type="email" {...register("email", { required: !isCustomerUpgrade })}
                      readOnly={isCustomerUpgrade}
                      className={`w-full pl-4 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green ${
                        isCustomerUpgrade ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400"><Mail className="w-5 h-5" /></div>
                  </div>
                  
                  {/* Mật khẩu: hiển thị che •••••• nếu là customer nâng cấp, cho nhập nếu là user mới */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      {t('auth.pass')} (*)
                      {isCustomerUpgrade && <span className="ml-2 text-[10px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded-full normal-case font-bold">Từ tài khoản</span>}
                    </label>
                    <input 
                      type="password"
                      {...(isCustomerUpgrade 
                        ? {} // Không đăng ký ràng buộc nếu customer upgrade
                        : register("password", { required: true, minLength: 6 })
                      )}
                      readOnly={isCustomerUpgrade}
                      defaultValue={isCustomerUpgrade ? '99999999' : undefined}
                      className={`w-full pl-4 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green ${
                        isCustomerUpgrade ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400"><Lock className="w-5 h-5" /></div>
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
                      placeholder={isCustomerUpgrade && !user?.phone_number ? 'Vui lòng bổ sung SĐT' : ''}
                      className={`w-full pl-4 pr-10 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-green ${
                        isCustomerUpgrade && user?.phone_number ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
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

            {/* --- BƯỚC 2: TẢI TÀI LIỆU --- */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('org.upload_desc')}
                  </p>
                  
                  {/* Khu vực Drag & Drop */}
                  <div 
                    onClick={() => document.getElementById('file-upload').click()}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    className={`relative w-full h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragActive 
                        ? 'border-neon-green bg-green-50/5 dark:bg-neon-green/10' 
                        : 'border-gray-300 dark:border-dark-border hover:border-neon-green hover:bg-gray-50 dark:hover:bg-dark-bg'
                    }`}
                  >
                    <input id="file-upload" type="file" className="hidden" accept=".jpg,.png,.pdf" onChange={handleFileChange} />
                    
                    {!file ? (
                      <>
                        <UploadCloud className={`w-12 h-12 mb-3 ${isDragActive ? 'text-neon-green' : 'text-gray-400'}`} />
                        <p className="text-gray-700 dark:text-white font-semibold">{t('org.drag_drop')}</p>
                        <p className="text-gray-400 text-xs mt-1">{t('org.or_click')}</p>
                        <div className="mt-4 px-3 py-1 bg-gray-100 dark:bg-[#111] rounded-lg text-xs text-gray-500 font-medium">{t('org.supported_files')}</div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full relative group">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="h-32 object-contain rounded-lg shadow-md mb-2" />
                        ) : (
                          <FileText className="w-16 h-16 text-neon-green mb-2" />
                        )}
                        <p className="text-sm font-medium text-gray-900 dark:text-white max-w-[80%] truncate">{file.name}</p>
                        
                        {/* Thanh Upload Progress (Chỉ hiện khi progress < 100) */}
                        {uploadProgress < 100 && (
                          <div className="w-[80%] h-1.5 bg-gray-200 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-neon-green transition-all" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                        )}
                        {uploadProgress === 100 && (
                          <CheckCircle2 className="w-5 h-5 text-neon-green absolute top-2 right-2" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 mt-auto">
                  <button type="button" onClick={() => setStep(1)}
                    className="px-5 py-4 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={handleSendRequest}
                    className="flex-1 py-4 bg-neon-green hover:bg-neon-hover text-black font-bold rounded-xl shadow-[0_0_15px_rgba(82,196,45,0.4)] transition-all"
                  >
                    {t('org.submit_btn')}
                  </button>
                </div>

              </div>
            )}
          </form>
        </div>

      </div>

      {/* --- BƯỚC 3: MODAL OTP (Phủ mờ toàn màn hình) --- */}
      {step === 3 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"></div>
          
          <div className="relative bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-8 max-w-[420px] w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
            
            <button onClick={() => setStep(2)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            
            <ShieldCheck className="w-16 h-16 text-neon-green mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('org.otp_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6">
              {t('org.otp_desc')}
            </p>

            {/* OTP Inputs */}
            <div className="flex justify-center space-x-2 sm:space-x-3 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => otpInputs.current[i] = el}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 bg-white border border-gray-300 text-gray-900 text-center text-xl font-black rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-green focus:shadow-[0_0_10px_rgba(82,196,45,0.3)] transition-all"
                />
              ))}
            </div>

            <button 
              onClick={verifyOTPAndSubmit}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-black transition-all ${
                isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-neon-green hover:bg-neon-hover shadow-[0_0_15px_rgba(82,196,45,0.4)]'
              }`}
            >
              {isLoading ? t('org.configuring') : t('org.confirm_register')}
            </button>

            <div className="mt-4 text-sm font-medium text-gray-500">
              {countdown > 0 ? (
                <span>{t('org.resend_in')} <span className="text-neon-green font-bold">{countdown}s</span></span>
              ) : (
                <button className="text-neon-green hover:underline">{t('org.resend_now')}</button>
              )}
            </div>

            {/* Note text requirement */}
            <div className="mt-8 border-t border-gray-100 dark:border-dark-border pt-4 w-full">
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
                <Lock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                {t('org.data_encrypted')}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL CHỌN ĐỊA CHỈ & BẢN ĐỒ --- */}
      <AddressMapModal 
        isOpen={isMapModalOpen} 
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={(data) => {
           setValue('address', data.text, { shouldValidate: true });
           setLatLng({ lat: data.lat, lng: data.lng });
        }}
      />

    </div>
  );
};

export default RegisterOrganizer;
