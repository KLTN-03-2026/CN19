import React, { useState, useEffect } from 'react';
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
  Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminService } from '../../services/admin.service';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const uploadImage = async (file) => {
    const storageRef = ref(storage, `categories/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
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
          image_url: imageUrl 
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
          image_url: imageUrl 
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

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await adminService.updateCategory(id, { 
        is_active: !currentStatus 
      });
      if (response.success) {
        toast.success(currentStatus ? 'Đã ẩn danh mục' : 'Đã hiện danh mục');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
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

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-neon-green/10 rounded-lg">
              <Tags className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Danh mục Sự kiện</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
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
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Số lượng Sự kiện</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Trạng thái</th>
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
                        onClick={() => toggleStatus(c.id, c.is_active)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                          c.is_active 
                          ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        }`}
                      >
                        {c.is_active ? 'Đang hoạt động' : 'Đã ẩn'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
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
    </div>
  );
};

export default CategoryManagement;
