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
  Download
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
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
    organizerId: ''
  });
  const [filteredRevenue, setFilteredRevenue] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [eventList, setEventList] = useState([]);
  const [organizerList, setOrganizerList] = useState([]);

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
      case 'success':
      case 'completed':
      case 'paid':
        return (
          <span className="flex items-center space-x-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã thanh toán</span>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center space-x-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-yellow-500/20">
            <Clock className="w-3 h-3" />
            <span>Đang chờ</span>
          </span>
        );
      case 'failed':
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-3">
            {/* <History className="w-10 h-10 text-neon-green" /> */}
            <span>QUẢN LÝ GIAO DỊCH</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Theo dõi và quản lý mọi dòng tiền lưu thông trên nền tảng.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center text-gray-600 dark:text-gray-400">
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo (CSV)
          </button>
          <button 
            onClick={fetchTransactions}
            className="bg-neon-green text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(82,196,45,0.3)] hover:shadow-[0_0_25px_rgba(82,196,45,0.5)] transition-all flex items-center uppercase"
          >
            {/* <Activity className="w-4 h-4 mr-2" /> */}
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-neon-green/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[50px] -mr-8 -mt-6 group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Tổng Doanh thu</p>
              <h3 className="text-xl font-black mt-2 text-gray-900 dark:text-white tracking-tighter">{formatCurrency(stats.totalRevenue)}</h3>
              <div className="flex items-center mt-2 text-green-500">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                <span className="text-[10px] font-bold">+12.5% so với tháng trước</span>
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-neon-green/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[50px] -mr-8 -mt-8 group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Số giao dịch</p>
              <h3 className="text-2xl font-black mt-2 text-gray-900 dark:text-white tracking-tighter">{stats.totalOrders.toLocaleString()}</h3>
              <div className="flex items-center mt-2 text-green-500">
                <Activity className="w-3 h-3 mr-1" />
                <span className="text-[10px] font-bold">Hệ thống ổn định</span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-2xl">
              <CreditCard className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-[50px] -mr-8 -mt-8 group-hover:bg-green-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thành công</p>
              <h3 className="text-2xl font-black mt-2 text-gray-900 dark:text-white tracking-tighter">{stats.successfulOrders.toLocaleString()}</h3>
              <div className="flex items-center mt-2 text-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                <span className="text-[10px] font-bold">Tỷ lệ: {stats.totalOrders > 0 ? ((stats.successfulOrders / stats.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[50px] -mr-8 -mt-8 group-hover:bg-red-500/20 transition-all"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thất bại / Hủy</p>
              <h3 className="text-2xl font-black mt-2 text-gray-900 dark:text-white tracking-tighter">{stats.failedOrders.toLocaleString()}</h3>
              <div className="flex items-center mt-2 text-red-500">
                <XCircle className="w-3 h-3 mr-1" />
                <span className="text-[10px] font-bold">Cần kiểm tra log rủi ro</span>
              </div>
            </div>
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <ArrowDownRight className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary / Dynamic Total */}
      {(filters.keyword || filters.status || filters.type || filters.from || filters.to) && (
        <div className="bg-neon-green/10 border border-neon-green/20 rounded-2xl p-4 flex items-center justify-between animate-in fade-in zoom-in duration-300">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-neon-green rounded-lg text-black shadow-[0_0_10px_rgba(82,196,45,0.4)]">
                 <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-neon-green tracking-widest">Doanh thu theo bộ lọc</p>
                 <p className="text-sm font-bold text-gray-900 dark:text-white italic">Dựa trên các tiêu chí bạn đã chọn</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-xl font-black text-neon-green tracking-tighter">{formatCurrency(filteredRevenue)}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Tổng cộng {totalCount} giao dịch</p>
           </div>
        </div>
      )}

      {/* Main Content Table Area */}
      <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden transition-all">
        {/* Filter Bar */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-wrap items-center gap-4 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="relative flex-1 min-w-[300px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
                type="text"
                placeholder="Tìm mã đơn hàng, email, tên khách hàng..."
                className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-neon-green/50 transition-all text-gray-900 dark:text-white"
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
             />
          </div>

          <div className="flex items-center gap-2">
            <select 
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-neon-green/50"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
            >
              <option value="">Tất cả loại hình</option>
              <option value="TICKET_PURCHASE">Mua vé mới</option>
              <option value="MARKETPLACE">Mua từ Chợ</option>
              <option value="TICKET_TRANSFER">Chuyển nhượng</option>
            </select>

            <select 
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-neon-green/50 max-w-[200px]"
              value={filters.eventId}
              onChange={(e) => setFilters({...filters, eventId: e.target.value, page: 1})}
            >
              <option value="">Tất cả Sự kiện</option>
              {eventList.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>

            <select 
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-neon-green/50 max-w-[200px]"
              value={filters.organizerId}
              onChange={(e) => setFilters({...filters, organizerId: e.target.value, page: 1})}
            >
              <option value="">Tất cả Ban tổ chức</option>
              {organizerList.map(org => (
                <option key={org.id} value={org.organizer_profile?.id}>{org.organizer_profile?.organization_name || org.email}</option>
              ))}
            </select>

            <select 
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-neon-green/50"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="pending">Đang chờ</option>
              <option value="failed">Thất bại</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            
            <div className="flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-1.5 focus-within:border-neon-green/50 transition-all">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">Từ ngày</span>
                  <input 
                    type="date" 
                    className="bg-transparent text-xs text-gray-700 dark:text-white focus:outline-none"
                    value={filters.from}
                    onChange={(e) => setFilters({...filters, from: e.target.value})}
                  />
               </div>
               <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-3"></div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">Đến ngày</span>
                  <input 
                    type="date" 
                    className="bg-transparent text-xs text-gray-700 dark:text-white focus:outline-none"
                    value={filters.to}
                    onChange={(e) => setFilters({...filters, to: e.target.value})}
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/[0.03] text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                <th className="px-5 py-5">Mã Giao dịch</th>
                <th className="px-5 py-5">Khách hàng</th>
                <th className="px-5 py-5">Loại hình</th>
                <th className="px-5 py-5">Số tiền</th>
                <th className="px-5 py-5 text-center">Trạng thái</th>
                <th className="px-5 py-5">Thời gian</th>
                <th className="px-5 py-5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="7" className="px-8 py-8 h-16 bg-white dark:bg-transparent"></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                   <td colSpan="7" className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center space-y-3 opacity-50">
                        <History className="w-12 h-12 text-gray-400" />
                        <span className="text-sm font-bold text-gray-500 italic">Không tìm thấy dữ liệu giao dịch nào phù hợp.</span>
                     </div>
                   </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all group">
                    <td className="px-5 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight">{tx.transaction_id}</span>
                        <span className="text-[10px] text-gray-500 italic font-medium truncate max-w-[130px]">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center font-black text-neon-green text-[10px] border border-neon-green/20 flex-shrink-0">
                          {tx.customer.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate">{tx.customer}</span>
                          <span className="text-[10px] text-gray-500 font-medium truncate">{tx.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">{getTypeBadge(tx.type)}</td>
                    <td className="px-5 py-5 text-xs font-black text-gray-900 dark:text-white uppercase italic tracking-tighter whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-5 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(tx.status)}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-[11px] text-gray-500 font-medium whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-5 text-right">
                       <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => navigate(`/admin/transactions/${tx.type === 'MARKETPLACE' ? 'MARKETPLACE' : 'ORDER'}/${tx.id}`)}
                            className="p-1.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-neon-green hover:text-black transition-all border border-gray-200 dark:border-white/10 group/btn shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:text-white transition-all border border-gray-200 dark:border-white/10 shadow-sm">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 bg-gray-50/30 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 flex items-center justify-between transition-all">
          <div className="text-xs text-gray-500 font-medium italic">
             Hiển thị <span className="text-gray-900 dark:text-white font-bold">{transactions.length}</span> trên tổng số <span className="text-gray-900 dark:text-white font-bold">{totalCount}</span> giao dịch
          </div>
          <div className="flex items-center space-x-3">
             <button className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
               Trước
             </button>
             <button className="px-5 py-2 text-xs font-black uppercase tracking-widest bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
               Sau
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagement;
