import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  User, 
  Calendar, 
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  UserCheck,
  Tag,
  Send,
  ShoppingBag,
  ArrowLeftRight,
  ShoppingCart,
  Wallet,
  Eye,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { useNavigate, useLocation } from 'react-router-dom';

const MarketplaceManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { gasFee } = useSystemConfig();
    const [activeTab, setActiveTab] = useState('resale'); // 'resale' or 'direct'
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState([]);

    const [filters, setFilters] = useState(() => {
        const params = new URLSearchParams(location.search);
        return {
            event_id: params.get('event_id') || '',
            search: params.get('search') || ''
        };
    });


    const fetchEvents = async () => {
        try {
            const response = await api.get('/organizer/events');
            setEvents(response.data.data);
        } catch (error) {
            console.error('Không thể tải danh sách sự kiện.');
        }
    };

    const fetchTransactions = async () => {
        try {
            setIsLoading(true);
            const endpoint = activeTab === 'resale' ? '/organizer/orders/marketplace' : '/organizer/orders/transfers';
            const query = new URLSearchParams(filters).toString();
            const response = await api.get(`${endpoint}?${query}`);
            setTransactions(response.data);
            setIsLoading(false);
        } catch (error) {
            toast.error('Không thể tải danh sách giao dịch.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 300);
        return () => clearTimeout(timer);
    }, [filters, activeTab]);

    const handleViewDetail = (tx) => {
        navigate(`/organizer/marketplace/${activeTab}/${tx.id}`);
    };

    // Thống kê nhanh dựa trên Tab
    const stats = {
        totalRoyalty: activeTab === 'resale' 
            ? transactions.reduce((sum, tx) => sum + Number(tx.royalty_amount || 0), 0)
            : transactions.reduce((sum, tx) => sum + gasFee, 0), // Phí gas mỗi lần chuyển
        totalVolume: activeTab === 'resale'
            ? transactions.reduce((sum, tx) => sum + Number(tx.resale_price || 0), 0)
            : 0,
        totalCount: transactions.length
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header Area */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase leading-none">Quản lý Marketplace</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-[13px] mt-1.5 font-medium">
                        Theo dõi biến động sở hữu vé qua các giao dịch mua bán lại và chuyển nhượng trực tiếp.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-sm active:scale-95"
                        onClick={() => toast.success('Tính năng báo cáo đang được chuẩn bị')}
                    >
                        <Download className="w-4 h-4" />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
                {[
                    { 
                        label: activeTab === 'resale' ? 'Tổng hoa hồng (Royalty)' : 'Phí hệ thống thu về', 
                        value: `${stats.totalRoyalty.toLocaleString()}đ`, 
                        icon: Wallet, 
                        color: 'blue', 
                        detail: 'Doanh thu thụ động' 
                    },
                    { 
                        label: 'Tổng giá trị giao dịch', 
                        value: `${stats.totalVolume.toLocaleString()}đ`, 
                        icon: ShoppingCart, 
                        color: 'purple', 
                        detail: 'Khối lượng giao dịch sàn',
                        hide: activeTab !== 'resale'
                    },
                    { 
                        label: 'Lượt đổi chủ vé', 
                        value: stats.totalCount, 
                        icon: Ticket, 
                        color: 'orange', 
                        detail: 'Số lần chuyển nhượng' 
                    },
                ].filter(s => !s.hide).map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111114] p-5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-600/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 bg-${stat.color}-600/10 rounded-xl flex items-center justify-center transition-transform shrink-0`}>
                                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                                </div>
                                <p className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase">{stat.label}</p>
                            </div>
                            <div className="flex items-end justify-between">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</h2>
                                <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase opacity-60 leading-none">{stat.detail}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Tabs */}
            <div className="flex items-center p-1.5 bg-gray-100/50 dark:bg-white/5 rounded-2xl mb-2 w-full sm:w-fit">
                <button 
                    onClick={() => setActiveTab('resale')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'resale' ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Mua bán Marketplace
                </button>
                <button 
                    onClick={() => setActiveTab('direct')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'direct' ? 'bg-white dark:bg-white/10 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    <ArrowLeftRight className="w-4 h-4" />
                    Chuyển nhượng trực tiếp
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text"
                        placeholder="Tìm mã giao dịch, vé, người dùng..."
                        className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 outline-none transition-all placeholder-gray-600 dark:placeholder-gray-400"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                
                <select 
                    className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-sm outline-none focus:border-blue-600 cursor-pointer font-bold sm:min-w-[200px]"
                    value={filters.event_id}
                    onChange={(e) => setFilters({...filters, event_id: e.target.value})}
                >
                    <option value="">Tất cả sự kiện</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                </select>
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-white/5 text-[10px] font-black uppercase text-gray-500">
                                <th className="px-6 py-5">Giao dịch / Vé</th>
                                <th className="px-6 py-5">Sự kiện & Hạng vé</th>
                                <th className="px-6 py-5">Người bán/Chuyển</th>
                                <th className="px-6 py-5">Người mua/Nhận</th>
                                {activeTab === 'resale' && <th className="px-6 py-5 text-right">Giá bán lại</th>}
                                <th className="px-6 py-5 text-right text-blue-600">Hoa hồng BTC</th>
                                <th className="px-6 py-5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {!isLoading && transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="font-black text-blue-600 dark:text-blue-400 text-[11px] leading-tight uppercase mb-1">
                                                    #{tx.transaction_number || tx.id.slice(0,8).toUpperCase()}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                                                    <Ticket className="w-3.5 h-3.5 text-gray-400" />
                                                    {tx.ticket_number}
                                                </div>
                                                <div className="text-[9px] text-gray-500 mt-1.5 flex items-center gap-1 font-black uppercase">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] mb-1.5 uppercase leading-tight" title={tx.event_title}>
                                                {tx.event_title}
                                            </div>
                                            <div className="font-black text-[10px] text-blue-600 dark:text-blue-400 uppercase italic">
                                                {tx.tier_name}
                                            </div>
                                            
                                            {tx.merchandise_items?.length > 0 && (
                                                <div className="mt-2.5 flex flex-wrap gap-1">
                                                    {tx.merchandise_items.map((m, idx) => (
                                                        <div key={idx} className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shadow-sm">
                                                            <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" />
                                                            <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase">
                                                                {m.merchandise?.name} (x{m.quantity})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 overflow-hidden">
                                                    {tx.sender?.avatar_url || tx.seller?.avatar_url ? (
                                                        <img src={tx.sender?.avatar_url || tx.seller?.avatar_url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-orange-600" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black text-gray-900 dark:text-white truncate">{tx.sender?.full_name || tx.seller?.full_name}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold truncate opacity-70">{tx.sender?.email || tx.seller?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20 overflow-hidden">
                                                    {tx.buyer?.avatar_url || tx.receiver?.avatar_url ? (
                                                        <img src={tx.buyer?.avatar_url || tx.receiver?.avatar_url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <UserCheck className="w-4 h-4 text-green-600" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black text-gray-900 dark:text-white truncate">{tx.buyer?.full_name || tx.receiver?.full_name}</span>
                                                    <span className="text-[10px] text-gray-500 font-bold truncate opacity-70">{tx.buyer?.email || tx.receiver?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {activeTab === 'resale' && (
                                            <td className="px-6 py-5 text-right font-black text-gray-900 dark:text-white">
                                                {Number(tx.resale_price).toLocaleString()}đ
                                            </td>
                                        )}
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                                +{Number(activeTab === 'resale' ? tx.royalty_amount : tx.fee_amount).toLocaleString()}đ
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button 
                                                onClick={() => handleViewDetail(tx)}
                                                className="p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : !isLoading && (
                                <tr>
                                    <td colSpan={activeTab === 'resale' ? 7 : 6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <ShoppingCart className="w-12 h-12" />
                                            <p className="text-sm font-black uppercase">Không có giao dịch</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile View Card List */}
            <div className="md:hidden space-y-4 mb-10">
                {isLoading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-100 dark:bg-white/5 rounded-3xl animate-pulse" />)
                ) : transactions.length > 0 ? (
                    transactions.map((tx) => (
                        <div key={tx.id} onClick={() => handleViewDetail(tx)} className="bg-white dark:bg-[#111114] p-5 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm active:scale-[0.98] transition-transform">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-blue-600 uppercase leading-none">
                                        #{tx.transaction_number || tx.id.slice(0,8).toUpperCase()}
                                    </span>
                                    <h3 className="font-black text-gray-900 dark:text-white uppercase leading-tight line-clamp-1">{tx.event_title}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                                        +{Number(activeTab === 'resale' ? tx.royalty_amount : tx.fee_amount).toLocaleString()}đ
                                    </span>
                                    <p className="text-[8px] font-black text-gray-400 uppercase">Doanh thu BTC</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200 dark:border-white/5 mb-4">
                                <div>
                                    <p className="text-[8px] font-black text-gray-600 dark:text-gray-500 uppercase mb-1.5">Bên chuyển</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 shrink-0 flex items-center justify-center overflow-hidden">
                                            {tx.sender?.avatar_url || tx.seller?.avatar_url ? (
                                                <img src={tx.sender?.avatar_url || tx.seller?.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <User className="w-3.5 h-3.5 text-orange-600" />
                                            )}
                                        </div>
                                        <span className="text-[11px] font-black text-gray-900 dark:text-white truncate">{tx.sender?.full_name || tx.seller?.full_name}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-600 dark:text-gray-500 uppercase mb-1.5">Bên nhận</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 shrink-0 flex items-center justify-center overflow-hidden">
                                            {tx.buyer?.avatar_url || tx.receiver?.avatar_url ? (
                                                <img src={tx.buyer?.avatar_url || tx.receiver?.avatar_url} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <UserCheck className="w-3.5 h-3.5 text-green-600" />
                                            )}
                                        </div>
                                        <span className="text-[11px] font-black text-gray-900 dark:text-white truncate">{tx.buyer?.full_name || tx.receiver?.full_name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase">
                                        <Ticket className="w-3 h-3" />
                                        {tx.ticket_number}
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-500 italic mt-0.5">{tx.tier_name}</span>
                                </div>
                                <button className="px-5 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-xl text-[9px] font-black uppercase active:scale-90 transition-transform">
                                    Chi tiết
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-10 text-center opacity-30">
                        <ShoppingCart className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-xs font-black uppercase">Trống</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketplaceManagement;
