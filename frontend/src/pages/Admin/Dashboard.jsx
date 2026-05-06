import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Ticket, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Shield,
  RefreshCcw,
  ArrowRight,
  ChevronRight,
  Zap,
  BarChart4,
  Wallet,
  Globe,
  Bell,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip,
  Legend
} from 'recharts';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// Thẻ thống kê tối ưu diện tích và độ tương phản
const StatCard = ({ title, value, change, icon: Icon, isPositive, color, subtitle }) => (
  <div className="relative group perspective-1000">
    <div className={`absolute -inset-0.5 bg-gradient-to-br from-${color}-500 to-transparent rounded-3xl opacity-10 group-hover:opacity-30 transition duration-500 blur-sm`}></div>
    <div className="bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-xl p-5 rounded-2xl border border-gray-200 dark:border-white/5 relative overflow-hidden transition-all duration-500 transform-gpu group-hover:translate-y-[-4px] shadow-sm hover:shadow-xl">
      
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${color}-500/5 blur-[40px] group-hover:bg-${color}-500/10 transition-all duration-700`}></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-tight">{title}</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{value}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black ${isPositive ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-700 border border-red-500/20'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {change}
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight opacity-90">{subtitle || 'so với tuần trước'}</span>
          </div>
        </div>
        <div className={`p-3 bg-gradient-to-br from-${color}-500/10 to-transparent rounded-xl group-hover:scale-110 transition-all duration-500 border border-gray-200 dark:border-white/10 shadow-sm`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  if (loading && !stats) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-neon-green/10 border-t-neon-green rounded-full animate-spin"></div>
              <div className="absolute inset-0 bg-neon-green/20 blur-xl rounded-full"></div>
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight animate-pulse">Đang khởi tạo hệ thống...</p>
        </div>
    );
  }

  const statCards = [
    { title: 'TỔNG DOANH THU SÀN', value: formatCurrency(stats?.total_revenue), change: '+15.4%', icon: Wallet, isPositive: true, color: 'blue', subtitle: 'Phí dịch vụ & Hoa hồng' },
    { title: 'VÉ BÁN THÀNH CÔNG', value: stats?.total_successful_orders?.toLocaleString(), change: '+8.2%', icon: Ticket, isPositive: true, color: 'green', subtitle: 'Giao dịch đã xác thực' },
    { title: 'NGƯỜI DÙNG HỆ THỐNG', value: stats?.total_users?.toLocaleString(), change: '+24', icon: Users, isPositive: true, color: 'purple', subtitle: 'Tài khoản hoạt động' },
    { title: 'SỰ KIỆN ĐANG CHẠY', value: stats?.total_events?.toLocaleString(), change: '+4', icon: Calendar, isPositive: true, color: 'orange', subtitle: 'Hệ thống vận hành' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 tracking-tight pb-8 relative overflow-hidden">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-neon-green/5 blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>

      {/* Futuristic Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-black/5 dark:bg-white/5 backdrop-blur-md px-3 py-0.5 rounded-full border border-gray-300 dark:border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse mr-2"></div>
                <span className="text-[9px] font-black text-neon-green uppercase tracking-tight">Hệ thống trực tuyến</span>
             </div>
             <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-500 text-[9px] font-bold uppercase tracking-tight">
                <Globe className="w-3 h-3" />
                Máy chủ chính / Cụm-01
             </div>
          </div>
          
          <div className="space-y-0">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">
              TRUNG TÂM <span className="text-neon-green drop-shadow-[0_0_10px_rgba(57,255,20,0.2)]">ĐIỀU HÀNH</span>
            </h1>
            <p className="text-slate-600 dark:text-zinc-500 font-bold text-[10px] uppercase tracking-tight opacity-90">Quản trị tài chính & vận hành nền tảng BASTICKET v2.4.0</p>
          </div>
        </div>

        {/* Live Status Ticker */}
        <div className="flex-1 max-w-lg bg-gray-100 dark:bg-white/5 backdrop-blur-xl border border-gray-300 dark:border-white/10 rounded-xl p-2.5 overflow-hidden hidden lg:block relative group">
           <div className="flex items-center gap-4 animate-marquee whitespace-nowrap">
              <span className="flex items-center gap-2 text-[9px] font-black text-neon-green uppercase">
                <Bell className="w-3 h-3" /> Thông báo hệ thống:
              </span>
              <span className="text-[9px] font-bold text-slate-700 dark:text-zinc-400 uppercase tracking-tight">
                Phát hiện 12 yêu cầu rút tiền mới chờ xử lý • Doanh thu tăng trưởng 12% so với hôm qua • Hệ thống AI vừa ngăn chặn 2 giao dịch nghi vấn • Sự kiện "Music Festival 2024" vừa bán hết vé...
              </span>
           </div>
           <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-100 dark:from-[#0a0a0c] to-transparent z-10"></div>
           <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-100 dark:from-[#0a0a0c] to-transparent z-10"></div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchStats} className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/10 rounded-xl hover:border-neon-green/50 transition-all group active:scale-95 shadow-sm">
            <RefreshCcw className={`w-4 h-4 text-slate-600 group-hover:text-neon-green ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="bg-neon-green text-black px-5 py-3 rounded-xl text-[10px] font-black shadow-lg shadow-neon-green/10 hover:shadow-neon-green/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center uppercase tracking-tight">
            <Activity className="w-3.5 h-3.5 mr-2" />
            Báo cáo chi tiết
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative z-10">
        {/* Left Column: Visualizations area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main Revenue Chart (Column) */}
          <div className="bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-gray-200 dark:border-white/5 relative overflow-hidden group shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-neon-green/10 rounded-lg border border-neon-green/20">
                      <BarChart4 className="w-5 h-5 text-neon-green" />
                    </div>
                    Thống kê doanh thu
                </h3>
                <p className="text-[9px] text-slate-600 dark:text-zinc-500 font-black uppercase tracking-tight opacity-90">Đồng bộ dữ liệu thời gian thực • Chỉ số tài chính</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg border border-gray-300 dark:border-white/10 backdrop-blur-md">
                <button className="px-4 py-1 text-[9px] font-black uppercase rounded-md bg-white dark:bg-white/10 shadow-sm transition-all text-neon-green tracking-tight">Ngày</button>
                <button className="px-4 py-1 text-[9px] font-black uppercase rounded-md text-slate-500 hover:text-gray-900 dark:hover:text-white transition-all tracking-tight">Tháng</button>
              </div>
            </div>
            
            <div className="h-[250px] flex items-end justify-between gap-3 px-2 relative">
              <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-gray-400 dark:border-white"></div>
                ))}
              </div>
              
              {stats?.revenue_trend?.map((item, i) => {
                const maxVal = Math.max(...stats.revenue_trend.map(t => t.revenue), 1);
                const height = (item.revenue / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group/bar relative z-10 h-full justify-end">
                    <div 
                      className="w-full max-w-[40px] bg-gradient-to-t from-neon-green to-neon-green/20 rounded-t-lg rounded-b transition-all duration-700 ease-out group-hover/bar:from-neon-green relative group shadow-[0_0_10px_rgba(57,255,20,0.05)]"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-neon-green px-3 py-1.5 rounded-lg text-[9px] font-black opacity-0 group-hover/bar:opacity-100 transition-all duration-300 whitespace-nowrap border border-neon-green/20 shadow-xl z-20">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-600 dark:text-zinc-500 mt-3 uppercase tracking-tight group-hover/bar:text-neon-green transition-all">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white dark:bg-[#0c0c0e] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm relative group">
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Giao dịch trực tuyến
                  </h3>
                  <p className="text-[9px] text-slate-600 dark:text-zinc-500 font-black uppercase tracking-tight opacity-90">Giám sát luồng giao dịch hệ thống</p>
                </div>
                <Link to="/admin/transactions" className="text-neon-green text-[9px] font-black uppercase hover:underline transition-all tracking-tight flex items-center gap-2">
                    Xem tất cả <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
                    <th className="px-6 py-3.5 text-[9px] font-black uppercase text-slate-700 dark:text-zinc-400 tracking-tight">Mã đơn</th>
                    <th className="px-5 py-3.5 text-[9px] font-black uppercase text-slate-700 dark:text-zinc-400 tracking-tight">Khách hàng</th>
                    <th className="px-5 py-3.5 text-[9px] font-black uppercase text-slate-700 dark:text-zinc-400 tracking-tight">Số tiền</th>
                    <th className="px-5 py-3.5 text-[9px] font-black uppercase text-slate-700 dark:text-zinc-400 tracking-tight">Trạng thái</th>
                    <th className="px-6 py-3.5 text-[9px] font-black uppercase text-slate-700 dark:text-zinc-400 tracking-tight text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {stats?.recent_transactions?.map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors group/row">
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight font-mono">
                          #{tx.order_number}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-neon-green font-black text-[10px] border border-gray-300 dark:border-white/5 shadow-sm">
                                {tx.customer?.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">{tx.customer?.full_name}</span>
                                <span className="text-[9px] text-slate-600 dark:text-zinc-500 font-bold leading-none">{tx.customer?.email}</span>
                            </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(tx.total_amount)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase bg-green-500/10 text-green-700 border border-green-500/20 w-fit">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Thành công
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-[10px] text-slate-600 dark:text-zinc-500 font-black uppercase opacity-90 font-mono">
                         {format(new Date(tx.created_at), 'HH:mm:ss • dd/MM')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Revenue Distribution Pie Chart */}
          <div className="bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-gray-200 dark:border-white/5 relative group shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight flex items-center gap-2">
               <PieIcon className="w-4 h-4 text-neon-green" />
               Phân loại doanh thu
            </h3>
            
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.revenue_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.revenue_distribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip 
                    contentStyle={{ 
                      backgroundColor: '#111', 
                      borderColor: '#333', 
                      borderRadius: '12px',
                      fontSize: '10px',
                      color: '#fff'
                    }} 
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 gap-2 mt-4">
               {stats?.revenue_distribution?.map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                     <span className="text-[10px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-tight">{item.name}</span>
                   </div>
                   <span className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(item.value)}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0e] p-6 rounded-2xl border border-gray-200 dark:border-white/5 relative group shadow-sm">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
               <Bell className="w-4 h-4 text-neon-green" />
               Duyệt sự kiện
            </h3>
            
            <div className="space-y-4">
              {[
                { label: 'Yêu cầu mới', count: stats?.event_stats?.pending, color: 'blue', icon: AlertCircle, bg: 'bg-blue-500/10', text: 'text-blue-600' },
                { label: 'Đang mở bán', count: stats?.event_stats?.published, color: 'green', icon: CheckCircle2, bg: 'bg-green-500/10', text: 'text-green-600' },
                { label: 'Đã hoàn thành', count: stats?.event_stats?.completed, color: 'purple', icon: TrendingUp, bg: 'bg-purple-500/10', text: 'text-purple-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                  <div className="flex items-center space-x-3.5">
                    <div className={`p-2 ${item.bg} rounded-lg border border-gray-200 dark:border-white/5`}>
                      <item.icon className={`w-4 h-4 ${item.text}`} />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 dark:text-zinc-400 uppercase tracking-tight">{item.label}</span>
                  </div>
                  <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>

            <Link to="/admin/events" className="w-full mt-6 py-3.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[9px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-tight hover:bg-neon-green hover:text-black hover:border-neon-green transition-all text-center flex items-center justify-center gap-2 group/link shadow-sm">
                Quản lý sự kiện
                <ChevronRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="bg-gray-900 dark:bg-[#08080a] p-6 rounded-2xl border border-gray-800 dark:border-white/5 relative overflow-hidden group shadow-xl">
            <div className="relative z-10 mb-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Lối tắt quản trị</h3>
              <p className="text-[9px] text-neon-green/60 font-black uppercase tracking-tight mt-1">Truy cập hệ thống nhanh</p>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                {[
                  { to: "/admin/users", icon: Users, label: "Người dùng", color: "neon-green" },
                  { to: "/admin/transactions", icon: Ticket, label: "Vé bán", color: "blue" },
                  { to: "/admin/events", icon: Calendar, label: "Sự kiện", color: "purple" },
                  { to: "/admin/settings", icon: Zap, label: "Cài đặt", color: "orange" }
                ].map((act, i) => (
                  <Link 
                    key={i} 
                    to={act.to} 
                    className="p-4 bg-white/5 hover:bg-neon-green border border-white/10 rounded-xl flex flex-col items-center justify-center gap-2.5 transition-all duration-300 group/btn hover:-translate-y-1"
                  >
                    <act.icon className="w-5 h-5 text-neon-green group-hover/btn:text-black transition-colors" />
                    <span className="text-[9px] font-black text-white group-hover/btn:text-black uppercase tracking-tight text-center leading-none">{act.label}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
};

export default Dashboard;
