import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Info, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';
import { useTranslation } from 'react-i18next';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Turnstile } from '@marsidev/react-turnstile';

const Login = () => {
  const { register, handleSubmit, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.login);
  const { t } = useTranslation();

  const emailVal = watch("email", "");
  const passVal = watch("password", "");
  const isFormValid = emailVal.length > 0 && passVal.length > 0 && turnstileToken;

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await authService.login(data);
      setAuth(res.user, res.token);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại.');
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
      
      setAuth(res.user, res.token);
      toast.success('Đăng nhập với Google thành công!');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đăng nhập bằng Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col glow-card-green transition-colors">
        
        {/* Header Dark Mode */}
        <div className="border-b border-gray-100 dark:border-dark-border pt-10 pb-6 px-8 flex flex-col items-center justify-center">
          <Shield className="w-12 h-12 text-neon-green mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-wide text-center">
            {t('auth.welcome')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm text-center">{t('auth.welcome_desc')}</p>
        </div>

        {/* Form Content */}
        <form className="p-8 flex flex-col space-y-5" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('auth.email_phone')}</label>
            <div className="relative">
              <input
                type="text"
                {...register("email", { required: true })}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
                placeholder="VD: user@email.com"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500">
                <Info className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('auth.pass')}</label>
              <Link to="/forgot-password" className="text-sm font-semibold text-neon-green hover:text-neon-hover transition-colors">
                {t('auth.forgot')}
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", { required: true })}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
                placeholder="••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-neon-green transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="w-full my-2 overflow-hidden rounded-xl">
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
            className={`w-full py-3.5 rounded-xl font-bold text-[15px] transition-all ${
              isFormValid 
                ? 'bg-neon-green hover:bg-neon-hover text-black shadow-[0_0_15px_rgba(82,196,45,0.4)]' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? t('auth.auth_btn') : t('auth.signin_btn')}
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

          <div className="flex flex-col items-center space-y-3 ">
            <div className="text-[14px] text-gray-500 dark:text-gray-400 ">
              {t('auth.no_acc')}{' '}
              <Link to="/register" className="text-neon-green font-semibold hover:text-neon-hover">
                {t('auth.create_btn')}
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {t('auth.terms1')}
            <Link to="/terms" className="text-neon-green hover:underline">{t('auth.terms2')}</Link>
            {t('auth.terms3')}
            <Link to="/privacy" className="text-neon-green hover:underline">{t('auth.terms4')}</Link>
            {t('auth.terms5')}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
