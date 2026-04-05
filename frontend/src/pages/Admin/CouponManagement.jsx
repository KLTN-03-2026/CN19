import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  Search, 
  Filter, 
  Plus,
  ChevronRight,
  Loader2,
  Calendar,
  Tag,
  Trash2,
  Power,
  PowerOff,
  Edit,
  AlertCircle,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminService } from '../../services/admin.service';

const CouponManagement = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchCoupons();
  }, [statusFilter, typeFilter]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.discount_type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await adminService.getCoupons(params);
      if (response.success) {
        setCoupons(response.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await adminService.toggleCouponStatus(id);
      if (response.success) {
        toast.success(response.message);
        fetchCoupons();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;

    try {
      const response = await adminService.deleteCoupon(id);
      if (response.success) {
        toast.success('Xóa mã giảm giá thành công');
        fetchCoupons();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa mã giảm giá này');
    }
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const endDate = parseISO(coupon.end_date);
    
    if (!coupon.is_active) {
      return { label: 'Tạm dừng', color: 'bg-gray-500/10 text-gray-500' };
    }
    if (endDate < now) {
      return { label: 'Hết hạn', color: 'bg-red-500/10 text-red-500' };
    }
    return { label: 'Đang chạy', color: 'bg-neon-green/10 text-neon-green' };
  };

  return (
    <div className="p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black uppercase text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-neon-green/10 rounded-lg">
              <Tag className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Mã giảm giá</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-[10px] italic">
            Tạo và quản lý các chương trình khuyến mãi, mã giảm giá hệ thống
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/coupons/create')}
          className="flex items-center justify-center space-x-2 bg-neon-green hover:bg-neon-green/90 text-black px-6 py-3 rounded-xl font-black uppercase text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-neon-green/20"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Tìm theo mã giảm giá..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 uppercase font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Discount Type Filter */}
          <div className="relative w-full md:w-44">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả loại giảm</option>
              <option value="PERCENTAGE">Phần trăm (%)</option>
              <option value="FIXED_AMOUNT">Cố định (đ)</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>

          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
              <option value="expired">Đã hết hạn</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 animate-pulse uppercase text-xs font-black tracking-widest">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Thông tin Mã</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Phạm vi</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Loại giảm giá</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Giá trị</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Lượt dùng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {coupons.length > 0 ? coupons.map((coupon) => {
                  const status = getStatusBadge(coupon);
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                            <Tag className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white uppercase tracking-wider">{coupon.code}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{coupon.description || 'Không có mô tả'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {coupon.event ? (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-blue-500 mb-1">Sự kiện cụ thể</span>
                            <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 line-clamp-1 max-w-[150px]">
                              {coupon.event.title}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">Tất cả sự kiện</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                          coupon.discount_type === 'PERCENTAGE' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {coupon.discount_type === 'PERCENTAGE' ? 'Phần trăm' : 'Cố định'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-gray-900 dark:text-white">
                          {coupon.discount_type === 'PERCENTAGE' 
                            ? `${coupon.discount_value}%` 
                            : `${Number(coupon.discount_value).toLocaleString('vi-VN')}đ`}
                        </div>
                        {coupon.max_discount_amount && (
                          <div className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                            Tối đa: {Number(coupon.max_discount_amount).toLocaleString('vi-VN')}đ
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {coupon.used_count} / {coupon.usage_limit || '∞'}
                        </div>
                        <div className="w-20 h-1 bg-gray-100 dark:bg-white/5 rounded-full mx-auto mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-neon-green" 
                            style={{ width: `${coupon.usage_limit ? Math.min((coupon.used_count / coupon.usage_limit) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => navigate(`/admin/coupons/${coupon.id}`)}
                            className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-all"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                            className={`p-2 rounded-lg transition-all ${
                              coupon.is_active 
                              ? 'text-amber-500 hover:bg-amber-500/10' 
                              : 'text-neon-green hover:bg-neon-green/10'
                            }`}
                            title={coupon.is_active ? 'Tạm dừng mã' : 'Kích hoạt mã'}
                          >
                            {coupon.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => navigate(`/admin/coupons/edit/${coupon.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(coupon.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Xóa"
                            disabled={coupon.used_count > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                          <Tag className="w-8 h-8 text-gray-300 dark:text-white/10" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold">Không tìm thấy mã giảm giá nào</p>
                        <p className="text-xs text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
