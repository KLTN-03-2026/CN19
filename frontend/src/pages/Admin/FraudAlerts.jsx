import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  UserX, 
  Globe, 
  Cpu, 
  MousePointer2, 
  ShieldCheck,
  Search,
  Eye,
  AlertTriangle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
  <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden group shadow-sm transition-all hover:border-white/10">
    <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500/10 blur-[40px] -mr-6 -mt-6`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</h3>
        <p className="text-[10px] font-bold mt-1 text-gray-500 uppercase tracking-tight">{subValue}</p>
      </div>
      <div className={`p-2.5 bg-${color}-500/10 rounded-xl`}>
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
    </div>
  </div>
);

const RiskBadge = ({ score }) => {
  const s = parseFloat(score);
  let color = 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-500 border-green-200 dark:border-green-500/20';
  let label = 'An toàn';
  
  if (s > 0.7) {
    color = 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-500 border-red-200 dark:border-red-500/20';
    label = 'Rất Nguy hiểm';
  } else if (s > 0.4) {
    color = 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-500 border-orange-200 dark:border-orange-500/20';
    label = 'Cần lưu ý';
  } else if (s > 0.2) {
    color = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20';
    label = 'Rủi ro thấp';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${color} tracking-tighter`}>
      {label} ({s.toFixed(2)})
    </span>
  );
};

const normalizeBehaviorMetrics = (metrics = {}) => {
  const mouseDistance = metrics.mouse_distance ?? metrics.mouseDistance ?? 0;
  const clickCount = metrics.click_count ?? metrics.clickCount ?? metrics.totalClicks ?? 0;
  const timeToFirstClick = metrics.time_to_first_click ?? metrics.timeToFirstClick ?? 0;
  const mouseMovements = metrics.mouse_movements ?? metrics.mouseMovements ?? [];

  return {
    mouseDistance,
    clickCount,
    timeToFirstClick,
    mouseMovements: Array.isArray(mouseMovements) ? mouseMovements : []
  };
};

const FraudAlerts = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterEvent, setFilterEvent] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const normalizedSelectedMetrics = normalizeBehaviorMetrics(selectedLog?.behavior_metrics);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminService.getFraudAlerts();
      setLogs(res.data);
      setStats(res.stats);
    } catch (err) {
      toast.error('Không thể tải dữ liệu cảnh báo gian lận.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterRisk('ALL');
    setFilterEvent('ALL');
    setFilterDate('');
    toast.success('Đã xóa bộ lọc');
  };

  const handleProcess = async (id, action) => {
    try {
      const toastId = toast.loading('Đang xử lý...');
      await adminService.processFraudAlert(id, action);
      toast.success('Đã cập nhật trạng thái!', { id: toastId });
      fetchData(); // Refresh
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Lỗi khi xử lý.');
    }
  };

  const uniqueEvents = [...new Set(logs.map(l => l.event_type))];

  const filteredLogs = logs.filter(log => {
      // Risk Filter Logic
      let logRisk = 'LOW';
      if (log.risk_score > 0.7) logRisk = 'HIGH';
      else if (log.risk_score > 0.4) logRisk = 'WARNING';
      const matchesRisk = filterRisk === 'ALL' || logRisk === filterRisk;

      // Event Filter Logic
      const matchesEvent = filterEvent === 'ALL' || log.event_type === filterEvent;

      // Date Filter Logic
      let matchesDate = true;
      if (filterDate) {
          const logDateStr = new Date(log.created_at).toISOString().split('T')[0];
          matchesDate = logDateStr === filterDate;
      }

      // Search Text Logic
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
          log.ip_address?.toLowerCase().includes(searchLower) ||
          log.user_id?.toLowerCase().includes(searchLower) ||
          log.user?.full_name?.toLowerCase().includes(searchLower) ||
          log.user?.email?.toLowerCase().includes(searchLower) ||
          log.event_type?.toLowerCase().includes(searchLower) ||
          log.decision?.toLowerCase().includes(searchLower);

      return matchesRisk && matchesEvent && matchesDate && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="w-8 h-8 text-neon-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase">Trung tâm Giám sát Hệ thống</h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium opacity-70">Theo dõi và ngăn chặn các hoạt động tự động hóa trên BASTICKET.</p>
        </div>
        <div className="flex items-center space-x-2 ml-auto sm:ml-0">
          <button 
              onClick={fetchData}
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500 hover:text-neon-green shadow-sm active:scale-95"
              title="Làm mới dữ liệu"
          >
              <Activity className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
            title="Tổng số chặn (BLOCK)" 
            value={filteredLogs.filter(l => l.decision === 'BLOCK').length} 
            subValue="Theo bộ lọc hiện tại" 
            icon={ShieldAlert}
            color="red"
        />
        <StatCard 
            title="Ca rủi ro cao (>0.7)" 
            value={filteredLogs.filter(l => l.risk_score > 0.7).length} 
            subValue="Cần xem xét thủ công" 
            icon={AlertTriangle}
            color="orange"
        />
        <StatCard 
            title="Chặn trong 24h qua" 
            value={filteredLogs.filter(l => l.decision === 'BLOCK' && new Date(l.created_at) > new Date(Date.now() - 24*60*60*1000)).length} 
            subValue="Hoạt động Bot gần đây" 
            icon={Clock}
            color="blue"
        />
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-[#111114] rounded-2xl md:rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="px-4 py-4 md:px-6 md:py-5 border-b border-gray-100 dark:border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <ShieldAlert className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Phát hiện Gần đây</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4">
                <div className="relative lg:col-span-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm IP, User, Event..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-neon-green w-full text-gray-900 dark:text-white transition-colors font-medium shadow-sm"
                    />
                </div>
                
                <div className="lg:col-span-2">
                  <select 
                      value={filterRisk} 
                      onChange={(e) => setFilterRisk(e.target.value)}
                      className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-black  focus:outline-none focus:border-neon-green w-full text-gray-700 dark:text-gray-300 appearance-none cursor-pointer shadow-sm"
                  >
                      <option value="ALL">Mức độ rủi ro</option>
                      <option value="HIGH">Rất Nguy Hiểm</option>
                      <option value="WARNING">Cần Lưu Ý</option>
                      <option value="LOW">An Toàn</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <select 
                      value={filterEvent} 
                      onChange={(e) => setFilterEvent(e.target.value)}
                      className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-black focus:outline-none focus:border-neon-green w-full text-gray-700 dark:text-gray-300 appearance-none cursor-pointer shadow-sm"
                  >
                      <option value="ALL">Loại sự kiện</option>
                      {uniqueEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <input 
                      type="date" 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-black focus:outline-none focus:border-neon-green w-full text-gray-700 dark:text-gray-300 shadow-sm"
                  />
                </div>

                <div className="lg:col-span-2">
                  <button 
                    onClick={handleResetFilters}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-tighter text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group w-full shadow-sm"
                    title="Xóa tất cả bộ lọc"
                  >
                    <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-180deg] transition-transform duration-500" />
                    <span>Làm mới</span>
                  </button>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Đối tượng</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Sự kiện</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Rủi ro</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quyết định</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                        <ShieldCheck className="w-16 h-16 text-gray-200 dark:text-white/5 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Hệ thống an toàn</h4>
                        <p className="text-sm font-medium opacity-50 uppercase tracking-widest">Không có phát hiện rủi ro nào gần đây.</p>
                    </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.015] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                              {format(new Date(log.created_at), 'HH:mm:ss')}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-tight font-bold">
                              {format(new Date(log.created_at), 'dd MMM yyyy', { locale: vi })}
                          </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                          <div className="flex items-center space-x-3">
                              {log.user.avatar_url ? (
                                  <img 
                                      src={log.user.avatar_url} 
                                      alt={log.user.full_name || 'User Avatar'} 
                                      className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-white/10 hidden md:block"
                                  />
                              ) : (
                                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-[10px] border border-blue-100 dark:border-blue-500/20 hidden md:flex uppercase">
                                      {log.user.full_name?.[0] || 'U'}
                                  </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate ">{log.user.full_name || 'Người dùng ẩn danh'}</span>
                                  <span className="text-[10px] text-gray-500 truncate max-w-[120px] md:max-w-none mt-0.5 lowercase font-medium">{log.user.email}</span>
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 font-medium text-xs hidden md:flex">
                                  <Globe className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Khách vãng lai</span>
                                  <span className="text-[10px] text-gray-400 mt-0.5 font-mono font-medium">{log.ip_address}</span>
                              </div>
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider shadow-sm">
                          {log.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-col space-y-1 justify-center">
                          <RiskBadge score={log.risk_score} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                        log.decision === 'BLOCK' 
                          ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20 shadow-sm' 
                          : log.decision === 'SAFE'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20 shadow-sm'
                          : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20 shadow-sm'
                      }`}>
                        {log.decision === 'BLOCK' ? <ShieldAlert className="w-3 h-3 mr-1.5" /> : <ShieldCheck className="w-3 h-3 mr-1.5" />}
                        {log.decision}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                          onClick={() => { setSelectedLog(log); setIsModalOpen(true); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-neon-green rounded-xl transition-all active:scale-95 group-hover:bg-gray-100 dark:group-hover:bg-white/5"
                          title="Xem chi tiết"
                      >
                          <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#111114] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/5">
                
                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${parseFloat(selectedLog.risk_score) > 0.7 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500'}`}>
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase text-gray-900 dark:text-white tracking-tight">Phân tích Hệ thống</h2>
                            <p className="text-xs font-bold text-gray-500 mt-1 uppercase opacity-70 tracking-widest">Sự kiện: {selectedLog.event_type} • ID: {selectedLog.id.split('-')[0]}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
                    {/* User & IP Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">
                                <Globe className="w-4 h-4 mr-2 text-neon-green" />
                                Nguồn truy cập
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white font-mono tracking-tight">{selectedLog.ip_address}</p>
                            <p className="text-[10px] text-gray-500 mt-2 line-clamp-2 italic font-medium opacity-70" title={selectedLog.user_agent}>{selectedLog.user_agent}</p>
                        </div>
                        <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">
                                <Cpu className="w-4 h-4 mr-2 text-blue-500" />
                                Phản hồi Hệ thống
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{selectedLog.click_speed_ms}<span className="text-xs text-gray-400 ml-1 font-normal lowercase tracking-widest">ms</span></p>
                                    <p className="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-tighter opacity-70">Tốc độ Click</p>
                                </div>
                                <div className="w-px h-10 bg-gray-200 dark:bg-white/10"></div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{selectedLog.form_fill_duration}<span className="text-xs text-gray-400 ml-1 font-normal lowercase tracking-widest">ms</span></p>
                                    <p className="text-[10px] font-black text-gray-500 mt-2 uppercase tracking-tighter opacity-70">Form Entry</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phân tích Hành vi Chuyên sâu */}
                    {selectedLog.behavior_metrics && Object.keys(selectedLog.behavior_metrics).length > 0 && (
                        <div className="p-5 bg-gray-100/50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center text-[10px] font-black uppercase text-gray-400 mb-5 tracking-widest">
                                <MousePointer2 className="w-4 h-4 mr-2 text-neon-green" />
                                Phân tích Hành vi (AI)
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{normalizedSelectedMetrics.mouseDistance}<span className="text-[10px] text-gray-400 ml-1 font-normal lowercase">px</span></p>
                                    <p className="text-[9px] font-black text-gray-500 mt-1.5 uppercase tracking-tighter opacity-70">Quãng đường</p>
                                </div>
                                <div className="border-l border-gray-200 dark:border-white/10 pl-5">
                                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{normalizedSelectedMetrics.mouseMovements.length}</p>
                                    <p className="text-[9px] font-black text-gray-500 mt-1.5 uppercase tracking-tighter opacity-70">Lệnh lia</p>
                                </div>
                                <div className="border-l border-gray-200 dark:border-white/10 pl-5">
                                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{normalizedSelectedMetrics.clickCount}</p>
                                    <p className="text-[9px] font-black text-gray-500 mt-1.5 uppercase tracking-tighter opacity-70">Tổng Click</p>
                                </div>
                                <div className="border-l border-gray-200 dark:border-white/10 pl-5">
                                    <p className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{normalizedSelectedMetrics.timeToFirstClick}<span className="text-[10px] text-gray-400 ml-1 font-normal lowercase">ms</span></p>
                                    <p className="text-[9px] font-black text-gray-500 mt-1.5 uppercase tracking-tighter opacity-70">Phản xạ 1st</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Logic Details */}
                    <div className="space-y-4">
                        <div className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <Activity className="w-4 h-4 mr-2 text-neon-green" />
                            Cơ sở đánh giá phân tích
                        </div>
                        <div className="bg-gray-50 dark:bg-white/3 rounded-3xl p-6 border border-gray-100 dark:border-white/5">
                            {selectedLog.detection_details ? (
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-white/10">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tight">Bảo mật Captcha</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${(selectedLog.detection_details?.recaptchaScore ?? 1.0) >= 0.5 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {(selectedLog.detection_details?.recaptchaScore ?? 1.0) >= 0.5 ? `Vượt qua (${selectedLog.detection_details?.recaptchaScore ?? '1.0'})` : 'Thất bại'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-white/10">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tight">Đánh giá AI (Hành vi)</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 px-2 py-1 rounded-lg">
                                            Rủi ro: {selectedLog.detection_details?.aiRiskScore ?? selectedLog.risk_score}
                                        </span>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Lý do từ Hệ thống AI:</p>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-white/50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                                            {(() => {
                                                const detailsData = Array.isArray(selectedLog.detection_details) 
                                                    ? selectedLog.detection_details 
                                                    : selectedLog.detection_details?.details;
                                                    
                                                return detailsData && detailsData.length > 0 ? (
                                                    <ul className="space-y-3">
                                                        {detailsData.map((reason, index) => (
                                                            <li key={index} className="flex items-start">
                                                              <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                                                              <span className="font-medium tracking-tight text-gray-700 dark:text-gray-300">{reason}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="italic text-gray-500 font-medium">Mẫu hành vi bình thường. Không ghi nhận dấu hiệu vi phạm.</p>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-center text-gray-500 py-6 font-medium italic">Không có bản ghi chi tiết nội bộ.</p>
                            )}
                        </div>
                    </div>

                    {/* Raw Payload Section (JSON) */}
                    {selectedLog.behavior_metrics && (
                        <div className="space-y-4">
                            <div className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                <MousePointer2 className="w-4 h-4 mr-2" />
                                Payload Hệ thống (Raw)
                            </div>
                            <div className="bg-gray-900/5 dark:bg-black/20 rounded-3xl p-6 overflow-x-auto text-[10px] text-gray-500 dark:text-gray-400 font-mono border border-gray-200 dark:border-white/5 shadow-inner">
                                <pre className="whitespace-pre-wrap opacity-80 leading-relaxed">
                                    {JSON.stringify(selectedLog.behavior_metrics, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer (Actions) */}
                <div className="px-8 py-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
                    >
                        Đóng
                    </button>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <button 
                             onClick={() => handleProcess(selectedLog.id, 'safe')}
                             className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
                        >
                            Đánh dấu an toàn
                        </button>
                        {selectedLog.user && selectedLog.user.status !== 'banned' && (
                            <button 
                                onClick={() => {
                                    if(window.confirm(`Xác nhận khóa tài khoản ${selectedLog.user.email}?`)) {
                                        handleProcess(selectedLog.id, 'ban_user')
                                    }
                                }}
                                className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 flex items-center justify-center active:scale-95"
                            >
                                <UserX className="w-3.5 h-3.5 mr-2" />
                                Cấm tài khoản
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FraudAlerts;
