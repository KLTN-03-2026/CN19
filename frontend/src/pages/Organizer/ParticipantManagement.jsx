import React, { useState, useEffect } from 'react';
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

        return matchesSearch && matchesTier;
    });

    const stats = {
        total: participants.length,
        checkedIn: participants.filter(p => p.is_used).length,
        pending: participants.filter(p => !p.is_used).length
    };

    const handleExport = () => {
        toast.success('Đang chuẩn bị danh sách để tải về...');
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
                    <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
                        Quản lý người tham gia
                    </h1>
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <p className="text-blue-600 font-bold text-xs ">
                            {eventId ? `Sự kiện: ${currentEvent?.title}` : 'Tất cả sự kiện'}
                        </p>
                    </div>
                </div>
                {/* <button 
                    onClick={handleExport}
                    className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white px-6 py-3 rounded-2xl text-sm font-black shadow-sm transition-all flex items-center uppercase gap-3 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                    <Download className="w-4 h-4" />
                    Xuất danh sách
                </button> */}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Tổng người tham gia', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                    { label: 'Đã soát vé', value: stats.checkedIn, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Chưa soát vé', value: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111114] p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-500 leading-none mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & Table Container */}
            <div className="bg-white dark:bg-[#111114] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 backdrop-blur-xl">
                    <div className="flex flex-col lg:flex-row gap-4 ">
                        <div className="flex-1 relative group border border-gray-200 dark:border-white/5 rounded-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm theo tên, email, mã vé..."
                                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1a1a1e] border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            {/* EVENT FILTER */}
                            <div className="relative flex items-center bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3 min-w-[200px]">
                                <select 
                                    className="bg-transparent border-none focus:outline-none focus:ring-0 font-medium text-sm dark:text-white appearance-none pr-8 cursor-pointer w-full"
                                    value={filterEvent}
                                    onChange={(e) => handleEventFilterChange(e.target.value)}
                                >
                                    <option value="all" className="dark:bg-[#1a1a1e]">Tất cả sự kiện</option>
                                    {myEvents.map(e => (
                                        <option key={e.id} value={e.id} className="dark:bg-[#1a1a1e]">{e.title}</option>
                                    ))}
                                </select>
                            </div>

                            {/* TIER FILTER */}
                            <div className="relative flex items-center bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3">
                                <select 
                                    className="bg-transparent border-none focus:outline-none focus:ring-0 font-medium text-sm dark:text-white appearance-none pr-8 cursor-pointer"
                                    value={filterTier}
                                    onChange={(e) => setFilterTier(e.target.value)}
                                >
                                    <option value="all" className="dark:bg-[#1a1a1e]">Hạng vé: Tất cả</option>
                                    {tiers.filter(t => t !== 'all').map(t => (
                                        <option key={t} value={t} className="dark:bg-[#1a1a1e]">{t}</option>
                                    ))}
                                </select>
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
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/5">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Người tham gia</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Sự kiện</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5 text-center">Hạng vé</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">Mã số vé</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5 text-center">Trạng thái</th>
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
                                            <div className="flex items-center font-mono text-[11px] font-black text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/20 px-3 py-2 rounded-lg w-fit">
                                                <Ticket className="w-3.5 h-3.5 mr-2 text-blue-600" />
                                                #{p.ticket_number?.toUpperCase()}
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
                </div>
            </div>

            {/* Scan Detail Modal */}
            {isModalOpen && selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    
                    <div className="bg-white dark:bg-[#111114] w-full max-w-sm rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
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
