import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  Ban, 
  CheckCircle2, 
  UserCheck, 
  Mail, 
  Phone,
  ArrowUpDown,
  XCircle,
  Clock,
  Eye,
  FileSearch
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import toast from 'react-hot-toast';
import CreateUserModal from './components/CreateUserModal';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    keyword: '',
    kyc_status: '',
    from: '',
    to: ''
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getUsers(filters);
      setUsers(res.data);
      if (res.meta) {
        setStats(res.meta);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.role, filters.status, filters.keyword, filters.kyc_status, filters.from, filters.to]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const confirmMsg = currentStatus === 'active' 
      ? 'Bạn có chắc chắn muốn KHÓA tài khoản này?' 
      : 'Bạn có chắc chắn muốn MỞ KHÓA tài khoản này?';

    if (window.confirm(confirmMsg)) {
      try {
        await adminService.toggleUserStatus(userId, { status: newStatus });
        toast.success(`Đã cập nhật trạng thái thành ${newStatus}`);
        fetchUsers();
      } catch (error) {
        toast.error('Cập nhật trạng thái thất bại');
      }
    }
  };

  const handleApproveOrganizer = async (id, action, reason = '') => {
    try {
      await adminService.approveOrganizer(id, { action, reason });
      toast.success(action === 'approve' ? 'Đã duyệt hồ sơ BTC' : 'Đã từ chối hồ sơ BTC');
      setShowRejectModal(false);
      setRejectReason('');
      fetchUsers();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const openRejectModal = (profileId) => {
    setSelectedProfile(profileId);
    setShowRejectModal(true);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full uppercase border border-red-500/20">Admin</span>;
      case 'organizer': return <span className="px-2 py-0.5 bg-neon-green/10 text-neon-green text-[10px] font-bold rounded-full uppercase border border-neon-green/20">Organizer</span>;
      case 'staff': return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full uppercase border border-blue-500/20">Staff</span>;
      default: return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-[10px] font-bold rounded-full uppercase border border-white/5">Customer</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center space-x-3 text-gray-900 dark:text-white">
            <Users className="w-8 h-8 text-neon-green" />
            <span>Quản lý Người dùng</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Xem, tìm kiếm và quản lý quyền hạn của toàn bộ thành viên.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setFilters({ role: '', status: '', keyword: '', kyc_status: '', from: '', to: '' })}
            className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all ${
              !filters.kyc_status && !filters.from && !filters.to
                ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              !filters.kyc_status ? 'bg-neon-green/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs uppercase font-bold tracking-wider opacity-60">Tất cả</div>
              <div className="text-xl font-black">{stats.total}</div>
            </div>
          </button>

          <button 
            onClick={() => setFilters({ ...filters, role: '', status: '', kyc_status: 'pending' })}
            className={`p-4 rounded-2xl border flex items-center space-x-4 transition-all ${
              filters.kyc_status === 'pending' 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              filters.kyc_status === 'pending' ? 'bg-yellow-500/20' : 'bg-gray-100 dark:bg-white/5'
            }`}>
              <FileSearch className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs uppercase font-bold tracking-wider opacity-60">Chờ duyệt</div>
              <div className="text-xl font-black">{stats.pending}</div>
            </div>
          </button>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-4 rounded-2xl bg-neon-green text-black hover:bg-neon-green/90 transition-all flex items-center space-x-3 shadow-lg shadow-neon-green/20 group"
          >
            <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-black" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-black tracking-widest opacity-60">Thao tác</div>
              <div className="text-sm font-bold">Thêm Người dùng</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl transition-all">
        <div className="bg-white dark:bg-[#111114] p-4 border-b border-gray-200 dark:border-white/5 flex flex-wrap items-center gap-4 shadow-sm transition-all">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm theo Email hoặc Số điện thoại..."
              className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </form>

          <select 
            className="bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green"
            value={filters.role}
            onChange={(e) => setFilters({...filters, role: e.target.value})}
          >
            <option value="">Tất cả Vai trò</option>
            <option value="customer">Người mua (Customer)</option>
            <option value="organizer">Ban tổ chức (Organizer)</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="staff">Nhân viên (Staff)</option>
          </select>

          <select 
            className="bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="banned">Đã khóa</option>
          </select>

          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl px-3 py-1.5 focus-within:border-neon-green transition-all">
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase ml-1">Từ ngày</label>
              <input 
                type="date" 
                className="bg-transparent text-gray-700 dark:text-gray-300 text-xs focus:outline-none transition-colors"
                value={filters.from}
                onChange={(e) => setFilters({...filters, from: e.target.value})}
              />
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase ml-1">Đến ngày</label>
              <input 
                type="date" 
                className="bg-transparent text-gray-700 dark:text-gray-300 text-xs focus:outline-none transition-colors"
                value={filters.to}
                onChange={(e) => setFilters({...filters, to: e.target.value})}
              />
            </div>
          </div>
          
          <button 
            onClick={fetchUsers}
            className="p-3 bg-neon-green text-black rounded-xl hover:bg-neon-hover transition-all font-bold shadow-lg shadow-neon-green/20"
          >
            Lọc
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase font-black tracking-widest border-b border-gray-200 dark:border-white/5">
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4">Vai trò</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Hồ sơ BTC</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-4 bg-white/5"></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-gray-500">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-neon-green border border-gray-200 dark:border-white/5">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 truncate">{u.email}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                             <Phone className="w-3 h-3" />
                             <span>{u.phone_number || 'N/A'}</span>
                          </div>
                          {u.wallet_address && (
                            <div className="text-[10px] font-mono text-gray-400 mt-1 flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <Shield className="w-2.5 h-2.5 text-neon-green" />
                              <span title={u.wallet_address}>{u.wallet_address.substring(0, 6)}...{u.wallet_address.substring(38)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4">
                      {u.status === 'active' ? (
                        <div className="flex items-center text-green-500 text-xs font-bold space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500 text-xs font-bold space-x-1.5">
                          <Ban className="w-4 h-4" />
                          <span>Banned</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.organizer_profile ? (
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{u.organizer_profile.organization_name}</span>
                          {u.organizer_profile.kyc_status === 'pending' ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded-full uppercase font-black">Chờ duyệt</span>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleApproveOrganizer(u.organizer_profile.id, 'approve')}
                                  className="p-1 bg-green-500/20 hover:bg-green-500/40 text-green-500 rounded" title="Duyệt"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => openRejectModal(u.organizer_profile.id)}
                                  className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded" title="Từ chối"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                             <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-black ${
                               u.organizer_profile.kyc_status === 'approved' ? 'bg-neon-green/10 text-neon-green' : 'bg-red-500/10 text-red-500'
                             }`}>
                               {u.organizer_profile.kyc_status}
                             </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-[10px] italic">Chưa đăng ký BTC</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-400 flex items-center space-x-2">
                         <Clock className="w-3.5 h-3.5 text-gray-600" />
                         <span>{new Date(u.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                           onClick={() => navigate(`/admin/users/${u.id}`)}
                           className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-lg hover:text-neon-green hover:bg-neon-green/10 transition-all border border-transparent dark:border-white/5"
                           title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => handleToggleStatus(u.id, u.status)}
                           className={`p-2 rounded-lg transition-all border ${
                             u.status === 'active' 
                               ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
                               : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'
                           }`}
                           title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {u.status === 'active' ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:text-white transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
           <span>Hiển thị 1 - {users.length} của {users.length} người dùng</span>
           <div className="flex items-center space-x-2">
              <button disabled className="px-3 py-1 bg-white/5 rounded-lg opacity-50">Trước</button>
              <button disabled className="px-3 py-1 bg-white/5 rounded-lg opacity-50">Sau</button>
           </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl scale-in-center">
            <div className="flex items-center space-x-3 text-red-500">
              <XCircle className="w-6 h-6" />
              <h3 className="text-xl font-black uppercase tracking-tighter">Từ chối Hồ sơ BTC</h3>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Vui lòng nhập lý do từ chối. Lý do này sẽ được gửi tới email của người đăng ký.
            </p>
            <textarea 
              className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl p-4 text-sm focus:outline-none focus:border-red-500 transition-all min-h-[120px] dark:text-white text-gray-900"
              placeholder="Ví dụ: Hình ảnh giấy phép kinh doanh không rõ ràng, thông tin không trùng khớp..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl font-bold transition-all text-gray-700 dark:text-gray-300"
              >
                Hủy
              </button>
              <button 
                onClick={() => handleApproveOrganizer(selectedProfile, 'reject', rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
              >
                Gửi Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateUserModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default UserManagement;
