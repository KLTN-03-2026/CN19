import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
  ArrowLeft, Package, Tag, Star, Edit, Trash2,
  ToggleLeft, ToggleRight, Loader2, ShoppingBag,
  Calendar, User, Mail, DollarSign, TrendingUp,
  Clock, Hash, Search, Eye, CheckCircle,
  FileText,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const MerchandiseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { productPlatformFee, productTransactionFee } = useSystemConfig();
  const totalProductFeePercent = productPlatformFee + productTransactionFee;
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Order History States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');
  const [chartDays, setChartDays] = useState(7); // Mặc định 7 ngày

  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'pickup' | 'collected'
  const [collectedItems, setCollectedItems] = useState([]); // Array of order_item IDs

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const res = await organizerService.getMerchandiseById(id);
      setItem(res.data);
    } catch (err) {
      toast.error('Không thể tải thông tin sản phẩm.');
      navigate('/organizer/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      const res = await organizerService.toggleMerchandise(id);
      toast.success(res.message);
      setItem(prev => ({ ...prev, is_active: res.data.is_active }));
    } catch (err) {
      toast.error('Không thể thay đổi trạng thái.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await organizerService.deleteMerchandise(id);
      toast.success('Đã xóa sản phẩm.');
      navigate('/organizer/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể xóa.');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredOrders = item?.order_items?.filter(oi => {
    const order = oi.order;
    if (!order) return false;

    // Search
    const searchMatch = !orderSearch || 
      order.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer?.full_name?.toLowerCase().includes(orderSearch.toLowerCase());

    // Status
    const statusMatch = orderStatus === 'all' || order.status === orderStatus;

    // Date
    const orderDate = new Date(order.created_at);
    const startMatch = !orderStartDate || orderDate >= new Date(orderStartDate);
    const endMatch = !orderEndDate || orderDate <= new Date(new Date(orderEndDate).setHours(23, 59, 59));

    return searchMatch && statusMatch && startMatch && endMatch;
  }) || [];

  // 2. Lọc danh sách Chờ bàn giao (Đã thanh toán & Chưa nhận)
  const pendingPickups = item?.order_items?.filter(oi => {
    const status = oi.order?.status?.toLowerCase();
    const isPaid = status === 'paid' || status === 'completed';
    const isNotRedeemed = !oi.is_redeemed && !collectedItems.includes(oi.id);
    
    if (!(isPaid && isNotRedeemed)) return false;

    const searchMatch = !orderSearch || 
      oi.order?.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      oi.order?.customer?.full_name?.toLowerCase().includes(orderSearch.toLowerCase());

    return searchMatch;
  }) || [];

  // 3. Lọc danh sách Đã nhận hàng
  const completedPickups = item?.order_items?.filter(oi => {
    const isCollected = oi.is_redeemed || collectedItems.includes(oi.id);
    if (!isCollected) return false;
    
    const searchMatch = !orderSearch || 
      oi.order?.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
      oi.order?.customer?.full_name?.toLowerCase().includes(orderSearch.toLowerCase());

    return searchMatch;
  }) || [];

  // Tính toán tổng số lượng sản phẩm cho mỗi tab (Dùng cho Badge hiển thị số lượng)
  const pickupTotalQty = pendingPickups.reduce((sum, oi) => sum + (oi.quantity || 0), 0);
  const completedTotalQty = completedPickups.reduce((sum, oi) => sum + (oi.quantity || 0), 0);
  const historyTotalQty = item?.order_items?.reduce((sum, oi) => sum + (oi.quantity || 0), 0) || 0;

  // --- CHUẨN BỊ DỮ LIỆU BIỂU ĐỒ ---
  
  // 1. Dữ liệu tỷ lệ bàn giao (Donut Chart)
  const redemptionData = [
    { name: 'Đã nhận', value: completedTotalQty, color: '#10b981' },
    { name: 'Chờ bàn giao', value: pickupTotalQty, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // 2. Dữ liệu xu hướng bán hàng (Dựa trên chartDays)
  const salesTrendData = (() => {
    if (!item?.order_items) return [];
    
    const timeRange = Array.from({ length: chartDays }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const salesMap = item.order_items.reduce((acc, oi) => {
      if (oi.order?.created_at) {
        const date = new Date(oi.order.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (oi.quantity || 0);
      }
      return acc;
    }, {});

    return timeRange.map(date => ({
      date: new Date(date).toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      fullDate: date,
      quantity: salesMap[date] || 0
    }));
  })();

  const handleConfirmPickup = async (orderItemId) => {
    // Thêm bước hỏi trước để tránh nhấn nhầm
    if (!window.confirm('Bạn có chắc chắn muốn xác nhận bàn giao sản phẩm này không? Thao tác này sẽ ghi nhận bạn là người thực hiện.')) {
      return;
    }

    try {
      // Gọi API thực tế để xác nhận nhận hàng và ghi log nhân viên
      const response = await organizerService.confirmMerchandisePickup(orderItemId);
      
      if (response.data) {
        toast.success('Đã xác nhận bàn giao sản phẩm thành công!');
        setCollectedItems(prev => [...prev, orderItemId]);
        // Tải lại dữ liệu để lấy thông tin nhân viên vừa quét từ database
        fetchDetail();
      }
    } catch (error) {
      console.error('Confirm pickup error:', error);
      toast.error(error.response?.data?.error || 'Không thể xác nhận nhận hàng');
    }
  };

  // Hàm xuất danh sách khách hàng (.xlsx) chuyên nghiệp
  const exportCustomersToExcel = () => {
    try {
      if (!item?.order_items || item.order_items.length === 0) {
        toast.error('Không có dữ liệu khách hàng để xuất.');
        return;
      }

      toast.loading('Đang chuẩn bị danh sách...', { id: 'export-customers' });

      // Chuẩn bị dữ liệu cho Excel
      const dataToExport = item.order_items.map((oi, index) => {
        const order = oi.order;
        const customer = order?.customer;
        const staffName = oi.scan_history?.[0]?.staff?.full_name || (oi.scan_history?.length > 0 ? 'Xác nhận bằng mã' : (oi.is_redeemed ? 'Hệ thống' : '---'));
        
        return {
          'STT': index + 1,
          'Mã đơn hàng': order?.order_number?.toUpperCase() || '---',
          'Khách hàng': customer?.full_name || 'Khách vãng lai',
          'Email': customer?.email || '---',
          'Số điện thoại': customer?.phone_number || '---',
          'Ngày đặt hàng': order?.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm') : '---',
          'Số lượng': oi.quantity || 0,
          'Đơn giá (VNĐ)': Number(oi.unit_price) || 0,
          'Tổng tiền (VNĐ)': Number(oi.subtotal) || 0,
          'Trạng thái nhận': oi.is_redeemed ? 'Đã nhận hàng' : 'Chờ bàn giao',
          'Thời gian nhận': oi.redeemed_at ? format(new Date(oi.redeemed_at), 'dd/MM/yyyy HH:mm') : '---',
          'Nhân viên bàn giao': staffName
        };
      });

      // Tạo Worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách khách mua');

      // Tự động căn chỉnh độ rộng cột
      const wscols = [
        { wch: 5 },  // STT
        { wch: 15 }, // Mã đơn
        { wch: 25 }, // Tên khách
        { wch: 30 }, // Email
        { wch: 15 }, // SĐT
        { wch: 20 }, // Ngày đặt
        { wch: 10 }, // SL
        { wch: 15 }, // Đơn giá
        { wch: 15 }, // Tổng tiền
        { wch: 18 }, // Trạng thái
        { wch: 20 }, // Thời gian nhận
        { wch: 25 }, // Nhân viên
      ];
      worksheet['!cols'] = wscols;

      // Xuất file
      const fileName = `DS_Khach_hang_${item.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast.success('Xuất danh sách thành công!', { id: 'export-customers' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Có lỗi xảy ra khi xuất danh sách.', { id: 'export-customers' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-700 dark:text-gray-400 font-bold uppercase text-xs">Đang tải...</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/organizer/products')}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-400 hover:text-blue-600 transition-colors font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            className={`px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all flex items-center gap-1.5 border ${
              item.is_active
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                : 'bg-gray-100 dark:bg-white/5 text-gray-700 border-gray-200 dark:border-white/10 hover:bg-green-500/10 hover:text-green-600'
            }`}
          >
            {item.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            {item.is_active ? 'Đang bán' : 'Đã tắt'}
          </button>
          <button
            onClick={exportCustomersToExcel}
            className="px-2.5 md:px-3 py-1.5 md:py-2 bg-white dark:bg-[#111114] text-gray-700 dark:text-gray-400 rounded-xl text-[8px] md:text-[10px] font-black hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center gap-1.5 border border-gray-200 dark:border-white/10 shadow-sm active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" /> Xuất DS khách
          </button>
          <button
            onClick={() => navigate('/organizer/products', { state: { editId: id } })}
            className="px-2.5 md:px-3 py-1.5 md:py-2 bg-blue-500/10 text-blue-600 rounded-xl text-[8px] md:text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> Sửa
          </button>
          <button
            onClick={handleDelete}
            className="px-2.5 md:px-3 py-1.5 md:py-2 bg-red-500/10 text-red-500 rounded-xl text-[8px] md:text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#16161a] rounded-[2rem] border border-gray-200 dark:border-white/5 overflow-hidden">
            <div className="aspect-square bg-gray-100 dark:bg-white/5">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-200 dark:text-gray-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-3">
          {/* Title + Status */}
          <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase">{item.name}</h1>
                {item.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">{item.description}</p>
                )}
              </div>
              <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase shrink-0 ${
                item.is_active
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
              }`}>
                {item.is_active ? 'Đang bán' : 'Đã tắt'}
              </span>
            </div>

            {/* Event link */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
              <div className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                {item.event ? (
                  <><Tag className="w-3.5 h-3.5 text-blue-500" /> Sự kiện: <span className="text-gray-900 dark:text-white">{item.event.title}</span></>
                ) : (
                  <><Star className="w-3.5 h-3.5 text-amber-500" /> Bán chung tất cả sự kiện</>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-4 text-center">
              <p className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase mb-1">Giá bán</p>
              <p className="text-sm md:text-lg font-black text-blue-600">{formatPrice(item.price)}</p>
            </div>
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-4 text-center">
              <p className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase mb-1">Tồn kho</p>
              <p className={`text-sm md:text-lg font-black ${item.stock > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{item.stock}</p>
            </div>
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-4 text-center">
              <p className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase mb-1">Đã bán</p>
              <p className="text-sm md:text-lg font-black text-gray-900 dark:text-white">{item.totalSold || 0}</p>
            </div>
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-4 text-center">
              <p className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase mb-1">Doanh thu</p>
              <p className="text-sm md:text-lg font-black text-amber-600">{formatPrice(item.totalRevenue || 0)}</p>
            </div>
          </div>
 
          {/* Settlement Breakdown */}
          {item.totalRevenue > 0 && (
            <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 px-6 py-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Chi tiết quyết toán {item.event_id ? '(Dự kiến)' : '(Thực tế lịch sử)'}
                </h3>
                {!item.event_id && (
                   <span className="text-[8px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase">
                     Sản phẩm dùng chung
                   </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-700 dark:text-gray-400 font-medium">Tổng doanh thu bán sản phẩm</span>
                  <span className="text-gray-900 dark:text-white font-black">{formatPrice(item.totalRevenue)}</span>
                </div>
                
                {/* 
                  Logic tính toán:
                  1. Nếu là sản phẩm gắn sự kiện: Dùng phí đã chốt tại Merchandise (Snapshot lúc tạo)
                  2. Nếu là sản phẩm dùng chung: Cộng dồn từ các OrderItem thực tế (đảm bảo tính đúng nếu Admin đổi phí hệ thống)
                */}
                {(() => {
                  let totalPlatformFeeAmount = 0;
                  let totalCommissionFeeAmount = 0;
                  let displayPlatformRate = 0;
                  let displayCommissionRate = 0;

                  if (item.event_id) {
                    // Sản phẩm gắn sự kiện -> Tính dựa trên tỷ lệ cố định
                    displayPlatformRate = Number(item.platform_fee_percent || productPlatformFee);
                    displayCommissionRate = Number(item.commission_fee_percent || productTransactionFee);
                    totalPlatformFeeAmount = item.totalRevenue * (displayPlatformRate / 100);
                    totalCommissionFeeAmount = item.totalRevenue * (displayCommissionRate / 100);
                  } else {
                    // Sản phẩm dùng chung -> Cộng dồn từ lịch sử (Granular Fee Tracking)
                    totalPlatformFeeAmount = item.order_items?.reduce((sum, oi) => sum + Number(oi.platform_fee || 0), 0) || 0;
                    totalCommissionFeeAmount = item.order_items?.reduce((sum, oi) => sum + Number(oi.commission_fee || 0), 0) || 0;
                  }

                  return (
                    <>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">
                          Phí hệ thống {item.event_id ? `(${displayPlatformRate}%)` : ''}
                        </span>
                        <span className="text-red-500 font-bold">-{formatPrice(totalPlatformFeeAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">
                          Phí cổng thanh toán {item.event_id ? `(${displayCommissionRate}%)` : ''}
                        </span>
                        <span className="text-red-500 font-bold">-{formatPrice(totalCommissionFeeAmount)}</span>
                      </div>
                      <div className="pt-3 border-t border-dashed border-gray-200 dark:border-white/10 flex justify-between items-center">
                        <span className="text-blue-600 text-xs font-black uppercase">Thực nhận {item.event_id ? 'dự kiến' : 'thực tế'}</span>
                        <div className="text-right">
                          <span className="text-xl font-black text-blue-600 leading-none block">
                            {formatPrice(item.totalRevenue - totalPlatformFeeAmount - totalCommissionFeeAmount)}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold mt-1 block">
                            {item.event_id ? 'Đã khấu trừ theo tỷ lệ sản phẩm' : 'Tính toán từ lịch sử đơn hàng'}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}


          {/* Meta info */}
          <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-4">
            <div className="flex flex-wrap gap-6 text-xs text-gray-600 dark:text-gray-300 font-bold">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Tạo lúc: <span className="text-gray-700 dark:text-gray-300">{formatDate(item.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Cập nhật: <span className="text-gray-700 dark:text-gray-300">{formatDate(item.updated_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> ID: <span className="text-gray-700 dark:text-gray-300 font-mono text-[10px]">{item.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Xu hướng bán hàng</h3>
            </div>
            {/* Time Range Selector */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
              {[7, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setChartDays(days)}
                  className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${
                    chartDays === days 
                      ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {days} Ngày
                </button>
              ))}
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(22, 22, 26, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="quantity" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorQty)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Redemption Status Chart */}
        <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <PieIcon className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Tỷ lệ bàn giao</h3>
          </div>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={redemptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {redemptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(22, 22, 26, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-[-10px]">
              <p className="text-[10px] font-black text-gray-600 uppercase">Hoàn thành</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {historyTotalQty > 0 ? Math.round((completedTotalQty / historyTotalQty) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="bg-white dark:bg-[#16161a] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
        {/* Tab Header */}
        <div className="px-3 md:px-6 pt-5 border-b border-gray-200 dark:border-white/5 bg-gray-50/20 dark:bg-white/[0.02]">
          <div className="flex items-center gap-x-2.5 md:gap-x-8">
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 text-[8.5px] md:text-xs font-black uppercase transition-all relative flex items-center gap-1.5 ${
                activeTab === 'history' 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap">Lịch sử</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold ${
                  activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600'
                }`}>
                  {item.order_items?.length || 0}<span className="hidden sm:inline"> đơn / {historyTotalQty} SP</span>
                </span>
              </div>
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in slide-in-from-left-2" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('pickup')}
              className={`pb-4 text-[8.5px] md:text-xs font-black uppercase transition-all relative flex items-center gap-1.5 ${
                activeTab === 'pickup' 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap">Chờ giao</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold ${
                  activeTab === 'pickup' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600'
                }`}>
                  {pendingPickups.length}<span className="hidden sm:inline"> đơn / {pickupTotalQty} SP</span>
                </span>
              </div>
              {activeTab === 'pickup' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full animate-in slide-in-from-left-2" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('collected')}
              className={`pb-4 text-[8.5px] md:text-xs font-black uppercase transition-all relative flex items-center gap-1.5 ${
                activeTab === 'collected' 
                  ? 'text-green-600' 
                  : 'text-gray-600 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="whitespace-nowrap">Đã nhận</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold ${
                  activeTab === 'collected' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600'
                }`}>
                  {completedPickups.length}<span className="hidden sm:inline"> đơn / {completedTotalQty} SP</span>
                </span>
              </div>
              {activeTab === 'collected' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full animate-in slide-in-from-left-2" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'history' ? (
          <>
            {/* Filter Bar (Already existing but moved inside tab) */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-4">
                <div className="relative group flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="Tìm tên khách, mã đơn..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-xs font-medium text-gray-900 dark:text-white placeholder-gray-500"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold text-xs text-gray-900 dark:text-white appearance-none cursor-pointer min-w-[120px]"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                  >
                    <option value="all" className="dark:bg-[#16161a]">Tất cả trạng thái</option>
                    <option value="completed" className="dark:bg-[#16161a]">Hoàn thành</option>
                    <option value="pending" className="dark:bg-[#16161a]">Chờ xử lý</option>
                    <option value="cancelled" className="dark:bg-[#16161a]">Đã hủy</option>
                  </select>

                  <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <input
                      type="date"
                      className="bg-transparent border-none focus:outline-none text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
                      value={orderStartDate}
                      onChange={(e) => setOrderStartDate(e.target.value)}
                      title="Từ ngày"
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="date"
                      className="bg-transparent border-none focus:outline-none text-xs font-bold text-gray-900 dark:text-white cursor-pointer"
                      value={orderEndDate}
                      onChange={(e) => setOrderEndDate(e.target.value)}
                      title="Đến ngày"
                    />
                  </div>
                </div>
              </div>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/5">
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Khách hàng</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Mã đơn</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">SL</th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Đơn giá</th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Thành tiền</th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">Thực nhận</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Ngày mua</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((orderItem, idx) => (
                      <tr key={orderItem.id} className={`border-b border-gray-50 dark:border-white/[0.02] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-white/[0.01]'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                              {orderItem.order?.customer?.avatar_url ? (
                                <img src={orderItem.order.customer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                orderItem.order?.customer?.full_name?.[0]?.toUpperCase() || '?'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">{orderItem.order?.customer?.full_name || 'N/A'}</p>
                              <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate">{orderItem.order?.customer?.email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{orderItem.order?.order_number || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">x{orderItem.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-black text-gray-600 dark:text-gray-300">{formatPrice(orderItem.unit_price)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-black text-gray-900 dark:text-white">{formatPrice(orderItem.subtotal)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-black text-blue-600">{formatPrice(Number(orderItem.subtotal) - Number(orderItem.platform_fee || 0) - Number(orderItem.commission_fee || 0))}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${getStatusColor(orderItem.order?.status)}`}>
                            {getStatusLabel(orderItem.order?.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            {orderItem.order?.created_at ? formatDate(orderItem.order.created_at) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => navigate(`/organizer/orders/${orderItem.order.id}`)}
                            className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Search className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Không tìm thấy đơn hàng nào khớp với bộ lọc.</p>
              </div>
            )}
          </>
        ) : activeTab === 'pickup' ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm tên khách hoặc mã đơn để trả hàng..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all text-xs font-medium text-gray-900 dark:text-white placeholder-gray-500"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>

            {pendingPickups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/5">
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Khách nhận</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Mã đơn</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Sự kiện</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Số lượng</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPickups.map((orderItem, idx) => (
                      <tr key={orderItem.id} className="border-b border-gray-50 dark:border-white/[0.02] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-black text-xs shrink-0 overflow-hidden">
                              {orderItem.order?.customer?.avatar_url ? (
                                <img src={orderItem.order.customer.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                orderItem.order?.customer?.full_name?.[0]?.toUpperCase() || 'P'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{orderItem.order?.customer?.full_name}</p>
                              <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate">{orderItem.order?.customer?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{orderItem.order?.order_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                            {orderItem.order?.event?.title || item?.event?.title || 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-purple-600 bg-purple-500/5 px-3 py-1 rounded-lg">x{orderItem.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 rounded-full text-[8px] font-black uppercase bg-yellow-500/10 text-yellow-600">
                            Chưa nhận
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleConfirmPickup(orderItem.id)}
                            className="px-3 py-1.5 bg-purple-600 text-white text-[9px] font-bold rounded-lg hover:bg-purple-700 transition-all flex items-center gap-1 mx-auto shadow-lg shadow-purple-500/20"
                          >
                            Xác nhận nhận hàng
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Package className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Không có yêu cầu nhận hàng nào được tìm thấy.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.01]">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-green-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm khách hàng đã nhận hàng..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-600 transition-all text-xs font-medium text-gray-900 dark:text-white placeholder-gray-500"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>

            {completedPickups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/5">
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Người nhận</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Mã đơn</th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Sự kiện</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Số lượng</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-center text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Thời gian nhận</th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase">Nhân viên quét</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedPickups.map((orderItem, idx) => (
                      <tr key={orderItem.id} className="border-b border-gray-50 dark:border-white/[0.02] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-black text-xs shrink-0 overflow-hidden">
                              {orderItem.order?.customer?.avatar_url ? (
                                <img src={orderItem.order.customer.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                orderItem.order?.customer?.full_name?.[0]?.toUpperCase() || 'C'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{orderItem.order?.customer?.full_name}</p>
                              <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate">{orderItem.order?.customer?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">{orderItem.order?.order_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                            {orderItem.order?.event?.title || item?.event?.title || 'N/A'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-black text-green-600 bg-green-500/5 px-3 py-1 rounded-lg">x{orderItem.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 rounded-full text-[8px] font-black uppercase bg-green-500/10 text-green-600 flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle className="w-2.5 h-2.5" /> Đã nhận
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {orderItem.redeemed_at ? new Date(orderItem.redeemed_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {orderItem.redeemed_at ? new Date(orderItem.redeemed_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {orderItem.scan_history?.[0]?.staff?.full_name || (orderItem.scan_history?.length > 0 ? 'Xác nhận bằng mã' : 'Hệ thống')}
                            </span>
                            <span className="text-[9px] text-gray-500 uppercase font-black">
                              {orderItem.scan_history?.[0]?.staff?.id 
                                ? `Scan ID: ${orderItem.scan_history[0].staff.id.slice(0, 8)}` 
                                : orderItem.scan_history?.length > 0 ? 'MANUAL' : 'AUTO'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Chưa có khách hàng nào nhận sản phẩm.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MerchandiseDetail;
