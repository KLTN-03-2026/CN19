import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ShieldCheck, 
  ChevronRight,
  UserCheck,
  Building2,
  ScanLine,
  LayoutDashboard,
  Calendar,
  Layers,
  Undo2,
  AlertOctagon,
  ArrowRightLeft,
  Settings
} from 'lucide-react';
import { adminService } from '../../../services/admin.service';
import toast from 'react-hot-toast';

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone_number: '',
    role: 'customer',
    permissions: []
  });

  const availablePermissions = [
    { id: 'user_view', label: 'Xem danh sách Người dùng', icon: User, color: 'text-blue-500' },
    { id: 'user_create', label: 'Thêm & Quản lý Admin khác', icon: ShieldCheck, color: 'text-red-500' },
    { id: 'event_management', label: 'Quản lý Sự kiện', icon: Calendar, color: 'text-neon-green' },
    { id: 'category_management', label: 'Quản lý Danh mục', icon: Layers, color: 'text-purple-500' },
    { id: 'refund_management', label: 'Yêu cầu Hoàn tiền', icon: Undo2, color: 'text-yellow-500' },
    { id: 'transaction_management', label: 'Quản lý Giao dịch', icon: ArrowRightLeft, color: 'text-cyan-500' },
    { id: 'system_config', label: 'Cấu hình Hệ thống', icon: Settings, color: 'text-gray-400' }
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminService.createUser(formData);
      toast.success('Tạo tài khoản thành công!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0f0f12] border border-gray-200 dark:border-white/10 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-neon-green/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-neon-green" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Tải khoản Mới</h2>
                <p className="text-gray-500 text-sm">Thiết lập thông tin và phân quyền hệ thống.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col: Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Đăng nhập</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white"
                    placeholder="admin@basticket.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white"
                    placeholder="Nguyễn Văn A"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Vai trò (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'admin', label: 'Admin', icon: ShieldCheck },
                    { id: 'staff', label: 'Staff', icon: ScanLine },
                    { id: 'organizer', label: 'BTC', icon: Building2 },
                    { id: 'customer', label: 'Khách hàng', icon: User }
                  ].map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({...formData, role: role.id})}
                      className={`flex items-center space-x-2 p-3 rounded-xl border transition-all text-sm font-bold ${
                        formData.role === role.id 
                          ? 'bg-neon-green border-neon-green text-black' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <role.icon className="w-4 h-4" />
                      <span>{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Permissions */}
            <div className="bg-gray-50 dark:bg-white/[0.02] rounded-[24px] p-6 border border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Quyền hạn hệ thống</h3>
                {formData.role !== 'admin' && (
                  <span className="text-[9px] bg-white/10 text-gray-400 px-2 py-1 rounded-md uppercase font-bold">Mặc định</span>
                )}
              </div>

              {formData.role === 'admin' ? (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                  {availablePermissions.map(perm => (
                    <label 
                      key={perm.id}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                        formData.permissions.includes(perm.id)
                          ? 'bg-neon-green/10 border-neon-green/30' 
                          : 'bg-transparent border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${perm.color}`}>
                          <perm.icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-bold ${formData.permissions.includes(perm.id) ? 'text-neon-green' : 'text-gray-400'}`}>
                          {perm.label}
                        </span>
                      </div>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        formData.permissions.includes(perm.id) ? 'bg-neon-green border-neon-green' : 'border-white/10'
                      }`}>
                        {formData.permissions.includes(perm.id) && <X className="w-3 h-3 text-black rotate-45" />}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-40 py-10">
                  <ShieldCheck className="w-12 h-12 text-gray-500" />
                  <p className="text-xs text-gray-500 px-4">
                    Vai trò này có các quyền hạn mặc định theo tiêu chuẩn hệ thống.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/5">
            <button 
              type="button" onClick={onClose}
              className="px-6 py-3.5 text-sm font-bold text-gray-500 hover:text-white transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-neon-green hover:bg-neon-hover text-black rounded-2xl font-black text-sm transition-all shadow-xl shadow-neon-green/20 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>TẠO TÀI KHOẢN</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
