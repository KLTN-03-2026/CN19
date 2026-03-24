import React from 'react';
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
  Wallet
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const StatCard = ({ title, value, change, icon: Icon, isPositive, color }) => (
  <div className="bg-white dark:bg-[#111114] p-6 rounded-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 blur-[50px] -mr-8 -mt-8`}></div>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-black mt-2 text-gray-900 dark:text-white">{value}</h3>
        <div className="flex items-center mt-2 space-x-2">
          <span className={`flex items-center text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {change}
          </span>
          <span className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">so với tuần trước</span>
        </div>
      </div>
      <div className={`p-3 bg-${color}-500/10 rounded-xl`}>
        <Icon className={`w-6 h-6 text-${color}-500`} />
      </div>
    </div>
  </div>
);

const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  
  const stats = [
    { title: 'Doanh thu Sự kiện', value: '12.5 ETH', change: '+15.2%', icon: DollarSign, isPositive: true, color: 'blue' },
    { title: 'Tổng vé đã bán', value: '458', change: '+22.5%', icon: Ticket, isPositive: true, color: 'indigo' },
    { title: 'Tỷ lệ lấp đầy', value: '78%', change: '+5.4%', icon: TrendingUp, isPositive: true, color: 'emerald' },
    { title: 'Sự kiện sắp tới', value: '3', change: 'Trong 7 ngày', icon: Calendar, isPositive: true, color: 'amber' },
  ];

  const myEvents = [
    { id: 1, name: 'Crypto & NFT Workshop 2026', date: '25/03/2026', sold: 120, total: 200, status: 'Active' },
    { id: 2, name: 'Web3 Gaming Night', date: '02/04/2026', sold: 340, total: 500, status: 'Active' },
    { id: 3, name: 'Blockchain Developers Meetup', date: '15/04/2026', sold: 0, total: 150, status: 'Draft' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic underline decoration-blue-600 decoration-4 underline-offset-8 transition-colors">
            Trang chủ BTC
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-4 font-medium italic">
            Chào mừng {user?.full_name}! Chúc bạn một ngày làm việc hiệu quả và bùng nổ doanh số.
          </p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all flex items-center uppercase italic group">
          <PlusCircle className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
          Tạo sự kiện mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: My Events Overview */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900 dark:text-white italic uppercase tracking-tight">Sự kiện đang chạy</h3>
                <button className="text-blue-600 text-xs font-black uppercase hover:underline italic">Tất cả sự kiện</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans">Sự kiện</th>
                    <th className="px-? py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans text-center">Ngày diễn ra</th>
                    <th className="px-? py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans text-center">Tiến độ bán vé</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider font-sans text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {myEvents.map((event, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase">{event.name}</span>
                      </td>
                      <td className="px-? py-5 text-center">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{event.date}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Sắp tới</span>
                        </div>
                      </td>
                      <td className="px-? py-5">
                        <div className="flex flex-col space-y-2">
                             <div className="flex items-center justify-between text-[10px] font-black italic uppercase">
                                <span className="text-blue-600">{event.sold} / {event.total}</span>
                                <span className="text-gray-400">{Math.round((event.sold/event.total)*100)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-1000"
                                    style={{ width: `${(event.sold/event.total)*100}%` }}
                                ></div>
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          event.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {event.status === 'Active' ? 'Đang bán' : 'Bản nháp'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Quick Links */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-[#111114] p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight italic">Thông báo mới</h3>
            <div className="space-y-6">
              {[
                { label: 'Yêu cầu rút tiền thành công', time: '10 phút trước', icon: DollarSign, color: 'green' },
                { label: 'Sự kiện vừa hết vé', time: '1 giờ trước', icon: Activity, color: 'red' },
                { label: 'Đơn hàng mới - TX9021', time: '2 giờ trước', icon: Ticket, color: 'blue' },
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-4 group/item">
                  <div className={`p-2 bg-${item.color}-500/10 rounded-lg group-hover/item:scale-110 transition-transform`}>
                    <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white">{item.label}</span>
                    <span className="text-[10px] text-gray-400 font-bold italic uppercase">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all italic">
                Xem tất cả thông báo
            </button>
          </div>

          {/* Quick Action Cards */}
          <div className="bg-gradient-to-br from-[#111114] to-black p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <LayoutDashboard className="w-24 h-24 text-blue-500" />
            </div>
            <h3 className="text-lg font-black text-white mb-6 uppercase italic tracking-tight">Thao tác nhanh</h3>
            <div className="space-y-3 relative z-10">
                <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center space-x-4 transition-all group/btn">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover/btn:scale-110 transition-all">
                        <PlusCircle className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-xs font-black text-white uppercase italic">Tạo sự kiện mới</span>
                </button>
                <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center space-x-4 transition-all group/btn">
                    <div className="p-2 bg-indigo-500/20 rounded-lg group-hover/btn:scale-110 transition-all">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="text-xs font-black text-white uppercase italic">Quản lý sự kiện</span>
                </button>
                <button className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center space-x-4 transition-all group/btn">
                    <div className="p-2 bg-emerald-500/20 rounded-lg group-hover/btn:scale-110 transition-all">
                        <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-black text-white uppercase italic">Yêu cầu rút tiền</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
