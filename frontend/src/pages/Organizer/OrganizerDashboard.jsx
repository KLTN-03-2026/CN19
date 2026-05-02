import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Ticket, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Activity,
  Users,
  PlusCircle,
  Clock,
  CheckCircle2,
  Timer,
  LayoutDashboard,
  Wallet,
  Loader2,
  BarChart3,
  ShoppingBag,
  Repeat,
  PieChart as PieChartIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuthStore } from '../../store/useAuthStore';
import { organizerService } from '../../services/organizer.service';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

const StatCard = ({ title, value, change, icon: Icon, isPositive, color }) => (
  <div className="bg-white dark:bg-[#111114] p-3 md:p-6 rounded-2xl border border-gray-200 dark:border-white/5 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 blur-[50px] -mr-8 -mt-8`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div className="flex-1 min-w-0">
        <p className="text-[8px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{title}</p>
        <h3 className="text-sm md:text-xl font-black mt-0.5 md:mt-2 text-gray-900 dark:text-white truncate">{value}</h3>
        {change && (
          <div className="flex flex-wrap items-center mt-0.5 md:mt-2 gap-x-2 gap-y-1">
            <span className={`flex items-center text-[8px] md:text-xs font-bold ${isPositive ? 'text-green-500' : 'text-gray-400'}`}>
              {isPositive ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
              {change}
            </span>
          </div>
        )}
      </div>
      <div className={`p-2 md:p-3 bg-${color}-500/10 rounded-xl shrink-0 ml-2`}>
        <Icon className={`w-4 h-4 md:w-6 md:h-6 text-${color}-500`} />
      </div>
    </div>
  </div>
);

const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState(7);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await organizerService.getDashboardStats(chartPeriod);
        setData(res.data);
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu thống kê');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [chartPeriod]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Đang tải dữ liệu Dashboard...</p>
      </div>
    );
  }

  const stats = [
    { title: 'Doanh thu Thực tế', value: `${new Intl.NumberFormat('vi-VN').format(data?.total_revenue || 0)} đ`, change: 'Đã đối soát', icon: DollarSign, isPositive: true, color: 'blue' },
    { title: 'Tổng vé đã bán', value: new Intl.NumberFormat('vi-VN').format(data?.total_tickets_sold || 0), change: 'Vé hợp lệ', icon: Ticket, isPositive: true, color: 'indigo' },
    { title: 'Hoa hồng bán lại', value: `${new Intl.NumberFormat('vi-VN').format(data?.total_royalty_revenue || 0)} đ`, change: 'Thị trường thứ cấp', icon: Repeat, isPositive: true, color: 'violet' },
    { title: 'Sự kiện sắp tới', value: data?.upcoming_events_count || 0, change: 'Sự kiện mở bán', icon: Calendar, isPositive: true, color: 'amber' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase">
            Trang chủ BTC
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs md:text-sm">
            Chào mừng {user?.full_name}! Chúc bạn một ngày làm việc hiệu quả và bùng nổ doanh số.
          </p>
        </div>
        <button onClick={() => navigate('/organizer/create-event')} className="w-full md:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all flex items-center justify-center group">
          <PlusCircle className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Tạo sự kiện mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Top Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111114] p-4 md:p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4 md:mb-8">
            <div>
              <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase">Doanh thu {chartPeriod} ngày qua</h3>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Xu hướng bán vé & hoạt động sinh lời</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                <button
                  onClick={() => setChartPeriod(7)}
                  className={`px-2 md:px-4 py-1 md:py-1.5 text-[8px] md:text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all ${chartPeriod === 7 ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  7 ngày
                </button>
                <button
                  onClick={() => setChartPeriod(30)}
                  className={`px-2 md:px-4 py-1 md:py-1.5 text-[8px] md:text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all ${chartPeriod === 30 ? 'bg-white dark:bg-[#111114] text-blue-600 shadow-sm border border-gray-200 dark:border-white/10' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  30 ngày
                </button>
              </div>
            </div>
          </div>
          
          {/* Revenue Dual Line Chart */}
          <div className="h-52 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.revenue_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <filter id="glow-blue">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-violet">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                  dy={8}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}
                />
                <CartesianGrid vertical={false} stroke="#374151" strokeDasharray="3 3" opacity={0.15} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '12px' }}
                  formatter={(value, name) => [
                    `${new Intl.NumberFormat('vi-VN').format(value)} đ`,
                    name === 'primary' ? 'Vé / Hàng hóa' : 'Hoa hồng bán lại'
                  ]}
                  labelStyle={{ color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}
                />
                <Legend 
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', paddingBottom: '8px' }}
                  formatter={(value) => value === 'primary' ? 'Vé / Hàng hóa' : 'Hoa hồng bán lại'}
                />
                <Line
                  type="monotone"
                  dataKey="primary"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="royalty"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={false}
                  activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Distribution Pie Chart */}
        <div className="bg-white dark:bg-[#111114] p-4 md:p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div>
              <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase">Cơ Cấu</h3>
              <p className="text-xs font-bold text-gray-500 mt-0.5">Theo sự kiện</p>
            </div>
            <div className="p-2 md:p-3 bg-emerald-500/10 rounded-xl">
              <PieChartIcon className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="flex-1 min-h-[160px] md:min-h-[200px] w-full relative">
            {(!data?.event_revenue_distribution || data.event_revenue_distribution.length === 0) ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-bold text-gray-500 uppercase">Chưa có dữ liệu</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.event_revenue_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.event_revenue_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111114', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value) => [`${new Intl.NumberFormat('vi-VN').format(value)} đ`, 'Doanh thu']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-4 space-y-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
             {(() => {
               const totalDist = data?.event_revenue_distribution?.reduce((s, e) => s + e.value, 0) || 1;
               return data?.event_revenue_distribution?.map((entry, index) => (
                 <div key={index} className="flex items-center justify-between text-[8px] md:text-[10px] font-bold uppercase">
                   <div className="flex items-center gap-2 truncate">
                     <div className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                     <span className="text-gray-500 truncate max-w-[70px] md:max-w-[90px]">{entry.name}</span>
                   </div>
                   <span className="text-gray-900 dark:text-white shrink-0">
                      {Math.round((entry.value / totalDist) * 100)}%
                   </span>
                 </div>
               ));
             })()}
          </div>
        </div>
      </div>

      {/* Middle Row: Events & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
        {/* Left Column: My Events Overview */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="px-4 md:px-8 py-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-sm md:text-base font-black text-gray-900 dark:text-white uppercase">Sự kiện gần đây</h3>
                <button onClick={() => navigate('/organizer/my-events')} className="text-blue-600 text-xs font-bold hover:underline">Tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                    <th className="px-4 md:px-8 py-3 text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-wider">Sự kiện</th>
                    <th className="px-3 py-3 text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-wider text-center hidden sm:table-cell">Ngày diễn ra</th>
                    <th className="px-3 py-3 text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-wider text-center">Tiến độ</th>
                    <th className="px-4 md:px-8 py-3 text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                  {data?.my_events?.length > 0 ? data.my_events.map((event, i) => (
                    <tr key={event.id || i} onClick={() => navigate(`/organizer/events/${event.id}`)} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer">
                      <td className="px-4 md:px-8 py-4">
                        <span className="text-xs md:text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase truncate block max-w-[130px] md:max-w-[200px]">{event.name}</span>
                      </td>
                      <td className="px-3 py-4 text-center hidden sm:table-cell">
                        <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{event.date !== 'N/A' ? new Date(event.date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col space-y-1.5 w-24 md:w-32 mx-auto">
                             <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-blue-600">{event.sold}/{event.total}</span>
                                <span className="text-gray-400">{event.total > 0 ? Math.round((event.sold/event.total)*100) : 0}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000"
                                    style={{ width: `${event.total > 0 ? (event.sold/event.total)*100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                          event.status === 'active' ? 'bg-green-500/10 text-green-500' : 
                          event.status === 'ended' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {event.status === 'active' ? 'Đang bán' : event.status === 'ended' ? 'Kết thúc' : event.status === 'published' ? 'Sắp mở' : 'Nháp'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-10 text-center text-sm font-bold text-gray-500 uppercase">Không có sự kiện nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white dark:bg-[#111114] p-4 md:p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm h-full flex flex-col">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-6 uppercase">Thông báo mới</h3>
            <div className="space-y-6 flex-1">
              {data?.notifications?.length > 0 ? data.notifications.map((item, i) => (
                <div key={i} className="flex items-start space-x-4 group/item">
                  <div className={`p-2 bg-blue-500/10 rounded-lg group-hover/item:scale-110 transition-transform`}>
                    <Ticket className={`w-4 h-4 text-blue-500`} />
                  </div>
                  <div>
                    <span className="block text-xs md:text-sm font-bold text-gray-900 dark:text-white">{item.label}</span>
                    <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">{new Date(item.time).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )) : (
                <p className="text-xs font-bold text-gray-500 uppercase">Chưa có thông báo mới.</p>
              )}
            </div>
            
            <button onClick={() => navigate('/organizer/orders')} className="w-full mt-6 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all mt-auto">
                Xem tất cả đơn hàng
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Merchandise & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
        {/* Top Merchandise */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111114] p-4 md:p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase">Top Sản Phẩm Bán Chạy</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {data?.top_merchandise?.length > 0 ? data.top_merchandise.map((item, i) => (
              <div key={item.id || i} className="flex flex-col p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl hover:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer group" onClick={() => navigate(`/organizer/products/${item.id}`)}>
                <div className="flex items-center justify-between mb-4">
                   <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md">
                    #{i + 1}
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Đã bán</p>
                     <p className="text-sm font-black text-indigo-500">{item.sold_quantity}</p>
                   </div>
                </div>
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                  <p className="text-xs font-black text-green-500 mt-1">{new Intl.NumberFormat('vi-VN').format(item.revenue)} đ</p>
                </div>
              </div>
            )) : (
              <div className="md:col-span-3 flex flex-col items-center justify-center py-8 opacity-50">
                 <ShoppingBag className="w-12 h-12 text-gray-400 mb-3" />
                 <p className="text-xs font-bold text-gray-500 uppercase">Chưa có dữ liệu bán hàng</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="bg-gradient-to-br from-[#111114] to-black p-4 md:p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
              <LayoutDashboard className="w-32 h-32 text-blue-500 -mr-8 -mt-8" />
          </div>
          <h3 className="text-sm md:text-base font-black text-white mb-3 md:mb-4 uppercase relative z-10">Thao tác nhanh</h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 relative z-10">
              <button onClick={() => navigate('/organizer/create-event')} className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center space-x-4 transition-all group/btn">
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover/btn:scale-110 transition-all">
                      <PlusCircle className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-[9px] md:text-xs font-black  text-white uppercase text-center md:text-left">Tạo sự kiện mới</span>
              </button>
              <button onClick={() => navigate('/organizer/my-events')} className="w-full p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center md:space-x-4 transition-all group/btn">
                  <div className="p-2 md:p-3 bg-indigo-500/20 rounded-xl group-hover/btn:scale-110 transition-all mb-2 md:mb-0">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                  </div>
                  <span className="text-[9px] md:text-xs font-bold text-white uppercase text-center md:text-left">Quản lý sự kiện</span>
              </button>
              <button onClick={() => navigate('/organizer/settlements')} className="w-full p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center md:space-x-4 transition-all group/btn">
                  <div className="p-2 md:p-3 bg-emerald-500/20 rounded-xl group-hover/btn:scale-110 transition-all mb-2 md:mb-0">
                      <Wallet className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                  </div>
                  <span className="text-[9px] md:text-xs font-bold text-white uppercase text-center md:text-left">Yêu cầu rút tiền</span>
              </button>
              <button onClick={() => navigate('/organizer/orders')} className="w-full p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col md:flex-row items-center md:space-x-4 transition-all group/btn">
                  <div className="p-2 md:p-3 bg-rose-500/20 rounded-xl group-hover/btn:scale-110 transition-all mb-2 md:mb-0">
                      <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
                  </div>
                  <span className="text-[9px] md:text-xs font-bold text-white uppercase text-center md:text-left">Quản lý đơn hàng</span>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
