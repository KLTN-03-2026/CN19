import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Send, 
    Shield, 
    AlertCircle, 
    Loader2, 
    CheckCircle2,
    Calendar,
    MapPin,
    Ticket as TicketIcon,
    Info,
    ArrowRightLeft
} from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { userService } from '../../services/user.service';
import orderService from '../../services/order.service';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const TicketTransfer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuthStore();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [receiverEmail, setReceiverEmail] = useState('');
    const [receiverInfo, setReceiverInfo] = useState(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);

    useEffect(() => {
        fetchTicketDetail();
    }, [id]);

    const fetchTicketDetail = async () => {
        try {
            setLoading(true);
            const res = await ticketService.getTicketById(id);
            setTicket(res.data);
            
            // Verification check
            const isOwner = res.data.is_current_owner || res.data.current_owner_id === authUser?.userId || res.data.current_owner_id === authUser?.id;

            if (!isOwner) {
                toast.error('Bạn không còn sở hữu vé này.');
                navigate('/my-tickets');
            }
            if (res.data.status === 'used' || res.data.status === 'cancelled') {
                toast.error('Vé không khả dụng để chuyển nhượng.');
                navigate('/my-tickets');
            }
        } catch (error) {
            toast.error('Không thể tải thông tin vé.');
            navigate('/my-tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (receiverEmail && receiverEmail.includes('@')) {
                checkReceiver(receiverEmail);
            } else {
                setReceiverInfo(null);
            }
        }, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [receiverEmail]);

    const checkReceiver = async (email) => {
        try {
            setIsCheckingEmail(true);
            const res = await userService.findByEmail(email);
            setReceiverInfo(res.data);
        } catch (error) {
            setReceiverInfo(null);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleTransfer = async () => {
        if (!receiverEmail) {
            toast.error('Vui lòng nhập email người nhận.');
            return;
        }
        
        try {
            setIsTransferring(true);
            const res = await orderService.createTransferOrder(ticket.id, receiverEmail);
            toast.success('Khởi tạo thanh toán phí chuyển nhượng thành công!');
            // Chuyển sang trang checkout
            navigate(`/checkout/${res.data.id}`);
        } catch (error) {
            console.error('Transfer error:', error);
            toast.error(error.response?.data?.error || 'Không thể khởi tạo thanh toán. Vui lòng thử lại.');
        } finally {
            setIsTransferring(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500 pt-24 pb-20 px-4 sm:px-8 relative overflow-hidden">
            {/* Background elements to match the premium theme */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-green/5 blur-[150px] -z-10 rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] -z-10 rounded-full"></div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                {/* Navigation & Header */}
                <div className="flex flex-col gap-4">
                    <Link 
                        to="/my-tickets" 
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-neon-green transition-colors text-xs font-black uppercase tracking-widest group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Quay lại kho vé
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                             <div className="inline-flex items-center gap-2 text-neon-green font-black uppercase tracking-[0.2em] text-[10px] bg-neon-green/5 px-4 py-2 rounded-full border border-neon-green/20">
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>Chuyển quyền sở hữu số</span>
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Chuyển nhượng vé</h1>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-6 py-3 bg-neon-green/10 border border-neon-green/20 rounded-2xl">
                            <Shield className="w-5 h-5 text-neon-green" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-neon-green uppercase tracking-widest leading-none">Xác thực Blockchain</span>
                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Giao thức an toàn 100%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Left Column: Ticket Preview Card */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="relative group overflow-hidden rounded-[3.5rem] bg-dark-card border border-white/5 shadow-2xl flex flex-col">
                            {/* Banner Image */}
                            <div className="relative aspect-[3/4]">
                                <img 
                                    src={ticket.event.image_url} 
                                    alt={ticket.event.title}
                                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2000ms]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-95" />
                                
                                <div className="absolute top-8 left-8">
                                    <span className="bg-neon-green/20 backdrop-blur-md text-neon-green px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-neon-green/30">
                                        NFT Asset
                                    </span>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-10 space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-neon-green uppercase tracking-[0.3em] mb-2 px-1">
                                            {new Date(ticket.event.event_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                        <h3 className="text-4xl font-black text-white uppercase leading-[0.9] tracking-tighter drop-shadow-2xl">
                                            {ticket.event.title}
                                        </h3>
                                    </div>
                                    
                                    <div className="flex flex-col gap-3 text-gray-400">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/5 rounded-lg">
                                                <MapPin className="w-4 h-4 text-neon-green" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wide truncate">
                                                {ticket.event.location_address || 'Địa điểm chưa xác định'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Category Footer */}
                            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hạng vé / Vị trí</p>
                                    <p className="text-xl font-black text-white uppercase tracking-tighter">
                                        {ticket.ticket_tier.tier_name} <span className="text-neon-green text-sm">/</span> {ticket.ticket_tier.section_name || 'GENERAL'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Mã định danh</p>
                                    <p className="text-xl font-black text-neon-green uppercase tracking-widest leading-none">#{ticket.token_id || 'NFT'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] flex items-start gap-4">
                            <Shield className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Giao thức an toàn</p>
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                    Vé của bạn được chuyển nhượng thông qua hợp đồng thông minh. Người nhận phải có tài khoản trên hệ thống BASTICKET để nhận được quyền sở hữu.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Transfer Form */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-white dark:bg-dark-card rounded-[3.5rem] border border-gray-200 dark:border-white/5 shadow-2xl p-10 md:p-14 space-y-12">
                            
                            {/* Step 1: Input Email */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-neon-green text-black flex items-center justify-center font-black text-xs">1</div>
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Thông tin người nhận</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic opacity-60">* Email xác định duy nhất</span>
                                </div>

                                <div className="relative group">
                                    <Send className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon-green transition-colors" />
                                    <input 
                                        type="email"
                                        placeholder="Nhập email tài khoản BASTICKET người nhận..."
                                        value={receiverEmail}
                                        onChange={(e) => setReceiverEmail(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-3xl py-7 pl-16 pr-8 text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:border-neon-green focus:ring-4 focus:ring-neon-green/5 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700"
                                    />
                                    {isCheckingEmail && (
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-5 h-5 text-neon-green animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Receiver Info Visualization */}
                                {receiverInfo ? (
                                    <div className="mx-2 p-6 bg-neon-green/10 border border-neon-green/20 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 shadow-xl shadow-neon-green/5">
                                        <div className="relative">
                                            <img 
                                                src={receiverInfo.avatar_url || 'https://via.placeholder.com/100'} 
                                                className="w-20 h-20 rounded-[1.5rem] border-2 border-neon-green/30 object-cover shadow-[0_0_30px_rgba(82,196,45,0.2)]"
                                                alt=""
                                            />
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon-green rounded-full flex items-center justify-center border-4 border-dark-card shadow-lg">
                                                <CheckCircle2 className="w-5 h-5 text-black" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-neon-green uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                                                <Shield className="w-3.5 h-3.5" />
                                                Tài khoản đã xác thực
                                            </p>
                                            <h4 className="text-2xl font-black text-gray-900 dark:text-white truncate uppercase tracking-tighter leading-none mb-1">{receiverInfo.full_name}</h4>
                                            <p className="text-xs text-gray-500 font-bold truncate opacity-80">{receiverInfo.email}</p>
                                        </div>
                                    </div>
                                ) : receiverEmail && !isCheckingEmail && receiverEmail.includes('@') ? (
                                    <div className="mx-2 p-6 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex items-center gap-4 animate-in fade-in duration-500">
                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-red-500 uppercase tracking-tighter leading-none">Không tìm thấy người dùng</p>
                                            <p className="text-[11px] text-gray-500 font-medium">Vui lòng kiểm tra lại email hoặc yêu cầu người nhận tạo tài khoản.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-500 font-bold italic px-6 uppercase tracking-widest opacity-60 text-center">
                                        * Vui lòng nhập email chính xác để định danh người nhận NFT
                                    </p>
                                )}
                            </div>

                            {/* Step 2: Confirmation & Fees */}
                            {receiverInfo && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="w-8 h-8 rounded-full bg-neon-green text-black flex items-center justify-center font-black text-xs">2</div>
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Xác nhận giao thức</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-2">
                                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phí Blockchain & AI</p>
                                                    <div className="group relative">
                                                        <Info className="w-3 h-3 text-gray-600 cursor-help" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                                                            Phí duy trì mạng diện rộng & quét ví AI đảm bảo an toàn giao dịch tối đa.
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-widest leading-none">10.000 <span className="text-xs text-neon-green font-bold">VND</span></p>
                                            </div>

                                            <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex flex-col justify-center">
                                                <div className="flex gap-4">
                                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                                    <p className="text-[10px] text-red-500/80 font-black leading-relaxed uppercase tracking-widest">
                                                        CẢNH BÁO: HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC. QUYỀN SỞ HỮU SẼ THAY ĐỔI VĨNH VIỄN.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Action */}
                                    <div className="pt-4 px-2">
                                        <button 
                                            onClick={handleTransfer}
                                            disabled={isTransferring}
                                            className="w-full bg-neon-green hover:bg-neon-hover disabled:opacity-30 text-black font-black uppercase tracking-[0.2em] py-8 rounded-[2rem] text-sm flex items-center justify-center gap-4 transition-all shadow-[0_20px_60px_-15px_rgba(82,196,45,0.4)] active:scale-[0.98] group"
                                        >
                                            {isTransferring ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Mã hóa & Chuyển quyền sở hữu...
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowRightLeft className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                                    Xác nhận và Chuyển nhượng ngay
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Marketplace Context */}
                            {!receiverInfo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-neon-green/10 rounded-xl">
                                                <Shield className="w-4 h-4 text-neon-green" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">NFT Secure Direct</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Bảo mật đa lớp đảm bảo tài sản được chuyển đến đúng địa chỉ đích mà không bị thay đổi thông tin.</p>
                                    </div>
                                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                                <TicketIcon className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Instat Transfer</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Quyền lợi về vé, bao gồm quyền tham gia sự kiện, sẽ được cập nhật ngay lập tức cho chủ sở hữu mới.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketTransfer;
