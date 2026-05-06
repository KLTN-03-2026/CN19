import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  EyeOff,
  Trash2, 
  MoreVertical,
  ChevronRight,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Tag,
  ArrowUpDown,
  LayoutGrid,
  List,
  FilterX,
  Download,
  TrendingUp,
  DollarSign,
  Archive,
  ArrowUp,
  ArrowDown,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const ProductManagement = () => {
  const { productPlatformFee, productTransactionFee } = useSystemConfig();
  const totalProductFee = productPlatformFee + productTransactionFee;

  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [organizerFilter, setOrganizerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price_high', 'price_low', 'stock_low'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, organizerFilter]);

  // Export to Excel logic
  const exportToExcel = () => {
    try {
      if (products.length === 0) {
        toast.error('Không có dữ liệu để xuất');
        return;
      }

      toast.loading('Đang chuẩn bị báo cáo...', { id: 'export-report' });

      const dataToExport = products.map((p, index) => ({
        'STT': index + 1,
        'Tên sản phẩm': p.name,
        'Ban tổ chức': p.organizer?.organization_name,
        'Sự kiện': p.event?.title || 'Bán chung',
        'Giá bán (VNĐ)': Number(p.price),
        'Tồn kho': p.stock,
        'Lượt bán': p._count?.order_items || 0,
        'Doanh thu dự tính (VNĐ)': Number(p.price * (p._count?.order_items || 0)),
        [`Hoa hồng hệ thống (${totalProductFee}%)`]: Number(p.price * (p._count?.order_items || 0) * (totalProductFee / 100)),
        [`Thực nhận BTC (${100 - totalProductFee}%)`]: Number(p.price * (p._count?.order_items || 0) * ((100 - totalProductFee) / 100)),
        'Trạng thái': p.is_active ? 'Đang bán' : 'Đã ẩn',
        'Ngày tạo': p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Merchandise');

      // Auto-width columns
      const wscols = [
        { wch: 5 }, { wch: 30 }, { wch: 25 }, { wch: 30 }, 
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `Bao_cao_san_pham_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`);
      toast.success('Xuất báo cáo thành công!', { id: 'export-report' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất báo cáo', { id: 'export-report' });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (organizerFilter !== 'all') params.organizerId = organizerFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await adminService.getMerchandise(params);
      if (response.success) {
        let sortedData = [...response.data];
        
        // Apply Sorting
        if (sortBy === 'price_high') sortedData.sort((a, b) => b.price - a.price);
        else if (sortBy === 'price_low') sortedData.sort((a, b) => a.price - b.price);
        else if (sortBy === 'stock_low') sortedData.sort((a, b) => a.stock - b.stock);
        else if (sortBy === 'sales_high') sortedData.sort((a, b) => (b._count?.order_items || 0) - (a._count?.order_items || 0));
        
        setProducts(sortedData);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchProducts();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOrganizerFilter('all');
    setSortBy('newest');
    fetchProducts();
  };

  const toggleStatus = async (id, currentStatus) => {
    const action = currentStatus ? 'Ẩn' : 'Công khai';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} sản phẩm này trên hệ thống?`)) return;

    try {
      const response = await adminService.toggleMerchandiseStatus(id);
      if (response.success) {
        toast.success(currentStatus ? 'Đã ẩn sản phẩm thành công' : 'Đã công khai sản phẩm thành công');
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác này không thể hoàn tác.')) return;

    try {
      const response = await adminService.deleteMerchandise(id);
      if (response.success) {
        toast.success('Xóa sản phẩm thành công');
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm này');
    }
  };

  // Lấy danh sách BTC duy nhất để lọc
  const organizers = [...new Set(products.map(p => ({ id: p.organizer?.id, name: p.organizer?.organization_name })))];
  // Filter unique objects by id
  const uniqueOrganizers = Array.from(new Set(organizers.filter(o => o.id).map(o => o.id)))
    .map(id => organizers.find(o => o.id === id));

  // Statistics calculation
  const stats = {
    total: products.length,
    active: products.filter(p => p.is_active).length,
    totalRevenue: products.reduce((sum, p) => sum + (p.price * (p._count?.order_items || 0)), 0),
    totalSales: products.reduce((sum, p) => sum + (p._count?.order_items || 0), 0)
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black uppercase text-gray-900 dark:text-white flex items-center space-x-3 tracking-tight">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <Package className="w-5 h-5 text-neon-green" />
            </div>
            <span>Quản lý sản phẩm</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm font-medium">
            Giám sát và quản trị hàng hóa đồng hành cùng sự kiện trên toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center space-x-2 bg-neon-green text-black px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-neon-hover transition-all shadow-lg shadow-neon-green/20 active:scale-95 group"
          >
            <Download className="w-4 h-4" />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Stats Bar - Premium Administrative View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tổng sản phẩm', value: stats.total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Đang hoạt động', value: stats.active, icon: CheckCircle2, color: 'text-neon-green', bg: 'bg-neon-green/10' },
          { label: 'Tổng doanh thu bán', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Hiệu suất bán', value: `${stats.totalSales} lượt`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#111114] p-4 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-white/10 transition-all group flex items-center space-x-4">
            <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase leading-none mb-1.5" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                {stat.label}
              </p>
              <p className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar - High Density */}
      <div className="bg-gray-50/50 dark:bg-[#111114] p-3 rounded-2xl border border-gray-300 dark:border-white/5 flex flex-wrap items-center gap-3 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            className="w-full bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green/50 focus:ring-4 focus:ring-neon-green/5 transition-all dark:text-white text-gray-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select 
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-green/50 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="hidden">Đã ẩn</option>
          </select>

          {/* Organizer Filter */}
          <select 
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-green/50 max-w-[200px] cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
            value={organizerFilter}
            onChange={(e) => setOrganizerFilter(e.target.value)}
          >
            <option value="all">Tất cả Ban tổ chức</option>
            {uniqueOrganizers.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>

          {/* Sort By */}
          <select 
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-green/50 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              // Trigger sorting immediately if we already have products
              if (products.length > 0) {
                let sortedData = [...products];
                if (e.target.value === 'price_high') sortedData.sort((a, b) => b.price - a.price);
                else if (e.target.value === 'price_low') sortedData.sort((a, b) => a.price - b.price);
                else if (e.target.value === 'stock_low') sortedData.sort((a, b) => a.stock - b.stock);
                else if (e.target.value === 'sales_high') sortedData.sort((a, b) => (b._count?.order_items || 0) - (a._count?.order_items || 0));
                setProducts(sortedData);
              }
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_high">Giá: Cao đến Thấp</option>
            <option value="price_low">Giá: Thấp đến Cao</option>
            <option value="stock_low">Tồn kho: Thấp đến Cao</option>
            <option value="sales_high">Bán chạy nhất</option>
          </select>

          <button 
            type="button" 
            onClick={handleClearFilters} 
            className="flex items-center space-x-2 bg-gray-100 dark:bg-neon-green/10 text-gray-700 dark:text-neon-green border border-gray-200 dark:border-neon-green/20 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-neon-green dark:hover:text-black transition-all shadow-sm"
          >
            <FilterX className="w-4 h-4" />
            <span>Xóa lọc</span>
          </button>

          <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

          <div className="flex items-center bg-white dark:bg-white/5 p-1 rounded-xl border border-gray-300 dark:border-white/10 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-neon-green text-gray-900 dark:text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-neon-green text-gray-900 dark:text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Xem dạng danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 p-20 flex flex-col items-center justify-center shadow-sm">
          <Loader2 className="w-8 h-8 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 uppercase text-[10px] font-black tracking-widest">Đang tải dữ liệu...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 p-20 flex flex-col items-center justify-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-gray-400 mb-4 opacity-20" />
          <p className="text-gray-500 italic text-sm">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Thông tin sản phẩm</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Ban tổ chức</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest text-center">Lượt bán / Tổng</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest text-right">Tài chính (VNĐ)</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex flex-shrink-0 items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 group-hover:border-neon-green/30 transition-all shadow-sm">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-neon-green transition-colors">{p.name}</div>
                          <div className="flex items-center text-[10px] text-gray-600 mt-1 font-medium tracking-wide">
                            {p.event ? (
                              <><Tag className="w-3 h-3 mr-1 text-neon-green" /> <span className="truncate max-w-[150px]">{p.event.title}</span></>
                            ) : (
                              <><TrendingUp className="w-3 h-3 mr-1 text-blue-500" /> <span>Bán chung toàn sàn</span></>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-[11px] font-black text-blue-500 border border-blue-500/10 shadow-inner">
                          {p.organizer?.organization_name?.[0].toUpperCase() || 'O'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-300 truncate max-w-[150px]">
                            {p.organizer?.organization_name}
                          </p>
                          <p className="text-[9px] text-gray-600 dark:text-gray-400 font-bold uppercase mt-0.5">ID: {p.organizer_id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-neon-green">
                            {p._count?.order_items || 0}
                          </span>
                          <span className="text-gray-300 dark:text-gray-700">/</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                            {p.stock + (p._count?.order_items || 0)}
                          </span>
                        </div>
                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200 dark:border-white/5">
                          <div 
                            className="h-full bg-neon-green rounded-full shadow-[0_0_5px_rgba(50,255,100,0.3)]" 
                            style={{ width: `${Math.min(100, ((p._count?.order_items || 0) / (p.stock + (p._count?.order_items || 0) || 1)) * 100)}%` }} 
                          />
                        </div>
                        <p className="text-[9px] text-gray-600 dark:text-gray-500 font-black uppercase tracking-tighter">Lượt bán / Tổng</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-gray-900 dark:text-neon-green">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                             <span className="text-[9px] font-black text-gray-600 dark:text-gray-500 uppercase tracking-widest">HH({totalProductFee}%):</span>
                             <span className="text-[10px] font-black text-blue-500">
                                {new Intl.NumberFormat('vi-VN').format(p.price * (totalProductFee / 100))}đ
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm border ${
                          p.is_active 
                          ? 'bg-green-50 dark:bg-neon-green/10 text-green-700 dark:text-neon-green border-green-200 dark:border-neon-green/20' 
                          : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/20'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${p.is_active ? 'bg-green-600 dark:bg-neon-green animate-pulse' : 'bg-red-600 dark:bg-red-500'}`} />
                        {p.is_active ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button 
                          onClick={() => navigate(`/admin/products/${p.id}`)}
                          className="p-2.5 bg-white dark:bg-white/5 text-gray-400 dark:text-gray-500 group-hover:text-neon-green dark:group-hover:text-black group-hover:bg-neon-green/10 dark:group-hover:bg-neon-green group-hover:border-neon-green/30 rounded-xl border border-gray-200 dark:border-white/10 transition-all shadow-sm"
                          title="Xem chi tiết sản phẩm"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => toggleStatus(p.id, p.is_active)}
                          className={`p-2.5 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm transition-all ${
                            p.is_active 
                            ? 'text-amber-500 hover:border-amber-500/30' 
                            : 'text-blue-500 hover:border-blue-500/30'
                          }`}
                          title={p.is_active ? 'Ẩn sản phẩm khỏi hệ thống' : 'Công khai sản phẩm lên hệ thống'}
                        >
                          {p.is_active ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2.5 bg-white dark:bg-white/5 text-gray-400 hover:text-red-500 hover:border-red-500/30 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
           {products.map((p) => (
             <div key={p.id} className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/5 overflow-hidden group hover:shadow-xl hover:shadow-neon-green/10 hover:border-neon-green/40 transition-all duration-500 flex flex-col hover:-translate-y-1">
                <div className="relative aspect-video overflow-hidden">
                   {p.image_url ? (
                     <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   ) : (
                     <div className="w-full h-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-200 dark:text-white/10" />
                     </div>
                   )}
                   <div className="absolute top-4 right-4 flex flex-col space-y-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-500">
                       <button 
                         onClick={() => navigate(`/admin/products/${p.id}`)}
                         className="p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-md text-gray-900 dark:text-white rounded-xl shadow-lg hover:text-neon-green transition-colors border border-gray-100 dark:border-white/10"
                         title="Xem chi tiết sản phẩm"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => toggleStatus(p.id, p.is_active)}
                         className={`p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-xl shadow-lg transition-colors border border-gray-100 dark:border-white/10 ${p.is_active ? 'text-amber-500' : 'text-blue-500'}`}
                         title={p.is_active ? 'Ẩn sản phẩm' : 'Công khai sản phẩm'}
                       >
                         {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                   </div>
                   <div className="absolute bottom-4 left-4 z-10">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-xl backdrop-blur-md border ${
                        p.is_active 
                        ? 'bg-white dark:bg-black/90 text-green-700 dark:text-neon-green border-green-200 dark:border-neon-green/30' 
                        : 'bg-white dark:bg-black/90 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30'
                      }`}>
                        {p.is_active ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                   </div>
                </div>

                <div className="p-5 flex-1 flex flex-col space-y-4">
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                         <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-neon-green transition-colors">{p.name}</h3>
                         <div className="flex items-center space-x-1 text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-full border border-neon-green/10">
                            <ShoppingBag className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-bold">{p._count?.order_items || 0}</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center text-[10px] text-gray-700 dark:text-gray-400 font-medium mb-4">
                         <Users className="w-3 h-3 mr-1.5 text-blue-500" />
                         <span className="truncate">{p.organizer?.organization_name}</span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-gray-600 dark:text-gray-400 font-bold mb-0.5">Giá niêm yết</span>
                            <span className="text-base font-black text-gray-900 dark:text-neon-green tracking-tighter">
                               {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                            </span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-600 dark:text-gray-400 font-bold mb-0.5">Kho hàng</span>
                            <span className={`text-base font-black tracking-tighter ${p.stock <= 10 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                               {p.stock}
                            </span>
                         </div>
                      </div>

                      {/* Sales Progress */}
                      <div className="space-y-1.5">
                         <div className="flex justify-between text-[9px] font-bold text-gray-700 dark:text-gray-400 tracking-tight">
                            <span>Tỷ lệ đã bán</span>
                            <span className="text-neon-green font-black">
                               {p._count?.order_items || 0} / {p.stock + (p._count?.order_items || 0)}
                            </span>
                         </div>
                         <div className="h-2 w-full bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200 dark:border-white/5">
                            <div 
                               className="h-full bg-neon-green rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(50,255,100,0.4)]"
                               style={{ width: `${Math.min(100, ((p._count?.order_items || 0) / (p.stock + (p._count?.order_items || 0) || 1)) * 100)}%` }}
                            />
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={() => navigate(`/admin/products/${p.id}`)}
                     className="w-full py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black text-gray-600 dark:text-gray-400 group-hover:bg-neon-green dark:group-hover:bg-neon-green group-hover:text-black dark:group-hover:text-black group-hover:border-neon-green transition-all shadow-sm"
                   >
                     Chi tiết quản trị
                   </button>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
