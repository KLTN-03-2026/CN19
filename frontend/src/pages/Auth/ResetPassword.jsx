import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Loader2, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword({
        email,
        otp,
        new_password: newPassword
      });
      toast.success(t('profile.forgot.success'));
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Thiếu thông tin Email xác thực.</p>
          <Link to="/forgot-password" className="text-neon-green font-bold">Quay lại</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col glow-card-green transition-colors">
        
        <div className="border-b border-gray-100 dark:border-dark-border pt-10 pb-6 px-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-neon-green" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
            {t('profile.forgot.verify_title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {t('profile.forgot.verify_desc')}
          </p>
          <div className="mt-3 px-3 py-1 bg-neon-green/5 rounded-lg border border-neon-green/10">
            <span className="text-xs font-bold text-neon-green">{email}</span>
          </div>
        </div>

        <form className="p-8 space-y-5" onSubmit={handleSubmit}>
          {/* OTP Code */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
              {t('profile.forgot.otp_label')}
            </label>
            <input 
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full px-4 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:border-neon-green outline-none transition-all dark:text-white placeholder:tracking-normal placeholder:text-gray-300"
            />
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
              {t('profile.forgot.new_pass_label')}
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl text-sm font-bold focus:border-neon-green outline-none transition-all dark:text-white"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neon-green transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">
              Xác nhận mật khẩu
            </label>
            <input 
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl text-sm font-bold focus:border-neon-green outline-none transition-all dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6 || !newPassword}
            className="w-full py-4 bg-neon-green hover:bg-neon-hover text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(82,196,45,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('profile.forgot.reset_btn')}
          </button>

          <Link 
            to="/forgot-password" 
            className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-neon-green transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thử lại với Email khác</span>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
