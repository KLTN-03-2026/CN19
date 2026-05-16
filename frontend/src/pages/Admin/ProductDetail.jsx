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
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  Wallet,
  Eye,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [chartRange, setChartRange] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
      case 'success':
      case 'completed':
        return <span className="px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg text-[9px] font-black uppercase border border-green-500/20 shadow-sm whitespace-nowrap">Thành công</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase border border-red-500/20 shadow-sm whitespace-nowrap">Bị hủy</span>
      default:
        return <span className="px-2.5 py-1 bg-gray-500/10 text-gray-600 rounded-lg text-[9px] font-black uppercase border border-gray-100 dark:border-white/10 shadow-sm whitespace-nowrap uppercase tracking-widest">{status}</span>;
    }
  };

  const filteredOrders = product?.order_items?.filter(item => {
    const matchesSearch = item.order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.order.customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'success') return matchesSearch && ['paid', 'success', 'completed'].includes(item.order.status);
    return matchesSearch && item.order.status === statusFilter;
  }) || [];

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
        <p className="text-gray-600 animate-pulse uppercase text-xs font-black tracking-widest">Đang tải dữ liệu sản phẩm...</p>
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Back Acti4n */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/products')}
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-xl hover:border-neon-green/50 hover:text-neon-green transition-all shadow-sm group"
            title="Quay lại"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
              <Package className="w-4 h-4" />
              <span>Chi tiết Sản phẩm</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {product.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${
            product.is_active 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {product.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
          </span>
        </div>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-neon-green/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-neon-green/5 blur-3xl -mr-8 -mt-8"></div>
          <div className="flex items-center space-x-2.5 relative z-10">
            <div className="p-2 bg-neon-green/10 rounded-xl text-neon-green flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-gray-600">Đã bán</p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-0.5">{product.totalSold || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-amber-500/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-3xl -mr-8 -mt-8"></div>
          <div className="flex items-center space-x-2.5 relative z-10">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 flex-shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-gray-600">Doanh thu</p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.totalRevenue || 0)}>
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.totalRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* New Net Revenue Card */}
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-emerald-500/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-3xl -mr-8 -mt-8"></div>
          <div className="flex items-center space-x-2.5 relative z-10">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 flex-shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-gray-600">Doanh thu (Về BTC)</p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.netRevenue || 0)}>
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.netRevenue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* System Commission Card */}
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-blue-500/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-3xl -mr-8 -mt-8"></div>
          <div className="flex items-center space-x-2.5 relative z-10">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 flex-shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-gray-600">Hoa hồng hệ thống</p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis" title={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.systemCommission ?? (product.totalRevenue * 0.08 || 0))}>
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                   product.systemCommission ?? (product.totalRevenue * 0.08 || 0)
                 )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl relative overflow-hidden group shadow-sm transition-all hover:border-blue-500/30">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-3xl -mr-8 -mt-8"></div>
          <div className="flex items-center space-x-2.5 relative z-10">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500 flex-shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-black text-gray-600">Tồn kho</p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none mt-0.5">{product.stock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-3 rounded-2xl flex flex-col justify-center relative group shadow-sm transition-all hover:border-neon-green/30 font-bold">
          <div className="relative z-10 overflow-hidden ml-1">
             <p className="text-[10px] uppercase font-black text-gray-600 mb-0.5">Ban tổ chức</p>
             <p className="text-[11px] font-black text-neon-green uppercase truncate leading-none" title={product.organizer?.organization_name}>{product.organizer?.organization_name}</p>
             <p className="text-[9px] text-gray-600 mt-0.5 font-bold truncate opacity-70">{product.organizer?.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {/* Sales Trend AreaChart */}
          <div className="lg:col-span-2 p-6 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col h-[350px]">
             <div className="mb-6 flex justify-between items-start">
                <div>
                   <h3 className="text-[10px] font-black uppercase text-gray-600 mb-1 tracking-widest">Xu hướng tiêu thụ</h3>
                   <p className="text-sm font-bold text-gray-900 dark:text-white">Doanh thu {chartRange} ngày gần nhất</p>
                </div>
                <div className="flex items-center space-x-3">
                   <div className="flex items-center p-0.5 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                     <button 
                       onClick={() => setChartRange(7)}
                       className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${chartRange === 7 ? 'bg-neon-green text-black shadow-sm' : 'text-gray-500'}`}
                     >
                       7 ngày 
                     </button>
                     <button 
                       onClick={() => setChartRange(30)}
                       className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${chartRange === 30 ? 'bg-neon-green text-black shadow-sm' : 'text-gray-500'}`}
                     >
                       30 ngày 
                     </button>
                   </div>
                   <div className="hidden sm:flex items-center space-x-1.5 ml-2">
                     <div className="w-2 h-2 rounded-full bg-neon-green" />
                     <span className="text-[9px] font-black text-gray-500 uppercase leading-none">Doanh thu</span>
                   </div>
                </div>
             </div>
             
             <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={(product.statistics?.timeline || []).slice(-chartRange)}>
                     <defs>
                        <linearGradient id="colorRevenueProd" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#00FF85" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#00FF85" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 'bold' }} 
                     />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ 
                           backgroundColor: '#111114', 
                           border: '1px solid rgba(255,255,255,0.1)',
                           borderRadius: '16px',
                           fontSize: '11px',
                           fontWeight: 'bold',
                           color: '#fff',
                           padding: '12px'
                        }}
                        itemStyle={{ color: '#00FF85' }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#00FF85" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenueProd)" 
                        animationDuration={1500}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Stock Composition PieChart */}
         <div className="p-6 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] shadow-sm flex flex-col h-[350px]">
            <div className="mb-6">
               <h3 className="text-[10px] font-black uppercase text-gray-600 mb-1 tracking-widest">Tình trạng kho</h3>
               <p className="text-sm font-bold text-gray-900 dark:text-white">Phân bổ nguồn lực</p>
            </div>
            <div className="flex-1 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={[
                           { name: 'Đã bán', value: product.totalSold || 0 },
                           { name: 'Còn lại', value: product.stock || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={10}
                        dataKey="value"
                        animationDuration={1500}
                     >
                        <Cell fill="#00FF85" stroke="none" />
                        <Cell fill="rgba(255,255,255,0.05)" stroke="none" />
                     </Pie>
                     <Tooltip 
                        contentStyle={{ 
                           backgroundColor: '#111114', 
                           border: '1px solid rgba(255,255,255,0.1)',
                           borderRadius: '16px',
                           fontSize: '11px',
                           fontWeight: 'bold',
                           color: '#fff'
                        }}
                     />
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Tổng nhập</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
                     {(product.totalSold || 0) + (product.stock || 0)}
                  </p>
               </div>
            </div>
            <div className="space-y-3 mt-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-neon-green" />
                    <span className="text-[10px] font-black text-gray-500 uppercase">Đã bán</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-900 dark:text-white">
                     {Math.round(((product.totalSold || 0) / ((product.totalSold || 0) + (product.stock || 0)) * 100) || 0)}%
                  </span>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-white/10" />
                    <span className="text-[10px] font-black text-gray-500 uppercase">Tồn kho</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-900 dark:text-white">
                     {Math.round(((product.stock || 0) / ((product.totalSold || 0) + (product.stock || 0)) * 100) || 0)}%
                  </span>
               </div>
            </div>
         </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
              <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white mb-6 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-neon-green" />
                Thông tin cơ bản
              </h3>
              
              {/* Product Image integrated here */}
              <div className="mb-6 aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-inner bg-gray-50 dark:bg-white/5 group">
                 {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 opacity-30">
                      <Package className="w-12 h-12 mb-2" />
                      <p className="text-[10px] uppercase font-black">No Image</p>
                   </div>
                 )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Tên sản phẩm</label>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mt-1">{product.name}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Sự kiện liên kết</label>
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
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Mô tả</label>
                  <p className="text-xs text-gray-700 dark:text-gray-400 mt-1 leading-relaxed">
                    {product.description || 'Chưa có mô tả cho sản phẩm này.'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Ngày tạo</label>
                  <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                    {format(new Date(product.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-white/5 space-y-5">
              {/* Row 1: Title & Stats */}
              <div className="flex items-center justify-between group">
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                  <div className="p-2 bg-neon-green/10 rounded-xl">
                    <ShoppingBag className="w-5 h-5 text-neon-green" />
                  </div>
                  <span>Lịch sử Bán hàng</span>
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2.5 py-1 rounded-full uppercase tracking-widest ml-2">
                    {filteredOrders.length} giao dịch
                  </span>
                </h2>
              </div>

              {/* Row 2: Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'success', label: 'Thành công' },
                    { id: 'cancelled', label: 'Bị hủy' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setStatusFilter(tab.id);
                        setCurrentPage(1);
                      }}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                        statusFilter === tab.id
                          ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10'
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input 
                    type="text" 
                    placeholder="Tìm theo mã đơn, khách hàng..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 text-xs bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl focus:outline-none focus:border-neon-green/50 transition-all dark:text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/[0.02] text-left text-[10px] text-gray-600 uppercase font-black border-b border-gray-100 dark:border-white/5">
                    <th className="px-6 py-4">Đơn hàng</th>
                    <th className="px-6 py-4">Khách hàng</th>
                    <th className="px-6 py-4 text-center">Số lượng</th>
                    <th className="px-6 py-4 text-center">Doanh thu</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right pr-10 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-black text-neon-green">#{item.order.order_number.slice(-8)}</span>
                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tight mt-1">
                               {format(new Date(item.order.created_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3 max-w-[200px]">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden flex-shrink-0">
                               {item.order.customer?.avatar_url ? (
                                  <img 
                                    src={item.order.customer.avatar_url} 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.order.customer.full_name)}&background=random&color=fff`;
                                    }}
                                  />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-white/5 uppercase">
                                     {item.order.customer?.full_name?.charAt(0)}
                                  </div>
                               )}
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="text-xs font-black text-gray-900 dark:text-white truncate">{item.order.customer.full_name}</span>
                               <span className="text-[10px] text-gray-600 font-bold truncate opacity-60 tracking-tight">{item.order.customer.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(item.order.status)}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <button 
                            onClick={() => window.open(`http://localhost:5173/admin/transactions/ORDER/${item.order.id}`, '_blank')}
                            className="p-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-neon-green hover:text-black transition-all text-gray-600 group shadow-sm active:scale-95"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                           <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Không có dữ liệu giao dịch</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase">Trang {currentPage} / {totalPages}</p>
                <div className="flex items-center space-x-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                        currentPage === i + 1 
                        ? 'bg-neon-green text-black' 
                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
