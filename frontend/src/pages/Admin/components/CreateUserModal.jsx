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
  Settings,
  FileText,
  MessageSquare,
  Siren,
  Users,
  History,
  Bell,
  Ticket
} from 'lucide-react';
import { adminService } from '../../../services/admin.service';
import toast from 'react-hot-toast';

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    full_name: '',
    phone_number: '',
    role: 'admin', // Cố định vai trò là admin
    permissions: []
  });

  const availablePermissions = [
    { id: 'dashboard', label: 'Dashboard & Thống kê', icon: LayoutDashboard, color: 'text-blue-500' },
    { id: 'users', label: 'Quản lý Người dùng', icon: User, color: 'text-indigo-500' },
    { id: 'admins', label: 'Quản trị viên', icon: ShieldCheck, color: 'text-red-500' },
    { id: 'events', label: 'Quản lý Sự kiện', icon: Calendar, color: 'text-neon-green' },
    { id: 'categories', label: 'Danh mục Sự kiện', icon: Layers, color: 'text-purple-500' },
    { id: 'refunds', label: 'Yêu cầu Hoàn tiền', icon: Undo2, color: 'text-yellow-500' },
    { id: 'fraud', label: 'Cảnh báo Gian lận', icon: AlertOctagon, color: 'text-rose-500' },
    { id: 'transactions', label: 'Quản lý Giao dịch', icon: ArrowRightLeft, color: 'text-cyan-500' },
    { id: 'settlements', label: 'Quyết toán Sự kiện', icon: Building2, color: 'text-emerald-500' },
    { id: 'merchandise', icon: Layers, label: 'Quản lý Sản phẩm', color: 'text-blue-400' },
    { id: 'blogs', label: 'Quản lý Blog', icon: FileText, color: 'text-orange-400' },
    { id: 'support', label: 'Hỗ trợ & Khiếu nại', icon: MessageSquare, color: 'text-amber-500' },
    { id: 'system', label: 'Cấu hình Hệ thống', icon: Settings, color: 'text-gray-400' }
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
        <div className="relative px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-neon-green/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-neon-green" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Quản trị viên Mới</h2>
                <p className="text-gray-500 text-sm">Thiết lập tài khoản quản trị và phân quyền hệ thống.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Đăng nhập</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="email" required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:outline-none focus:border-neon-green transition-all dark:text-white"
                    placeholder="admin@basticket.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="password" required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:outline-none focus:border-neon-green transition-all dark:text-white"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Họ và Tên</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text" required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:outline-none focus:border-neon-green transition-all dark:text-white"
                    placeholder="Họ tên quản trị"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="tel"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:outline-none focus:border-neon-green transition-all dark:text-white"
                    placeholder="09xx xxx xxx"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-3 bg-gray-50 dark:bg-white/[0.02] rounded-[24px] p-5 border border-gray-100 dark:border-white/5 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Phân quyền Truy cập</h3>
                <span className="text-[9px] bg-neon-green/10 text-neon-green px-2 py-1 rounded-md uppercase font-bold">Cấp quyền</span>
              </div>

              <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 max-h-[320px] custom-scrollbar">
                {availablePermissions.map(perm => (
                  <label 
                    key={perm.id}
                    className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                      formData.permissions.includes(perm.id)
                        ? 'bg-neon-green/10 border-neon-green/30' 
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg bg-white/5 ${perm.color}`}>
                      <perm.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold leading-tight ${formData.permissions.includes(perm.id) ? 'text-neon-green' : 'text-gray-400'}`}>
                        {perm.label}
                      </p>
                    </div>
                    <input 
                      type="checkbox"
                      className="hidden"
                      checked={formData.permissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                    />
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      formData.permissions.includes(perm.id) ? 'bg-neon-green border-neon-green' : 'border-white/10'
                    }`}>
                      {formData.permissions.includes(perm.id) && <X className="w-2.5 h-2.5 text-black rotate-45" />}
                    </div>
                  </label>
                ))}
              </div>
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
