import React from 'react';
import { 
  Users, 
  Calendar, 
  Ticket, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield
} from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, isPositive, color }) => (
  <div className="bg-white dark:bg-[#111114] p-6 rounded-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden group hover:shadow-xl hover:shadow-neon-green/5 transition-all duration-300">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 blur-[50px] -mr-8 -mt-8 group-hover:bg-${color}-500/20 transition-all`}></div>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-black mt-2 text-gray-900 dark:text-white">{value}</h3>
        <div className="flex items-center mt-2 space-x-2">
          <span className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </span>
          <span className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">so với tháng trước</span>
        </div>
      </div>
      <div className={`p-3 bg-${color}-500/10 rounded-xl`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const stats = [
    { title: 'Tổng Doanh thu', value: '45.2 ETH', change: '+12.5%', icon: DollarSign, isPositive: true, color: 'blue' },
    { title: 'Vé đã bán', value: '1,284', change: '+8.2%', icon: Ticket, isPositive: true, color: 'green' },
    { title: 'Người dùng mới', value: '342', change: '-2.4%', icon: Users, isPositive: false, color: 'purple' },
    { title: 'Sự kiện Đang diễn ra', value: '24', change: '+4', icon: Calendar, isPositive: true, color: 'orange' },
  ];

  const recentTransactions = [
    { id: 'TX-9021', user: 'Nguyễn Văn A', amount: '0.5 ETH', status: 'Success', time: '2 phút trước' },
    { id: 'TX-9022', user: 'Trần Thị B', amount: '1.2 ETH', status: 'Pending', time: '15 phút trước' },
    { id: 'TX-9023', user: 'Lê Văn C', amount: '0.8 ETH', status: 'Success', time: '1 giờ trước' },
    { id: 'TX-9024', user: 'Phạm Minh D', amount: '2.1 ETH', status: 'Failed', time: '3 giờ trước' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">DASHBOARD</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Chào mừng trở lại, Super Admin! Hệ thống đang hoạt động ổn định.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            Lịch sử hoạt động
          </button>
          <button className="bg-neon-green text-black px-4 py-2 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(82,196,45,0.3)] hover:shadow-[0_0_25px_rgba(82,196,45,0.5)] transition-all flex items-center uppercase italic">
            <Activity className="w-4 h-4 mr-2" />
            Báo cáo chi tiết
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visualizations area (Mocking with Tailwind) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl border border-gray-100 dark:border-white/5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white italic">TỔNG QUAN DOANH THU</h3>
                <p className="text-sm text-gray-500 font-medium">Thống kê 7 ngày gần nhất</p>
              </div>
              <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg bg-white dark:bg-white/10 shadow-sm transition-all italic">Ngày</button>
                <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all italic">Tháng</button>
              </div>
            </div>
            
            {/* Mock Chart using Tailwind Bars */}
            <div className="h-[250px] flex items-end justify-between gap-2 px-4 relative">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-20">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-dashed border-gray-400 dark:border-white"></div>
                ))}
              </div>
              
              {[65, 45, 85, 30, 95, 60, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group/bar relative z-10">
                  <div 
                    className="w-full max-w-[40px] bg-gradient-to-t from-neon-green to-neon-green/30 rounded-t-lg transition-all duration-500 group-hover/bar:brightness-125 relative group"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-neon-green px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap border border-neon-green/30">
                      {h * 10} VNĐ
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-tighter">Ngày {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 dark:text-white italic uppercase tracking-tight">Hoạt động gần đây</h3>
                <button className="text-neon-green text-xs font-black uppercase hover:underline italic">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Mã GD</th>
                    <th className="px-? py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Khách hàng</th>
                    <th className="px-? py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Số tiền</th>
                    <th className="px-? py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Trạng thái</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {recentTransactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5 text-sm font-bold text-gray-900 dark:text-white">{tx.id}</td>
                      <td className="px-? py-5">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green font-bold text-[10px]">
                                {tx.user.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{tx.user}</span>
                        </div>
                      </td>
                      <td className="px-? py-5 text-sm font-black text-gray-900 dark:text-white uppercase italic">{tx.amount}</td>
                      <td className="px-? py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          tx.status === 'Success' ? 'bg-green-500/10 text-green-500' :
                          tx.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right text-xs text-gray-500 dark:text-gray-400 font-medium italic">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Details/Activities */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl border border-gray-100 dark:border-white/5 relative group">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight italic">Trạng thái Duyệt sự kiện</h3>
            <div className="space-y-6">
              {[
                { label: 'Yêu cầu mới', count: 12, color: 'blue', icon: AlertCircle },
                { label: 'Đang triển khai', count: 45, color: 'green', icon: CheckCircle2 },
                { label: 'Đã hoàn thành', count: 128, color: 'purple', icon: TrendingUp },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between group/item">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 bg-${item.color}-500/10 rounded-lg group-hover/item:scale-110 transition-transform`}>
                      <item.icon className="w-4 h-4 text-neon-green" />
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 group-hover/item:text-gray-900 dark:group-hover/item:text-white transition-colors">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neon-green hover:text-black transition-all italic">
                Quản lý Sự kiện
            </button>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-[#111114] to-black p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <Shield className="w-24 h-24 text-neon-green" />
            </div>
            <h3 className="text-lg font-black text-white mb-4 uppercase italic">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-3 relative z-10">
                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all group/btn">
                    <Users className="w-5 h-5 text-neon-green group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-white uppercase italic">Người dùng</span>
                </button>
                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all group/btn">
                    <Ticket className="w-5 h-5 text-neon-green group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-white uppercase italic">Vé bán</span>
                </button>
                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all group/btn">
                    <Calendar className="w-5 h-5 text-neon-green group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-white uppercase italic">Sự kiện</span>
                </button>
                <button className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all group/btn">
                    <Activity className="w-5 h-5 text-neon-green group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-white uppercase italic">Cấu hình</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
