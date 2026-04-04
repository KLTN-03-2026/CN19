import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ChevronLeft, 
  Calendar, 
  Users, 
  Loader2, 
  AlertCircle,
  Clock,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { adminService } from '../../services/admin.service';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const response = await adminService.getMerchandiseById(id);
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin sản phẩm');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = product?.order_items?.filter(item => 
    item.order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.order.customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
        <p className="text-gray-500 animate-pulse uppercase text-xs font-black tracking-widest">Đang tải dữ liệu sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center bg-red-500/10 rounded-2xl border border-red-500/20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy sản phẩm</h2>
        <button onClick={() => navigate('/admin/products')} className="text-neon-green hover:underline">Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-1">
      {/* Header & Back Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/products')}
            className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-neon-green" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
              <Package className="w-4 h-4" />
              <span>Chi tiết Sản phẩm</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase ${
            product.is_active 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {product.is_active ? 'Đang hoạt động' : 'Đã ẩn bởi quản trị'}
          </span>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-neon-green/10 rounded-xl text-neon-green">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã bán</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{product.totalSold || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Doanh thu</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tồn kho</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{product.stock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl md:col-span-1 overflow-hidden relative group">
          {product.image_url ? (
             <img 
               src={product.image_url} 
               alt={product.name} 
               className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" 
             />
          ) : (
            <div className="absolute inset-0 bg-neon-green/5"></div>
          )}
          <div className="relative z-10">
             <p className="text-sm text-gray-500 mb-1 font-bold">Ban tổ chức</p>
             <p className="text-sm font-black text-neon-green uppercase truncate">{product.organizer?.organization_name}</p>
             <p className="text-[10px] text-gray-400 mt-1 italic">{product.organizer?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
              <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-neon-green" />
                Thông tin cơ bản
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Tên sản phẩm</label>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">{product.name}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Sự kiện liên kết</label>
                  {product.event ? (
                    <div className="flex items-center space-x-2 mt-1 p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10 overflow-hidden">
                         <img src={product.event?.image_url} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-bold text-neon-green truncate">{product.event?.title}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Sản phẩm độc lập</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Mô tả</label>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {product.description || 'Chưa có mô tả cho sản phẩm này.'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Ngày tạo</label>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(product.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-neon-green" />
                <span>Lịch sử Bán hàng</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                  {filteredOrders.length} giao dịch
                </span>
              </h2>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Mã đơn / Tên khách hàng..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-neon-green transition-colors dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02] text-left text-xs text-gray-500 uppercase font-black tracking-wider">
                    <th className="px-6 py-4">Đơn hàng</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4 text-center">Số lượng</th>
                    <th className="px-6 py-4 text-center">Tổng tiền</th>
                    <th className="px-6 py-4 text-center">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-neon-green">#{item.order.order_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{item.order.customer.full_name}</span>
                            <span className="text-[10px] text-gray-400">{item.order.customer.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="text-sm font-black text-gray-900 dark:text-white">
                             {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-center text-[10px] text-gray-500">
                          {format(new Date(item.order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        <p>Chưa có dữ liệu giao dịch cho sản phẩm này</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
