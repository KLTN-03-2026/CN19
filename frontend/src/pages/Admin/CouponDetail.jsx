import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Tag, 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  Clock, 
  User, 
  ExternalLink,
  Loader2,
  AlertCircle,
  Hash,
  Activity,
  CalendarDays,
  Target,
  ShoppingBag,
  Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service';

const CouponDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouponDetail();
  }, [id]);

  const fetchCouponDetail = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCouponById(id);
      if (res.success) {
        setCoupon(res.data);
      }
    } catch (error) {
      console.error('Fetch detail error:', error);
      toast.error('Không thể tải chi tiết mã giảm giá');
      navigate('/admin/coupons');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
        <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Đang tải chi tiết...</p>
      </div>
    );
  }

  if (!coupon) return null;

  const getStatus = (coupon) => {
    const now = new Date();
    const endDate = parseISO(coupon.end_date);
    if (!coupon.is_active) return { label: 'Tạm dừng', color: 'bg-gray-500/10 text-gray-500', icon: Clock };
    if (endDate < now) return { label: 'Hết hạn', color: 'bg-red-500/10 text-red-500', icon: AlertCircle };
    return { label: 'Đang chạy', color: 'bg-neon-green/10 text-neon-green', icon: Activity };
  };

  const status = getStatus(coupon);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/admin/coupons')}
            className="flex items-center text-gray-500 hover:text-neon-green font-black uppercase text-[10px] tracking-widest transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Quay lại danh sách
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-neon-green/10 rounded-2xl flex items-center justify-center border border-neon-green/20">
              <Tag className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                 <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white leading-none">
                  {coupon.code}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border border-current/20 ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">{coupon.description || 'Không có mô tả cho mã này'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/admin/coupons/edit/${id}`)}
            className="px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm"
          >
            Chỉnh sửa cấu hình
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111114] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                {coupon.discount_type === 'PERCENTAGE' ? <Percent className="text-purple-500" /> : <DollarSign className="text-purple-500" />}
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá trị giảm</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white tracking-widest">
                {coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `${Number(coupon.discount_value).toLocaleString('vi-VN')}đ`}
            </div>
        </div>

        <div className="bg-white dark:bg-[#111114] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <ShoppingBag className="text-blue-500" />
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đã sử dụng</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white tracking-widest">
                {coupon.used_count} <span className="text-xs text-gray-400 font-bold">/ {coupon.usage_limit || '∞'}</span>
            </div>
        </div>

        <div className="bg-white dark:bg-[#111114] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-neon-green/10 rounded-xl flex items-center justify-center mb-4">
                <Clock className="text-neon-green" />
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hiệu lực từ</div>
            <div className="text-sm font-black text-gray-900 dark:text-white">
                {format(parseISO(coupon.start_date), 'dd/MM/yyyy')}
            </div>
        </div>

        <div className="bg-white dark:bg-[#111114] p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500" />
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hết hạn vào</div>
            <div className="text-sm font-black text-gray-900 dark:text-white">
                {format(parseISO(coupon.end_date), 'dd/MM/yyyy')}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail Configuration */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 space-y-6">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white pb-4 border-b border-gray-50 dark:border-white/5 flex items-center gap-3">
                    <Target className="w-4 h-4 text-neon-green" /> Cấu hình chi tiết
                </h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">ID Hệ thống:</span>
                        <code className="bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-[10px] font-mono select-all text-gray-400">{coupon.id}</code>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Mã ưu đãi:</span>
                        <span className="font-black text-neon-green uppercase">{coupon.code}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Loại ưu đãi:</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                             {coupon.discount_type === 'PERCENTAGE' ? 'Giảm theo phần trăm (%)' : 'Giảm số tiền cố định (đ)'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Đơn hàng tối thiểu:</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                             {coupon.min_order_amount ? `${Number(coupon.min_order_amount).toLocaleString('vi-VN')}đ` : 'Không giới hạn'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">Giảm tối đa (%):</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                             {coupon.discount_type === 'PERCENTAGE' && coupon.max_discount_amount 
                                ? `${Number(coupon.max_discount_amount).toLocaleString('vi-VN')}đ` 
                                : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-50 dark:border-white/5 space-y-4">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white flex items-center gap-3">
                        <CalendarDays className="w-4 h-4 text-blue-500" /> Phạm vi áp dụng
                    </h3>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        {coupon.event ? (
                            <div className="space-y-2">
                                <div className="text-[9px] font-black uppercase text-blue-500 opacity-70 tracking-widest">Dành cho sự kiện:</div>
                                <div className="font-bold text-sm text-gray-800 dark:text-gray-200 leading-tight">
                                    {coupon.event.title}
                                </div>
                                <Link 
                                    to={`/admin/events/${coupon.event_id}`}
                                    className="inline-flex items-center text-[10px] font-black text-blue-500 hover:underline uppercase mt-2 gap-1"
                                >
                                    Xem sự kiện <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-neon-green" />
                                <div>
                                    <div className="text-[10px] font-black uppercase text-neon-green tracking-widest">Toàn bộ hệ thống</div>
                                    <div className="text-xs text-gray-500 italic mt-0.5">Áp dụng cho mọi đơn hàng hợp lệ.</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-amber-500/5 p-6 rounded-3xl border border-amber-500/10 flex gap-4">
                <Info className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-500 font-medium leading-relaxed italic">
                    Ghi chú: Thông tin ID hệ thống được dùng để đối soát giao dịch và gỡ lỗi trong cơ sở dữ liệu.
                </p>
            </div>
        </div>

        {/* History Usage Table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Lịch sử sử dụng gần đây</h3>
                    <p className="text-[10px] text-gray-500 mt-1 font-bold italic uppercase tracking-tighter">* Hiển thị 20 giao dịch cuối cùng</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                    <HistoryIcon className="w-4 h-4 text-gray-400" />
                </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Mã đơn hàng</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Khách hàng</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Ngày dùng</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Số tiền giảm</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {coupon.orders && coupon.orders.length > 0 ? coupon.orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-8 py-5">
                                    <Link to={`/admin/orders/${order.id}`} className="font-mono text-[10px] font-bold text-blue-500 hover:underline">
                                        #{order.id.slice(0, 8).toUpperCase()}
                                    </Link>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">{order.customer.full_name}</span>
                                        <span className="text-[10px] text-gray-400 font-mono italic mt-0.5">{order.customer.email}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {format(parseISO(order.created_at), 'dd/MM/yyyy HH:mm')}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right font-black text-neon-green">
                                    -{Number(order.discount_amount).toLocaleString('vi-VN')}đ
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center opacity-30">
                                        <ShoppingBag className="w-12 h-12 mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest">Chưa có lượt sử dụng nào</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

const HistoryIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/><path d="m20.2 20.2-1.5-1.5"/></svg>
);

export default CouponDetail;
