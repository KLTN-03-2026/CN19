import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart4, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  PieChart as PieIcon,
  Download,
  Filter,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Zap,
  ShoppingBag,
  Activity,
  ArrowRightLeft,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const AdminReports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30days');

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/analytics');
            setData(res.data.data);
        } catch (error) {
            toast.error('Không thể tải báo cáo phân tích');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-neon-green/10 border-t-neon-green rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-tight animate-pulse">Đang tổng hợp dữ liệu báo cáo...</p>
            </div>
        );
    }

    const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899'];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase">
                                {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('tiền') ? formatCurrency(entry.value) : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 tracking-tight pb-10">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 uppercase">
                        <BarChart4 className="w-6 h-6 text-neon-green" />
                        THỐNG KÊ & BÁO CÁO CHI TIẾT
                    </h1>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-500 mt-1 font-bold uppercase tracking-tight">Phân tích toàn diện doanh thu, sự kiện và tăng trưởng người dùng</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-zinc-900/50 p-1 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        {['7days', '30days', '90days'].map(range => (
                            <button 
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${dateRange === range ? 'bg-neon-green text-black shadow-md' : 'text-slate-500 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {range === '7days' ? '7 Ngày' : range === '30days' ? '30 Ngày' : '90 Ngày'}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-black uppercase hover:bg-neon-green hover:text-black dark:hover:bg-neon-green transition-all shadow-lg active:scale-95">
                        <Download className="w-3.5 h-3.5" />
                        Xuất báo cáo (PDF)
                    </button>
                </div>
            </div>

            {/* Top 4 Stats - REAL DATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tăng trưởng User', value: `${data?.user_growth?.reduce((a,b)=>a+b._count.id, 0)}`, sub: 'Tổng người dùng hệ thống', icon: Users, color: 'green' },
                    { label: 'Tỉ lệ xác thực KYC', value: `${data?.kyc_ratio}%`, sub: 'Người dùng đã xác thực danh tính', icon: ShieldCheck, color: 'blue' },
                    { label: 'Doanh thu thu sàn', value: formatCurrency(data?.financial_outflow?._sum?.fee_amount), sub: 'Hoa hồng & Phí rút', icon: DollarSign, color: 'purple' },
                    { label: 'Sự kiện hoạt động', value: `${data?.total_events_count}`, sub: 'Đang mở bán công khai', icon: Calendar, color: 'orange' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900/40 p-6 rounded-[2rem] border border-gray-200 dark:border-white/5 relative overflow-hidden group shadow-sm transition-all hover:border-neon-green/30">
                        <div className={`absolute -right-4 -top-4 w-20 h-20 bg-${stat.color}-500/5 blur-2xl group-hover:bg-${stat.color}-500/10 transition-all duration-700`}></div>
                        <div className="relative z-10 flex items-center gap-5">
                            <div className={`p-3 bg-${stat.color}-500/10 rounded-2xl border border-${stat.color}-500/20`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-tight leading-none">{stat.label}</p>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase opacity-80">{stat.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. Phân bổ sự kiện - Pie Chart */}
                <div className="lg:col-span-5 bg-white dark:bg-zinc-900/40 p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-neon-green" />
                            Phân loại sự kiện
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.event_by_category || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="count"
                                >
                                    {data?.event_by_category?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Hiệu suất bán vé - Progress Bars */}
                <div className="lg:col-span-7 bg-white dark:bg-zinc-900/40 p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm flex flex-col">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Top hiệu suất bán vé
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight italic">Xếp hạng theo % lấp đầy</span>
                    </div>
                    <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar max-h-[300px] pr-2">
                        {data?.ticket_stats?.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-gray-800 dark:text-white uppercase tracking-tight line-clamp-1">{item.name}</span>
                                    <span className="text-[11px] font-black text-neon-green">{item.ratio}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-neon-green transition-all duration-1000"
                                        style={{ width: `${item.ratio}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase opacity-70">
                                    <span>Đã bán: {item.sold}</span>
                                    <span>Tổng: {item.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Tỉ lệ vai trò người dùng - Bar Chart */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900/40 p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Vai trò User
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.user_growth || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.05} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="role" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#888', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }} 
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="_count.id" radius={[0, 10, 10, 0]} barSize={35}>
                                    {data?.user_growth?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.role === 'admin' ? '#ef4444' : entry.role === 'organizer' ? '#a855f7' : '#22c55e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Doanh thu theo phương thức - Dark Card Style */}
                <div className="lg:col-span-8 bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-all duration-700">
                        <CreditCard className="w-64 h-64 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="mb-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-neon-green" />
                                Nạp tiền vào hệ thống
                            </h3>
                            <p className="text-[10px] text-white/40 font-black uppercase mt-1">Phân tích theo phương thức thanh toán</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                            {data?.payment_methods?.map((pm, i) => (
                                <div key={i} className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                    <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center border border-neon-green/20">
                                        <TrendingUp className="w-6 h-6 text-neon-green" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{pm.method === 'vnpay' ? 'VNPay' : pm.method}</span>
                                        <p className="text-lg font-black text-white tracking-tight">{formatCurrency(pm._sum.amount)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. Dòng tiền ra & Phí thu được */}
                <div className="lg:col-span-6 bg-white dark:bg-zinc-900/40 p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-red-500" />
                        Luồng tiền ra (Outflow)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase block">Tổng giải ngân thành công</span>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(data?.financial_outflow?._sum?.net_amount)}</span>
                                <div className="p-1.5 bg-red-500/10 rounded-lg">
                                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 md:pl-8">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Phí rút thu sàn</span>
                                <span className="text-sm font-black text-blue-500">{formatCurrency(data?.financial_outflow?._sum?.fee_amount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Thuế & Phí khác</span>
                                <span className="text-sm font-black text-slate-400">-{formatCurrency(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Thống kê sàn & Marketplace */}
                <div className="lg:col-span-6 bg-white dark:bg-zinc-900/40 p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                        Giao dịch sàn nâng cao
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">Tỉ lệ KYC User</span>
                            <p className="text-3xl font-black text-neon-green tracking-tighter">{data?.kyc_ratio}%</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Dữ liệu thực tế</p>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <span className="text-[10px] font-black text-slate-500 uppercase block mb-2">Vật phẩm (Merch)</span>
                            <p className="text-3xl font-black text-purple-500 tracking-tighter">{data?.total_merch_sold}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Đã bán ra</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="p-6 bg-white dark:bg-zinc-900/40 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-neon-green animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Dữ liệu phân tích cập nhật từ cơ sở dữ liệu thời gian thực</span>
                </div>
                <div className="flex gap-3">
                    <Link to="/admin/dashboard" className="px-6 py-3 bg-gray-100 dark:bg-zinc-800 text-slate-700 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase hover:bg-neon-green hover:text-black transition-all">
                        Về Dashboard
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default AdminReports;
