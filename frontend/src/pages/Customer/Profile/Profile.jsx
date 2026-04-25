import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Wallet, Shield, 
  Camera, ChevronRight, ExternalLink, 
  Lock, Bell, Globe, Save, Loader2, X,
  CreditCard, History
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { userService } from '../../../services/user.service';
import { revenueService } from '../../../services/revenue.service';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'wallet', 'security'
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0');
  const [vndBalance, setVndBalance] = useState(0);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change Password States
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPass, setChangingPass] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.full_name || user?.fullName || '',
    phoneNumber: user?.phone_number || '',
    address: user?.address || '',
    dateOfBirth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
    avatarUrl: user?.avatar_url || '',
    bankName: user?.bank_name || '',
    accountNumber: user?.account_number || '',
    accountHolder: user?.account_holder || '',
  });

  // Helper chuyển đổi DD/MM/YYYY của CCCD sang YYYY-MM-DD cho input
  const formatOcrDate = (dateStr) => {
    if (!dateStr || !dateStr.includes('/')) return '';
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  useEffect(() => {
    if (user) {
      // Ưu tiên lấy ngày sinh từ CCCD nếu là BTC và info cá nhân trống
      let dobValue = user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '';
      if (!dobValue && user.role === 'organizer' && user.organizer_profile?.dob_raw) {
        dobValue = formatOcrDate(user.organizer_profile.dob_raw);
      }

      // Ưu tiên lấy địa chỉ từ hồ sơ CCCD nếu là BTC và chưa có địa chỉ ngoại trú
      let addressValue = user.address || '';
      if (!addressValue && user.role === 'organizer' && user.organizer_profile?.address_raw) {
        addressValue = user.organizer_profile.address_raw;
      }

      setFormData({
        fullName: user.full_name || user.fullName || '',
        phoneNumber: user.phone_number || '',
        address: addressValue,
        dateOfBirth: dobValue,
        avatarUrl: user.avatar_url || '',
      });
      fetchWalletBalance();
      
      // Đồng bộ thông tin mới nhất từ DB
      const syncProfile = async () => {
        try {
          const res = await userService.getProfile();
          if (res.data) {
            updateUser(res.data);
          }
        } catch (err) {
          console.error('Failed to sync profile', err);
        }
      };
      syncProfile();
    }
  }, [user?.id]);

  const fetchWalletBalance = async () => {
    try {
      setLoadingFinancial(true);
      const [walletRes, revenueRes, historyRes] = await Promise.all([
        userService.getWalletBalance(),
        revenueService.getSummary(),
        revenueService.getTransactions()
      ]);
      
      setWalletBalance(walletRes.data?.balance_matic || '0');
      setVndBalance(revenueRes.balance || 0);
      setWithdrawalHistory(historyRes.withdrawalRequests || []);
    } catch (error) {
      console.error('Failed to fetch financial data', error);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(i18n.language.startsWith('vi') ? "Cloudinary chưa được cấu hình (Thiếu Cloud Name hoặc Preset)" : "Cloudinary not configured (Missing Cloud Name or Preset)");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    return res.data.secure_url;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(i18n.language.startsWith('vi') ? 'Ảnh phải nhỏ hơn 2MB' : 'Image must be less than 2MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      const imageUrl = await uploadImageToCloudinary(file);
      
      // Update backend immediately
      const result = await userService.updateProfile({ avatar_url: imageUrl });
      updateUser(result.data);
      setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
      toast.success(i18n.language.startsWith('vi') ? 'Cập nhật ảnh đại diện thành công!' : 'Avatar updated!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(i18n.language.startsWith('vi') ? 'Tải ảnh thất bại' : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        address: formData.address,
        date_of_birth: formData.dateOfBirth,
        avatar_url: formData.avatarUrl,
        bank_name: formData.bankName,
        account_number: formData.accountNumber,
        account_holder: formData.accountHolder,
      };
      const result = await userService.updateProfile(apiData);
      updateUser(result.data);
      setIsEditing(false);
      toast.success(t('profile.labels.save_success'));
    } catch (error) {
      toast.error(error.response?.data?.error || t('profile.labels.update_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(i18n.language.startsWith('vi') ? 'Mật khẩu xác nhận không khớp!' : 'Passwords do not match!');
      return;
    }

    try {
      setChangingPass(true);
      await userService.changePassword({
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword
      });
      toast.success(t('profile.security.change_success'));
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || t('profile.security.change_failed'));
    } finally {
      setChangingPass(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        fullName: user.full_name || user.fullName || '',
        phoneNumber: user.phone_number || '',
        address: user.address || '',
        dateOfBirth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
        avatarUrl: user.avatar_url || '',
        bankName: user.bank_name || '',
        accountNumber: user.account_number || '',
        accountHolder: user.account_holder || '',
      });
    }
  };

  const tabs = [
    { id: 'info', label: t('profile.tabs.info'), icon: User },
    { id: 'wallet', label: t('profile.tabs.wallet'), icon: Wallet },
    { id: 'security', label: t('profile.tabs.security'), icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-transparent pt-6 md:pt-10 pb-20 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Left Column: Sidebar (Avatar + Info + Tabs) */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            
            {/* User Profile Summary Card */}
            <div className="flex flex-col items-center text-center p-5 md:p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-sm relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 p-16 bg-neon-green/10 blur-[50px] rounded-full"></div>
               
               <div className="relative group mb-4 md:mb-5">
                  <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-neon-green/10 border-4 border-neon-green flex items-center justify-center text-3xl md:text-4xl font-black text-neon-green shadow-[0_0_20px_rgba(82,196,45,0.2)] overflow-hidden transition-transform duration-300 group-hover:scale-105">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 md:p-2.5 bg-gray-900 border-2 border-white dark:border-dark-bg rounded-full text-white hover:text-neon-green transition-colors shadow-xl disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
               </div>

               <h1 className="text-xl font-black text-gray-900 dark:text-white mb-1 relative z-10 break-words w-full px-2">
                 {user?.full_name || user?.fullName || t('profile.user')}
               </h1>
               
               <span className="inline-flex items-center px-4 py-1 bg-neon-green/10 text-neon-green text-[10px] font-black rounded-full border border-neon-green/20 mb-3 relative z-10">
                 {t(`profile.roles.${user?.role || 'customer'}`)}
               </span>
               
               <span className="text-gray-500 dark:text-gray-400 text-xs font-medium flex items-center justify-center gap-1.5 relative z-10 break-all px-2 w-full">
                 <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                 <span className="truncate">{user?.email}</span>
               </span>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-center lg:justify-between px-3 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? 'bg-neon-green text-black border-neon-green font-black shadow-[0_0_20px_rgba(82,196,45,0.3)]' 
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/10 font-black hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3">
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span className="text-[10px] lg:text-xs font-black text-center lg:text-left">{tab.label}</span>
                    </div>
                    <ChevronRight className={`hidden lg:block w-4 h-4 transition-transform ${isActive ? 'translate-x-1' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-white/5 rounded-[2rem] md:rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-5 sm:p-8 md:p-12 shadow-sm animate-in slide-in-from-right-8 duration-500">
              
              {activeTab === 'info' && (
                <div className="space-y-8 md:space-y-12">
                  <form onSubmit={handleUpdateProfile} className="space-y-5 md:space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-neon-green uppercase">
                        {t('profile.tabs.info')}
                      </h3>
                      {!isEditing && (
                        <button 
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-neon-green/10 text-neon-green rounded-xl text-[10px] font-black hover:bg-neon-green hover:text-black transition-all"
                        >
                          <Save className="w-3 h-3 rotate-180" />
                          {t('profile.labels.edit_btn')}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                          {t('profile.labels.name')}
                        </label>
                        <input 
                          type="text"
                          value={formData.fullName}
                          readOnly={!isEditing}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                          {t('profile.labels.phone')}
                        </label>
                        <input 
                          type="tel"
                          value={formData.phoneNumber}
                          readOnly={!isEditing}
                          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                          placeholder="Ex: 0912345678"
                          className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                          {t('profile.labels.dob')}
                        </label>
                        <input 
                          type="date"
                          value={formData.dateOfBirth}
                          readOnly={!isEditing}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium transition-all outline-none [color-scheme:light] dark:[color-scheme:dark] ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                        />
                      </div>
                      
                      {user?.role === 'organizer' ? (
                        <div className="space-y-1 animate-in fade-in duration-300">
                          <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                            {t('profile.labels.current_address')}
                          </label>
                          <input 
                            type="text"
                            value={formData.address}
                            readOnly={!isEditing}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder={t('profile.labels.address_placeholder')}
                            className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 hidden md:block">
                           {/* Empty placeholder */}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                        {t('profile.labels.email')}
                      </label>
                      <input 
                        type="email"
                        value={user?.email}
                        readOnly
                        className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-400 dark:text-gray-600 font-medium cursor-not-allowed outline-none"
                      />
                    </div>

                    {/* Bank Information Section */}
                    <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
                       <h4 className="text-xs font-black text-blue-500 uppercase flex items-center gap-2">
                         <CreditCard className="w-4 h-4" /> {t('profile.bank.title')}
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                              {t('profile.bank.bank_name')}
                            </label>
                            <input 
                              type="text"
                              value={formData.bankName}
                              readOnly={!isEditing}
                              onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                              placeholder={t('profile.bank.bank_placeholder')}
                              className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                              {t('profile.bank.account_number')}
                            </label>
                            <input 
                              type="text"
                              value={formData.accountNumber}
                              readOnly={!isEditing}
                              onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                              placeholder={t('profile.bank.account_placeholder')}
                              className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                            />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                            {t('profile.bank.account_holder')}
                          </label>
                          <input 
                            type="text"
                            value={formData.accountHolder}
                            readOnly={!isEditing}
                            onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                            placeholder={t('profile.bank.holder_placeholder')}
                            className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                          />
                       </div>
                    </div>

                    {isEditing && (
                      <div className="pt-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                        <button 
                          type="submit"
                          disabled={loading}
                          className="bg-neon-green text-black px-6 py-2.5 rounded-xl font-black uppercase text-[10px] hover:shadow-[0_0_30px_rgba(82,196,45,0.4)] transition-all duration-300 flex items-center gap-2"
                        >
                          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {t('profile.labels.save_btn')}
                        </button>
                        <button 
                          type="button"
                          onClick={handleCancel}
                          className="bg-gray-100 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
                        >
                          {t('profile.labels.cancel_btn')}
                        </button>
                      </div>
                    )}
                  </form>

                  {user?.role === 'organizer' && user?.organizer_profile && (
                    <div className="pt-10 border-t border-gray-100 dark:border-white/5 space-y-6 animate-in fade-in duration-500">
                       <h3 className="text-sm font-black text-neon-green uppercase">
                         {t('profile.organizer.details')}
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                               {t('profile.organizer.org_name')}
                             </label>
                             <div className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-400 dark:text-gray-600 font-medium font-sans">
                                {user.organizer_profile.organization_name}
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-gray-500 dark:text-gray-400 ml-1">
                               {t('profile.organizer.kyc_status_label')}
                             </label>
                             <div className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                                <span className="font-black text-[10px] tracking-wider text-neon-green flex items-center gap-2">
                                  {user.organizer_profile.kyc_status === 'verified' ? t('profile.organizer.verified') : t('profile.organizer.pending')}
                                  {user.organizer_profile.is_verified && <Shield className="w-3.5 h-3.5" />}
                                </span>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  {/* Balance Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* VND Wallet */}
                    <div className="p-6 md:p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 bg-blue-500/10 blur-[80px] group-hover:bg-blue-500/20 transition-all"></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3 md:mb-4">
                          <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                          </div>
                          <span className="text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-wider">{t('profile.wallet.system_wallet')}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('vi-VN').format(vndBalance)}
                          </span>
                          <span className="text-xs md:text-sm font-black text-blue-500 uppercase">VND</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">{t('profile.wallet.vnd_desc')}</p>
                        
                        <button 
                          className="mt-6 w-full py-3 bg-blue-500 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                          onClick={() => toast.success(i18n.language.startsWith('vi') ? 'Vui lòng liên hệ Admin để tạo yêu cầu rút tiền' : 'Please contact Admin to create a withdrawal request')}
                        >
                          {t('profile.wallet.withdraw_btn')}
                        </button>
                      </div>
                    </div>

                    {/* Crypto Wallet */}
                    <div className="p-6 md:p-8 bg-neon-green/5 border border-neon-green/20 rounded-[2rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 bg-neon-green/10 blur-[80px] group-hover:bg-neon-green/20 transition-all"></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3 md:mb-4">
                          <div className="p-2 bg-neon-green/20 rounded-xl">
                            <Shield className="w-5 h-5 md:w-6 md:h-6 text-neon-green" />
                          </div>
                          <span className="text-[10px] md:text-[11px] font-black text-neon-green uppercase tracking-wider">{t('profile.wallet.blockchain_wallet')}</span>
                        </div>
                        {/* Blockchain balance removed per user request */}
                        <p className="text-[10px] text-gray-500 font-medium">{t('profile.wallet.blockchain_desc')}</p>

                        <div className="mt-6 flex items-center justify-between bg-white/50 dark:bg-black/20 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5">
                           <code className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">{user?.wallet_address}</code>
                           <a 
                             href={`https://amoy.polygonscan.com/address/${user?.wallet_address}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-neon-green"
                           >
                             <ExternalLink className="w-3.5 h-3.5" />
                           </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal History Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                         <History className="w-4 h-4 text-blue-500" /> {t('profile.wallet.history')}
                      </h4>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{withdrawalHistory.length} {t('profile.wallet.transactions')}</span>
                    </div>

                    <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                       <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">{t('profile.wallet.table_id_time')}</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">{t('profile.wallet.table_amount')}</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">{t('profile.wallet.table_status')}</th>
                                <th className="px-6 py-3 text-[10px] font-black uppercase text-gray-400">{t('profile.wallet.table_note')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                               {loadingFinancial ? (
                                 <tr>
                                   <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic text-xs">
                                     {t('profile.wallet.loading_history')}
                                   </td>
                                 </tr>
                               ) : withdrawalHistory.length === 0 ? (
                                 <tr>
                                   <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic text-xs">
                                     {t('profile.wallet.empty_history')}
                                   </td>
                                 </tr>
                               ) : (
                                 withdrawalHistory.map((req) => (
                                   <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all">
                                     <td className="px-6 py-4">
                                       <div className="flex flex-col">
                                         <span className="text-[10px] font-mono font-black text-gray-400 uppercase max-w-[80px] truncate">#{req.id.substring(0, 8)}</span>
                                         <span className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                                           {format(new Date(req.created_at), 'dd/MM/yyyy HH:mm', { locale: i18n.language.startsWith('vi') ? vi : enUS })}
                                         </span>
                                       </div>
                                     </td>
                                     <td className="px-6 py-4">
                                       <span className="text-sm font-black text-gray-900 dark:text-white">
                                         {new Intl.NumberFormat('vi-VN').format(req.amount)}đ
                                       </span>
                                     </td>
                                     <td className="px-6 py-4">
                                       <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                         req.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                         req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                         'bg-red-500/10 text-red-500'
                                       }`}>
                                         {req.status === 'completed' ? t('profile.wallet.status_completed') : 
                                          req.status === 'pending' ? t('profile.wallet.status_pending') : t('profile.wallet.status_rejected')}
                                       </span>
                                     </td>
                                     <td className="px-6 py-4">
                                       <p className="text-[11px] text-gray-500 italic line-clamp-2 max-w-[200px]">
                                         {req.admin_note || '...'}
                                       </p>
                                     </td>
                                   </tr>
                                 ))
                               )}
                            </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
                    <div className="space-y-2">
                       <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase">
                         {t('profile.security.header')}
                       </h3>
                       <p className="text-[11px] md:text-xs font-black text-gray-500 dark:text-gray-400 ">
                         {t('profile.security.subtitle')}
                       </p>
                    </div>

                   {/* Change Password Form */}
                   <div className="p-6 md:p-8 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] space-y-6">
                      <h4 className="text-xs font-black text-neon-green uppercase flex items-center gap-2">
                        <Lock className="w-4 h-4" /> {t('profile.security.change_pass_header')}
                      </h4>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center px-2">
                              <label className="text-[11px] font-black text-gray-400">{t('profile.security.old_pass_label')}</label>
                              <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-neon-green hover:underline">
                                {t('profile.security.forgot_pass')}
                              </Link>
                            </div>
                            <input 
                              type="password"
                              required
                              value={passwordData.oldPassword}
                              onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                              className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-green outline-none transition-all dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-black text-gray-400 ml-2">{t('profile.security.new_pass_label')}</label>
                            <input 
                              type="password"
                              required
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-green outline-none transition-all dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-black text-gray-400 ml-2">{t('profile.security.confirm_pass_label')}</label>
                            <input 
                              type="password"
                              required
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-green outline-none transition-all dark:text-white"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          disabled={changingPass}
                          className="px-6 py-2.5 bg-neon-green text-black font-black uppercase text-[10px] rounded-xl hover:shadow-[0_0_20px_rgba(82,196,45,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {changingPass ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {t('profile.security.update_pass_btn')}
                        </button>
                      </form>
                   </div>

                   <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <h4 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase mb-6 inline-block border-b-2 border-neon-green pb-1">
                        {t('profile.security.notif_settings')}
                      </h4>
                      
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-transparent rounded-xl border-b border-gray-50 dark:border-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <Bell className="w-4 h-4 text-neon-green" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.security.email_notif_label')}</span>
                        </div>
                        <div className="w-10 h-5 bg-neon-green/20 rounded-full p-1 relative cursor-pointer">
                          <div className="w-3 h-3 bg-neon-green rounded-full shadow-[0_0_5px_rgba(82,196,45,1)]"></div>
                        </div>
                      </div>
                   </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
