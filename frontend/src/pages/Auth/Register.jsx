import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Info, Eye, EyeOff, User, Phone, ShieldCheck, X, Lock, Calendar } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Turnstile } from '@marsidev/react-turnstile';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(59);
  const otpInputs = useRef([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const emailVal = watch("email", "");
  const passVal = watch("password", "");
  const confirmPassVal = watch("confirmPassword", "");
  const nameVal = watch("full_name", "");
  const phoneVal = watch("phone_number", "");
  const dobVal = watch("date_of_birth", "");
  
  const isFormValid = emailVal && passVal && confirmPassVal && nameVal && phoneVal && dobVal && turnstileToken;

  const onSubmitStep1 = async (data) => {
    try {
      setIsLoading(true);
      await authService.sendRegisterOtp(data);
      toast.success(t('org.otp_sent') || 'Đã gửi mã OTP đến email của bạn!');
      setStep(2);
      setCountdown(59);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi gửi yêu cầu đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- OTP Logic ---
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 5) otpInputs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const onVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      toast.error(t('org.error_otp_length'));
      return;
    }
    try {
      setIsLoading(true);
      await authService.verifyRegisterOtp({ email: emailVal, otp: otpCode });
      toast.success(t('auth.register_success') || 'Đăng ký tài khoản thành công!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Xác thực OTP thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const res = await authService.googleLogin({
        email: user.email,
        name: user.displayName,
        uid: user.uid,
        photoURL: user.photoURL
      });
      
      const { login: setAuth } = useAuthStore.getState();
      setAuth(res.user, res.token);
      toast.success('Liên kết tài khoản Google thành công!');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đăng nhập bằng Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col glow-card-green transition-colors">
        
        {/* Header Dark/Light Mode */}
        <div className="border-b border-gray-100 dark:border-dark-border pt-8 pb-6 px-8 flex flex-col items-center justify-center">
          <ShieldCheck className="w-12 h-12 text-neon-green mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-wide text-center">
            {t('auth.create')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm text-center">{t('auth.create_desc')}</p>
        </div>

        {/* Form Content */}
        <form className="p-8 flex flex-col space-y-4" onSubmit={handleSubmit(onSubmitStep1)}>
          
          <div className="relative">
            <input
              type="text"
              {...register("full_name", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder={t('auth.name')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500">
              <User className="w-5 h-5" />
            </div>
          </div>
          
          <div className="relative">
            <input
              type="email"
              {...register("email", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder={t('auth.email')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500">
              <Info className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              {...register("phone_number", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder={t('auth.phone')}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500">
              <Phone className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <input
              type="date"
              {...register("date_of_birth", { 
                required: true,
                validate: value => {
                  const selectedDate = new Date(value);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  if (selectedDate > today) return "Ngày sinh không thể ở tương lai";
                  
                  // Kiểm tra tối thiểu 13 tuổi (Tùy chọn nhưng nên có)
                  const minAgeDate = new Date();
                  minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
                  if (selectedDate > minAgeDate) return "Bạn phải từ 13 tuổi trở lên để sử dụng hệ thống";
                  
                  return true;
                }
              })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors appearance-none cursor-pointer"
              placeholder={t('auth.dob')}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          {errors.date_of_birth && <p className="text-sm text-red-500 mt-1">{errors.date_of_birth.message}</p>}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", { required: true, minLength: 6 })}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder={t('auth.pass')}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-neon-green transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword", { 
                required: true,
                validate: value => value === passVal || "Mật khẩu không khớp"
              })}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder={t('auth.cpass')}
            />
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}

          <div className="w-full mt-2 mb-1 overflow-hidden rounded-xl">
            <Turnstile 
              siteKey="1x00000000000000000000AA"
              onSuccess={(token) => setTurnstileToken(token)}
              options={{ theme: 'auto', size: 'flexible' }}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-[15px] transition-all mt-4 ${
              isFormValid 
                ? 'bg-neon-green hover:bg-neon-hover text-black shadow-[0_0_15px_rgba(82,196,45,0.4)]' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? t('auth.creating_btn') : t('auth.create_btn')}
          </button>

          {/* Ngăn cách */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-200 dark:border-dark-border"></div>
            <span className="mx-4 text-sm text-gray-400 dark:text-gray-500 font-medium">{t('auth.or')}</span>
            <div className="flex-grow border-t border-gray-200 dark:border-dark-border"></div>
          </div>

          {/* Google Button Oauth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full py-4 bg-transparent border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 rounded-xl font-bold text-[15px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center space-x-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            {t('auth.google')}
          </button>

          <div className="flex flex-col items-center space-y-3 pt-1">
            <div className="text-[14px] text-gray-500 dark:text-gray-400">
              {t('auth.yes_acc')}{' '}
              <Link to="/login" className="text-neon-green font-semibold hover:text-neon-hover">
                {t('auth.signin_btn')}
              </Link>
            </div>
          </div>

          <div className="text-center  text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {t('auth.terms1')}
            <Link to="/terms" className="text-neon-green hover:underline">{t('auth.terms2')}</Link>
            {t('auth.terms3')}
            <Link to="/privacy" className="text-neon-green hover:underline">{t('auth.terms4')}</Link>
            {t('auth.terms5')}
          </div>
        </form>
      </div>

      {/* --- MÀN HÌNH NHẬP OTP BƯỚC 2 --- */}
      {step === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"></div>
          
          <div className="relative bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-8 max-w-[420px] w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
            
            <button onClick={() => setStep(1)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            
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
              onClick={onVerifyOtp}
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
                <button 
                  className="text-neon-green hover:underline cursor-pointer tracking-wide"
                  onClick={handleSubmit(onSubmitStep1)}
                >
                  {t('org.resend_now')}
                </button>
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
    </div>
  );
};

export default Register;
