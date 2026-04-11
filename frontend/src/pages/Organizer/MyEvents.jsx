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
        const isEnded = status === 'ended' || (event && new Date(event.end_date || event.event_date) < new Date());
        if (isEnded) return { label: 'Đã kết thúc', color: 'bg-red-500/10 text-red-500', icon: Calendar };

        switch (status) {
            case 'draft': return { label: 'Bản nháp', color: 'bg-gray-500/10 text-gray-500', icon: Clock };
            case 'pending': return { label: 'Chờ duyệt', color: 'bg-yellow-500/10 text-yellow-500', icon: AlertCircle };
            case 'active': return { label: 'Đang bán', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 };
            case 'pending_cancel': return { label: 'Chờ hủy', color: 'bg-red-500/10 text-red-600', icon: AlertCircle };
            case 'pending_reschedule': return { label: 'Chờ dời lịch', color: 'bg-blue-500/10 text-blue-600', icon: Calendar };
            default: return { label: status, color: 'bg-gray-500/10 text-gray-500', icon: Clock };
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        const isEnded = event.status === 'ended' || new Date(event.end_date || event.event_date) < new Date();
        
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'ended' ? isEnded : event.status === filterStatus);
        
        const matchesCategory = filterCategory === 'all' || event.category_id === filterCategory;
        
        let matchesDate = true;
        if (filterDate) {
            // Sử dụng en-CA để lấy YYYY-MM-DD từ ngày địa phương
            const eventDateStr = new Date(event.event_date).toLocaleDateString('en-CA');
            matchesDate = eventDateStr === filterDate;
        }

        return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase underline decoration-blue-600 decoration-4 underline-offset-8">
                        Quản lý sự kiện
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 font-[10px] italic">
                        Theo dõi tiến độ, cập nhật thông tin và quản lý các sự kiện của bạn.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/organizer/create-event')}
                    className="bg-blue-600 text-white px-4 py-3 rounded-2xl text-sm font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30_rgba(37,99,235,0.6)] transition-all flex items-center uppercase group w-fit"
                >
                    <PlusCircle className="w-4 h-4 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Tạo sự kiện mới
                </button>
            </div>

            {/* Controls Section - Sticky for better UX */}
            <div className="sticky top-0 z-30 py-4 -my-4 bg-white/10 dark:bg-[#0a0a0c]/10 backdrop-blur-xl">
                <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Tìm kiếm sự kiện theo tên..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-[#111114] border-gray-100 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="px-4 py-4 bg-gray-50 dark:bg-[#1a1a1e] border border-gray-100 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-bold text-sm dark:text-white appearance-none cursor-pointer"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all" className="dark:bg-[#1a1a1e]">Tất cả danh mục</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id} className="dark:bg-[#1a1a1e]">{cat.name}</option>
                        ))}
                    </select>

                    <div className="relative flex items-center bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
                        <Calendar 
                            className="w-4 h-4 text-gray-400 mr-2 shrink-0 cursor-pointer hover:text-blue-600 transition-colors" 
                            onClick={() => document.getElementById('filter-date-input')?.showPicker()}
                        />
                        <input 
                            id="filter-date-input"
                            type="date"
                            className="bg-transparent border-none focus:outline-none focus:ring-0 font-bold text-sm w-full dark:text-white [color-scheme:dark]"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center">
                        {(searchQuery || filterStatus !== 'all' || filterCategory !== 'all' || filterDate !== '') && (
                            <button 
                                onClick={handleClearFilters}
                                className="px-5 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 shadow-sm flex items-center justify-center gap-2 group whitespace-nowrap"
                            >
                                <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        <span className="text-[10px] font-black uppercase text-gray-400 mr-2">Trạng thái:</span>
                        {['all', 'draft', 'pending', 'active', 'ended'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-6 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${
                                    filterStatus === s 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-blue-600/30'
                                }`}
                            >
                                {s === 'all' ? 'Tất cả' : s === 'draft' ? 'Nháp' : s === 'pending' ? 'Chờ duyệt' : s === 'active' ? 'Đang bán' : 'Kết thúc'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-100 dark:border-white/5 self-end">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Lưới"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                            title="Danh sách"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="bg-gray-50/50 dark:bg-black/20 -mx-8 px-8 py-6 rounded-t-[3rem] border-t border-gray-100 dark:border-white/5 min-h-[500px]">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
                </div>
            ) : filteredEvents.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
                        {filteredEvents.map((event) => {
                            const statusInfo = getStatusInfo(event.status);
                            const totalTickets = event.ticket_tiers?.reduce((sum, t) => sum + t.quantity_total, 0) || 0;
                            const availableTickets = event.ticket_tiers?.reduce((sum, t) => sum + t.quantity_available, 0) || 0;
                            const soldTickets = totalTickets - availableTickets;
                            const progress = totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0;

                            return (
                                <div key={event.id} className="bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 relative  dark:bg-[#16161a]">
                                    <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-white/5">
                                        {event.image_url ? (
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Calendar className="w-12 h-12" /></div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md shadow-xl ${statusInfo.color}`}>
                                                <statusInfo.icon className="w-2.5 h-2.5" />
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{event.category?.name}</span>
                                                <h3 className="text-base font-black text-gray-900 dark:text-white line-clamp-1 uppercase group-hover:text-blue-600 transition-colors">{event.title}</h3>
                                            </div>
                                            <button 
                                                onClick={() => navigate(`/organizer/events/${event.id}/participants`)}
                                                className="p-2.5 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                title="Danh sách tham gia"
                                            >
                                                <Users className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                            <div className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-2 text-blue-600" /> {new Date(event.event_date).toLocaleDateString('vi-VN')} at {event.event_time}</div>
                                            <div className="flex items-center line-clamp-1"><MapPin className="w-3.5 h-3.5 mr-2 text-blue-600" /> {event.location_address}</div>
                                        </div>

                                        {/* Updated Progress Section - Grid View */}
                                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-3">
                                            <div className="flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tiến độ bán vé</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-lg font-black text-blue-600 tracking-tighter">{soldTickets.toLocaleString()}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold">/ {totalTickets.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-gray-900 dark:text-white bg-blue-600/10 px-2 py-1 rounded-lg">
                                                        {progress}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-100/50 dark:border-white/5">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-1000 relative" 
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-shine_2s_linear_infinite]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex items-center justify-between gap-3">
                                            <button onClick={() => navigate(`/organizer/events/${event.id}`)} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center group/btn">
                                                Chi tiết <ChevronRight className="w-2.5 h-2.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                            
                                            <div className="flex items-center gap-2">
                                                {(event.status === 'draft' || event.status === 'pending') && (
                                                    <>
                                                        <button onClick={() => navigate(`/organizer/events/${event.id}/edit`)} className="p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm" title="Chỉnh sửa"><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDelete(event.id)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm" title="Xóa sự kiện"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                                {event.status === 'active' && (
                                                    <button onClick={() => { setSelectedEvent(event); setIsEmergencyModalOpen(true); }} className="p-3 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm" title="Xử lý khẩn cấp"><AlertTriangle className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map((event) => {
                            const statusInfo = getStatusInfo(event.status);
                            const totalTickets = event.ticket_tiers?.reduce((sum, t) => sum + t.quantity_total, 0) || 0;
                            const availableTickets = event.ticket_tiers?.reduce((sum, t) => sum + t.quantity_available, 0) || 0;
                            const soldTickets = totalTickets - availableTickets;
                            const progress = totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0;

                            return (
                                <div key={event.id} className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4 flex flex-col lg:flex-row lg:items-center gap-6 group hover:border-blue-600/30 transition-all duration-300">
                                    {/* Thumbnail */}
                                    <div className="w-full lg:w-32 aspect-video lg:aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                                        {event.image_url ? (
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Calendar className="w-8 h-8" /></div>
                                        )}
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{event.category?.name}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${statusInfo.color}`}>
                                                {statusInfo.label}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-gray-900 dark:text-white truncate uppercase">{event.title}</h3>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 font-bold">
                                            <div className="flex items-center"><Calendar className="w-3 h-3 mr-1.5 text-blue-600" /> {new Date(event.event_date).toLocaleDateString('vi-VN')}</div>
                                            <div className="flex items-center"><MapPin className="w-3 h-3 mr-1.5 text-blue-600" /> {event.location_address}</div>
                                        </div>
                                    </div>

                                    {/* Sales Progress - List View */}
                                    <div className="w-full lg:w-64 space-y-2 border-l border-gray-100 dark:border-white/5 pl-6">
                                        <div className="flex items-end justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Đã bán</span>
                                                <span className="text-sm font-black text-blue-600">{soldTickets.toLocaleString()} <span className="text-gray-400 font-bold text-[10px]">/ {totalTickets.toLocaleString()}</span></span>
                                            </div>
                                            <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-md self-center">
                                                {progress}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 lg:border-l lg:border-gray-100 lg:dark:border-white/5 lg:pl-6 shrink-0">
                                        <button onClick={() => navigate(`/organizer/events/${event.id}/participants`)} className="p-2.5 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" title="Danh sách tham gia"><Users className="w-4 h-4" /></button>
                                        <button onClick={() => navigate(`/organizer/events/${event.id}`)} className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all" title="Chi tiết"><ExternalLink className="w-4 h-4" /></button>
                                        {(event.status === 'draft' || event.status === 'pending') && (
                                            <>
                                                <button onClick={() => navigate(`/organizer/events/${event.id}/edit`)} className="p-2.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all" title="Chỉnh sửa"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(event.id)} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                            </>
                                        )}
                                        {event.status === 'active' && (
                                            <button onClick={() => { setSelectedEvent(event); setIsEmergencyModalOpen(true); }} className="p-2.5 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all" title="Xử lý khẩn cấp"><AlertTriangle className="w-4 h-4" /></button>
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
