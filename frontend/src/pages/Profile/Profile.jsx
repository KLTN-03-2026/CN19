import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Wallet, Shield, 
  Camera, ChevronRight, ExternalLink, 
  Lock, Bell, Globe, Save, Loader2, X
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { userService } from '../../services/user.service';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'wallet', 'security'
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0');
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
    fullName: user?.fullName || '',
    phoneNumber: user?.phone_number || '',
    address: user?.address || '',
    dateOfBirth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
    avatarUrl: user?.avatar_url || '',
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
      const data = await userService.getWalletBalance();
      setWalletBalance(data.data?.balance_matic || '0');
    } catch (error) {
      console.error('Failed to fetch wallet balance', error);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary chưa được cấu hình (Thiếu Cloud Name hoặc Preset)");
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
      toast.error('Upload failed');
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
      });
    }
  };

  const tabs = [
    { id: 'info', label: t('profile.tabs.info'), icon: User },
    { id: 'wallet', label: t('profile.tabs.wallet'), icon: Wallet },
    { id: 'security', label: t('profile.tabs.security'), icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-transparent pt-10 pb-20 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Sidebar (Avatar + Info + Tabs) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* User Profile Summary Card */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-sm relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 p-16 bg-neon-green/10 blur-[50px] rounded-full"></div>
               
               <div className="relative group mb-5">
                  <div className="w-28 h-28 rounded-full bg-neon-green/10 border-4 border-neon-green flex items-center justify-center text-4xl font-black text-neon-green shadow-[0_0_20px_rgba(82,196,45,0.2)] overflow-hidden transition-transform duration-300 group-hover:scale-105">
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
                    className="absolute bottom-0 right-0 p-2.5 bg-gray-900 border-2 border-white dark:border-dark-bg rounded-full text-white hover:text-neon-green transition-colors shadow-xl disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
               </div>

               <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter mb-2 relative z-10 break-words w-full px-2">
                 {user?.full_name || user?.fullName || t('profile.user')}
               </h1>
               
               <span className="inline-flex items-center px-4 py-1 bg-neon-green/10 text-neon-green text-[10px] font-black uppercase rounded-full border border-neon-green/20 mb-3 relative z-10">
                 {t(`profile.roles.${user?.role || 'customer'}`)}
               </span>
               
               <span className="text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center justify-center gap-1.5 relative z-10 break-all px-2 w-full">
                 <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                 <span className="truncate">{user?.email}</span>
               </span>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? 'bg-neon-green text-black border-neon-green font-black shadow-[0_0_20px_rgba(82,196,45,0.3)]' 
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/10 font-bold hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="uppercase text-[12px]">{tab.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-1' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 md:p-12 shadow-sm animate-in slide-in-from-right-8 duration-500">
              
              {activeTab === 'info' && (
                <div className="space-y-12">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-neon-green uppercase ">
                        {t('profile.tabs.info')}
                      </h3>
                      {!isEditing && (
                        <button 
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-neon-green/10 text-neon-green rounded-xl text-[10px] font-black uppercase hover:bg-neon-green hover:text-black transition-all"
                        >
                          <Save className="w-3 h-3 rotate-180" />
                          {t('profile.labels.edit')}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4">
                          {t('profile.labels.name')}
                        </label>
                        <input 
                          type="text"
                          value={formData.fullName}
                          readOnly={!isEditing}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4">
                          {t('profile.labels.phone')}
                        </label>
                        <input 
                          type="tel"
                          value={formData.phoneNumber}
                          readOnly={!isEditing}
                          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                          placeholder="Ex: 0912345678"
                          className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4">
                          {t('profile.labels.dob')}
                        </label>
                        <input 
                          type="date"
                          value={formData.dateOfBirth}
                          readOnly={!isEditing}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 text-gray-900 dark:text-white font-medium transition-all outline-none [color-scheme:light] dark:[color-scheme:dark] ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                        />
                      </div>
                      
                      {user?.role === 'organizer' ? (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4">
                            {t('profile.labels.address')}
                          </label>
                          <input 
                            type="text"
                            value={formData.address}
                            readOnly={!isEditing}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder={t('profile.placeholders.address')}
                            className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 text-gray-900 dark:text-white font-medium transition-all outline-none ${isEditing ? 'focus:border-neon-green shadow-sm' : 'cursor-default opacity-80'}`}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 hidden md:block">
                           {/* Empty placeholder */}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4">
                        {t('profile.labels.email')}
                      </label>
                      <input 
                        type="email"
                        value={user?.email}
                        readOnly
                        className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 text-gray-400 dark:text-gray-600 font-medium cursor-not-allowed outline-none"
                      />
                    </div>

                    {isEditing && (
                      <div className="pt-4 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                        <button 
                          type="submit"
                          disabled={loading}
                          className="bg-neon-green text-black px-6 py-4 rounded-2xl font-black uppercase text-xs hover:shadow-[0_0_30px_rgba(82,196,45,0.4)] transition-all duration-300 flex items-center gap-2"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {t('profile.labels.save')}
                        </button>
                        <button 
                          type="button"
                          onClick={handleCancel}
                          className="bg-gray-200 px-10 py-4 rounded-2xl font-black uppercase text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
                        >
                          {t('profile.labels.cancel')}
                        </button>
                      </div>
                    )}
                  </form>

                  {user?.role === 'organizer' && user?.organizer_profile && (
                    <div className="pt-10 border-t border-gray-100 dark:border-white/5 space-y- animate-in fade-in duration-500">
                       <h3 className="text-sm font-black text-neon-green uppercase">
                         {t('profile.organizer.title')}
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4">
                              {t('profile.organizer.name')}
                            </label>
                            <div className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 text-gray-400 dark:text-gray-600 font-medium">
                               {user.organizer_profile.organization_name}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase t-gray-400 dark:text-gray-500 ml-4">
                              {t('profile.organizer.kyc')}
                            </label>
                            <div className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 flex items-center justify-between">
                               <span className="font-black uppercase text-[10px] tracking-widest text-neon-green">
                                 {user.organizer_profile.kyc_status}
                               </span>
                               {user.organizer_profile.is_verified && <Shield className="w-4 h-4 text-neon-green" />}
                            </div>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 ml-4">
                            {t('profile.organizer.desc')}
                          </label>
                          <div className="w-full bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-3 text-gray-400 dark:text-gray-600 font-medium min-h-[100px]">
                            {user.organizer_profile.description || '...'}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-10">
                  <div className="p-8 bg-neon-green/5 border border-neon-green/20 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 bg-neon-green/10 blur-[80px] group-hover:bg-neon-green/20 transition-all"></div>
                    
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="p-3 bg-neon-green/20 rounded-xl">
                        <Wallet className="w-8 h-8 text-neon-green" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-neon-green uppercase leading-none mb-1">{t('profile.wallet.title')}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{t('profile.wallet.desc')}</p>
                      </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                        <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 mb-2">{t('profile.wallet.address')}</p>
                        <div className="flex items-center justify-between gap-4">
                          <code className="text-xs md:text-sm font-mono text-gray-900 dark:text-neon-green font-bold break-all">
                            {user?.wallet_address || t('profile.wallet.no_wallet')}
                          </code>
                          <a 
                            href={`https://amoy.polygonscan.com/address/${user?.wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-neon-green/20 rounded-lg text-gray-400 dark:text-white/50 hover:text-neon-green transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{walletBalance}</span>
                        <span className="text-sm font-black text-neon-green uppercase tracking-widest mb-1">POL</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                        <h5 className="text-[10px] font-black text-gray-900 dark:text-white uppercase mb-2 flex items-center gap-2">
                          <Globe className="w-3 h-3 text-neon-green" /> {t('profile.wallet.network')}
                        </h5>
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Polygon Amoy Testnet</p>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                        <h5 className="text-[10px] font-black text-gray-900 dark:text-white uppercase mb-2 flex items-center gap-2">
                          <Lock className="w-3 h-3 text-neon-green" /> {t('profile.wallet.type')}
                        </h5>
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Custodial (ERC-4337 Ready)</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-12 animate-in fade-in duration-500">
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">
                        {t('profile.security.title')}
                      </h3>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 ">
                        {t('profile.security.desc')}
                      </p>
                   </div>

                   {/* Change Password Form */}
                   <div className="p-8 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] space-y-6">
                      <h4 className="text-xs font-black text-neon-green uppercase flex items-center gap-2">
                        <Lock className="w-4 h-4" /> {t('profile.security.change_pass')}
                      </h4>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center px-2">
                              <label className="text-[12px] font-black text-gray-400">{t('profile.security.old_pass')}</label>
                              <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-neon-green hover:underline">
                                {t('profile.forgot.title')}?
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
                            <label className="text-[12px] font-black text-gray-400 ml-2">{t('profile.security.new_pass')}</label>
                            <input 
                              type="password"
                              required
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-neon-green outline-none transition-all dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[12px] font-black text-gray-400 ml-2">{t('profile.security.confirm_new_pass')}</label>
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
                          className="px-8 py-3 bg-neon-green text-black font-black uppercase text-[10px] rounded-xl hover:shadow-[0_0_20px_rgba(82,196,45,0.3)] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {changingPass ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          {t('profile.security.change_pass')}
                        </button>
                      </form>
                   </div>

                   <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-6 inline-block border-b-2 border-neon-green pb-1">
                        {t('profile.security.preferences')}
                      </h4>
                      
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-transparent rounded-xl border-b border-gray-50 dark:border-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <Bell className="w-4 h-4 text-neon-green" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('profile.security.email_notif')}</span>
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
