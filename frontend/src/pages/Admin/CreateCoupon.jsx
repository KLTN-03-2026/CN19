import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Tag, 
  X, 
  Loader2, 
  Calendar, 
  DollarSign, 
  Percent,
  Info,
  Clock,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { adminService } from '../../services/admin.service';

const CreateCoupon = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [events, setEvents] = useState([]);
  const [couponScope, setCouponScope] = useState('all'); // 'all' | 'specific'
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'PERCENTAGE', // PERCENTAGE | FIXED_AMOUNT
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    event_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setIsFetching(true);
      // Fetch events for selection
      const eventsRes = await adminService.getEvents({ status: 'active' });
      // Inconsistent API: admin-event doesn't return .success, just .data
      if (eventsRes && eventsRes.data) {
        setEvents(eventsRes.data);
      }

      if (isEditMode) {
        const res = await adminService.getCouponById(id);
        if (res.success) {
          const coupon = res.data;
          setFormData({
            code: coupon.code,
            description: coupon.description || '',
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            min_order_amount: coupon.min_order_amount || '',
            max_discount_amount: coupon.max_discount_amount || '',
            usage_limit: coupon.usage_limit || '',
            start_date: coupon.start_date.split('T')[0],
            end_date: coupon.end_date.split('T')[0],
            event_id: coupon.event_id || '',
            is_active: coupon.is_active
          });
          setCouponScope(coupon.event_id ? 'specific' : 'all');
        }
      }
    } catch (error) {
      console.error('Fetch Initial Data Error:', error);
      toast.error('Không thể tải dữ liệu ban đầu.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data
    const submitData = {
      ...formData,
      event_id: couponScope === 'all' ? null : formData.event_id
    };
    
    // Basic validation
    if (!submitData.code || !submitData.discount_value || !submitData.start_date || !submitData.end_date) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (couponScope === 'specific' && !submitData.event_id) {
      toast.error('Vui lòng chọn sự kiện áp dụng.');
      return;
    }

    if (submitData.discount_type === 'PERCENTAGE' && (submitData.discount_value <= 0 || submitData.discount_value > 100)) {
      toast.error('Phần trăm giảm giá phải từ 1 đến 100.');
      return;
    }

    if (new Date(submitData.end_date) <= new Date(submitData.start_date)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    try {
      setIsLoading(true);
      if (isEditMode) {
        await adminService.updateCoupon(id, submitData);
        toast.success('Cập nhật mã giảm giá thành công!');
      } else {
        await adminService.createCoupon(submitData);
        toast.success('Tạo mã giảm giá mới thành công!');
      }
      navigate('/admin/coupons');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/coupons')}
          className="flex items-center text-gray-500 hover:text-neon-green font-black uppercase text-[10px] tracking-widest transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Quay lại danh sách
        </button>
        <div className={`flex items-center gap-2 px-6 py-2 rounded-full border border-neon-green/20 bg-neon-green/5 font-black uppercase text-[10px] tracking-wider`}>
          <Tag className="w-3 h-3 text-neon-green" />
          {isEditMode ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
            {/* Coupon Code Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã giảm giá (Code)</label>
              <input 
                type="text"
                placeholder="VÍ DỤ: GIAM30, SUMMER2026..."
                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-xl font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green transition-all uppercase leading-tight placeholder:opacity-50"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={isEditMode}
              />
              <p className="text-[9px] text-gray-500 italic ml-1">* Mã viết hoa, không dấu, không khoảng cách.</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả chương trình</label>
              <textarea 
                placeholder="Mô tả ngắn gọn về ưu đãi này..."
                rows="3"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green transition-all"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Discount Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Loại giảm giá</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, discount_type: 'PERCENTAGE' })}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${formData.discount_type === 'PERCENTAGE' ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'border-gray-100 dark:border-white/10 text-gray-400'}`}
                  >
                    <Percent className="w-3 h-3" /> Phần trăm
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, discount_type: 'FIXED_AMOUNT' })}
                    className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border transition-all ${formData.discount_type === 'FIXED_AMOUNT' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'border-gray-100 dark:border-white/10 text-gray-400'}`}
                  >
                    <DollarSign className="w-3 h-3" /> Số tiền
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Giá trị giảm ({formData.discount_type === 'PERCENTAGE' ? '%' : 'VNĐ'})
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-sm font-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20 focus:border-neon-green"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                    {formData.discount_type === 'PERCENTAGE' ? '%' : 'đ'}
                  </div>
                </div>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-white/5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phạm vi áp dụng</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setCouponScope('all')}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 border transition-all ${couponScope === 'all' ? 'bg-neon-green/10 border-neon-green text-neon-green shadow-lg shadow-neon-green/10' : 'border-gray-100 dark:border-white/5 text-gray-400'}`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${couponScope === 'all' ? 'text-neon-green' : 'text-gray-300 dark:text-gray-600'}`} />
                  Tất cả sự kiện
                </button>
                <button 
                  type="button"
                  onClick={() => setCouponScope('specific')}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-2 border transition-all ${couponScope === 'specific' ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-lg shadow-blue-500/10' : 'border-gray-100 dark:border-white/5 text-gray-400'}`}
                >
                  <Calendar className={`w-5 h-5 ${couponScope === 'specific' ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`} />
                  Sự kiện nhất định
                </button>
              </div>

              {couponScope === 'specific' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <select 
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl py-4 px-6 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={formData.event_id}
                    onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                  >
                    <option value="">-- Chọn sự kiện áp dụng --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({new Date(event.event_date).toLocaleDateString('vi-VN')})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đơn hàng tối thiểu</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                   <input 
                    type="number"
                    placeholder="Không giới hạn"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm font-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giảm tối đa (Nếu dùng %)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                   <input 
                    type="number"
                    placeholder="Không giới hạn"
                    disabled={formData.discount_type === 'FIXED_AMOUNT'}
                    className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm font-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20 ${formData.discount_type === 'FIXED_AMOUNT' ? 'opacity-50' : ''}`}
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Timeline Card */}
          <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-neon-green" />
              Thời gian áp dụng
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày bắt đầu</label>
                  {formData.start_date && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-neon-green bg-neon-green/10 px-2 py-0.5 rounded-lg mb-1">
                        {format(parseISO(formData.start_date), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium italic">
                        (Ngày {format(parseISO(formData.start_date), 'dd')} tháng {format(parseISO(formData.start_date), 'MM')}, {format(parseISO(formData.start_date), 'yyyy')})
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <DatePicker
                    selected={formData.start_date ? parseISO(formData.start_date) : null}
                    onChange={(date) => setFormData({ 
                      ...formData, 
                      start_date: date ? format(date, 'yyyy-MM-dd') : '' 
                    })}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold dark:text-white focus:outline-none focus:border-neon-green transition-all"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày kết thúc</label>
                  {formData.end_date && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg mb-1">
                        {format(parseISO(formData.end_date), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium italic">
                        (Ngày {format(parseISO(formData.end_date), 'dd')} tháng {format(parseISO(formData.end_date), 'MM')}, {format(parseISO(formData.end_date), 'yyyy')})
                      </span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <DatePicker
                    selected={formData.end_date ? parseISO(formData.end_date) : null}
                    onChange={(date) => setFormData({ 
                      ...formData, 
                      end_date: date ? format(date, 'yyyy-MM-dd') : '' 
                    })}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold dark:text-white focus:outline-none focus:border-neon-green transition-all"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Usage Limit Card */}
          <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-neon-green" />
              Giới hạn sử dụng
            </h3>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tổng lượt dùng tối đa</label>
              <input 
                type="number"
                placeholder="Không giới hạn"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl py-3 px-4 text-sm font-black dark:text-white focus:outline-none focus:ring-2 focus:ring-neon-green/20"
                value={formData.usage_limit}
                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
              />
            </div>

            {/* Status Toggle */}
            <div className="pt-4 border-t border-gray-50 dark:border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái Kích hoạt</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.is_active}
                    onChange={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-neon-green text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-neon-green/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditMode ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá ngay'}
            </button>
            <button 
              type="button"
              onClick={() => navigate('/admin/coupons')}
              className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              Hủy bỏ
            </button>
          </div>

          {/* Info Hint */}
          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 dark:text-blue-500 font-medium leading-relaxed italic">
              Lưu ý: Mã giảm giá hệ thống sẽ được áp dụng cho tất cả các sự kiện hiện có.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateCoupon;
