import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  ChevronRight, 
  User, 
  Calendar, 
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  ArrowUpDown,
  Eye,
  X,
  CreditCard,
  ShoppingBag,
  Tag,
  Wallet,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const OrderManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        gasFee: systemGasFee, 
        eventPlatformFee, 
        eventTransactionFee, 
        productPlatformFee, 
        productTransactionFee 
    } = useSystemConfig();
    const totalEventFee = eventPlatformFee + eventTransactionFee;
    const totalProductFee = productPlatformFee + productTransactionFee;

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [events, setEvents] = useState([]);
    
    const [filters, setFilters] = useState(() => {
        const params = new URLSearchParams(location.search);
        return {
            status: params.get('status') || '',
            is_settled: params.get('is_settled') || '',
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

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const query = new URLSearchParams(filters).toString();
            const response = await api.get(`/organizer/orders?${query}`);
            setOrders(response.data);
            setIsLoading(false);
        } catch (error) {
            toast.error('Không thể tải danh sách đơn hàng.');
            setIsLoading(false);
        }
    };

    const handleViewDetail = (orderId) => {
        navigate(`/organizer/orders/${orderId}`);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [filters]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
            case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-400';
        }
    };

    const handleExport = () => {
        if (orders.length === 0) {
            toast.error("Không có dữ liệu để xuất báo cáo");
            return;
        }

        const reportData = orders.map(order => ({
            "Mã đơn hàng": order.order_number,
            "Khách hàng": order.customer?.full_name || 'N/A',
            "Email": order.customer?.email || 'N/A',
            "Sự kiện": order.event?.title || 'N/A',
            "Số lượng vé": order.order_type === 'TICKET_TRANSFER' ? 1 : order.items?.reduce((s, i) => s + i.quantity, 0) || 0,
            "Tổng tiền (VNĐ)": Math.round(Number(order.total_amount)),
            "Thực nhận (VNĐ)": Math.round(Number(order.organizer_revenue || 0)),
            "Trạng thái": order.status === 'paid' ? 'Đã thanh toán' : order.status === 'pending' ? 'Chờ thanh toán' : 'Đã hủy',
            "Ngày tạo": new Date(order.created_at).toLocaleString('vi-VN')
        }));

        const worksheet = XLSX.utils.json_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo đơn hàng");

        // Tự động căn chỉnh chiều rộng cột
        const wscols = [
            { wch: 22 }, // Mã đơn hàng
            { wch: 25 }, // Khách hàng
            { wch: 30 }, // Email
            { wch: 40 }, // Sự kiện
            { wch: 12 }, // Số lượng vé
            { wch: 18 }, // Tổng tiền
            { wch: 18 }, // Thực nhận
            { wch: 15 }, // Trạng thái
            { wch: 20 }  // Ngày tạo
        ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, `Bao_cao_don_hang_${new Date().getTime()}.xlsx`);
        toast.success("Đã xuất báo cáo Excel thành công!");
    };

    const stats = {
        totalGross: orders.filter(o => o.status === 'paid').reduce((acc, o) => acc + Number(o.total_amount || 0), 0),
        totalNet: orders.filter(o => o.status === 'paid').reduce((acc, o) => acc + Number(o.organizer_revenue || 0), 0),
        paidCount: orders.filter(o => o.status === 'paid').length,
        ticketsCount: orders.filter(o => o.status === 'paid').reduce((acc, o) => acc + (o.items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0)
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header Area */}
            <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Quản lý Đơn hàng</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 font-medium">
                        Theo dõi chi tiết các giao dịch mua vé của khách hàng.
                    </p>
                </div>
                <button 
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-sm active:scale-95"
                    onClick={handleExport}
                >
                    <Download className="w-4 h-4" />
                    Xuất báo cáo
                </button>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Tổng doanh thu', value: `${stats.totalGross.toLocaleString()}đ`, icon: ShoppingCart, color: 'blue', detail: 'Tổng tiền khách trả' },
                    { label: 'Thực nhận về tay', value: `${stats.totalNet.toLocaleString()}đ`, icon: Wallet, color: 'orange', detail: 'Doanh thu sau phí' },
                    { label: 'Vé đã bán', value: stats.ticketsCount, icon: Ticket, color: 'emerald', detail: 'Số lượng vé thực tế' },
                    { label: 'Đơn thành công', value: stats.paidCount, icon: CheckCircle2, color: 'purple', detail: 'Giao dịch hoàn tất' },
                ].map((stat, idx) => {
                    const colors = {
                        blue: 'text-blue-600 bg-blue-600/10 border-blue-600/20 shadow-blue-600/5',
                        orange: 'text-orange-600 bg-orange-600/10 border-orange-600/20 shadow-orange-600/5',
                        emerald: 'text-emerald-600 bg-emerald-600/10 border-emerald-600/20 shadow-emerald-600/5',
                        purple: 'text-purple-600 bg-purple-600/10 border-purple-600/20 shadow-purple-600/5',
                    };
                    
                    return (
                        <div key={idx} className="bg-white dark:bg-[#111114] p-5 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color === 'emerald' ? 'green' : stat.color}-600/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`} />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 ${colors[stat.color]} rounded-xl flex items-center justify-center transition-transform shrink-0 border`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{stat.value}</h2>
                                    <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase opacity-60 leading-none">{stat.detail}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters Bar */}
            <div className="bg-gray-50 dark:bg-[#111114] px-4 py-3 rounded-[1.5rem] border border-gray-200 dark:border-white/5 mb-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text"
                        placeholder="Tìm theo tên khách hàng hoặc mã đơn hàng..."
                        className="w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 outline-none transition-all placeholder:text-gray-400"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                
                <select 
                    className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 cursor-pointer max-w-[200px] font-bold text-gray-700 dark:text-white"
                    value={filters.event_id}
                    onChange={(e) => setFilters({...filters, event_id: e.target.value})}
                >
                    <option value="">Tất cả sự kiện</option>
                    {events.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                </select>

                <select 
                    className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 cursor-pointer font-bold text-gray-700 dark:text-white"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="pending">Chờ thanh toán</option>
                    <option value="cancelled">Đã hủy</option>
                </select>

                <select 
                    className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 cursor-pointer font-bold text-gray-700 dark:text-white"
                    value={filters.is_settled}
                    onChange={(e) => setFilters({...filters, is_settled: e.target.value})}
                >
                    <option value="">Tất cả đối soát</option>
                    <option value="true">Đã vào ví</option>
                    <option value="false">Chờ đối soát</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] font-black uppercase text-gray-600 dark:text-gray-500">
                                <th className="px-6 py-5">Đơn hàng / Khách hàng</th>
                                <th className="px-6 py-5">Sự kiện</th>
                                <th className="px-6 py-5">Số lượng</th>
                                <th className="px-6 py-5">Tổng tiền</th>
                                <th className="px-6 py-5 text-center">Trạng thái</th>
                                <th className="px-6 py-5">Đối soát</th>
                                <th className="px-6 py-5 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-8 h-20 bg-gray-100/50 dark:bg-white/[0.02]"></td>
                                    </tr>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-100/50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                                                    {order.customer?.avatar_url ? (
                                                        <img src={order.customer.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="font-black text-blue-600 dark:text-blue-400 text-[11px] leading-tight">
                                                        #{order.order_number}
                                                    </div>
                                                    <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                        {order.customer?.full_name}
                                                    </div>
                                                    <div className="text-[9px] font-mono font-medium text-gray-500 tracking-tighter opacity-70">
                                                        ID: {order.id.slice(0, 13)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{order.event?.title}</div>
                                            <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1 uppercase font-bold">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(order.event?.event_date), 'dd/MM/yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1 font-bold">
                                                <div className="flex items-center gap-1">
                                                    <Ticket className={`w-3 h-3 ${order.order_type === 'TICKET_TRANSFER' ? 'text-purple-600' : 'text-blue-600'}`} />
                                                    {order.order_type === 'TICKET_TRANSFER' ? (
                                                        <span className="text-purple-600">1 vé (Chuyển nhượng)</span>
                                                    ) : (
                                                        <span>{order.items.reduce((s, i) => s + i.quantity, 0)} vé</span>
                                                    )}
                                                </div>
                                                {order.merchandise_items?.length > 0 && (
                                                    <div className="flex items-center gap-1 text-[10px] text-purple-600">
                                                        <ShoppingBag className="w-3 h-3" />
                                                        + {order.merchandise_items.reduce((s, i) => s + i.quantity, 0)} sản phẩm
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-black text-gray-900 dark:text-white whitespace-nowrap">
                                            {Number(order.total_amount).toLocaleString()}đ
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusStyle(order.status)}`}>
                                                {order.status === 'paid' ? 'Đã thanh toán' : 
                                                 order.status === 'pending' ? 'Chờ xử lý' : 
                                                 order.status === 'cancelled' ? 'Đã hủy' : order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            {order.is_settled ? (
                                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Đã vào ví
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-500 font-bold text-[10px] whitespace-nowrap">
                                                        <Clock className="w-3 h-3" />
                                                        {order.status === 'paid' ? 'Chờ 3 ngày đối soát' : '---'}
                                                    </div>
                                                    {order.status === 'paid' && (
                                                        <div className="text-[9px] text-blue-600 font-black ml-5">
                                                                Ước tính: {Number(order.organizer_revenue || 0).toLocaleString()}đ
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button 
                                                onClick={() => handleViewDetail(order.id)}
                                                className="p-2 hover:bg-blue-600/10 text-blue-600 rounded-lg transition-all group-hover:scale-110"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <AlertCircle className="w-16 h-16 text-gray-200 dark:text-white/5 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-500 font-bold italic">Không tìm thấy đơn hàng nào.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;
