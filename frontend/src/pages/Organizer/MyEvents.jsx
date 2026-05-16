import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Ticket, 
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  ChevronRight,
  AlertTriangle,
  LayoutGrid,
  List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import EmergencyActionModal from '../../components/Organizer/EmergencyActionModal';

const MyEvents = () => {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const navigate = useNavigate();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setIsLoading(true);
            const [eventsRes, catsRes] = await Promise.all([
                organizerService.getMyEvents(),
                organizerService.getCategories()
            ]);
            setEvents(eventsRes.data);
            setCategories(catsRes.data || []);
        } catch (error) {
            toast.error('Không thể tải dữ liệu.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setFilterCategory('all');
        setFilterDate('');
        toast.success('Đã xóa tất cả bộ lọc');
    };

    const handleEmergencyAction = async (data) => {
        if (!selectedEvent) return;
        try {
            await organizerService.requestEmergencyAction(selectedEvent.id, data);
            toast.success('Gửi yêu cầu xử lý khẩn cấp thành công!');
            setIsEmergencyModalOpen(false);
            fetchInitialData(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.error || 'Đã xảy ra lỗi.');
            throw err;
        }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này không?')) return;
        
        try {
            await organizerService.deleteEvent(eventId);
            toast.success('Đã xóa sự kiện thành công.');
            setEvents(events.filter(e => e.id !== eventId));
        } catch (error) {
            toast.error(error.response?.data?.error || 'Không thể xóa sự kiện.');
        }
    };

    const getStatusInfo = (status, event) => {
        if (status === 'settled') return { label: 'Đã quyết toán', color: 'bg-emerald-600 text-white', icon: CheckCircle2 };
        if (status === 'cancelled') return { label: 'Đã hủy', color: 'bg-red-600 text-white', icon: AlertTriangle };
        if (status === 'hidden') return { label: 'Tạm ẩn', color: 'bg-yellow-500 text-black', icon: AlertTriangle };

        const isEnded = status === 'ended' || (event && new Date(event.end_date || event.event_date) < new Date());
        if (isEnded && status === 'active') return { label: 'Đã kết thúc', color: 'bg-gray-600 text-white', icon: Calendar };

        switch (status) {
            case 'draft': return { label: 'Bản nháp', color: 'bg-gray-700 text-white', icon: Clock };
            case 'pending': return { label: 'Chờ duyệt', color: 'bg-amber-500 text-black', icon: AlertCircle };
            case 'active': return { label: 'Đang bán', color: 'bg-green-600 text-white', icon: CheckCircle2 };
            case 'pending_cancel': return { label: 'Chờ hủy', color: 'bg-red-600 text-white', icon: AlertCircle };
            case 'pending_cancellation_fee': return { label: 'Chờ nộp phí hủy', color: 'bg-purple-600 text-white', icon: AlertCircle };
            case 'pending_reschedule': return { label: 'Chờ dời lịch', color: 'bg-blue-600 text-white', icon: Calendar };
            case 'ended': return { label: 'Đã kết thúc', color: 'bg-gray-600 text-white', icon: Calendar };
            default: return { label: status, color: 'bg-gray-600 text-white', icon: Clock };
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        const isEnded = event.status === 'ended' || new Date(event.end_date || event.event_date) < new Date();
        
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'ended' ? (isEnded && !['settled', 'cancelled', 'hidden', 'pending_cancel', 'pending_cancellation_fee', 'pending_reschedule'].includes(event.status)) : (
                                filterStatus === 'active' ? (event.status === 'active' && !isEnded) : event.status === filterStatus
                             ));
        
        const matchesCategory = filterCategory === 'all' || event.category_id === filterCategory;
        
        let matchesDate = true;
        if (filterDate) {
            const eventDateStr = new Date(event.event_date).toLocaleDateString('en-CA');
            matchesDate = eventDateStr === filterDate;
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section - More Compact & Professional */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase">
                        Quản lý sự kiện
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-medium mt-0.5">
                        Theo dõi tiến độ và quản lý các show diễn của bạn.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/organizer/create-event')}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center uppercase group w-fit"
                >
                    <PlusCircle className="w-3.5 h-3.5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Tạo sự kiện
                </button>
            </div>

            {/* Controls Section - Sleeker & More Compact */}
            <div className="py-2 mb-1">
                <div className="bg-white dark:bg-[#111114] p-3 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-3">
                        <div className="col-span-2 md:col-span-5 lg:col-span-5 relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm sự kiện..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600/50 transition-all font-bold text-xs"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="col-span-1 md:col-span-3 lg:col-span-3">
                            <select 
                                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all font-bold text-xs dark:text-white appearance-none cursor-pointer"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="all">Tất cả danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-1 md:col-span-3 lg:col-span-3 relative flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-600/10 focus-within:border-blue-600/50 transition-all">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                            <input 
                                type="date"
                                className="bg-transparent border-none focus:outline-none focus:ring-0 font-bold text-xs w-full dark:text-white [color-scheme:dark]"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1 lg:col-span-1 flex items-center justify-end">
                            {(searchQuery || filterStatus !== 'all' || filterCategory !== 'all' || filterDate !== '') && (
                                <button 
                                    onClick={handleClearFilters}
                                    className="w-full md:w-auto flex justify-center p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10 group"
                                    title="Xóa bộ lọc"
                                >
                                    <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1 sm:pb-0">
                            <span className="text-[9px] font-black uppercase text-gray-400 mr-1 shrink-0">Trạng thái:</span>
                            {[
                                { key: 'all', label: 'TẤT CẢ' },
                                { key: 'draft', label: 'NHÁP' },
                                { key: 'pending', label: 'CHỜ DUYỆT' },
                                { key: 'active', label: 'ĐANG BÁN' },
                                { key: 'hidden', label: 'TẠM ẨN' },
                                { key: 'pending_cancel', label: 'CHỜ HỦY' },
                                { key: 'pending_cancellation_fee', label: 'CHỜ NỘP PHÍ' },
                                { key: 'pending_reschedule', label: 'CHỜ DỜI LỊCH' },
                                { key: 'cancelled', label: 'ĐÃ HỦY' },
                                { key: 'ended', label: 'KẾT THÚC' },
                                { key: 'settled', label: 'ĐÃ QUYẾT TOÁN' }
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilterStatus(item.key)}
                                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] font-black transition-all whitespace-nowrap border ${
                                        filterStatus === item.key 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                                        : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-blue-600 border-transparent hover:border-blue-600/20'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5 self-end">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section - More Densed & Professional */}
            <div className="bg-white/50 dark:bg-white/5 -mx-4 px-4 py-4 rounded-t-3xl border-t border-gray-200 dark:border-white/5 min-h-[500px]">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin opacity-50" />
                    <p className="text-gray-400 font-black uppercase text-[10px]">Đang tải dữ liệu...</p>
                </div>
            ) : filteredEvents.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filteredEvents.map((event) => {
                            const statusInfo = getStatusInfo(event.status, event);
                            const totalTickets = event.ticket_tiers?.reduce((sum, t) => sum + (t.quantity_total || 0), 0) || 0;
                            const soldTickets = event.total_sold || 0;
                            const progress = totalTickets > 0 ? Math.min(100, Math.round((soldTickets / totalTickets) * 100)) : 0;

                            return (
                                <div key={event.id} className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden group hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 relative flex flex-col h-full border-b-2 hover:border-b-blue-600">
                                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                                        {event.image_url ? (
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0 relative" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 z-0 relative"><Calendar className="w-8 h-8 opacity-20" /></div>
                                        )}
                                        <div className="absolute top-2 right-2 z-10">
                                            <span className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[7px] sm:text-[8px] font-black uppercase shadow-2xl ${statusInfo.color} border border-white/20 ring-1 ring-black/5`}>
                                                <statusInfo.icon className="w-2.5 h-2.5" />
                                                <span className="hidden sm:inline">{statusInfo.label}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-3 sm:p-4 flex flex-col flex-1">
                                        <div className="flex-1 space-y-2 sm:space-y-2.5">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-[8px] sm:text-[9px] font-black text-blue-600 uppercase truncate">{event.category?.name}</span>
                                                <div className="flex items-center text-[8px] sm:text-[9px] font-bold text-gray-600 dark:text-gray-400">
                                                    <Users className="w-2.5 h-2.5 mr-1 text-blue-600" />
                                                    {soldTickets}
                                                </div>
                                            </div>
                                            <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white line-clamp-2 uppercase leading-tight group-hover:text-blue-600 transition-colors min-h-[2rem] sm:min-h-[2.5rem]">{event.title}</h3>
                                            
                                            <div className="space-y-1 sm:space-y-1.5 text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 font-bold">
                                                <div className="flex items-center"><Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-600 opacity-70 shrink-0" /> <span className="truncate">{new Date(event.event_date).toLocaleDateString('vi-VN')}</span></div>
                                                <div className="flex items-center"><MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 text-blue-600 opacity-70 shrink-0" /> <span className="truncate">{event.location_address}</span></div>
                                            </div>

                                            {/* Progress Bar - Slim & Elegant */}
                                            <div className="pt-2 space-y-1.5">
                                                <div className="flex items-center justify-between text-[9px] font-black uppercase">
                                                    <span className="text-gray-600 dark:text-gray-500">Vé đã bán</span>
                                                    <span className="text-blue-600">{progress}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-600 transition-all duration-1000" 
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-auto flex items-center justify-between gap-2 border-t border-gray-200 dark:border-white/5">
                                            {event.status === 'pending_cancellation_fee' ? (
                                                <div className="flex items-center gap-2 w-full">
                                                    <button 
                                                        onClick={() => navigate(`/organizer/events/${event.id}`)} 
                                                        className="flex-1 py-2 bg-blue-50 dark:bg-white/5 rounded-lg text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1 group/btn border border-blue-100 dark:border-white/5"
                                                    >
                                                        Quản lý <ChevronRight className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/organizer/events/${event.id}/cancellation-fee`)} 
                                                        className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase shadow-md shadow-purple-600/30 hover:bg-purple-700 transition-all flex items-center justify-center gap-1 group/btn animate-pulse"
                                                    >
                                                        Nộp phí <ChevronRight className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => navigate(`/organizer/events/${event.id}`)} 
                                                    className="flex-1 py-2 bg-blue-50 dark:bg-white/5 rounded-lg text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-1 group/btn border border-blue-100 dark:border-white/5"
                                                >
                                                    Quản lý <ChevronRight className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                                </button>
                                            )}

                                            
                                            <div className="flex items-center gap-1.5">
                                                {(event.status === 'draft' || event.status === 'pending' || event.status === 'active') && (
                                                    <>
                                                        <button onClick={() => navigate(`/organizer/events/${event.id}/edit`)} className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="Sửa"><Edit className="w-3.5 h-3.5" /></button>
                                                        {(event.status === 'draft' || event.status === 'pending') && (
                                                            <button onClick={() => handleDelete(event.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        )}
                                                    </>
                                                )}
                                                {event.status === 'active' && (
                                                    <button onClick={() => { setSelectedEvent(event); setIsEmergencyModalOpen(true); }} className="p-2 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="Khẩn cấp"><AlertTriangle className="w-3.5 h-3.5" /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredEvents.map((event) => {
                            const statusInfo = getStatusInfo(event.status, event);
                            const totalTickets = event.ticket_tiers?.reduce((sum, t) => sum + (t.quantity_total || 0), 0) || 0;
                            const soldTickets = event.total_sold || 0;
                            const progress = totalTickets > 0 ? Math.min(100, Math.round((soldTickets / totalTickets) * 100)) : 0;

                            return (
                                <div key={event.id} className="bg-white dark:bg-[#111114] rounded-xl border border-gray-200 dark:border-white/5 p-3 flex items-center gap-4 group hover:border-blue-600/30 transition-all duration-300">
                                    {/* Small Thumbnail */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                                        {event.image_url ? (
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Calendar className="w-5 h-5 opacity-20" /></div>
                                        )}
                                    </div>

                                    {/* Title & Category */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[8px] font-black text-blue-600 uppercase truncate">{event.category?.name}</span>
                                            <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase ${statusInfo.color} shadow-sm`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <h3 className="text-[13px] font-black text-gray-900 dark:text-white truncate uppercase leading-tight group-hover:text-blue-600 transition-colors">{event.title}</h3>
                                    </div>

                                    {/* Date & Location - Hidden on small screens for density */}
                                    <div className="hidden lg:flex items-center gap-6 shrink-0 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center w-32"><Calendar className="w-3 h-3 mr-2 text-blue-600 opacity-60" /> {new Date(event.event_date).toLocaleDateString('vi-VN')}</div>
                                        <div className="flex items-center w-40 truncate"><MapPin className="w-3 h-3 mr-2 text-blue-600 opacity-60" /> {event.location_address}</div>
                                    </div>

                                    {/* Progress - List View */}
                                    <div className="hidden md:block w-48 shrink-0 px-4">
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase mb-1.5">
                                            <span className="text-gray-600 dark:text-gray-500">P: {soldTickets}/{totalTickets}</span>
                                            <span className="text-blue-600">{progress}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                        <button onClick={() => navigate(`/organizer/events/${event.id}`)} className="p-2 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-transparent hover:border-blue-600/30" title="Chi tiết"><ExternalLink className="w-3.5 h-3.5" /></button>
                                        
                                        {event.status === 'pending_cancellation_fee' && (
                                            <button onClick={() => navigate(`/organizer/events/${event.id}/cancellation-fee`)} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase shadow-md shadow-purple-600/30 hover:bg-purple-700 transition-all flex items-center gap-1 animate-pulse" title="Nộp phí hủy">
                                                <span>Nộp phí</span> <ExternalLink className="w-3 h-3" />
                                            </button>
                                        )}
                                        
                                        {(event.status === 'draft' || event.status === 'pending' || event.status === 'active') && (
                                            <>
                                                <button onClick={() => navigate(`/organizer/events/${event.id}/edit`)} className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all" title="Sửa"><Edit className="w-3.5 h-3.5" /></button>
                                                {(event.status === 'draft' || event.status === 'pending') && (
                                                    <button onClick={() => handleDelete(event.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                                                )}
                                            </>
                                        )}
                                        {event.status === 'active' && (
                                            <button onClick={() => { setSelectedEvent(event); setIsEmergencyModalOpen(true); }} className="p-2 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="Khẩn cấp"><AlertTriangle className="w-3.5 h-3.5" /></button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="bg-white dark:bg-[#111114] rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/5 p-20 flex flex-col items-center justify-center space-y-6 shadow-xl text-center">
                    <Calendar className="w-12 h-12 text-gray-300" />
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">Không tìm thấy sự kiện</h3>
                        <p className="text-gray-500 font-medium italic">Vui lòng thử điều chỉnh bộ lọc hoặc tạo sự kiện mới.</p>
                    </div>
                </div>
            )}
            </div>

            {selectedEvent && (
                <EmergencyActionModal 
                    isOpen={isEmergencyModalOpen}
                    onClose={() => setIsEmergencyModalOpen(false)}
                    onConfirm={handleEmergencyAction}
                    eventTitle={selectedEvent.title}
                />
            )}
        </div>
    );
};

export default MyEvents;
