import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Search, Package, Edit, Trash2, Loader2,
  ToggleLeft, ToggleRight, X, Image, DollarSign,
  Tag, AlertCircle, Archive, Star, ShoppingBag,
  LayoutGrid, List, Upload, Camera, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { organizerService } from '../../services/organizer.service';

const MerchandiseManagement = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
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
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchEvent = filterEvent === 'all'
      || (filterEvent === 'global' && !item.event_id)
      || item.event_id === filterEvent;
    return matchSearch && matchEvent;
  });

  const stats = {
    total: items.length,
    active: items.filter(i => i.is_active).length,
    outOfStock: items.filter(i => i.stock <= 0).length
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase underline decoration-blue-600 decoration-4 underline-offset-8">
            Quản lý sản phẩm
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm italic">
            Tạo và quản lý lightstick, photocard, đồ ăn thức uống bán kèm vé sự kiện.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-3 rounded-2xl text-sm font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all flex items-center uppercase group w-fit"
        >
          <PlusCircle className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-300" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tổng sản phẩm</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đang bán</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Archive className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hết hàng</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{stats.outOfStock}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#16161a] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="px-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold text-sm text-gray-900 dark:text-white appearance-none cursor-pointer min-w-[200px]"
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
          >
            <option value="all" className="dark:bg-[#16161a]">Tất cả sự kiện</option>
            <option value="global" className="dark:bg-[#16161a]">🌐 Bán chung (không gắn sự kiện)</option>
            {events.map(e => <option key={e.id} value={e.id} className="dark:bg-[#16161a]">{e.title}</option>)}
          </select>

          <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              title="Lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
              title="Danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="bg-gray-50/50 dark:bg-black/20 -mx-8 px-8 py-6 rounded-t-[3rem] border-t border-gray-100 dark:border-white/5 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(item => (
                <div key={item.id} className="bg-white dark:bg-[#16161a] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/5 transition-all duration-500 hover:-translate-y-1">
                  {/* Image */}
                  <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-white/5">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-200 dark:text-gray-700" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md ${
                        item.is_active
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                      }`}>
                        {item.is_active ? 'Đang bán' : 'Đã tắt'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white line-clamp-1 uppercase group-hover:text-blue-600 transition-colors">{item.name}</h3>
                      {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 font-medium">{item.description}</p>}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-lg font-black text-blue-600">{formatPrice(item.price)}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.stock > 0 ? 'text-gray-400 dark:text-gray-500' : 'text-red-500'}`}>
                        {item.stock > 0 ? `Kho: ${item.stock}` : 'Hết hàng'}
                      </span>
                    </div>

                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5 border-t border-gray-100 dark:border-white/5 pt-3">
                      {item.event ? (
                        <><Tag className="w-3 h-3 text-blue-500 shrink-0" /> <span className="truncate">{item.event.title}</span></>
                      ) : (
                        <><Star className="w-3 h-3 text-amber-500 shrink-0" /> Bán chung tất cả sự kiện</>
                      )}
                    </div>

                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                      <ShoppingBag className="w-3 h-3 shrink-0" /> Đã bán: {item._count?.order_items || 0} đơn
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleToggle(item.id)}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
                          item.is_active
                            ? 'bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                            : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/20'
                        }`}
                      >
                        {item.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {item.is_active ? 'Đang bán' : 'Đã tắt'}
                      </button>
                      <button onClick={() => navigate(`${item.id}`)} className="p-2.5 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white rounded-xl transition-all" title="Chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(item)} className="p-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all" title="Chỉnh sửa">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Xóa">
                        <Trash2 className="w-4 h-4" />
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
                <div key={item.id} className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex flex-col lg:flex-row lg:items-center gap-4 group hover:border-blue-600/30 transition-all duration-300">
                  {/* Thumbnail */}
                  <div className="w-full lg:w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{item.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 ${
                        item.is_active
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {item.is_active ? 'Đang bán' : 'Đã tắt'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                      <span className="text-blue-600 font-black text-sm">{formatPrice(item.price)}</span>
                      <span className="flex items-center gap-1">
                        {item.event ? (
                          <><Tag className="w-3 h-3 text-blue-500" /> {item.event.title}</>
                        ) : (
                          <><Star className="w-3 h-3 text-amber-500" /> Bán chung</>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="w-full lg:w-28 text-center">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tồn kho</p>
                    <p className={`text-lg font-black ${item.stock > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{item.stock}</p>
                  </div>

                  {/* Sold */}
                  <div className="w-full lg:w-28 text-center">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Đã bán</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{item._count?.order_items || 0}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:border-l lg:border-gray-100 lg:dark:border-white/5 lg:pl-4 shrink-0">
                    <button onClick={() => handleToggle(item.id)} className={`p-2.5 rounded-xl transition-all ${
                      item.is_active ? 'bg-green-500/10 text-green-500 hover:bg-red-500/10 hover:text-red-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-green-500/10 hover:text-green-500'
                    }`} title={item.is_active ? 'Tắt bán' : 'Bật bán'}>
                      {item.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => navigate(`${item.id}`)} className="p-2.5 bg-gray-500/10 text-gray-500 hover:bg-gray-500 hover:text-white rounded-xl transition-all" title="Chi tiết">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditModal(item)} className="p-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all" title="Chỉnh sửa">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
              <p className="text-gray-500 dark:text-gray-400 font-medium italic">Hãy tạo sản phẩm đầu tiên để bán kèm vé sự kiện.</p>
            </div>
            <button onClick={openCreateModal} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase flex items-center gap-2 hover:scale-105 transition-transform">
              <PlusCircle className="w-4 h-4" /> Tạo sản phẩm
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#16161a] rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-[#16161a] px-8 pt-8 pb-4 border-b border-gray-100 dark:border-white/5 rounded-t-[2.5rem] z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {editingItem ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-gray-500 dark:text-gray-400 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Ảnh sản phẩm</label>
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
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Đang tải lên... {uploadProgress}%</p>
                      <div className="w-full max-w-xs mx-auto h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 px-4">
                      <Upload className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto group-hover/upload:text-blue-500 transition-colors" />
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Nhấn để tải ảnh lên</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600">PNG, JPG, WEBP (tối đa 5MB)</p>
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
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Tên sản phẩm *</label>
                <input
                  type="text"
                  placeholder="VD: Lightstick BTS, Combo Bắp Nước..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Mô tả</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả ngắn về sản phẩm..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Event */}
              <div>
                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Gắn sự kiện</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold text-sm text-gray-900 dark:text-white appearance-none cursor-pointer"
                  value={formData.event_id}
                  onChange={(e) => setFormData({...formData, event_id: e.target.value})}
                >
                  <option value="" className="dark:bg-[#16161a]">🌐 Bán chung (tất cả sự kiện)</option>
                  {events.filter(e => e.status === 'active' || e.status === 'draft' || e.status === 'pending').map(e => (
                    <option key={e.id} value={e.id} className="dark:bg-[#16161a]">{e.title}</option>
                  ))}
                </select>
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Giá bán (VNĐ) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="number"
                      placeholder="50000"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  {formData.price && parseFloat(formData.price) > 0 && (
                    <div className="mt-3 p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        <span>Phí hệ thống (5%)</span>
                        <span className="text-red-500">-{formatPrice(parseFloat(formData.price) * 0.05)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        <span>Phí cổng thanh toán (3%)</span>
                        <span className="text-red-500">-{formatPrice(parseFloat(formData.price) * 0.03)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black text-blue-600 border-t border-blue-500/10 pt-1.5">
                        <span className="uppercase tracking-tight">Thực nhận / SP</span>
                        <span>{formatPrice(parseFloat(formData.price) * 0.92)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Số lượng tồn kho</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="number"
                      placeholder="100"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div className="flex items-start gap-3 p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong className="text-gray-900 dark:text-white">Bán chung</strong> = Sản phẩm sẽ hiển thị ở tất cả sự kiện của bạn. <br />
                  <strong className="text-gray-900 dark:text-white">Gắn sự kiện</strong> = Sản phẩm chỉ hiển thị khi khách mua vé của sự kiện đó.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-[#16161a] px-8 py-6 border-t border-gray-100 dark:border-white/5 rounded-b-[2.5rem] flex items-center justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-sm font-black text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
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
