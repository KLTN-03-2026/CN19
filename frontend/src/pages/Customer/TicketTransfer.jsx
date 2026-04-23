import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Send, 
    Shield, 
    AlertCircle, 
    Loader2, 
    Calendar,
    MapPin,
    Ticket as TicketIcon,
    Info,
    Package,
    CheckSquare,
    Square
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
    const [selectedMerch, setSelectedMerch] = useState([]); // Danh sách ID sản phẩm được chọn

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
            const res = await orderService.createTransferOrder(ticket.id, receiverEmail, selectedMerch);
            toast.success('Khởi tạo thanh toán phí chuyển nhượng thành công!');
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
            <div className="min-h-screen bg-white dark:bg-[#080808] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-neon-green animate-spin" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-500 pt-10 pb-10 px-4 sm:px-8 relative overflow-hidden">
            {/* Background elements - Enhanced Neon Glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-green/10 blur-[130px] rounded-full animate-pulse duration-[4000ms]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
            </div>

            <div className="max-w-5xl mx-auto space-y-2 relative z-10">
                {/* Navigation & Header */}
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Link 
                        to="/my-tickets" 
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-neon-hover dark:hover:text-neon-green transition-colors text-[12px] font-black group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        Trở về danh sách vé
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
                        <div className="space-y-4">
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase leading-[1.1] tracking-tighter">
                                Chuyển nhượng <br/> <span className="text-neon-hover dark:text-neon-green">tài sản NFT</span>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Ticket Preview */}
                    <div className="lg:col-span-5 space-y-4 animate-in fade-in slide-in-from-left-6 duration-1000">
                        <div className="bg-white dark:bg-[#0c0c0d] rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden group relative">
                            {/* Visual Representation */}
                            <div className="relative aspect-[16/9] overflow-hidden">
                                <img 
                                    src={ticket.event.image_url} 
                                    alt="" 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0c0c0d] via-transparent to-transparent"></div>
                                <div className="absolute top-4 left-4">
                                    <span className="bg-neon-green text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                                        TÀI SẢN NFT
                                    </span>
                                </div>
                            </div>

                            {/* Ticket Info Area */}
                            <div className="p-6 pt-2 space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase leading-tight tracking-tight group-hover:text-neon-hover dark:group-hover:text-neon-green transition-colors">
                                        {ticket.event.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-400 dark:text-gray-500 text-[11px] font-bold">
                                        <div className="flex items-center gap-1.5 capitalize">
                                            <Calendar className="w-3.5 h-3.5 text-neon-hover dark:text-neon-green" />
                                            {new Date(ticket.event.event_date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                            {ticket.event.location_address}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-neon-green/[0.02] rounded-2xl border border-gray-100 dark:border-neon-green/10">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-gray-400">Hạng vé / Vị trí</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">
                                            {ticket.ticket_tier.tier_name}
                                        </p>
                                        <p className="text-[10px] font-black text-neon-hover dark:text-neon-green uppercase truncate">
                                            {ticket.ticket_tier.section_name || 'Standard Area'}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                        <p className="text-[9px] font-black text-gray-400 ">Mã định danh</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">#{ticket.ticket_number}</p>
                                        <p className="text-[10px] font-black text-gray-500 uppercase">Token: {ticket.nft_token_id || '98271'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Direct Protocol Info */}
                        <div className="p-4 bg-neon-green/5 border border-neon-green/20 rounded-2xl flex gap-4 shadow-inner">
                            <Shield className="w-5 h-5 text-neon-hover dark:text-neon-green shrink-0" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-neon-hover dark:text-neon-green uppercase tracking-tight">Giao thức Chuyển quyền sở hữu</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    Hành động này sẽ thay đổi chủ sở hữu tài sản kỹ thuật số vĩnh viễn trên mạng lưới Blockchain. Vui lòng kiểm tra kỹ thông tin người nhận.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Transfer Form */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white dark:bg-[#0c0c0d] rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl p-8 md:p-10 space-y-10 relative overflow-hidden">
                             {/* Subtle Neon Decorative Glow */}
                             <div className="absolute top-0 right-0 w-48 h-48 bg-neon-green/5 blur-[80px] -z-10"></div>
                            
                            {/* Step 1: Input Email */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-md bg-neon-green text-black flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(57,255,20,0.3)]">01</span>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase">Thông tin người nhận</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-neon-hover dark:text-neon-green/60">Email định danh duy nhất</span>
                                </div>

                                <div className="relative group">
                                    <Send className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-neon-green transition-colors" />
                                    <input 
                                        type="email"
                                        placeholder="Nhập email tài khoản BASTICKET người nhận..."
                                        value={receiverEmail}
                                        onChange={(e) => setReceiverEmail(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl py-2.5 pl-14 pr-8 text-[13px] font-bold text-gray-900 dark:text-white focus:outline-none focus:border-neon-green focus:ring-4 focus:ring-neon-green/5 transition-all"
                                    />
                                    {isCheckingEmail && (
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 text-neon-green animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Compact Receiver Info */}
                                {receiverInfo ? (
                                    <div className="px-4 py-2 bg-neon-green/10 border border-neon-green/20 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-500 shadow-lg shadow-neon-green/[0.05]">
                                        <div className="w-12 h-12 rounded-full border-2 border-neon-green/50 overflow-hidden bg-gray-800 shrink-0 shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                                            <img 
                                                src={(receiverInfo.avatar_url || receiverInfo.avatarUrl) 
                                                    ? ((receiverInfo.avatar_url || receiverInfo.avatarUrl).startsWith('http') 
                                                        ? (receiverInfo.avatar_url || receiverInfo.avatarUrl) 
                                                        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${receiverInfo.avatar_url || receiverInfo.avatarUrl}`)
                                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverInfo.full_name}`} 
                                                className="w-full h-full object-cover"
                                                alt=""
                                                onError={(e) => {
                                                    // Tránh lặp vô hạn nếu DiceBear cũng lỗi
                                                    if (!e.target.src.includes('dicebear')) {
                                                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverInfo.full_name}`;
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white tracking-tight truncate">{receiverInfo.full_name}</h4>
                                            </div>
                                            <p className="text-[11px] text-neon-hover dark:text-neon-green font-black truncate leading-none ">{receiverInfo.email}</p>
                                        </div>
                                    </div>
                                ) : receiverEmail && !isCheckingEmail && receiverEmail.includes('@') ? (
                                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        <span className="text-[11px] font-black text-red-500 uppercase">Cảnh báo: Không tìm thấy tài khoản đích</span>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-tight opacity-50">
                                        Xác thực chủ sở hữu mới thông qua hệ thống định danh BASTICKET
                                    </p>
                                )}
                            </div>

                            {/* Merchandise Selection Section */}
                            {receiverInfo && ticket?.order?.merchandise_items?.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-5 h-5 text-neon-green" />
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Sản phẩm đi kèm (Miễn phí chuyển)</h3>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const allIds = ticket.order.merchandise_items.map(m => m.id);
                                                setSelectedMerch(selectedMerch.length === allIds.length ? [] : allIds);
                                            }}
                                            className="text-[10px] font-black text-neon-green uppercase hover:underline"
                                        >
                                            {selectedMerch.length === ticket.order.merchandise_items.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {ticket.order.merchandise_items.map((item) => {
                                            const isSelected = selectedMerch.includes(item.id);
                                            // Kiểm tra xem user có thực sự sở hữu món này không (nếu đã chuyển nhượng xé lẻ trước đó)
                                            const isOwner = !item.owner_id || item.owner_id === authUser?.userId || item.owner_id === authUser?.id;
                                            
                                            if (!isOwner) return null;

                                            return (
                                                <div 
                                                    key={item.id}
                                                    onClick={() => {
                                                        setSelectedMerch(prev => 
                                                            prev.includes(item.id) 
                                                                ? prev.filter(id => id !== item.id) 
                                                                : [...prev, item.id]
                                                        );
                                                    }}
                                                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                                        isSelected 
                                                            ? 'bg-neon-green/10 border-neon-green/50 shadow-[0_0_15px_rgba(82,196,45,0.1)]' 
                                                            : 'bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/5 hover:border-neon-green/30'
                                                    }`}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden shrink-0">
                                                        <img src={item.merchandise.image_url} alt={item.merchandise.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-black text-gray-900 dark:text-white truncate uppercase">{item.merchandise.name}</p>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Số lượng: {item.quantity}</p>
                                                    </div>
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-neon-green" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-300 dark:text-gray-700" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Fees & Action */}
                            {receiverInfo && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-md bg-neon-green text-black flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(57,255,20,0.3)]">02</span>
                                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase">Xác nhận giao dịch</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="px-5 py-3 bg-gray-50 dark:bg-neon-green/[0.03] border border-gray-100 dark:border-neon-green/20 rounded-2xl space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-none">Phí Chuyển đổi NFT</p>
                                                    <Info className="w-3 h-3 text-neon-hover dark:text-neon-green" />
                                                </div>
                                                <p className="text-2xl font-black text-gray-900 dark:text-white  leading-none">
                                                    10.000 <span className="text-[10px] text-neon-hover dark:text-neon-green">VND</span>
                                                </p>
                                            </div>

                                            <div className="px-5 py-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                                <p className="text-[10px] text-red-500 font-bold leading-tight">
                                                    Sở hữu vĩnh viễn: Hành động không thể hoàn tác sau khi thanh toán.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleTransfer}
                                        disabled={isTransferring}
                                        className="w-full bg-neon-green hover:bg-neon-hover disabled:opacity-30 text-black font-black uppercase tracking-tight py-4 rounded-[1.25rem] text-[13px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_15px_35px_-10px_rgba(57,255,20,0.4)]"
                                    >
                                        {isTransferring ? (
                                            <>
                                                Xử lý giao thức...
                                            </>
                                        ) : (
                                            <>
                                                Xác nhận Chuyển nhượng ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Trust Signals */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5 group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                                        <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight group-hover:text-blue-500 transition-colors">Tài sản NFT</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed capitalize">Xác định duy nhất bởi mã định danh tài sản kỹ thuật số trên mạng lưới Polygon.</p>
                                </div>
                                <div className="space-y-1.5 group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-green shadow-[0_0_5px_rgba(57,255,20,0.5)]"></div>
                                        <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight group-hover:text-neon-green transition-colors">Kho số Digital</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed capitalize">Quyền sở hữu được cập nhật thông minh và lưu trữ cực kỳ bảo mật cho người dùng mới.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketTransfer;
