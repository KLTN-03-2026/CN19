import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Mail, 
    Phone, 
    Calendar, 
    Shield, 
    CheckCircle2, 
    ShieldOff,
    Ticket,
    ShoppingBag,
    Clock,
    User,
    Activity,
    ExternalLink,
    MapPin,
    History
} from 'lucide-react';
import { staffService } from '../../services/staff.service';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const StaffDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchStaffDetail();
    }, [id]);

    const fetchStaffDetail = async () => {
        try {
            setLoading(true);
            const res = await staffService.getStaffDetail(id);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching staff detail:', error);
            toast.error('Không thể tải thông tin nhân viên');
            navigate('/organizer/staff');
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data) return null;

    const { staff, assignments, stats } = data;

    const getStatusLabel = (st) => {
        switch(st) {
            case 'active': return { label: 'Đang bán', className: 'bg-emerald-500/10 text-emerald-500' };
            case 'completed': return { label: 'Kết thúc', className: 'bg-blue-500/10 text-blue-500' };
            case 'settled': return { label: 'Đã quyết toán', className: 'bg-purple-500/10 text-purple-500' };
            case 'pending': return { label: 'Chờ duyệt', className: 'bg-amber-500/10 text-amber-500' };
            case 'draft': return { label: 'Nháp', className: 'bg-gray-500/10 text-gray-500' };
            case 'cancelled': return { label: 'Đã hủy', className: 'bg-red-500/10 text-red-500' };
            case 'hidden': return { label: 'Tạm ẩn', className: 'bg-yellow-500/10 text-yellow-500' };
            default: return { label: st, className: 'bg-gray-500/10 text-gray-500' };
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/organizer/staff')}
                        className="p-2.5 bg-white dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl hover:scale-110 transition-all active:scale-90 shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="space-y-0.5">
                        <h1 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            Chi tiết nhân viên
                        </h1>
                        <p className="text-[10px] font-black text-blue-600 tracking-tight flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            Quản lý hồ sơ & hiệu suất
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-lg overflow-hidden">
                        <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-[#111114] p-1 shadow-lg">
                                    <div className="w-full h-full rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-2xl font-black text-blue-600 uppercase ring-2 ring-white dark:ring-[#111114]">
                                        {staff.full_name ? staff.full_name[0] : staff.email[0]}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-12 pb-6 px-6 text-center">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                {staff.full_name || 'Staff User'}
                            </h2>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tight">Nhân viên soát vé</p>
                            
                            <div className="mt-3 flex justify-center">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${
                                    staff.status === 'active' 
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                }`}>
                                    {staff.status === 'active' ? (
                                        <><CheckCircle2 className="w-3 h-3" /> Hoạt động</>
                                    ) : (
                                        <><ShieldOff className="w-3 h-3" /> Đã khóa</>
                                    )}
                                </span>
                            </div>

                            <div className="mt-6 space-y-3 text-left border-t border-gray-100 dark:border-white/5 pt-6">
                                <div className="flex items-center gap-3 group">
                                    <div className="w-9 h-9 flex items-center justify-center ">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Email</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{staff.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 group">
                                    <div className="w-9 h-9  flex items-center justify-center ">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Số điện thoại</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{staff.phone_number || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 group">
                                    <div className="w-9 h-9 flex items-center justify-center ">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Gia nhập</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                            {format(new Date(staff.created_at), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Assignments */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div 
                            whileHover={{ y: -3 }}
                            className="bg-white dark:bg-[#111114] p-5 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-lg flex items-center gap-5"
                        >
                            <div className="w-12 h- rounded-2xl bg-blue-600/10 flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Vé đã quét</p>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mt-0.5">{stats.total_ticket_scans}</h3>
                            
                            </div>
                        </motion.div>

                        <motion.div 
                            whileHover={{ y: -3 }}
                            className="bg-white dark:bg-[#111114] p-5 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-lg flex items-center gap-5"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Vật phẩm</p>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mt-0.5">{stats.total_merchandise_scans}</h3>
                               
                            </div>
                        </motion.div>
                    </div>

                    {/* Assigned Events */}
                    <div className="bg-white dark:bg-[#111114] rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[12px] font-black text-gray-900 dark:text-white uppercase ">Sự kiện đang đảm nhiệm</h3>
                            </div>
                            <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-lg text-[10px] font-black">
                                {assignments.length} Sự kiện
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {assignments.map((event) => {
                                const badge = getStatusLabel(event.status);
                                return (
                                <div key={event.id} className="p-4 flex items-center gap-5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group">
                                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/10 overflow-hidden shrink-0 border border-gray-200 dark:border-white/10">
                                        {event.image_url ? (
                                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px]">No Img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-gray-900 dark:text-white text-xs tracking-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                {event.title}
                                            </h4>
                                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${badge.className}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                                {format(new Date(event.event_date), 'dd/MM/yyyy')}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                                                {event.location_address || 'Địa điểm tại sự kiện'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button 
                                            onClick={() => navigate(`/organizer/staff/${id}/history/${event.id}`)}
                                            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-600/10 flex items-center justify-center hover:bg-blue-600 text-blue-600 hover:text-white group/btn transition-all shadow-sm"
                                            title="Lịch sử quét"
                                        >
                                            <History className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/organizer/events/${event.id}`)}
                                            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-blue-600 text-gray-500 hover:text-white group/btn transition-all"
                                            title="Chi tiết sự kiện"
                                        >
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover/btn:text-white" />
                                        </button>
                                    </div>
                                </div>
                            );})}
                            {assignments.length === 0 && (
                                <div className="p-10 text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Chưa được phân công sự kiện nào</p>
                                </div>
                            )}
                </div>
            </div>
        </div>
    </div>
</div>
    );
};

export default StaffDetail;
