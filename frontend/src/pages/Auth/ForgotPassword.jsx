import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Shield, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await authService.forgotPassword(email);
      toast.success(t('auth.forgot_otp_sent') || 'OTP đã được gửi tới email của bạn!');
      // Chuyển sang trang Reset Password và truyền email qua state
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col glow-card-green transition-colors">
        
        {/* Nút X quay lại màn hình trước đó */}
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="border-b border-gray-100 dark:border-dark-border pt-10 pb-6 px-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-neon-green/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-neon-green" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
            {t('profile.forgot.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            {t('profile.forgot.desc')}
          </p>
        </div>

        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('profile.forgot.email_placeholder')}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl text-sm font-bold focus:border-neon-green outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 bg-neon-green hover:bg-neon-hover text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(82,196,45,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('profile.forgot.send_btn')}
          </button>

          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-neon-green transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
