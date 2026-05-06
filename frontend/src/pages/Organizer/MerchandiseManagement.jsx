import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
  PlusCircle, Search, Package, Edit, Trash2, Loader2,
  ToggleLeft, ToggleRight, X, Image, DollarSign,
  Tag, AlertCircle, Archive, Star, ShoppingBag,
  LayoutGrid, List, Upload, Camera, Eye, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { organizerService } from '../../services/organizer.service';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const MerchandiseManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productPlatformFee, productTransactionFee } = useSystemConfig();
  const totalProductFeePercent = productPlatformFee + productTransactionFee;

  // Hàm xuất Excel (.xlsx) chuyên nghiệp
  const exportToExcel = () => {
    try {
      if (items.length === 0) {
        toast.error('Không có dữ liệu để xuất.');
        return;
      }

      toast.loading('Đang chuẩn bị báo cáo...', { id: 'export-merch' });

      // Chuẩn bị dữ liệu cho Excel
      const dataToExport = items.map((item, index) => {
        const mPlatformFee = Number(item.platform_fee_percent || productPlatformFee);
        const mTransFee = Number(item.commission_fee_percent || productTransactionFee);
        const mTotalFee = mPlatformFee + mTransFee;

        const soldCount = item._count?.order_items || 0;
        const actualRevenue = Number(soldCount * item.price);
        const netRevenue = Number(actualRevenue * (1 - mTotalFee / 100));
        const estTotalRevenue = Number((soldCount + item.stock) * item.price);

        return {
          'STT': index + 1,
          'Tên sản phẩm': item.name,
          'Sự kiện': item.event?.title || '🌐 Bán chung',
          'Giá bán (VNĐ)': Number(item.price),
          'Kho hiện tại': item.stock,
          'Đã bán': soldCount,
          'Doanh thu thực tế': actualRevenue,
          [`Thực nhận BTC (${100 - mTotalFee}%)`]: netRevenue,
          'Tổng doanh thu dự tính': estTotalRevenue,
          'Trạng thái': item.is_active ? 'Đang bán' : 'Đã tắt',
          'Ngày tạo': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '---'
        };
      });

      // Tạo Worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách sản phẩm');

      // Tự động căn chỉnh độ rộng cột
      const wscols = [
        { wch: 5 },  // STT
        { wch: 30 }, // Tên
        { wch: 35 }, // Sự kiện
        { wch: 15 }, // Giá
        { wch: 12 }, // Kho
        { wch: 10 }, // Đã bán
        { wch: 18 }, // Doanh thu thực tế
        { wch: 18 }, // Thực nhận
        { wch: 22 }, // Doanh thu dự tính
        { wch: 12 }, // Trạng thái
        { wch: 15 }, // Ngày tạo
      ];
      worksheet['!cols'] = wscols;

      // Xuất file
      const fileName = `Bao_cao_san_pham_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Xuất báo cáo thành công!', { id: 'export-merch' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Có lỗi xảy ra khi xuất báo cáo.', { id: 'export-merch' });
    }
  };

  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '', image_url: '', event_id: '', is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => { fetchData(); }, []);

  // Tự động mở Modal sửa nếu nhận được tín hiệu từ trang Chi tiết
  useEffect(() => {
    if (location.state?.editId && items.length > 0) {
      const itemToEdit = items.find(i => i.id === location.state.editId);
      if (itemToEdit) {
        openEditModal(itemToEdit);
        // Sau khi mở xong thì xóa state để tránh lặp lại khi refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, items]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [merchRes, eventsRes] = await Promise.all([
        organizerService.getMerchandise(),
        organizerService.getMyEvents()
      ]);
      setItems(merchRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (err) {
      toast.error('Không thể tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ name: '', description: '', price: '', stock: '', image_url: '', event_id: '', is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price?.toString() || '',
      stock: item.stock?.toString() || '',
      image_url: item.image_url || '',
      event_id: item.event_id || '',
      is_active: item.is_active
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || cloudName === 'your_cloud_name') {
      toast.error('Cloudinary chưa được cấu hình trong .env');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        fd,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );
      setFormData(prev => ({ ...prev, image_url: res.data.secure_url }));
      toast.success('Tải ảnh lên thành công!');
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error('Vui lòng nhập tên sản phẩm.');
    if (!formData.price || parseFloat(formData.price) <= 0) return toast.error('Giá phải lớn hơn 0.');

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        image_url: formData.image_url || null,
        event_id: formData.event_id || null,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await organizerService.updateMerchandise(editingItem.id, payload);
        toast.success('Đã cập nhật sản phẩm.');
      } else {
        await organizerService.createMerchandise(payload);
        toast.success('Đã tạo sản phẩm mới!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đã xảy ra lỗi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await organizerService.deleteMerchandise(id);
      toast.success('Đã xóa sản phẩm.');
      setItems(items.filter(i => i.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa.');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await organizerService.toggleMerchandise(id);
      toast.success(res.message);
      setItems(items.map(i => i.id === id ? { ...i, is_active: res.data.is_active } : i));
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái.');
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchEvent = filterEvent === 'all'
      || (filterEvent === 'global' && !item.event_id)
      || item.event_id === filterEvent;

    let matchStatus = true;
    if (filterStatus === 'active') matchStatus = item.is_active && item.stock > 0;
    else if (filterStatus === 'hidden') matchStatus = !item.is_active;
    else if (filterStatus === 'out_of_stock') matchStatus = item.stock <= 0;

    let matchDate = true;
    if (filterDate) {
      const itemDate = new Date(item.created_at).toDateString();
      const selectedDate = new Date(filterDate).toDateString();
      matchDate = itemDate === selectedDate;
    }

    return matchSearch && matchEvent && matchStatus && matchDate;
  });

  const stats = {
    total: items.length,
    active: items.filter(i => i.is_active).length,
    outOfStock: items.filter(i => i.stock <= 0).length
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4  duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Quản lý vật phẩm
          </h1>
          <p className="text-gray-500 dark:text-gray-300 mb-1 text-[9px] md:text-xs font-medium">
            Tạo và quản lý lightstick, photocard, đồ ăn thức uống bán kèm vé sự kiện.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button 
            onClick={exportToExcel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            Xuất báo cáo
          </button>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-2.5 md:px-3 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all flex items-center group shrink-0"
          >
            <PlusCircle className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Tổng sản phẩm', value: stats.total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Đang bán', value: stats.active, icon: Tag, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Hết hàng', value: stats.outOfStock, icon: Archive, color: 'text-red-500', bg: 'bg-red-500/10' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className={`w-10 h-10 md:w-10 md:h-10 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-3 h-3 md:w-4.5 md:h-4.5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase leading-none mb-1.5 tracking-wider">{stat.label}</p>
              <p className="text-sm md:text-lg font-black text-gray-900 dark:text-white leading-none tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Bar */}
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm vật phẩm..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm h-[48px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Event Select - Moved & Resized */}
        <select
          className="px-4 py-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[12px] tracking-tight text-gray-700 dark:text-white appearance-none cursor-pointer min-w-[130px] lg:max-w-[160px] shadow-sm h-[48px]"
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
        >
          <option value="all">Tất cả sự kiện</option>
          <option value="global">🌐 BÁN CHUNG</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.title.toUpperCase()}</option>)}
        </select>

        {/* Filters Group */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 md:gap-3">
          {/* Status Filters */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm shrink-0 h-[48px]">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang bán' },
              { id: 'hidden', label: 'Đã ẩn' },
              { id: 'out_of_stock', label: 'Hết hàng' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(s.id)}
                className={`px-3 md:px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap h-full ${
                  filterStatus === s.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 p-1 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm shrink-0 px-3 h-[48px]">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-[10px] font-bold text-gray-900 dark:text-white w-24 custom-date-input"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-[#111114] p-1 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm shrink-0 h-[48px]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              title="Lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              title="Danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="pt-1 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-700 dark:text-gray-500 font-bold uppercase text-xs">Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {filtered.map(item => (
                <div key={item.id} className="bg-white dark:bg-[#16161a] rounded-[2.5rem] border border-gray-200 dark:border-white/5 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1">
                  {/* Image */}
                  <div className="aspect-[3/2] relative overflow-hidden bg-gray-100 dark:bg-white/5">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-200 dark:text-gray-700" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase backdrop-blur-md ${
                        item.is_active
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                      }`}>
                        {item.is_active ? 'Đang bán' : 'Đã tắt'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 space-y-2 md:space-y-3">
                    <div className="space-y-1 md:space-y-1.5">
                      <h3 className="text-[11px] md:text-sm font-black text-gray-900 dark:text-white line-clamp-1 uppercase group-hover:text-blue-600 transition-colors tracking-tight">{item.name}</h3>
                      {item.description && <p className="text-[9px] md:text-[11px] text-gray-600 dark:text-gray-500 line-clamp-2 font-bold leading-tight">{item.description}</p>}
                    </div>

                    <div className="flex items-center justify-between pt-0.5 md:pt-1">
                      <span className="text-sm md:text-lg font-black text-blue-600 tracking-tighter">{formatPrice(item.price)}</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`text-[8px] md:text-[10px] font-black ${item.stock > 0 ? 'text-gray-400' : 'text-red-500'}`}>
                          {item.stock > 0 ? `Kho: ${item.stock}` : 'Hết hàng'}
                        </span>
                        {item.stock > 0 && item.stock < 10 && (
                          <span className="text-[7px] font-black text-amber-500 uppercase flex items-center gap-0.5 animate-pulse">
                            <AlertCircle className="w-2 h-2" /> Sắp hết
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-gray-600 dark:text-gray-500 border-t border-gray-200 dark:border-white/5 pt-3">
                      <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                        {item.event ? (
                          <><Tag className="w-3 h-3 text-blue-500 shrink-0" /> <span className="truncate">{item.event.title}</span></>
                        ) : (
                          <><Star className="w-3 h-3 text-amber-500 shrink-0" /> Bán chung</>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/5">
                        <ShoppingBag className="w-2.5 h-2.5" /> {item._count?.order_items || 0}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={`flex-1 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all flex items-center justify-center gap-1 border ${
                          item.is_active
                            ? 'bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                            : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-500 border-gray-200 dark:border-white/10 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/20'
                        }`}
                      >
                        {item.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                        {item.is_active ? 'Bán' : 'Tắt'}
                      </button>
                      <button onClick={() => navigate(`${item.id}`)} className="p-1.5 bg-gray-500/10 text-gray-700 hover:bg-gray-500 hover:text-white rounded-lg transition-all" title="Chi tiết">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEditModal(item)} className="p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="Chỉnh sửa">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Xóa">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filtered.map(item => (
                <div key={item.id} className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 group hover:border-blue-600/30 transition-all duration-300">
                  {/* Thumbnail & Basic Info Mobile Header */}
                  <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto flex-1">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0 border border-gray-200 dark:border-white/5">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 md:w-8 md:h-8 text-gray-200 dark:text-gray-700" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5 md:space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs md:text-sm font-black text-gray-900 dark:text-white uppercase truncate">{item.name}</h3>
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase shrink-0 ${
                          item.is_active
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {item.is_active ? 'Đang bán' : 'Đã tắt'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] md:text-[10px] text-gray-600 dark:text-gray-500 font-black uppercase">
                        <span className="text-blue-600 font-black text-xs md:text-sm tracking-tighter">{formatPrice(item.price)}</span>
                        <span className="flex items-center gap-1.5">
                          {item.event ? (
                            <><Tag className="w-2.5 h-2.5 text-blue-500" /> {item.event.title}</>
                          ) : (
                            <><Star className="w-2.5 h-2.5 text-amber-500" /> Bán chung</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions Footer */}
                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-6 md:gap-8">
                      <div className="text-center md:text-right">
                        <p className="text-[8px] md:text-[10px] font-black text-gray-500 dark:text-gray-700 leading-none mb-1">Kho</p>
                        <div className="flex flex-col items-center md:items-end gap-1">
                          <p className={`text-xs md:text-lg font-bold ${item.stock > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{item.stock}</p>
                          {item.stock > 0 && item.stock < 10 && (
                            <span className="text-[8px] font-black text-amber-500 uppercase flex items-center gap-1 animate-pulse">
                              <AlertCircle className="w-2.5 h-2.5" /> Sắp hết hàng
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-[8px] md:text-[10px] font-black text-gray-500 dark:text-gray-700 leading-none mb-1">Đã bán</p>
                        <p className="text-xs md:text-lg font-bold text-gray-900 dark:text-white">{item._count?.order_items || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2 md:border-l md:border-gray-200 md:dark:border-white/5 md:pl-4 shrink-0">
                      <button onClick={() => handleToggle(item.id)} className={`p-2 md:p-2.5 rounded-lg md:rounded-xl transition-all ${
                        item.is_active ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-green-500/10 hover:text-green-500'
                      }`} title={item.is_active ? 'Tắt bán' : 'Bật bán'}>
                        {item.is_active ? <ToggleRight className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <ToggleLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                      </button>
                      <button onClick={() => navigate(`${item.id}`)} className="p-2 md:p-2.5 bg-gray-500/10 text-gray-700 hover:bg-gray-500 hover:text-white rounded-lg md:rounded-xl transition-all" title="Chi tiết">
                        <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button onClick={() => openEditModal(item)} className="p-2 md:p-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg md:rounded-xl transition-all" title="Chỉnh sửa">
                        <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 md:p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg md:rounded-xl transition-all" title="Xóa">
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-[#16161a] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10 p-20 flex flex-col items-center justify-center space-y-6 text-center">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">Chưa có sản phẩm</h3>
              <p className="text-gray-700 dark:text-gray-500 font-medium italic">Hãy tạo sản phẩm đầu tiên để bán kèm vé sự kiện.</p>
            </div>
            <button onClick={openCreateModal} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase flex items-center gap-2 hover:scale-105 transition-transform">
              <PlusCircle className="w-4 h-4" /> Tạo sản phẩm
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto no-scrollbar scroll-smooth flex justify-center p-4 md:p-8 lg:p-12">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          {/* Modal Container */}
          <div className="relative bg-white dark:bg-[#16161a] rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-2xl my-auto animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#16161a]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs md:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {editingItem ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-1.5 md:p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-gray-700 dark:text-gray-500 transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-5 md:px-8 py-5 md:py-6 space-y-4 md:space-y-5">
              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-black text-gray-700 dark:text-gray-500 uppercase mb-2 block">Ảnh sản phẩm</label>
                <div
                  className={`relative aspect-video rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center cursor-pointer transition-all group/upload ${
                    formData.image_url
                      ? 'border-blue-500/30 bg-gray-50 dark:bg-white/5'
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/5'
                  }`}
                  onClick={() => document.getElementById('merch-image-input')?.click()}
                >
                  {formData.image_url ? (
                    <>
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center text-white space-y-1">
                          <Camera className="w-6 h-6 mx-auto" />
                          <p className="text-xs font-bold">Nhấn để đổi ảnh</p>
                        </div>
                      </div>
                    </>
                  ) : isUploading ? (
                    <div className="text-center space-y-3 px-4">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-500">Đang tải lên... {uploadProgress}%</p>
                      <div className="w-full max-w-xs mx-auto h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 px-4">
                      <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto group-hover/upload:text-blue-500 transition-colors" />
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-700">Nhấn để tải ảnh lên</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-600">PNG, JPG, WEBP (tối đa 5MB)</p>
                    </div>
                  )}
                  <input
                    id="merch-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                {formData.image_url && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFormData({...formData, image_url: ''}); }}
                    className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa ảnh
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-black text-gray-600 dark:text-gray-500 uppercase mb-2 block tracking-wider">Tên vật phẩm *</label>
                <input
                  type="text"
                  placeholder="VD: Lightstick BTS, Combo Bắp Nước..."
                  className="w-full px-5 py-3 bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-xs md:text-sm text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-500 shadow-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black text-gray-700 dark:text-gray-500 uppercase mb-2 block">Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả ngắn về sản phẩm..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-xs md:text-sm resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Event */}
              <div>
                <label className="text-[10px] font-black text-gray-700 dark:text-gray-500 uppercase mb-2 block">Gắn sự kiện</label>
                <div className="relative group/select">
                  <select
                    disabled={editingItem && (editingItem._count?.order_items > 0)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold text-xs md:text-sm text-gray-900 dark:text-white appearance-none cursor-pointer ${
                      editingItem && (editingItem._count?.order_items > 0) ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''
                    }`}
                    value={formData.event_id}
                    onChange={(e) => setFormData({...formData, event_id: e.target.value})}
                  >
                    <option value="" className="dark:bg-[#16161a]">🌐 Bán chung (tất cả sự kiện)</option>
                    {events.filter(e => e.status === 'active' || e.status === 'draft' || e.status === 'pending').map(e => (
                      <option key={e.id} value={e.id} className="dark:bg-[#16161a]">{e.title}</option>
                    ))}
                  </select>
                  {editingItem && (editingItem._count?.order_items > 0) && (
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <AlertCircle className="w-3 h-3" />
                      Sản phẩm đã có đơn hàng, không thể thay đổi sự kiện gắn kết.
                    </div>
                  )}
                </div>
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-700 dark:text-gray-500 uppercase mb-2 block">Giá bán (VNĐ) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-700" />
                    <input
                      type="number"
                      placeholder="50000"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-xs md:text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  {formData.price && parseFloat(formData.price) > 0 && (
                    <div className="mt-2 p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-gray-700 dark:text-gray-400">
                        <span>Phí hệ thống ({editingItem ? Number(editingItem.platform_fee_percent || productPlatformFee) : productPlatformFee}%)</span>
                        <span className="text-red-500">-{formatPrice(parseFloat(formData.price) * ((editingItem ? Number(editingItem.platform_fee_percent || productPlatformFee) : productPlatformFee) / 100))}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-gray-700 dark:text-gray-400">
                        <span>Phí cổng thanh toán ({editingItem ? Number(editingItem.commission_fee_percent || productTransactionFee) : productTransactionFee}%)</span>
                        <span className="text-red-500">-{formatPrice(parseFloat(formData.price) * ((editingItem ? Number(editingItem.commission_fee_percent || productTransactionFee) : productTransactionFee) / 100))}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-blue-600 border-t border-blue-500/10 pt-1.5">
                        <span className="uppercase">Thực nhận / SP</span>
                        <span>{formatPrice(parseFloat(formData.price) * (1 - ((editingItem ? (Number(editingItem.platform_fee_percent || productPlatformFee) + Number(editingItem.commission_fee_percent || productTransactionFee)) : totalProductFeePercent)) / 100))}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-700 dark:text-gray-500 uppercase mb-2 block">Số lượng tồn kho</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-700" />
                    <input
                      type="number"
                      placeholder="100"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-xs md:text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-3 p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-500 leading-relaxed">
                  <strong className="text-gray-900 dark:text-white">Bán chung</strong> = Sản phẩm hiển thị ở tất cả sự kiện. <br />
                  <strong className="text-gray-900 dark:text-white">Gắn sự kiện</strong> = Chỉ hiển thị ở sự kiện được chọn.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 md:px-8 py-5 md:py-6 border-t border-gray-200 dark:border-white/5 bg-gray-50/20 dark:bg-white/[0.02] flex flex-col-reverse md:flex-row items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full md:w-auto px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-xs md:text-sm font-black text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10 shadow-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs md:text-sm font-black uppercase hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-95"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? 'Cập nhật' : 'Tạo sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchandiseManagement;
