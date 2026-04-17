import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FilterX
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/admin.service';

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [organizerFilter, setOrganizerFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, organizerFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (organizerFilter !== 'all') params.organizerId = organizerFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await adminService.getMerchandise(params);
      if (response.success) {
        setProducts(response.data);
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
    // fetchProducts will be triggered by useEffect due to statusFilter/organizerFilter change
    if (statusFilter === 'all' && organizerFilter === 'all') {
      // If already at 'all', we need to manually trigger fetch if searchTerm was the only thing changed
      fetchProducts();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await adminService.toggleMerchandiseStatus(id);
      if (response.success) {
        toast.success(currentStatus ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm');
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
  const organizers = [...new Set(products.map(p => ({ id: p.organizer.id, name: p.organizer.organization_name })))];
  // Filter unique objects by id
  const uniqueOrganizers = Array.from(new Set(organizers.map(o => o.id)))
    .map(id => organizers.find(o => o.id === id));

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase text-gray-900 dark:text-white flex items-center space-x-3 tracking-tight">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <Package className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Sản phẩm</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">
            Giám sát và quản trị hàng hóa đồng hành cùng sự kiện.
          </p>
        </div>

        <div className="flex items-center bg-white dark:bg-[#111114] p-1 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Bar - High Density */}
      <div className="bg-white dark:bg-[#111114] p-3 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-wrap items-center gap-3 shadow-sm">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green/50 transition-all dark:text-white text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select 
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-green/50 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả Trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="hidden">Đã ẩn</option>
          </select>

          {/* Organizer Filter */}
          <select 
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-neon-green/50 max-w-[200px] cursor-pointer"
            value={organizerFilter}
            onChange={(e) => setOrganizerFilter(e.target.value)}
          >
            <option value="all">Tất cả Ban tổ chức</option>
            {uniqueOrganizers.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>

          <button 
            type="button" 
            onClick={handleClearFilters} 
            className="flex items-center space-x-2 bg-neon-green text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-neon-hover transition-all shadow-lg shadow-neon-green/20"
          >
            <span>Xóa lọc</span>
          </button>
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
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Thông tin sản phẩm</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Ban tổ chức</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Giá bán</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Kho hàng</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex flex-shrink-0 items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10 group-hover:border-neon-green/30 transition-all">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{p.name}</div>
                          {p.event && (
                            <div className="flex items-center text-[10px] text-gray-500 mt-0.5">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[200px]">{p.event.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-500 border border-blue-500/10">
                          {p.organizer.organization_name[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                          {p.organizer.organization_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center leading-none">
                        <span className={`text-sm font-black ${p.stock <= 10 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                          {p.stock}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">Sản phẩm</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                          p.is_active 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {p.is_active ? 'Bán' : 'Ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button 
                          onClick={() => navigate(`/admin/products/${p.id}`)}
                          className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg border border-transparent dark:border-white/5 transition-all shadow-sm"
                          title="Chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleStatus(p.id, p.is_active)}
                          className={`p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-transparent dark:border-white/5 shadow-sm transition-all ${
                            p.is_active 
                            ? 'text-amber-500 hover:bg-amber-500/10' 
                            : 'text-blue-500 hover:bg-blue-500/10'
                          }`}
                          title={p.is_active ? 'Ẩn' : 'Hiện'}
                        >
                          {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent dark:border-white/5 shadow-sm transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {products.map((p) => (
             <div key={p.id} className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden group hover:shadow-xl hover:shadow-neon-green/5 transition-all duration-500 flex flex-col">
                <div className="relative aspect-video overflow-hidden">
                   {p.image_url ? (
                     <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   ) : (
                     <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300 dark:text-white/10" />
                     </div>
                   )}
                   <div className="absolute top-4 right-4 flex flex-col space-y-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-500">
                      <button 
                        onClick={() => navigate(`/admin/products/${p.id}`)}
                        className="p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-md text-gray-900 dark:text-white rounded-xl shadow-lg hover:text-neon-green transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleStatus(p.id, p.is_active)}
                        className={`p-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-xl shadow-lg transition-colors ${p.is_active ? 'text-amber-500' : 'text-blue-500'}`}
                      >
                        {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                   </div>
                   <div className="absolute bottom-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-lg ${
                        p.is_active 
                        ? 'bg-neon-green text-black' 
                        : 'bg-red-500 text-white'
                      }`}>
                        {p.is_active ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                   </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                   <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{p.name}</h3>
                      <div className="flex items-center text-[10px] text-gray-500 mb-4">
                         <Users className="w-3 h-3 mr-1" />
                         <span className="truncate">{p.organizer.organization_name}</span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Giá bán</span>
                            <span className="text-base font-black text-gray-900 dark:text-white">
                               {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                            </span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tồn kho</span>
                            <span className={`text-base font-black ${p.stock <= 10 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                               {p.stock}
                            </span>
                         </div>
                      </div>
                   </div>

                   <button 
                     onClick={() => navigate(`/admin/products/${p.id}`)}
                     className="w-full py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 hover:bg-neon-green hover:text-black hover:border-neon-green transition-all"
                   >
                     Xem chi tiết
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
