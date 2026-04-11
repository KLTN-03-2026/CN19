import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Calendar, 
    MapPin, 
    Ticket, 
    ArrowLeft, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    ExternalLink,
    Loader2,
    Users,
    TrendingUp,
    ShieldCheck,
    Coins,
    AlertTriangle,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';
import EmergencyActionModal from '../../components/Organizer/EmergencyActionModal';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const handleEmergencyAction = async (data) => {
        try {
            await organizerService.requestEmergencyAction(id, data);
            toast.success('Gửi yêu cầu xử lý khẩn cấp thành công!');
            setIsEmergencyModalOpen(false);
            // Refresh event data to show new status
            const res = await organizerService.getEventById(id);
            setEvent(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Đã xảy ra lỗi.');
            throw err;
        }
    };

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const res = await organizerService.getEventById(id);
            setEvent(res.data);
        } catch (error) {
            toast.error('Không thể tải thông tin sự kiện.');
            console.error(error);
            navigate('/organizer/my-events');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePolicy = async (field, currentValue) => {
        const eventDate = new Date(event.event_date);
        const now = new Date();
        const diffDays = (eventDate - now) / (1000 * 60 * 60 * 24);

        // Cho phép sửa nếu là Draft/Pending bất kể thời gian
        const isEditableStatus = event.status === 'draft' || event.status === 'pending';

        if (!isEditableStatus && diffDays < 2) {
            toast.error('Không thể thay đổi chính sách khi còn chưa đầy 2 ngày đến sự kiện (đối với sự kiện đã duyệt).');
            return;
        }

        try {
            await organizerService.updateEvent(id, { [field]: !currentValue });
            toast.success('Cập nhật chính sách thành công!');
            fetchEvent();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Đã xảy ra lỗi khi cập nhật.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Đang tải thông tin sự kiện...</p>
            </div>
        );
    }

    if (!event) return null;

    const getStatusInfo = (status) => {
        switch (status) {
            case 'draft': return { label: 'Bản nháp', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: Clock };
            case 'pending': return { label: 'Chờ duyệt', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertCircle };
            case 'active': return { label: 'Đang bán', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 };
            case 'ended': return { label: 'Đã kết thúc', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: Calendar };
            default: return { label: status, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', icon: Clock };
        }
    };

    const statusInfo = getStatusInfo(event.status);
    const totalTickets = event.ticket_tiers?.reduce((sum, t) => sum + t.quantity_total, 0) || 0;
    const availableTickets = event.ticket_tiers?.reduce((sum, t) => sum + t.quantity_available, 0) || 0;
    const soldTickets = totalTickets - availableTickets;
    const progress = totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0;

    const checkInCount = event._count?.tickets || 0;
    const checkInProgress = soldTickets > 0 ? Math.round((checkInCount / soldTickets) * 100) : 0;
    
    // Helper to extract YouTube ID
    const getYouTubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYouTubeId(event.video_url);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate('/organizer/my-events')}
                    className="flex items-center text-gray-500 hover:text-blue-600 font-black text-sm transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Quay lại danh sách
                </button>
                <div className="flex items-center gap-3">
                    {(event.status === 'draft' || event.status === 'pending') && (
                        <button 
                            onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                            className="flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600 text-white font-black uppercase text-[10px] tracking-wider shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all"
                        >
                            Chỉnh sửa
                        </button>
                    )}
                    {event.status === 'active' && (
                        <button 
                            onClick={() => setIsEmergencyModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2 rounded-full bg-red-600 text-white font-black uppercase text-[10px] tracking-wider shadow-lg shadow-red-600/20 hover:brightness-110 transition-all"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            Xử lý khẩn cấp
                        </button>
                    )}
                    <div className={`flex items-center gap-2 px-6 py-2 rounded-full border ${statusInfo.color} font-black uppercase text-[10px] tracking-wider shadow-sm`}>
                        <statusInfo.icon className="w-3 h-3" />
                        {statusInfo.label}
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Content Column */}
                <div className="xl:col-span-2 space-y-8">
                    {/* 1. Banner Image */}
                    <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-2xl relative group">
                        {event.image_url ? (
                            <img 
                                src={event.image_url} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Calendar className="w-20 h-20" />
                            </div>
                        )}
                    </div>

                    {/* 2. Header Info: Title, Category & Time */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <span className="text-sm font-black text-blue-600 uppercase">{event.category?.name}</span>
                            <h1 className="text-2xl md:text-xl font-black text-gray-900 dark:text-white uppercase leading-tight">
                                {event.title}
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            {/* Start Time */}
                            <div className="flex items-center gap-4 px-6 py-4 bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/20 rounded-[2rem] group hover:border-blue-600/40 transition-all">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-blue-600/70 uppercase">Bắt đầu</p>
                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase leading-none">
                                        {new Date(event.event_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 italic">
                                        Lúc {event.event_time}
                                    </p>
                                </div>
                            </div>

                            {/* End Time */}
                            <div className="flex items-center gap-4 px-6 py-4 bg-rose-600/5 dark:bg-rose-600/10 border border-rose-600/20 rounded-[2rem] group hover:border-rose-600/40 transition-all">
                                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/20">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black text-rose-600/70 uppercase">Kết thúc</p>
                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase leading-none">
                                        {event.end_date ? new Date(event.end_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date(event.event_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 italic">
                                        Lúc {event.end_time || '--:--'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Video Player Section */}
                    {event.video_url && (
                        <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                                Video giới thiệu sự kiện
                            </h3>
                            <div className="aspect-video w-full rounded-3xl overflow-hidden border border-gray-100 dark:border-white/10 bg-black shadow-2xl relative">
                                {youtubeId ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                ) : (
                                    <video 
                                        controls
                                        className="w-full h-full object-contain"
                                        poster={event.image_url}
                                    >
                                        <source src={event.video_url} type="video/mp4" />
                                        <source src={event.video_url} type="video/webm" />
                                        <source src={event.video_url} type="video/ogg" />
                                        Trình duyệt của bạn không hỗ trợ phát video.
                                    </video>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. Extra Info Cards: Location, Description, Seating */}
                    <div className="bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-8">
                        {/* Location */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-4 p-5 bg-gray-50/50 dark:bg-white/5 rounded-[2.5rem] border border-gray-50 dark:border-white/5 group hover:border-blue-500/30 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-indigo-600/10 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Địa điểm tổ chức</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase line-clamp-1">
                                            {event.location_address || 'Địa điểm chưa xác định'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="aspect-video w-full rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 relative shadow-inner">
                                    {event.latitude && event.longitude ? (
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            style={{ border: 0 }}
                                            src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=15&output=embed`}
                                            allowFullScreen
                                            className="opacity-90 group-hover:opacity-100 transition-opacity grayscale-[10%] hover:grayscale-0"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-white/5 opacity-40">
                                            <MapPin className="w-8 h-8 mb-2 text-gray-400" />
                                            <p className="text-[9px] font-black uppercase tracking-widest text-center">Tọa độ chưa được thiết lập</p>
                                        </div>
                                    )}
                                    {event.latitude && (
                                        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-xl text-[8px] font-mono text-white border border-white/10 pointer-events-none">
                                            {event.latitude}, {event.longitude}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                                Mô tả sự kiện
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic whitespace-pre-line">
                                {event.description || 'Không có mô tả cho sự kiện này.'}
                            </div>
                        </div>

                        {/* Seating Charts */}
                        {event.seating_charts && event.seating_charts.length > 0 && (
                            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center">
                                    <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                                    Sơ đồ sự kiện
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {event.seating_charts.map((url, index) => (
                                        <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 group cursor-pointer" onClick={() => window.open(url, '_blank')}>
                                            <img 
                                                src={url} 
                                                alt={`Sơ đồ ${index + 1}`} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats & Ticket Tiers */}
                <div className="space-y-6">
                    {/* Sales Summary Card */}
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] space-y-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:40px_40px] animate-[progress-shine_4s_linear_infinite] opacity-30" />
                        <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Ticket className="w-48 h-48 rotate-12" />
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-2 opacity-80 mb-2">
                                <TrendingUp className="w-4 h-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Hiệu suất bán vé</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black tracking-tighter">{soldTickets.toLocaleString()}</span>
                                <span className="text-xl font-bold opacity-60">/ {totalTickets.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="space-y-3 relative">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                <span className="opacity-80 tracking-widest">Tỷ lệ lấp đầy</span>
                                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">{progress}%</span>
                            </div>
                            <div className="h-4 w-full bg-black/20 rounded-full overflow-hidden p-1 border border-white/5">
                                <div 
                                    className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.8)] relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-white/50 blur-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 relative">
                            <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10 flex flex-col items-center">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1 leading-none text-center italic">Doanh thu thực nhận</p>
                                <Coins className="w-4 h-4 mb-2 text-amber-300" />
                                <p className="text-sm font-black uppercase leading-none">
                                    {new Intl.NumberFormat('vi-VN').format(event?.estimated_net_revenue || 0)} đ
                                </p>
                                <div className="mt-2 text-[7px] font-bold opacity-40 text-center leading-tight">
                                    Đã trừ 8% phí sàn \u0026 10.000đ phí gas/vé. <br/> Không bao gồm vật phẩm.
                                </div>
                            </div>
                            <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10 flex flex-col items-center">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-70 mb-1 leading-none text-center italic">Người tham gia</p>
                                <Users className="w-4 h-4 mb-2 text-blue-200" />
                                <div className="flex flex-col items-center">
                                    <p className="text-sm font-black uppercase">{checkInCount.toLocaleString()}</p>
                                    <p className="text-[8px] font-bold opacity-60">({checkInProgress}%)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Policy & Smart Contract Info */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center">
                            <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" />
                            Chính sách & Công nghệ
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Coins className="w-4 h-4 text-amber-500" />
                                    <span className="text-[10px] font-black text-gray-500 uppercase">Phí bản quyền (BTC nhận)</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white">{event.royalty_fee_percent}%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black text-gray-500 uppercase">Giới hạn giá bán lại</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-900 dark:text-white">Tối đa {event.resale_price_limit_percent || 108}%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl hover:border-blue-500/30 transition-all border border-transparent">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black text-gray-500 uppercase">Cho phép Đăng bán lại</span>
                                </div>
                                <button 
                                    onClick={() => handleTogglePolicy('allow_resale', event.allow_resale)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${event.allow_resale ? 'bg-blue-600' : 'bg-gray-300 dark:bg-white/10'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${event.allow_resale ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-white/5 rounded-2xl hover:border-blue-500/30 transition-all border border-transparent">
                                <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 text-green-500" />
                                    <span className="text-[10px] font-black text-gray-500 uppercase">Hỗ trợ Chuyển nhượng</span>
                                </div>
                                <button 
                                    onClick={() => handleTogglePolicy('allow_transfer', event.allow_transfer)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${event.allow_transfer ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-white/10'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${event.allow_transfer ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-600/5 rounded-xl border border-blue-600/10 flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed italic">
                                * Quyền chuyển nhượng và đăng bán lại có thể được điều chỉnh (Bật/Tắt) cho đến trước 2 ngày diễn ra sự kiện.
                            </p>
                        </div>
                    </div>

                    {/* Ticket Tiers List */}
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4 overflow-hidden">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center">
                            <Ticket className="w-4 h-4 mr-2 text-blue-600" />
                            Danh sách hạng vé ({event.ticket_tiers?.length || 0})
                        </h3>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                            {event.ticket_tiers?.map((tier) => {
                                const tierSold = tier.quantity_total - tier.quantity_available;
                                const tierProgress = Math.round((tierSold / tier.quantity_total) * 100);
                                return (
                                    <div key={tier.id} className="p-5 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-50 dark:border-white/2 shadow-sm hover:border-blue-600/30 hover:bg-white dark:hover:bg-[#1a1a1e] transition-all group relative overflow-hidden">
                                        <div className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-blue-500/5 to-transparent skew-x-[-20deg] group-hover:left-full transition-all duration-1000" />
                                        <div className="flex justify-between items-start mb-3 relative">
                                            <div>
                                                <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase group-hover:text-blue-600 transition-colors tracking-tight">{tier.tier_name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Ticket className="w-2.5 h-2.5 text-blue-600" />
                                                    <p className="text-[9px] font-black text-blue-600/70 uppercase">Mã: {tier.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-blue-600 bg-blue-600/5 px-2 py-1 rounded-lg">
                                                    {tier.price === 0 ? 'FREE' : new Intl.NumberFormat('vi-VN').format(tier.price)} đ
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 relative">
                                            <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-blue-600">{tierSold.toLocaleString()}</span>
                                                    <span>/ {tier.quantity_total.toLocaleString()} đã bán</span>
                                                </div>
                                                <span className="text-gray-900 dark:text-white">{tierProgress}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden border border-gray-100/50 dark:border-white/5">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000"
                                                    style={{ width: `${tierProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <EmergencyActionModal 
                isOpen={isEmergencyModalOpen}
                onClose={() => setIsEmergencyModalOpen(false)}
                onConfirm={handleEmergencyAction}
                eventTitle={event.title}
            />
        </div>
    );
};

export default EventDetail;
