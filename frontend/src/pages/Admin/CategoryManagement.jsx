import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tags, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Image as ImageIcon,
  Upload,
  Eye,
  Filter,
  Clock,
  ArrowUpDown,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import axios from 'axios';

const CategoryManagement = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // New States
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, hidden
  const [dateSort, setDateSort] = useState('newest'); // newest, oldest
  const [isCategoryActive, setIsCategoryActive] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailCategory, setSelectedDetailCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    setEditingCategory(category);
    setNewCategoryName(category ? category.name : '');
    setImagePreview(category ? category.image_url : '');
    setIsCategoryActive(category ? category.is_active : true);
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ảnh phải nhỏ hơn 2MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || cloudName === 'your_cloud_name') {
      throw new Error("Cloudinary chưa được cấu hình");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    return res.data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Tên danh mục không được để trống');
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = imagePreview;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (editingCategory) {
        // Update
        const response = await adminService.updateCategory(editingCategory.id, { 
          name: newCategoryName, 
          image_url: imageUrl,
          is_active: isCategoryActive
        });
        if (response.success) {
          toast.success('Cập nhật thành công');
          fetchCategories();
          handleCloseModal();
        }
      } else {
        // Create
        const response = await adminService.createCategory({ 
          name: newCategoryName, 
          image_url: imageUrl,
          is_active: isCategoryActive
        });
        if (response.success) {
          toast.success('Thêm danh mục thành công');
          fetchCategories();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (category) => {
    // Kiếm tra xem có sự kiện hay không trước khi ẩn
    if (category.is_active && category._count.events > 0) {
      toast.error(`Không thể ẩn danh mục này vì đang có ${category._count.events} sự kiện.`);
      return;
    }

    try {
      const response = await adminService.updateCategory(category.id, { 
        is_active: !category.is_active 
      });
      if (response.success) {
        toast.success(category.is_active ? 'Đã ẩn danh mục' : 'Đã hiện danh mục');
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;

    try {
      const response = await adminService.deleteCategory(id);
      if (response.success) {
        toast.success('Xóa danh mục thành công');
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa danh mục này');
    }
  };

  const filteredCategories = categories
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' ? c.is_active : !c.is_active;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (dateSort === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });

  const handleOpenDetail = (category) => {
    navigate(`/admin/categories/${category.id}`);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedDetailCategory(null);
  };

  return (
    <div className="p-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-black uppercase text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-neon-green/10 rounded-lg">
              <Tags className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Danh mục Sự kiện</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-[10px] italic">
            Quản lý các loại hình sự kiện trong hệ thống ({categories.length} danh mục)
          </p>
        </div>

        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center space-x-2 bg-neon-green hover:bg-neon-green/90 text-black font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-neon-green/20"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Danh mục</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Tìm theo tên danh mục..."
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative w-full md:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all" className="dark:bg-[#111114] font-medium">Tất cả trạng thái</option>
              <option value="active" className="dark:bg-[#111114] font-medium">Đang hoạt động</option>
              <option value="hidden" className="dark:bg-[#111114] font-medium">Đã ẩn</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>
 
          {/* Date Sort */}
          <div className="relative w-full md:w-44">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select 
              className="w-full font-medium bg-gray-50 dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/20 rounded-xl py-3 pl-9 pr-10 text-xs font-bold appearance-none focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900 cursor-pointer"
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
            >
              <option value="newest" className="dark:bg-[#111114] font-medium">Mới nhất trước</option>
              <option value="oldest" className="dark:bg-[#111114] font-medium">Cũ nhất trước</option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-neon-green animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400 anime-pulse">Đang tải danh mục...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Tên Danh mục</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Số lượng</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Ngày tạo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredCategories.length > 0 ? filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-neon-green/10 transition-all overflow-hidden border border-gray-100 dark:border-white/10">
                          {c.image_url ? (
                            <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <Calendar className="w-5 h-5 text-gray-400 group-hover:text-neon-green" />
                          )}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-black">
                        {c._count.events} Sự kiện
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus(c);
                        }}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all hover:scale-105 active:scale-95 ${
                          c.is_active 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {c.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {new Date(c.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenDetail(c)}
                          className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-lg transition-all"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(c)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
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
                    <td colSpan="4" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
                        <p className="text-gray-500">Không tìm thấy danh mục nào phù hợp</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111114] w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                {editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục Mới'}
              </h3>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-all text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Ảnh bìa */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Ảnh bìa danh mục
                </label>
                <div 
                  onClick={() => document.getElementById('category-image').click()}
                  className="relative aspect-video rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-neon-green transition-all cursor-pointer overflow-hidden group bg-gray-50 dark:bg-white/5"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <button 
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-3 right-3 z-20 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <span className="text-xs font-bold uppercase tracking-tighter">Nhấn để tải ảnh</span>
                    </div>
                  )}
                  <input 
                    id="category-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  Tên Danh mục
                </label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Âm nhạc, Hội thảo..."
                  className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 text-sm focus:outline-none focus:border-neon-green transition-all dark:text-white text-gray-900"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white flex items-center">
                    Trạng thái hoạt động
                    {editingCategory?._count?.events > 0 && isCategoryActive && (
                      <span className="ml-2 text-[8px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase">Ràng buộc</span>
                    )}
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editingCategory?._count?.events > 0 && isCategoryActive
                      ? `Đang có ${editingCategory._count.events} sự kiện (Không thể ẩn)`
                      : 'Cho phép danh mục hiển thị trên hệ thống'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (editingCategory?._count?.events > 0 && isCategoryActive) {
                      toast.error('Không thể ẩn danh mục này vì đang có sự kiện.');
                      return;
                    }
                    setIsCategoryActive(!isCategoryActive);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isCategoryActive ? 'bg-neon-green' : 'bg-gray-300 dark:bg-gray-700'
                  } ${editingCategory?._count?.events > 0 && isCategoryActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isCategoryActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-4 rounded-2xl bg-neon-green text-black font-bold hover:bg-neon-green/90 transition-all shadow-lg shadow-neon-green/20 disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingCategory ? 'Cập nhật' : 'Tạo mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedDetailCategory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111114] w-full max-lg rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            {/* Modal Header/Image */}
            <div className="relative h-64 w-full">
              {selectedDetailCategory.image_url ? (
                <img src={selectedDetailCategory.image_url} alt={selectedDetailCategory.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <Tags className="w-20 h-20 text-gray-300 dark:text-gray-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button 
                onClick={handleCloseDetail}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-6 left-6">
                <h3 className="text-3xl font-black text-white mb-2">{selectedDetailCategory.name}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  selectedDetailCategory.is_active ? 'bg-neon-green text-black' : 'bg-red-500 text-white'
                }`}>
                  {selectedDetailCategory.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Ngày tạo
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(selectedDetailCategory.created_at).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Cập nhật cuối
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(selectedDetailCategory.updated_at).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Tags className="w-3 h-3" /> Quy mô
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedDetailCategory._count.events} Sự kiện đã đăng ký
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> ID Danh mục
                  </span>
                  <p className="text-xs font-mono text-gray-500 break-all">
                    {selectedDetailCategory.id}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5">
                <button 
                  onClick={() => {
                    handleCloseDetail();
                    handleOpenModal(selectedDetailCategory);
                  }}
                  className="w-full py-4 bg-neon-green hover:bg-neon-green/90 text-black font-black rounded-2xl transition-all shadow-lg shadow-neon-green/20 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  Chỉnh sửa danh mục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
