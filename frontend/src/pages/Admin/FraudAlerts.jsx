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
  <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-500/10 blur-[40px] -mr-6 -mt-6`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-1 uppercase">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 dark:text-white">{value}</h3>
        <p className="text-xs font-bold mt-1 text-green-600">{subValue}</p>
      </div>
      <div className={`p-3 bg-${color}-500/10 rounded-xl`}>
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
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
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Trung tâm Giám sát Hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi và ngăn chặn các hoạt động tự động hóa trên nền tảng.</p>
        </div>
        <button 
            onClick={fetchData}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-2.5 rounded-lg hover:bg-gray-50 transition-all text-gray-500"
            title="Làm mới dữ liệu"
        >
            <Activity className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            color="green"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
                        <ShieldAlert className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Nhật ký phát hiện</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm IP, User, Event..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 w-full text-gray-900 dark:text-white"
                    />
                </div>
                
                <select 
                    value={filterRisk} 
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 w-full text-gray-700 dark:text-gray-300"
                >
                    <option value="ALL">Tất cả Rủi ro</option>
                    <option value="HIGH">Rất Nguy Hiểm ({'>'}0.7)</option>
                    <option value="WARNING">Cần Lưu Ý ({'>'}0.4)</option>
                    <option value="LOW">An Toàn ({'<='}0.4)</option>
                </select>

                <select 
                    value={filterEvent} 
                    onChange={(e) => setFilterEvent(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 w-full text-gray-700 dark:text-gray-300 "
                >
                    <option value="ALL">Tất cả Sự kiện</option>
                    {uniqueEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>

                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 w-full text-gray-700 dark:text-gray-300"
                />

                <button 
                  onClick={handleResetFilters}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-bold text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group"
                  title="Xóa tất cả bộ lọc"
                >
                  <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-500" />
                  <span>Xóa lọc</span>
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Thời gian</th>
                <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Đối tượng</th>
                <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Sự kiện</th>
                <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Mức độ rủi ro</th>
                <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase">Quyết định</th>
                <th className="px-4 py-3 text-xs font-black text-gray-500 uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        Không tìm thấy nhật ký phù hợp với bộ lọc
                    </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(log.created_at), 'dd MMM yyyy', { locale: vi })}
                        </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {log.user ? (
                        <div className="flex items-center space-x-3">
                            {log.user.avatar_url ? (
                                <img 
                                    src={log.user.avatar_url} 
                                    alt={log.user.full_name || 'User Avatar'} 
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-white/10"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 font-medium text-xs border border-blue-100 dark:border-blue-500/20">
                                    {log.user.full_name?.[0] || 'U'}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{log.user.full_name || 'Người dùng ẩn danh'}</span>
                                <span className="text-xs text-gray-500 truncate max-w-[150px] mt-0.5">{log.user.email}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 font-medium text-xs">
                                <Globe className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Khách vãng lai</span>
                                <span className="text-xs text-gray-500 mt-0.5">{log.ip_address}</span>
                            </div>
                        </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md text-xs font-semibold uppercase text-gray-700 dark:text-gray-300">
                        {log.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col space-y-1.5 justify-center">
                        <div><RiskBadge score={log.risk_score} /></div>
                        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${parseFloat(log.risk_score) > 0.7 ? 'bg-red-500' : parseFloat(log.risk_score) > 0.4 ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: `${parseFloat(log.risk_score) * 100}%` }}
                            />
                        </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase ${
                      log.decision === 'BLOCK' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20' : 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20'
                    }`}>
                      {log.decision === 'BLOCK' ? <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
                      {log.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                        onClick={() => { setSelectedLog(log); setIsModalOpen(true); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 rounded-md transition-colors"
                        title="Xem chi tiết"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-16 text-center">
                <ShieldCheck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-base">Hệ thống an toàn. Không có phát hiện rủi ro nào gần đây.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#111114] rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${parseFloat(selectedLog.risk_score) > 0.7 ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-500'}`}>
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase text-gray-900 dark:text-white">Chi tiết Phân tích Hệ thống</h2>
                            <p className="text-sm font-medium text-gray-500 mt-0.5">Sự kiện: {selectedLog.event_type} • ID: {selectedLog.id.split('-')[0]}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* User & IP Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center text-sm font-black uppercase text-gray-500 dark:text-gray-400 mb-2">
                                <Globe className="w-4 h-4 mr-2" />
                                Nguồn truy cập
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{selectedLog.ip_address}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2" title={selectedLog.user_agent}>{selectedLog.user_agent}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center text-sm font-black uppercase text-gray-500 dark:text-gray-400 mb-3">
                                <Cpu className="w-4 h-4 mr-2" />
                                Chỉ số Phản hồi
                            </div>
                            <div className="flex items-center space-x-6">
                                <div>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{selectedLog.click_speed_ms}<span className="text-sm text-gray-400 ml-1 font-normal">ms</span></p>
                                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase">Tốc độ Click</p>
                                </div>
                                <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>
                                <div>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">{selectedLog.form_fill_duration}<span className="text-sm text-gray-400 ml-1 font-normal">ms</span></p>
                                    <p className="text-xs font-medium text-gray-500 mt-1 uppercase">Hoàn thành Form</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phân tích Hành vi Chuyên sâu */}
                    {selectedLog.behavior_metrics && Object.keys(selectedLog.behavior_metrics).length > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center text-sm font-black uppercase text-gray-500 dark:text-gray-400 mb-4">
                                <MousePointer2 className="w-4 h-4 mr-2" />
                                Phân tích Hành vi Chuyên sâu
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{normalizedSelectedMetrics.mouseDistance}<span className="text-xs text-gray-400 ml-1 font-normal">px</span></p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Quãng đường chuột</p>
                                </div>
                                <div className="sm:border-l sm:border-gray-200 dark:sm:border-white/10 sm:pl-4">
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{normalizedSelectedMetrics.mouseMovements.length}<span className="text-xs text-gray-400 ml-1 font-normal">lần</span></p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Khớp lệnh lia chuột</p>
                                </div>
                                <div className="border-t pt-4 mt-2 sm:border-t-0 sm:pt-0 sm:mt-0 sm:border-l sm:border-gray-200 dark:sm:border-white/10 sm:pl-4">
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{normalizedSelectedMetrics.clickCount}<span className="text-xs text-gray-400 ml-1 font-normal">click</span></p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Tổng tương tác</p>
                                </div>
                                <div className="border-t pt-4 mt-2 sm:border-t-0 sm:pt-0 sm:mt-0 sm:border-l sm:border-gray-200 dark:sm:border-white/10 sm:pl-4">
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{normalizedSelectedMetrics.timeToFirstClick}<span className="text-xs text-gray-400 ml-1 font-normal">ms</span></p>
                                    <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase">Độ trễ click 1</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI Logic Details */}
                    <div className="space-y-3">
                        <div className="flex items-center text-sm font-black uppercase text-gray-500 dark:text-gray-400">
                            <Activity className="w-4 h-4 mr-2" />
                            Cơ sở đánh giá phân tích
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 border border-gray-100 dark:border-white/5">
                            {selectedLog.detection_details ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/10">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Bảo mật Captcha</span>
                                        <span className={`text-sm font-semibold ${(selectedLog.detection_details?.recaptchaScore ?? 1.0) >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                                            {(selectedLog.detection_details?.recaptchaScore ?? 1.0) >= 0.5 ? `Vượt qua (${selectedLog.detection_details?.recaptchaScore ?? '1.0'})` : 'Thất bại'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/10">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Đánh giá AI (Hành vi)</span>
                                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                            Rủi ro AI: {selectedLog.detection_details?.aiRiskScore ?? selectedLog.risk_score}
                                        </span>
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Lý do từ Hệ thống AI:</p>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1">
                                            {(() => {
                                                const detailsData = Array.isArray(selectedLog.detection_details) 
                                                    ? selectedLog.detection_details 
                                                    : selectedLog.detection_details?.details;
                                                    
                                                return detailsData && detailsData.length > 0 ? (
                                                    <ul className="list-disc pl-4 space-y-2 marker:text-gray-400">
                                                        {detailsData.map((reason, index) => (
                                                            <li key={index}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="italic text-gray-500">Mẫu hành vi bình thường. Không ghi nhận dấu hiệu vi phạm.</p>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-center text-gray-500 py-4">Không có bản ghi chi tiết nội bộ.</p>
                            )}
                        </div>
                    </div>

                    {/* Behavior Metrics (JSON) */}
                    {selectedLog.behavior_metrics && (
                        <div className="space-y-3">
                            <div className="flex items-center text-sm font-black uppercase text-gray-500 dark:text-gray-400">
                                <MousePointer2 className="w-4 h-4 mr-2" />
                                Payload Hệ thống (Raw)
                            </div>
                            <div className="bg-gray-800 dark:bg-black/40 rounded-xl p-4 overflow-x-auto text-xs text-gray-300 dark:text-gray-400 font-mono">
                                <pre className="whitespace-pre-wrap opacity-90">
                                    {JSON.stringify(selectedLog.behavior_metrics, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer (Actions) */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        Đóng
                    </button>
                    <div className="flex items-center space-x-3">
                        <button 
                             onClick={() => handleProcess(selectedLog.id, 'safe')}
                             className="px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
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
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center"
                            >
                                <UserX className="w-4 h-4 mr-2" />
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
