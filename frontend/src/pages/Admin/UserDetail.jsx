import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  CreditCard, 
  Ticket, 
  ShoppingBag, 
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Package,
  ArrowRightLeft,
  Settings,
  Building2
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import toast from 'react-hot-toast';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserById(id);
      setUser(data);
    } catch (error) {
      toast.error('Lỗi khi tải thông tin người dùng');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    if (window.confirm(`Bạn có chắc chắn muốn ${newStatus === 'banned' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) {
      try {
        await adminService.toggleUserStatus(user.id, { status: newStatus });
        toast.success('Cập nhật trạng thái thành công');
        fetchUserDetail();
      } catch (error) {
        toast.error('Thao tác thất bại');
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-12 h-12 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin" />
      <p className="text-gray-500 font-bold animate-pulse">Đang truy xuất hồ sơ 360...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Hồ sơ người dùng</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                user.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                user.role === 'organizer' ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' :
                'bg-gray-500/10 text-gray-500 border border-white/5'
              }`}>
                {user.role}
              </span>
            </div>
            <p className="text-gray-500 text-sm flex items-center space-x-2">
              <span className="opacity-60">ID:</span>
              <span className="font-mono text-[11px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">{user.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={handleToggleStatus}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
              user.status === 'active' 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white shadow-red-500/10' 
                : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white shadow-green-500/10'
            }`}
          >
            {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Summary Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm dark:shadow-2xl">
            <div className="h-24 bg-gradient-to-r from-neon-green/20 to-blue-500/20 relative">
              <div className="absolute -bottom-10 left-8">
                <div className="w-20 h-20 rounded-[24px] bg-white dark:bg-[#1a1a1e] border-4 border-white dark:border-[#111114] flex items-center justify-center font-black text-3xl text-neon-green shadow-xl">
                  {user.email.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            
            <div className="px-8 pt-14 pb-8 space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{user.full_name || 'N/A'}</h3>
                <p className="text-gray-500 text-sm font-medium">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                  <div className="text-[10px] uppercase font-black text-gray-400 mb-1">Vé đang có</div>
                  <div className="text-xl font-black text-neon-green">{user.owned_tickets?.length || 0}</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                  <div className="text-[10px] uppercase font-black text-gray-400 mb-1">Đơn hàng</div>
                  <div className="text-xl font-black text-blue-500">{user.orders?.length || 0}</div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Clock className="w-4 h-4 opacity-40" />
                    <span>Ngày tham gia</span>
                  </div>
                  <span className="font-bold dark:text-gray-300">{new Date(user.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3 text-gray-500">
                    <Shield className="w-4 h-4 opacity-40" />
                    <span>Trạng thái</span>
                  </div>
                  <span className={`font-black uppercase text-[10px] ${user.status === 'active' ? 'text-neon-green' : 'text-red-500'}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black text-white rounded-[32px] p-8 space-y-6 relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-32 h-32" />
            </div>
            
            <div>
              <div className="flex items-center space-x-2 text-neon-green mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Ví Web3 Custodial</span>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter">Bảo mật tài sản</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-[11px] break-all leading-relaxed relative group/wallet">
              <div className="text-gray-500 mb-2 flex items-center justify-between">
                <span>Wallet Address</span>
                <button className="text-neon-green opacity-0 group-hover/wallet:opacity-100 transition-all">Sao chép</button>
              </div>
              <span className="text-gray-300">{user.wallet_address || 'Chưa cập nhật'}</span>
            </div>

            <p className="text-[10px] text-gray-500 italic">
              * Đây là ví lưu ký (Custodial), Private Key được mã hóa an toàn tại server.
            </p>
          </div>
        </div>

        {/* Right Col: Tabs & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl">
            {[
              { id: 'general', label: 'Thông tin chung', icon: User },
              { id: 'tickets', label: 'Kho vé NFT', icon: Ticket },
              { id: 'orders', label: 'Lịch sử mua', icon: ShoppingBag },
              { id: 'activity', label: 'Hoạt động', icon: ArrowRightLeft }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' 
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl min-h-[500px]">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Họ và Tên</label>
                    <div className="text-sm font-bold dark:text-white p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      {user.full_name || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Số điện thoại</label>
                    <div className="text-sm font-bold dark:text-white p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      {user.phone_number || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Email</label>
                    <div className="text-sm font-bold dark:text-white p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      {user.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Phân quyền đặc biệt</label>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {user.permissions?.length > 0 ? (
                        user.permissions.map(p => (
                          <span key={p} className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full uppercase border border-blue-500/20">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 italic px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl w-full">Không có phân quyền đặc biệt.</span>
                      )}
                    </div>
                  </div>
                </div>

                {user.organizer_profile && (
                  <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6">Hồ sơ Ban tổ chức</h4>
                    <div className="bg-neon-green/5 border border-neon-green/10 rounded-3xl p-6 relative overflow-hidden">
                       <Shield className="absolute -right-8 -bottom-8 w-32 h-32 text-neon-green/10" />
                       <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center">
                             <Building2 className="w-6 h-6 text-neon-green" />
                          </div>
                          <div>
                             <div className="text-lg font-black dark:text-white">{user.organizer_profile.organization_name}</div>
                             <div className={`text-[10px] font-black uppercase ${
                               user.organizer_profile.kyc_status === 'approved' ? 'text-neon-green' : 'text-yellow-500'
                             }`}>
                               KYC: {user.organizer_profile.kyc_status}
                             </div>
                          </div>
                       </div>
                       <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                         {user.organizer_profile.description || 'Không có mô tả cho ban tổ chức này.'}
                       </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {user.owned_tickets?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.owned_tickets.map(t => (
                      <div key={t.id} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-xl bg-white dark:bg-white/10 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-white/5">
                           <Ticket className="w-8 h-8 text-neon-green opacity-40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-gray-900 dark:text-white truncate mb-1">{t.event.title}</div>
                          <div className="text-[10px] text-gray-500 flex items-center space-x-2">
                             <span className="bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded uppercase font-black">{t.ticket_tier.tier_name}</span>
                             <span className="font-mono">{t.ticket_number}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                    <Package className="w-16 h-16 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Chưa sở hữu vé nào</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {user.orders?.length > 0 ? (
                  user.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all">
                       <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                             <ShoppingBag className="w-6 h-6" />
                          </div>
                          <div>
                             <div className="text-sm font-bold text-gray-900 dark:text-white">Đơn hàng #{o.order_number}</div>
                             <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString('vi-VN')}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="text-sm font-black dark:text-white">{parseFloat(o.total_amount).toLocaleString()}đ</div>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            o.status === 'completed' ? 'bg-neon-green/10 text-neon-green' : 'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {o.status}
                          </span>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                    <ShoppingBag className="w-16 h-16 mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">Chưa có giao dịch mua vé</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                <ArrowRightLeft className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">Tính năng đang phát triển</p>
                <p className="text-[10px] mt-2 italic px-20">Lịch sử sang tay vé NFT và các biến động số dư sẽ được cập nhật tại đây.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
