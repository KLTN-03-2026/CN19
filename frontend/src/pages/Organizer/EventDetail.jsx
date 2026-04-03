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
    const soldTickets = event._count?.tickets || 0;
    const progress = totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={() => navigate('/organizer/my-events')}
                    className="flex items-center text-gray-500 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-colors group"
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
                {/* Left: Banner & Media */}
                <div className="xl:col-span-2 space-y-6">
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
                        {event.video_url && (
                            <a 
                                href={event.video_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-2xl transition-all border border-white/20"
                            >
                                <ExternalLink className="w-4 h-4 mr-3" />
                                Xem Video giới thiệu
                            </a>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white dark:bg-[#111114] p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">{event.category?.name}</span>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase leading-tight tracking-tight">
                                {event.title}
                            </h1>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-start gap-4 p-5 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-50 dark:border-white/5">
                                <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Thời gian diễn ra</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase">
                                        {new Date(event.event_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 italic mt-1">{event.event_time} - {event.end_time || '--:--'}</p>
                                </div>
                            </div>

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

                        <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                                Mô tả sự kiện
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic whitespace-pre-line">
                                {event.description || 'Không có mô tả cho sự kiện này.'}
                            </div>
                        </div>

                        {/* Sơ đồ sự kiện */}
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

                {/* Right: Stats & Ticket Tiers */}
                <div className="space-y-6">
                    {/* Sales Summary Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-[0_20px_40px_rgba(37,99,235,0.3)] space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Ticket className="w-32 h-32 rotate-12" />
                        </div>
                        
                        <div className="relative">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Tiến độ bán vé</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black">{soldTickets}</span>
                                <span className="text-xl font-bold opacity-60">/ {totalTickets}</span>
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <div className="flex justify-between text-[10px] font-black uppercase">
                                <span>Tỷ lệ lấp đầy</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 relative">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase opacity-70 mb-1">Doanh thu dự kiến</p>
                                <p className="text-sm font-black uppercase">Sắp có</p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                                <p className="text-[9px] font-black uppercase opacity-70 mb-1">Check-in</p>
                                <p className="text-sm font-black uppercase">0%</p>
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
                            
                            {/* Toggle Resale */}
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

                            {/* Toggle Transfer */}
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
                    <div className="bg-white dark:bg-[#111114] p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center">
                            <Ticket className="w-4 h-4 mr-2 text-blue-600" />
                            Danh sách hạng vé ({event.ticket_tiers?.length || 0})
                        </h3>
                        <div className="space-y-4">
                            {event.ticket_tiers?.map((tier) => (
                                <div key={tier.id} className="p-4 bg-gray-50/50 dark:bg-white/5 rounded-3xl border border-gray-50 dark:border-white/5 hover:border-blue-600/30 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase group-hover:text-blue-600 transition-colors">{tier.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 italic mb-2 line-clamp-1">{tier.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-blue-600">
                                                {tier.price === 0 ? 'MIỄN PHÍ' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tier.price)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-black uppercase text-gray-400">
                                            <span>Đã bán: {tier.quantity_sold || 0} / {tier.quantity_total}</span>
                                            <span>{Math.round(((tier.quantity_sold || 0) / tier.quantity_total) * 100)}%</span>
                                        </div>
                                        <div className="h-1 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-600 transition-all duration-1000"
                                                style={{ width: `${(tier.quantity_sold || 0) / tier.quantity_total * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
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
