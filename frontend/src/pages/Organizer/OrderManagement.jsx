import React, { useState, useEffect } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const OrderManagement = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        is_settled: '',
        search: ''
    });

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

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300">
            {/* Header Area */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Quản lý Đơn hàng</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Theo dõi chi tiết các giao dịch mua vé của khách hàng.
                    </p>
                </div>
                <button 
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 text-sm"
                    onClick={() => toast.success('Tính năng xuất file đang được phát triển')}
                >
                    <Download className="w-4 h-4" />
                    Xuất CSV
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-gray-50 dark:bg-[#111114] p-4 rounded-[2rem] border border-gray-100 dark:border-white/5 mb-8 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Tìm theo tên khách hàng hoặc mã đơn hàng..."
                        className="w-full bg-white dark:bg-zinc-950 border border-gray-100 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 outline-none transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                
                <select 
                    className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 cursor-pointer"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="pending">Chờ thanh toán</option>
                    <option value="cancelled">Đã hủy</option>
                </select>

                <select 
                    className="bg-white dark:bg-zinc-950 border border-gray-100 dark:border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 cursor-pointer"
                    value={filters.is_settled}
                    onChange={(e) => setFilters({...filters, is_settled: e.target.value})}
                >
                    <option value="">Tất cả đối soát</option>
                    <option value="true">Đã vào ví</option>
                    <option value="false">Chờ đối soát</option>
                </select>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                <th className="px-8 py-5">Đơn hàng / Khách hàng</th>
                                <th className="px-8 py-5">Sự kiện</th>
                                <th className="px-8 py-5">Số lượng</th>
                                <th className="px-8 py-5">Tổng tiền</th>
                                <th className="px-8 py-5 text-center">Trạng thái</th>
                                <th className="px-8 py-5">Đối soát</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-8 h-20 bg-gray-50/50 dark:bg-white/[0.02]"></td>
                                    </tr>
                                ))
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center">
                                                    {order.customer?.avatar_url ? (
                                                        <img src={order.customer.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                                    ) : (
                                                        <User className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        #{order.order_number}
                                                        <span className="text-[10px] font-medium text-gray-400 font-mono tracking-tighter">({order.id.slice(0, 8)})</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{order.customer?.full_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{order.event?.title}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 uppercase font-bold">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(order.event?.event_date), 'dd/MM/yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-1 font-bold">
                                                <Ticket className="w-4 h-4 text-blue-600" />
                                                {order.items.reduce((s, i) => s + i.quantity, 0)} vé
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-black text-gray-900 dark:text-white">
                                            {Number(order.total_amount).toLocaleString()}đ
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getStatusStyle(order.status)}`}>
                                                {order.status === 'paid' ? 'Đã thanh toán' : 
                                                 order.status === 'pending' ? 'Chờ xử lý' : 
                                                 order.status === 'cancelled' ? 'Đã hủy' : order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            {order.is_settled ? (
                                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Đã vào ví
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 font-bold text-xs">
                                                    <Clock className="w-4 h-4" />
                                                    {order.status === 'paid' ? 'Chờ 3 ngày' : '---'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center">
                                        <AlertCircle className="w-16 h-16 text-gray-100 dark:text-white/5 mx-auto mb-4" />
                                        <p className="text-gray-400 dark:text-gray-500 font-bold italic">Không tìm thấy đơn hàng nào.</p>
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
