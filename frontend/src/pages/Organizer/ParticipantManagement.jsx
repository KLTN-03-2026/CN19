import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Search, 
  Download, 
  ArrowLeft,
  Mail,
  Phone,
  Ticket,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Calendar,
  Layers,
  Eye,
  X,
  User,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ParticipantManagement = () => {
    const { id: eventId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [participants, setParticipants] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTier, setFilterTier] = useState('all');
    const [filterEvent, setFilterEvent] = useState(eventId || 'all');
    const [filterStatus, setFilterStatus] = useState('all');
    
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchData(isInitialLoading);
    }, [eventId]);

    const fetchData = async (isFirstLoad = false) => {
        try {
            if (isFirstLoad) {
                setIsInitialLoading(true);
            } else {
                setIsFiltering(true);
            }
            
            // Get participants and all events for filtering
            const [participantsRes, eventsRes] = await Promise.all([
                eventId 
                    ? organizerService.getEventParticipants(eventId) 
                    : organizerService.getAllParticipants(),
                organizerService.getMyEvents()
            ]);

            setParticipants(participantsRes.data || []);
            setMyEvents(eventsRes.data || []);
            
            if (eventId) {
                setFilterEvent(eventId);
            }
        } catch (error) {
            console.error('Fetch Participants Error:', error);
            toast.error('Không thể tải danh sách người tham gia.');
        } finally {
            setIsInitialLoading(false);
            setIsFiltering(false);
        }
    };

    // When event filter changes, navigate if needed or just filter locally
    const handleEventFilterChange = (newVal) => {
        if (newVal === 'all') {
            navigate('/organizer/participants');
        } else {
            navigate(`/organizer/events/${newVal}/participants`);
        }
    };

    const tiers = ['all', ...new Set(participants.map(p => p.ticket_tier?.tier_name))];

    const filteredParticipants = participants.filter(p => {
        const matchesSearch = 
            (p.current_owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.current_owner?.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesTier = filterTier === 'all' || p.ticket_tier?.tier_name === filterTier;
        
        const matchesStatus = filterStatus === 'all' || 
            (filterStatus === 'used' && p.is_used) || 
            (filterStatus === 'pending' && !p.is_used);

        return matchesSearch && matchesTier && matchesStatus;
    });

    const stats = {
        total: participants.length,
        checkedIn: participants.filter(p => p.is_used).length,
        pending: participants.filter(p => !p.is_used).length
    };

    const handleExport = () => {
        try {
            toast.loading('Đang chuẩn bị danh sách để tải về...', { id: 'export-toast' });
            
            const dataToExport = filteredParticipants.map((p, index) => ({
                'STT': index + 1,
                'Họ và tên': p.current_owner?.full_name || 'Khách ẩn danh',
                'Email': p.current_owner?.email || 'N/A',
                'Số điện thoại': p.current_owner?.phone_number || 'N/A',
                'Sự kiện': p.event?.title || 'N/A',
                'Hạng vé': p.ticket_tier?.tier_name || 'N/A',
                'Mã vé': p.ticket_number?.toUpperCase() || 'N/A',
                'Trạng thái': p.is_used ? 'Đã soát vé' : 'Chờ tham gia',
                'Thời gian soát vé': p.checked_in_at ? format(new Date(p.checked_in_at), 'dd/MM/yyyy HH:mm:ss') : '---',
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách tham gia');

            // Adjust column widths
            const wscols = [
                { wch: 5 },  // STT
                { wch: 25 }, // Họ và tên
                { wch: 30 }, // Email
                { wch: 15 }, // Số điện thoại
                { wch: 40 }, // Sự kiện
                { wch: 20 }, // Hạng vé
                { wch: 15 }, // Mã vé
                { wch: 15 }, // Trạng thái
                { wch: 20 }, // Thời gian soát vé
            ];
            worksheet['!cols'] = wscols;

            const fileName = `Danh_sach_tham_gia_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            toast.success('Tải danh sách thành công!', { id: 'export-toast' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Có lỗi xảy ra khi xuất danh sách.', { id: 'export-toast' });
        }
    };

    if (isInitialLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang khởi tạo dữ liệu...</p>
            </div>
        );
    }

    const currentEvent = myEvents.find(e => e.id === eventId);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-base md:text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                        Quản lý người tham gia
                    </h1>
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <p className="text-blue-600 font-bold text-xs ">
                            {eventId ? `Sự kiện: ${currentEvent?.title}` : 'Tất cả sự kiện'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={handleExport}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 active:scale-95"
                >
                    Xuất báo cáo
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Tổng người tham gia', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                    { label: 'Đã soát vé', value: stats.checkedIn, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Chưa soát vé', value: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111114] p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shrink-0`}>
                            <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 leading-none mb-1">{stat.label}</p>
                            <p className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Table Container */}
            <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
                {/* Search & Filters */}
                <div className="p-3 md:p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                        {/* Search Bar */}
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm người tham gia..."
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[13px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm h-[48px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* All Filters Group */}
                        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 md:gap-3">
                            {/* EVENT FILTER */}
                            <select 
                                className="px-4 py-2 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[10px] tracking-tight text-gray-700 dark:text-white appearance-none cursor-pointer min-w-[130px] lg:max-w-[160px] shadow-sm h-[48px]"
                                value={filterEvent}
                                onChange={(e) => handleEventFilterChange(e.target.value)}
                            >
                                <option value="all">Tất cả sự kiện</option>
                                {myEvents.map(e => (
                                    <option key={e.id} value={e.id}>{e.title.toUpperCase()}</option>
                                ))}
                            </select>

                            {/* TIER FILTER - Moved to middle */}
                            <select 
                                className="px-4 py-2 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all font-bold text-[10px] tracking-tight text-gray-700 dark:text-white appearance-none cursor-pointer min-w-[140px] shadow-sm h-[48px]"
                                value={filterTier}
                                onChange={(e) => setFilterTier(e.target.value)}
                            >
                                <option value="all">Hạng vé: Tất cả</option>
                                {tiers.filter(t => t !== 'all').map(t => (
                                    <option key={t} value={t}>{t.toUpperCase()}</option>
                                ))}
                            </select>

                            {/* STATUS FILTER */}
                            <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm shrink-0 h-[48px]">
                                {[
                                    { id: 'all', label: 'Tất cả' },
                                    { id: 'used', label: 'Đã soát vé' },
                                    { id: 'pending', label: 'Chờ tham gia' }
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setFilterStatus(s.id)}
                                        className={`px-3 md:px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap h-full ${
                                            filterStatus === s.id
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto relative min-h-[300px]">
                    {/* Local Loading Overlay */}
                    {isFiltering && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-[#111114]/60 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-300">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Đang cập nhật...</span>
                            </div>
                        </div>
                    )}
                    <table className="w-full hidden md:table">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/5">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Người tham gia</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Sự kiện</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Hạng vé</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Mã số vé</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredParticipants.length > 0 ? (
                                filteredParticipants.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-9 h-9 rounded-full bg-blue-600/10 flex items-center justify-center overflow-hidden ring-2 ring-gray-100 dark:ring-white/5">
                                                    {p.current_owner?.avatar_url ? (
                                                        <img src={p.current_owner.avatar_url} alt={p.current_owner.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users className="w-5 h-5 text-blue-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white leading-tight text-xs">
                                                        {p.current_owner?.full_name || 'Khách ẩn danh'}
                                                    </p>
                                                    <div className="flex items-center text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                                        <Mail className="w-2.5 h-2.5 mr-1" />
                                                        {p.current_owner?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[150px]">
                                                <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase line-clamp-2 leading-tight">
                                                    {p.event?.title}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase text-blue-600 border border-gray-100 dark:border-white/5">
                                                {p.ticket_tier?.tier_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <div className="flex items-center font-mono text-[11px] font-black text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/20 px-3 py-2 rounded-lg w-fit">
                                                    <Ticket className="w-3.5 h-3.5 mr-2 text-blue-600" />
                                                    #{p.ticket_number?.toUpperCase()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {p.is_used ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Đã soát vé
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                        <Clock className="w-3 h-3" />
                                                        Chờ tham gia
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {p.is_used && (
                                                <button 
                                                    onClick={() => {
                                                        setSelectedParticipant(p);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-blue-600/10 text-blue-600 rounded-lg transition-all hover:scale-110"
                                                    title="Xem chi tiết soát vé"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <Users className="w-12 h-12 text-gray-200" />
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                                                Không tìm thấy người tham gia nào
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                        {filteredParticipants.length > 0 ? (
                            filteredParticipants.map((p) => (
                                <div key={p.id} className="p-4 space-y-4 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center overflow-hidden ring-2 ring-gray-100 dark:ring-white/5">
                                                {p.current_owner?.avatar_url ? (
                                                    <img src={p.current_owner.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-xs">{p.current_owner?.full_name || 'Khách ẩn danh'}</p>
                                                <p className="text-[9px] text-gray-500 dark:text-gray-400">{p.current_owner?.email}</p>
                                            </div>
                                        </div>
                                        {p.is_used && (
                                            <button 
                                                onClick={() => {
                                                    setSelectedParticipant(p);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-2 bg-blue-600/10 text-blue-600 rounded-lg"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase text-gray-400">Sự kiện & Hạng vé</p>
                                            <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 line-clamp-1">{p.event?.title}</p>
                                            <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded-full text-[8px] font-black text-blue-600 uppercase">
                                                {p.ticket_tier?.tier_name}
                                            </span>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[8px] font-black uppercase text-gray-400">Mã vé & Trạng thái</p>
                                            <p className="text-[10px] font-mono font-black text-gray-500">#{p.ticket_number?.toUpperCase()}</p>
                                            <div className="flex justify-end">
                                                {p.is_used ? (
                                                    <span className="flex items-center gap-1 text-[8px] font-black uppercase text-green-500">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Đã soát
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[8px] font-black uppercase text-yellow-500">
                                                        <Clock className="w-2.5 h-2.5" /> Chờ
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Không có dữ liệu</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scan Detail Modal */}
            {isModalOpen && selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    
                    <div className="bg-white dark:bg-[#111114] w-full max-w-sm rounded-3xl md:rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Chi tiết soát vé</h3>
                                    <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-0.5">Mã vé: #{selectedParticipant.ticket_number}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8">
                            {/* Participant Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-200 dark:border-white/5">
                                <div className="w-14 h-14 rounded-full overflow-hidden ring-4 ring-white dark:ring-white/5 shadow-lg">
                                    {selectedParticipant.current_owner?.avatar_url ? (
                                        <img src={selectedParticipant.current_owner.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                                            {selectedParticipant.current_owner?.full_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 dark:text-white text-base leading-tight uppercase tracking-tight">{selectedParticipant.current_owner?.full_name}</p>
                                    <p className="text-[11px] font-bold text-gray-500 mt-1">{selectedParticipant.current_owner?.email}</p>
                                </div>
                            </div>

                            {/* Scan Details */}
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Thời gian soát vé</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {selectedParticipant.checked_in_at ? format(new Date(selectedParticipant.checked_in_at), 'eeee, dd/MM/yyyy HH:mm:ss', { locale: vi }) : '---'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Nhân viên soát vé</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {selectedParticipant.scan_history?.[0]?.staff?.full_name || 'Hệ thống (Tự động)'}
                                        </p>
                                        <p className="text-[9px] font-bold text-gray-500 mt-0.5">
                                            {selectedParticipant.scan_history?.[0]?.staff?.email || ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-gray-500 dark:text-gray-400 mb-1">Hạng vé & Sự kiện</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{selectedParticipant.ticket_tier?.tier_name}</p>
                                        <p className="text-[9px] font-black text-blue-600 uppercase mt-1 leading-tight">{selectedParticipant.event?.title}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParticipantManagement;
