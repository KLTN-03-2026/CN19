import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Eye,
  MoreVertical,
  Activity,
  CreditCard,
  TrendingUp,
  Download,
  RotateCcw
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { exportToExcel } from '../../utils/excel';
import toast from 'react-hot-toast';

const TransactionManagement = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    successfulOrders: 0,
    failedOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    keyword: '',
    from: '',
    to: '',
    limit: 10,
    eventId: '',
    organizerId: '',
    page: 1
  });
  const [filteredRevenue, setFilteredRevenue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [eventList, setEventList] = useState([]);
  const [organizerList, setOrganizerList] = useState([]);
  const totalPages = Math.ceil(totalCount / filters.limit);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const [transRes, statsRes] = await Promise.all([
        adminService.getTransactions(filters),
        adminService.getTransactionStats(filters)
      ]);
      setTransactions(transRes.data);
      setTotalCount(transRes.meta.total);
      setFilteredRevenue(transRes.meta.filteredRevenue);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu giao dịch');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExportExcel = async () => {
    try {
      const toastId = toast.loading('Đang chuẩn bị dữ liệu báo cáo...');
      // Fetch ALL transactions matching current filters (larger limit for report)
      const res = await adminService.getTransactions({ ...filters, limit: 2000, page: 1 });
      
      const exportData = res.data.map(tx => ({
        'Mã Giao dịch': tx.transaction_id,
        'Khách hàng': tx.customer,
        'Email': tx.email,
        'Loại giao dịch': tx.type === 'TICKET_PURCHASE' ? 'Sơ cấp (Mua vé)' : (tx.type === 'MARKETPLACE' ? 'Thứ cấp (Chợ)' : 'Chuyển nhượng'),
        'Giá trị (VND)': tx.amount,
        'Trạng thái': tx.status.toLowerCase() === 'paid' ? 'Thành công' : 'Thất bại/Hủy',
        'Ngày tạo': new Date(tx.created_at).toLocaleString('vi-VN'),
        'Mô tả': tx.description || ''
      }));

      const success = exportToExcel(exportData, 'BASTICKET_Bao_cao_giao_dich');
      if (success) {
        toast.success('Xuất báo cáo thành công!', { id: toastId });
      } else {
        toast.error('Có lỗi xảy ra khi tạo file Excel', { id: toastId });
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu xuất báo cáo');
      console.error(error);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [eventsRes, orgsRes] = await Promise.all([
        adminService.getEvents(),
        adminService.getUsers({ role: 'organizer' })
      ]);
      setEventList(eventsRes.data);
      setOrganizerList(orgsRes.data);
    } catch (error) {
      console.error('Lỗi fetch filter options:', error);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      type: '',
      keyword: '',
      from: '',
      to: '',
      limit: 10,
      eventId: '',
      organizerId: '',
      page: 1
    });
    toast.success('Đã xóa bộ lọc');
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.status, filters.type, filters.keyword, filters.from, filters.to, filters.page, filters.eventId, filters.organizerId]);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="flex items-center space-x-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center space-x-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-red-500/20">
            <XCircle className="w-3 h-3" />
            <span>Thất bại</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-[9px] font-bold uppercase tracking-wider rounded-md border border-white/5">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'TICKET_PURCHASE':
        return (
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md text-[9px] font-bold uppercase tracking-wider border border-blue-500/10">
            Sơ cấp (Mua vé)
          </span>
        );
      case 'TICKET_TRANSFER':
        return (
          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-md text-[9px] font-bold uppercase tracking-wider border border-purple-500/10">
            Chuyển nhượng
          </span>
        );
      case 'MARKETPLACE':
        return (
          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-md text-[9px] font-bold uppercase tracking-wider border border-orange-500/10">
            Thứ cấp (Chợ)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded-md text-[9px] font-bold uppercase tracking-wider border border-white/5">
            {type}
          </span>
        );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center space-x-3 uppercase tracking-tight">
            <div className="p-2 bg-neon-green/10 rounded-xl">
              <History className="w-6 h-6 text-neon-green" />
            </div>
            <span>Quản lý Giao dịch</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Theo dõi và điều phối dòng tiền hệ thống.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExportExcel}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center text-gray-600 dark:text-gray-400"
          >
            <Download className="w-4 h-4 mr-2" />
            Báo cáo
          </button>
          <button 
            onClick={fetchTransactions}
            className="bg-neon-green text-black px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-neon-green/10 hover:bg-neon-hover transition-all flex items-center uppercase"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards - Standardized Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 flex items-center space-x-4">
           <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-500" />
           </div>
           <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Doanh thu</div>
              <div className="text-lg font-black dark:text-white leading-none mt-0.5">{formatCurrency(stats.totalRevenue)}</div>
           </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 flex items-center space-x-4">
           <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-500" />
           </div>
           <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Giao dịch</div>
              <div className="text-lg font-black dark:text-white leading-none mt-0.5">{totalCount.toLocaleString()}</div>
           </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 flex items-center space-x-4">
           <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
           </div>
           <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Thành công</div>
              <div className="text-lg font-black dark:text-white leading-none mt-0.5">{stats.successfulOrders.toLocaleString()}</div>
           </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 flex items-center space-x-4">
           <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
           </div>
           <div>
              <div className="text-[10px] uppercase font-bold text-gray-400">Thất bại</div>
              <div className="text-lg font-black dark:text-white leading-none mt-0.5">{stats.failedOrders.toLocaleString()}</div>
           </div>
        </div>
      </div>

      {/* Filter Bar - Modern & Compact */}
      <div className="bg-white dark:bg-[#111114] p-3 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
           <input 
              type="text"
              placeholder="Tìm ID, Email, Khách hàng..."
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green/50 transition-all text-gray-900 dark:text-white"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value, page: 1})}
           />
        </div>

        <select 
          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neon-green/50 font-bold"
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
        >
          <option value="">Loại giao dịch</option>
          <option value="TICKET_PURCHASE">Sơ cấp (Mua vé)</option>
          <option value="MARKETPLACE">Thứ cấp (Chợ)</option>
          <option value="TICKET_TRANSFER">Chuyển nhượng</option>
        </select>

        <select 
          className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neon-green/50 max-w-[180px]"
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
        >
          <option value="">Trạng thái</option>
          <option value="paid">Đã thanh toán</option>
          <option value="cancelled">Thất bại</option>
        </select>

        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 transition-all">
           <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-gray-400 ml-1">Từ</span>
              <input type="date" className="bg-transparent text-xs text-gray-700 dark:text-white focus:outline-none h-4" value={filters.from} onChange={(e) => setFilters({...filters, from: e.target.value, page: 1})} />
           </div>
           <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1"></div>
           <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-gray-400 ml-1">Đến</span>
              <input type="date" className="bg-transparent text-xs text-gray-700 dark:text-white focus:outline-none h-4" value={filters.to} onChange={(e) => setFilters({...filters, to: e.target.value, page: 1})} />
           </div>
        </div>

        <button 
          onClick={handleResetFilters}
          className="flex items-center justify-center space-x-2 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold text-sm px-6 group"
          title="Xóa tất cả bộ lọc"
        >
           <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-500" />
           <span>Xóa lọc</span>
        </button>
      </div>

      {/* Main Table - High Density */}
      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase font-black border-b border-gray-200 dark:border-white/5">
                <th className="px-6 py-4">Mã Giao dịch</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Loại hình</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-6 py-6 h-16 opacity-40">
                       <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full w-full"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                   <td colSpan="7" className="px-6 py-20 text-center opacity-50 italic text-sm">
                      Không tìm thấy dữ liệu giao dịch.
                   </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{tx.transaction_id}</span>
                        <span className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-neon-green/10 flex items-center justify-center font-bold text-neon-green text-[10px] flex-shrink-0 border border-neon-green/10 overflow-hidden">
                          {tx.customer_avatar ? (
                            <img src={tx.customer_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            tx.customer.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{tx.customer}</span>
                          <span className="text-[11px] text-gray-400 truncate">{tx.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                    <td className="px-6 py-4 text-sm font-black text-gray-900 dark:text-white uppercase whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(tx.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-gray-400 font-medium whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => navigate(`/admin/transactions/${tx.type === 'MARKETPLACE' ? 'MARKETPLACE' : 'ORDER'}/${tx.id}`)}
                            className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 rounded-lg hover:text-neon-green hover:bg-neon-green/10 transition-all border border-transparent dark:border-white/5 shadow-sm"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
           <span>Hiển thị {transactions.length} / {totalCount} giao dịch</span>
           <div className="flex items-center space-x-2">
              <button 
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-4 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/10 transition-all font-bold"
              >
                Trước
              </button>
              <div className="px-3 py-1.5 bg-neon-green/10 text-neon-green rounded-lg font-black text-[10px] border border-neon-green/20">
                {filters.page} / {totalPages || 1}
              </div>
              <button 
                disabled={filters.page >= totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-4 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/10 transition-all font-bold"
              >
                Sau
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagement;
