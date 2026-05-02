import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Download, 
  Calendar,
  ChevronRight,
  PieChart as PieChartIcon,
  Activity,
  FileText,
  RefreshCcw,
  Loader2,
  AlertCircle,
  Package,
  ShoppingCart,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie,
  Cell
} from 'recharts';
import { organizerService } from '../../services/organizer.service';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchReportData();
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await organizerService.getMyEvents();
      // Only keep events that are not in draft
      setEvents(res.data.filter(e => e.status !== 'draft'));
    } catch (error) {
      console.error('Lỗi khi tải danh sách sự kiện:', error);
    }
  };

  const fetchReportData = async (isManual = false) => {
    try {
      setLoading(true);
      const res = await organizerService.getReports(selectedEventId);
      setData(res.data);
      if (isManual) toast.success('Đã cập nhật dữ liệu mới nhất');
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu báo cáo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!data) return;

    try {
      const wb = XLSX.utils.book_new();
      const dateStr = new Date().toLocaleDateString('vi-VN');
      const eventName = selectedEventId ? events.find(e => e.id === selectedEventId)?.title : 'Tất cả sự kiện';
      
      // 1. TỔNG QUAN (Summary)
      const summaryHeader = [
        ['BÁO CÁO THỐNG KÊ HOẠT ĐỘNG KINH DOANH'],
        [`Sự kiện: ${eventName}`],
        [`Ngày xuất: ${dateStr}`],
        [''],
        ['HẠNG MỤC', 'GIÁ TRỊ', 'GHI CHÚ'],
        ['Tổng doanh thu', summary.totalRevenue, 'Bao gồm vé và hoa hồng'],
        ['Doanh thu vé sơ cấp', summary.ticketRevenue, 'Doanh thu từ bán vé mới'],
        ['Hoa hồng từ chợ (Royalty)', summary.royaltyRevenue, 'Thu nhập từ giao dịch thứ cấp'],
        ['Tổng số vé đã bán', summary.totalTickets, 'Tổng lượt bán thành công'],
        ['Tổng lượt tham gia', summary.totalCheckIns, 'Khách đã check-in thực tế'],
        ['Số yêu cầu hoàn tiền', summary.totalRefunds, 'Đang chờ hoặc đã xử lý'],
        ['Tỉ lệ tham gia trung bình', topEvents.length > 0 ? `${Math.round(topEvents.reduce((s,e) => s+e.attendanceRate, 0) / topEvents.length)}%` : '0%', 'Hiệu suất khách đi sự kiện'],
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryHeader);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 30 }];
      // Merge title
      wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Tổng quan");

      // 2. XU HƯỚNG DOANH THU (Monthly Trends)
      if (monthlyTrends.length > 0) {
        const trendData = [
          ['BIẾN ĐỘNG DOANH THU THEO THÁNG'],
          [''],
          ['Tháng', 'Doanh thu (đ)', 'Số vé bán ra']
        ];
        
        monthlyTrends.forEach(m => {
          trendData.push([m.month, m.revenue, m.tickets]);
        });
        
        const wsTrends = XLSX.utils.aoa_to_sheet(trendData);
        wsTrends['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsTrends, "Xu hướng tháng");
      }

      // 3. PHÂN LOẠI VÉ (Tier Distribution)
      if (tierDistribution.length > 0) {
        const tierData = [
          ['PHÂN TÍCH CƠ CẤU VÉ VÀ DOANH THU'],
          [''],
          ['Tên hạng vé', 'Số lượng vé', 'Doanh thu (đ)', 'Tỷ trọng số lượng (%)', 'Tỷ trọng doanh thu (%)']
        ];
        
        const totalVal = tierDistribution.reduce((s, t) => s + t.value, 0);
        const totalRev = tierDistribution.reduce((s, t) => s + t.revenue, 0);
        
        tierDistribution.forEach(t => {
          tierData.push([
            t.name, 
            t.value, 
            t.revenue, 
            totalVal > 0 ? `${((t.value / totalVal) * 100).toFixed(1)}%` : '0%',
            totalRev > 0 ? `${((t.revenue / totalRev) * 100).toFixed(1)}%` : '0%'
          ]);
        });
        
        const wsTiers = XLSX.utils.aoa_to_sheet(tierData);
        wsTiers['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsTiers, "Cơ cấu vé");
      }

      // 4. HIỆU SUẤT SỰ KIỆN (Events)
      if (topEvents.length > 0) {
        const eventData = [
          ['HIỆU SUẤT CHI TIẾT TỪNG SỰ KIỆN'],
          [''],
          ['Tên sự kiện', 'Vé đã bán', 'Sức chứa', 'Tỷ lệ lấp đầy (%)', 'Số lượt Check-in', 'Tỷ lệ tham gia (%)']
        ];
        
        topEvents.forEach(e => {
          eventData.push([e.title, e.sold, e.capacity, `${e.fillRate}%`, e.checkIns, `${e.attendanceRate}%`]);
        });
        
        const wsEvents = XLSX.utils.aoa_to_sheet(eventData);
        wsEvents['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsEvents, "Hiệu suất sự kiện");
      }

      // 5. SẢN PHẨM (Merchandise)
      if (topMerchandise.length > 0) {
        const merchData = [
          ['DANH SÁCH SẢN PHẨM BÁN CHẠY'],
          [''],
          ['Tên sản phẩm', 'Số lượng đã bán', 'Tổng doanh thu (đ)']
        ];
        
        topMerchandise.forEach(m => {
          merchData.push([m.name, m.sold, m.revenue]);
        });
        
        const wsMerch = XLSX.utils.aoa_to_sheet(merchData);
        wsMerch['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsMerch, "Sản phẩm");
      }

      // Generate filename
      const safeEventName = eventName.replace(/\s+/g, '_');
      const fileName = `Bao_cao_Chi_tiet_${safeEventName}_${new Date().getTime()}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success('Đã xuất báo cáo chi tiết thành công!');
    } catch (error) {
      console.error('Lỗi xuất file:', error);
      toast.error('Có lỗi xảy ra khi xuất báo cáo');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Đang tổng hợp báo cáo chi tiết...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    ticketRevenue: 0,
    royaltyRevenue: 0,
    totalRevenue: 0,
    totalTickets: 0,
    totalCheckIns: 0,
    totalRefunds: 0
  };

  const monthlyTrends = data?.monthlyTrends || [];
  const tierDistribution = data?.tierDistribution || [];
  const topEvents = data?.topEvents || [];
  const topMerchandise = data?.topMerchandise || [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Thống kê & Báo cáo
          </h1>
          <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-2">
            <Activity className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
            {selectedEventId ? 'Đang xem báo cáo chi tiết cho một sự kiện' : 'Báo cáo tổng hợp tất cả sự kiện'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Event Selector */}
          <div className="relative group min-w-[150px]">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="appearance-none w-full bg-white dark:bg-[#111114] border border-gray-300 dark:border-white/10 px-4 py-3 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all cursor-pointer pr-10"
            >
              <option value="">Tất cả sự kiện</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors" />
          </div>

          <button 
            onClick={() => fetchReportData(true)}
            className="p-2.5 bg-white dark:bg-[#111114] border border-gray-300 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            <RefreshCcw className={`w-4.5 h-4.5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={exportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Download className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Xuất</span>
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
          title="Tổng Doanh Thu" 
          value={`${new Intl.NumberFormat('vi-VN').format(summary.totalRevenue || 0)} đ`} 
          sub={selectedEventId ? "Doanh thu sự kiện" : "Tất cả nguồn thu"}
          icon={DollarSign}
          color="blue"
        />
        <StatCard 
          title="Vé đã bán" 
          value={summary.totalTickets || 0} 
          sub="Hàng sơ cấp & thứ cấp"
          icon={Users}
          color="emerald"
        />
        <StatCard 
          title="Lượt Tham Gia" 
          value={summary.totalCheckIns || 0} 
          sub={`Tỉ lệ đi: ${summary.totalTickets > 0 ? Math.round((summary.totalCheckIns/summary.totalTickets)*100) : 0}%`}
          icon={UserCheck}
          color="violet"
        />
        <StatCard 
          title="Yêu cầu hoàn" 
          value={summary.totalRefunds || 0} 
          sub="Cần xử lý"
          icon={AlertCircle}
          color="rose"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111114] p-4 md:p-6 rounded-2xl border border-gray-300 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Xu hướng doanh thu</h3>
              <p className="text-[10px] md:text-sm text-gray-600 mt-0.5">Sự biến động theo thời gian</p>
            </div>
          </div>
          <div className="h-[280px] md:h-[300px] w-full">
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 10, fontWeight: 600}}
                    tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111114', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    formatter={(value) => [`${new Intl.NumberFormat('vi-VN').format(value)} đ`, 'Doanh thu']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 italic text-sm">Chưa có dữ liệu xu hướng</div>
            )}
          </div>
        </div>

        {/* Ticket Type Distribution */}
        <div className="bg-white dark:bg-[#111114] p-4 md:p-6 rounded-2xl border border-gray-300 dark:border-white/5 shadow-sm flex flex-col">
          <h3 className="text-sm md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-0.5">Phân loại vé</h3>
          <p className="text-[10px] md:text-sm text-gray-600 mb-4">Tỷ trọng các hạng vé đã bán</p>
          <div className="flex-1 flex flex-col justify-center">
            {tierDistribution.length > 0 ? (
              <>
                <div className="h-[180px] md:h-[220px] w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                          data={tierDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {tierDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#111114', borderRadius: '12px', border: 'none', color: '#fff' }}
                        />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                   {tierDistribution.slice(0, 4).map((tier, idx) => (
                     <div key={idx} className="flex items-center justify-between text-[10px] md:text-xs">
                        <div className="flex items-center gap-1.5 md:gap-2">
                           <div className="w-2 md:w-3 h-2 md:h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                           <span className="font-bold text-gray-600 dark:text-gray-400">{tier.name}</span>
                        </div>
                        <span className="font-black text-gray-900 dark:text-white">{tier.value} vé</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 italic text-xs">Chưa có dữ liệu phân loại</div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Section: Attendance & Merchandise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Rate Table */}
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-300 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-300 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-sm md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Tham gia thực tế</h3>
            <span className="text-[8px] md:text-[10px] font-black text-violet-600 bg-violet-50 dark:bg-violet-600/10 px-2 py-1 rounded">Điểm danh</span>
          </div>
          <div className="p-4 md:p-6 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
            {topEvents.length > 0 ? topEvents.map((event, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-[250px] uppercase tracking-tight">{event.title}</span>
                  <span className="text-[10px] md:text-xs font-black text-violet-500">{event.attendanceRate}%</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 transition-all duration-1000"
                      style={{ width: `${event.attendanceRate}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">{event.checkIns} / {event.sold}</span>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-500 italic text-sm">Chưa có dữ liệu tham gia</div>
            )}
          </div>
        </div>

        {/* Top Merchandise */}
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-300 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-300 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-sm md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Sản phẩm tiêu biểu</h3>
            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
          </div>
          <div className="p-2 md:p-3 space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
            {topMerchandise.length > 0 ? topMerchandise.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 md:p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                         <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] md:text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate max-w-[120px] md:max-w-[200px]">{item.name}</h4>
                    <p className="text-[8px] md:text-xs text-gray-600 font-bold">{new Intl.NumberFormat('vi-VN').format(item.revenue)} đ</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs md:text-sm font-black text-gray-900 dark:text-white">{item.sold}</p>
                  <p className="text-[8px] md:text-[10px] font-bold text-gray-500">Đã bán</p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-500 italic text-sm">Chưa có dữ liệu sản phẩm</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Overall Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-300 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-300 dark:border-white/5">
            <h3 className="text-sm md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Tỷ lệ lấp đầy vé</h3>
          </div>
          <div className="p-4 md:p-6 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
            {topEvents.length > 0 ? topEvents.map((event, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-[250px] uppercase tracking-tight">{event.title}</span>
                  <span className="text-[10px] md:text-xs font-black text-blue-500">{event.fillRate}%</span>
                </div>
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${event.fillRate}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">{event.sold} / {event.capacity}</span>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-gray-500 italic text-sm">Chưa có dữ liệu sự kiện</div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black p-6 md:p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col justify-center text-white min-h-[180px]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <FileText className="w-32 h-32 md:w-40 md:h-40 -mr-8 -mt-8 md:-mr-10 md:-mt-10" />
          </div>
          <div className="relative z-10">
             <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2 md:mb-3">Tình hình chung</h3>
             <p className="text-[10px] md:text-sm text-gray-400 mb-4 md:mb-6 leading-relaxed max-w-md">
               Tổng hợp hiệu suất hoạt động kinh doanh sơ cấp và thứ cấp.
             </p>
             <div className="grid grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                   <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase mb-0.5">Tỉ lệ tham gia TB</p>
                   <p className="text-sm md:text-xl font-black">
                     {topEvents.length > 0 
                       ? Math.round(topEvents.reduce((s,e) => s+e.attendanceRate, 0) / topEvents.length) 
                       : 0}%
                   </p>
                </div>
                <div className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                   <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase mb-0.5">Giá vé trung bình</p>
                   <p className="text-sm md:text-xl font-black">
                     {summary.totalTickets > 0 
                       ? new Intl.NumberFormat('vi-VN').format(Math.round(summary.ticketRevenue / summary.totalTickets)) 
                       : 0}đ
                   </p>
                </div>
             </div>
             <button className="w-full py-2 md:py-3 bg-white text-black font-black uppercase text-[10px] md:text-xs rounded-xl md:rounded-2xl hover:bg-gray-200 transition-all">
                Cấu hình báo cáo
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon: Icon, color }) => {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-600/10 border-blue-600/20 shadow-blue-600/10',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20 shadow-violet-500/10',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
  };

  return (
    <div className="bg-white dark:bg-[#111114] p-3 md:p-6 rounded-2xl border border-gray-300 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[8px] md:text-[10px] font-black text-gray-600 dark:text-gray-500 uppercase tracking-widest mb-0.5 md:mb-1 truncate">{title}</p>
          <h4 className="text-sm md:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">{value}</h4>
          <p className="text-[8px] md:text-[10px] font-bold text-gray-600 mt-1.5 md:mt-2 flex items-center gap-1">
             <ChevronRight className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400" />
             <span className="truncate">{sub}</span>
          </p>
        </div>
        <div className={`p-2 md:p-3 rounded-xl ${colorMap[color]} border group-hover:scale-110 transition-transform shrink-0`}>
          <Icon className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
};

export default Reports;
