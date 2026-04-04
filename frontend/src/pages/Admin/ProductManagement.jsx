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
  ArrowUpDown
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
    e.preventDefault();
    fetchProducts();
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
    <div className="p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black uppercase text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-neon-green/10 rounded-lg">
              <Package className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Sản phẩm</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-[10px] italic">
            Giám sát và quản trị toàn bộ vật phẩm bán kèm trên hệ thống
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative w-full md:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="hidden">Đã ẩn</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>

          {/* Organizer Filter */}
          <div className="relative w-full md:w-56">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={organizerFilter}
              onChange={(e) => setOrganizerFilter(e.target.value)}
            >
              <option value="all">Tất cả BTC</option>
              {uniqueOrganizers.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 animate-pulse uppercase text-xs font-black tracking-widest">Đang tải sản phẩm...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Thông tin sản phẩm</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Ban tổ chức</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Giá bán</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Tồn kho</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {products.length > 0 ? products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-white/5 flex flex-shrink-0 items-center justify-center overflow-hidden border border-gray-100 dark:border-white/10 group-hover:border-neon-green/30 transition-all">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white line-clamp-1">{p.name}</div>
                          {p.event && (
                            <div className="flex items-center text-[10px] text-gray-500 mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[150px]">{p.event.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-500">
                          {p.organizer.organization_name[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
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
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-black ${p.stock <= 10 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                          {p.stock}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Sản phẩm</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                          p.is_active 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {p.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/admin/products/${p.id}`)}
                          className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => toggleStatus(p.id, p.is_active)}
                          className={`p-2 rounded-lg transition-all ${
                            p.is_active 
                            ? 'text-amber-500 hover:bg-amber-500/10' 
                            : 'text-blue-500 hover:bg-blue-500/10'
                          }`}
                          title={p.is_active ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                        >
                          {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                          <Package className="w-8 h-8 text-gray-300 dark:text-white/10" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold">Không tìm thấy sản phẩm nào</p>
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

export default ProductManagement;
