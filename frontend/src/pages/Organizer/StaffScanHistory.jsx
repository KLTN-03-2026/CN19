import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    History, 
    Ticket, 
    ShoppingBag, 
    User, 
    Clock, 
    CheckCircle2, 
    ShieldOff,
    Search,
    Filter,
    Calendar,
    ChevronRight,
    MapPin
} from 'lucide-react';
import { staffService } from '../../services/staff.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const StaffScanHistory = () => {
    const { id, eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState([]);
    const [staffInfo, setStaffInfo] = useState(null);
    const [eventInfo, setEventInfo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // ALL, TICKET, MERCHANDISE

    useEffect(() => {
        fetchData();
    }, [id, eventId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [historyRes, staffRes] = await Promise.all([
                staffService.getStaffScanHistory(id, eventId),
                staffService.getStaffDetail(id)
            ]);
            setHistory(historyRes.data);
            setEventInfo(historyRes.event);
            setStaffInfo(staffRes.data.staff);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Không thể tải dữ liệu lịch sử');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        try {
            const dataToExport = history.map(item => ({
                'Hoạt động': item.item_name,
                'Loại': item.type === 'TICKET' ? 'Vé' : 'Vật phẩm',
                'Khách hàng': item.customer_name,
                'Email': item.customer_email,
                'Thời gian': format(new Date(item.scanned_at), 'HH:mm:ss dd/MM/yyyy'),
                'Trạng thái': item.is_success ? 'Thành công' : `Thất bại (${item.failure_reason || ''})`
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử quét');
            
            const fileName = `LichSuQuet_${staffInfo?.full_name?.replace(/\s+/g, '_')}_${eventInfo?.title?.replace(/\s+/g, '_')}.xlsx`;
            XLSX.writeFile(wb, fileName);
            toast.success('Đã xuất báo cáo thành công');
        } catch (error) {
            console.error('Export Error:', error);
            toast.error('Có lỗi khi xuất báo cáo');
        }
    };

    const filteredHistory = history.filter(item => {
        const matchesSearch = 
            item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const stats = {
        total: history.length,
        tickets: history.filter(h => h.type === 'TICKET' && h.is_success).length,
        merch: history.filter(h => h.type === 'MERCHANDISE' && h.is_success).length,
        failed: history.filter(h => !h.is_success).length
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-2xl hover:scale-110 transition-all active:scale-90 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase">
                                {eventInfo?.title}
                            </h1>
                            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black">
                                {stats.total} Hoạt động
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5">
                                <User className="w-3 h-3" />
                                Nhân viên: {staffInfo?.full_name}
                            </p>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/10" />
                            <p className="text-[11px] font-bold text-gray-600 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Lịch sử quét chi tiết
                            </p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={exportToExcel}
                    className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <History className="w-4 h-4" />
                    Xuất báo cáo Excel
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Tổng lượt quét', value: stats.total, icon: History, color: 'blue' },
                    { label: 'Vé thành công', value: stats.tickets, icon: Ticket, color: 'emerald' },
                    { label: 'Vật phẩm đã giao', value: stats.merch, icon: ShoppingBag, color: 'indigo' },
                    { label: 'Lượt lỗi/Hủy', value: stats.failed, icon: ShieldOff, color: 'red' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#111114] p-3 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-sm flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">{stat.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-[#111114] p-3 rounded-[1.5rem] border border-gray-200 dark:border-white/5 shadow-xl flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm khách hàng, tên vé hoặc sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-none rounded-xl py-3 pl-12 pr-6 text-[13px] font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600/20 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {['ALL', 'TICKET', 'MERCHANDISE'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2.5 rounded-lg text-[10px] font-black transition-all shrink-0 ${
                                filterType === type 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            {type === 'ALL' ? 'Tất cả' : type === 'TICKET' ? 'Vé sự kiện' : 'Vật phẩm'}
                        </button>
                    ))}
                </div>
            </div>

            {/* History List */}
            <div className="bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase">Hoạt động</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase">Loại</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase">Khách hàng</th>
                                <th className="px-6 py-4 text-left text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase">Thời gian</th>
                                <th className="px-6 py-4 text-center text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredHistory.map((item) => (
                                <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center ${
                                                item.type === 'TICKET' 
                                                    ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-100 dark:border-blue-600/20 text-blue-600' 
                                                    : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10'
                                            }`}>
                                                {item.type === 'TICKET' ? (
                                                    <Ticket className="w-5 h-5" />
                                                ) : (
                                                    item.item_image ? (
                                                        <img src={item.item_image} alt={item.item_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="w-5 h-5 text-indigo-600" />
                                                    )
                                                )}
                                            </div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase">
                                                {item.item_name}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase ${
                                            item.type === 'TICKET' 
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' 
                                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-600 dark:text-white'
                                        }`}>
                                            {item.type === 'TICKET' ? 'VÉ' : 'VẬT PHẨM'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10">
                                                {item.customer_avatar ? (
                                                    <img src={item.customer_avatar} alt={item.customer_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-black text-gray-400 uppercase">{item.customer_name[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-[12px] font-black text-gray-900 dark:text-white truncate">{item.customer_name}</p>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">{item.customer_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[12px] font-black text-gray-900 dark:text-white">
                                                {format(new Date(item.scanned_at), 'HH:mm:ss')}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                                                {format(new Date(item.scanned_at), 'dd/MM/yyyy')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${
                                                item.is_success 
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' 
                                                    : 'bg-red-500/10 text-red-600 dark:text-red-500'
                                            }`}>
                                                {item.is_success ? (
                                                    <><CheckCircle2 className="w-3.5 h-3.5" /> Thành công</>
                                                ) : (
                                                    <><ShieldOff className="w-3.5 h-3.5" /> Thất bại</>
                                                )}
                                            </div>
                                            {!item.is_success && item.failure_reason && (
                                                <p className="text-[8px] font-bold text-red-500 dark:text-red-400 uppercase max-w-[120px] text-center">
                                                    {item.failure_reason}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400 mb-3">
                                            <Search className="w-6 h-6" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Không tìm thấy hoạt động nào phù hợp</p>
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

export default StaffScanHistory;
