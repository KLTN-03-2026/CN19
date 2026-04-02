import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Tag, Star, Edit, Trash2,
  ToggleLeft, ToggleRight, Loader2, ShoppingBag,
  Calendar, User, Mail, DollarSign, TrendingUp,
  Clock, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';

const MerchandiseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const res = await organizerService.getMerchandiseById(id);
      setItem(res.data);
    } catch (err) {
      toast.error('Không thể tải thông tin sản phẩm.');
      navigate('/organizer/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      const res = await organizerService.toggleMerchandise(id);
      toast.success(res.message);
      setItem(prev => ({ ...prev, is_active: res.data.is_active }));
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await organizerService.deleteMerchandise(id);
      toast.success('Đã xóa sản phẩm.');
      navigate('/organizer/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa.');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Đang tải...</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/organizer/products')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
              item.is_active
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10 hover:bg-green-500/10 hover:text-green-600'
            }`}
          >
            {item.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            {item.is_active ? 'Đang bán' : 'Đã tắt'}
          </button>
          <button
            onClick={() => navigate('/organizer/products')}
            className="px-4 py-2.5 bg-blue-500/10 text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Chỉnh sửa
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2.5 bg-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Xóa
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#16161a] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="aspect-square bg-gray-100 dark:bg-white/5">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-200 dark:text-gray-700" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title + Status */}
          <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</h1>
                {item.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
                )}
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                item.is_active
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}>
                {item.is_active ? 'Đang bán' : 'Đã tắt'}
              </span>
            </div>

            {/* Event link */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                {item.event ? (
                  <><Tag className="w-3.5 h-3.5 text-blue-500" /> Sự kiện: <span className="text-gray-900 dark:text-white">{item.event.title}</span></>
                ) : (
                  <><Star className="w-3.5 h-3.5 text-amber-500" /> Bán chung tất cả sự kiện</>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 text-center">
              <DollarSign className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Giá bán</p>
              <p className="text-lg font-black text-blue-600">{formatPrice(item.price)}</p>
            </div>
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 text-center">
              <Package className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tồn kho</p>
              <p className={`text-lg font-black ${item.stock > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{item.stock}</p>
            </div>
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 text-center">
              <ShoppingBag className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đã bán</p>
              <p className="text-lg font-black text-gray-900 dark:text-white">{item.totalSold || 0}</p>
            </div>
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 text-center">
              <TrendingUp className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Doanh thu</p>
              <p className="text-lg font-black text-amber-600">{formatPrice(item.totalRevenue || 0)}</p>
            </div>
          </div>
 
          {/* Settlement Breakdown */}
          {item.totalRevenue > 0 && (
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-6 animate-in fade-in slide-in-from-top-2 duration-500">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Chi tiết quyết toán (Dự kiến)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Tổng doanh thu bán sản phẩm</span>
                  <span className="text-gray-900 dark:text-white font-black">{formatPrice(item.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium italic">Phí hệ thống (5%)</span>
                  <span className="text-red-500 font-bold">-{formatPrice(item.totalRevenue * 0.05)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium italic">Phí cổng thanh toán (3%)</span>
                  <span className="text-red-500 font-bold">-{formatPrice(item.totalRevenue * 0.03)}</span>
                </div>
                <div className="pt-3 border-t border-dashed border-gray-100 dark:border-white/10 flex justify-between items-center">
                  <span className="text-blue-600 font-black uppercase tracking-tighter">Thực nhận cuối cùng</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600 leading-none block">{formatPrice(item.totalRevenue * 0.92)}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 block">Đã khấu trừ tất cả chi phí</span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Meta info */}
          <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4">
            <div className="flex flex-wrap gap-6 text-xs text-gray-400 dark:text-gray-500 font-bold">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Tạo lúc: <span className="text-gray-700 dark:text-gray-300">{formatDate(item.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Cập nhật: <span className="text-gray-700 dark:text-gray-300">{formatDate(item.updated_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> ID: <span className="text-gray-700 dark:text-gray-300 font-mono text-[10px]">{item.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-500" /> Lịch sử đơn hàng
          </h2>
          <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase">
            {item.order_items?.length || 0} đơn
          </span>
        </div>

        {item.order_items && item.order_items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Khách hàng</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mã đơn</th>
                  <th className="px-6 py-3 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">SL</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đơn giá</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thành tiền</th>
                  <th className="px-6 py-3 text-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ngày mua</th>
                </tr>
              </thead>
              <tbody>
                {item.order_items.map((orderItem, idx) => (
                  <tr key={orderItem.id} className={`border-b border-gray-50 dark:border-white/[0.02] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-white/[0.01]'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                          {orderItem.order?.customer?.avatar_url ? (
                            <img src={orderItem.order.customer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            orderItem.order?.customer?.full_name?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{orderItem.order?.customer?.full_name || 'N/A'}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{orderItem.order?.customer?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{orderItem.order?.order_number || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">x{orderItem.quantity}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{formatPrice(orderItem.unit_price)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-blue-600">{formatPrice(orderItem.subtotal)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${getStatusColor(orderItem.order?.status)}`}>
                        {getStatusLabel(orderItem.order?.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                        {orderItem.order?.created_at ? formatDate(orderItem.order.created_at) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500">Chưa có đơn hàng nào cho sản phẩm này.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchandiseDetail;
