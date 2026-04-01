import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Tag, 
    DollarSign, 
    Shield, 
    AlertCircle, 
    Loader2, 
    CheckCircle2,
    Calendar,
    MapPin,
    Ticket as TicketIcon,
    ChevronRight,
    Info
} from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { marketplaceService } from '../../services/marketplace.service';
import toast from 'react-hot-toast';

const ResaleTicket = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resalePrice, setResalePrice] = useState('');
    const [isListing, setIsListing] = useState(false);

    useEffect(() => {
        fetchTicketDetail();
    }, [id]);

    const fetchTicketDetail = async () => {
        try {
            setLoading(true);
            const res = await ticketService.getTicketById(id);
            setTicket(res.data);
            setResalePrice(res.data.ticket_tier.price); // Default to original price
        } catch (error) {
            toast.error('Không thể tải thông tin vé.');
            navigate('/my-tickets');
        } finally {
            setLoading(false);
        }
    };

    const handleResaleConfirm = async () => {
        if (!resalePrice || resalePrice <= 0) {
            toast.error('Vui lòng nhập giá bán hợp lệ.');
            return;
        }

        if (ticket.event.price_ceiling && resalePrice > ticket.event.price_ceiling) {
            toast.error(`Giá bán không được vượt quá giá trần: ${ticket.event.price_ceiling.toLocaleString()} VND`);
            return;
        }

        try {
            setIsListing(true);
            const res = await marketplaceService.createListing(ticket.id, resalePrice);
            toast.success(res.message || 'Đăng bán vé thành công!');
            navigate('/my-tickets');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi khi đăng bán vé.');
        } finally {
            setIsListing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
            </div>
        );
    }

    if (!ticket) return null;

    const royaltyFee = (resalePrice * ticket.event.royalty_fee_percent) / 100;
    const netProfit = resalePrice - royaltyFee;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500 pt-24 pb-20 px-4 sm:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
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
                        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Niêm yết vé lên Marketplace</h1>
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/20 rounded-full">
                            <Shield className="w-4 h-4 text-neon-green" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-widest">Xác thực bởi BASTICKET</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Side: Ticket Preview */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="relative group overflow-hidden rounded-[2.5rem] bg-dark-card border border-white/5 shadow-2xl">
                            <img 
                                src={ticket.event.poster_url} 
                                alt={ticket.event.title}
                                className="w-full aspect-[3/4] object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-90" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                                <span className="inline-block px-3 py-1 bg-neon-green text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                                    {ticket.category_name}
                                </span>
                                <h3 className="text-3xl font-black text-white uppercase leading-none tracking-tighter">
                                    {ticket.event.title}
                                </h3>
                                <div className="flex flex-col gap-2 text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-neon-green" />
                                        <span className="text-[11px] font-bold uppercase tracking-wide">
                                            {new Date(ticket.event.start_date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-neon-green" />
                                        <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                                            {ticket.event.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ticket ID Card */}
                        <div className="p-8 bg-dark-card border border-white/5 rounded-[2rem] flex items-center justify-between shadow-xl">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">NFT Asset ID</p>
                                <p className="text-xl font-black text-white tracking-tighter leading-none">#{ticket.nft_token_id || 'NOT_MINTED'}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                <TicketIcon className="w-6 h-6 text-neon-green" />
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Resale Pricing Controls */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-dark-card border border-white/5 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Giá mua gốc</p>
                                <p className="text-2xl font-black text-white tracking-tighter">
                                    {ticket.ticket_tier.price.toLocaleString()} <span className="text-xs text-neon-green ml-1">VND</span>
                                </p>
                            </div>
                            <div className="p-6 bg-dark-card border border-white/5 rounded-3xl space-y-2">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Giá trần (Price Ceiling)</p>
                                <p className="text-2xl font-black text-red-500 tracking-tighter">
                                    {ticket.event.price_ceiling ? `${ticket.event.price_ceiling.toLocaleString()} VND` : 'Không giới hạn'}
                                </p>
                            </div>
                        </div>

                        {/* Price Input Form */}
                        <div className="p-10 bg-dark-card border border-white/10 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <DollarSign className="w-32 h-32 text-neon-green" />
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-xs font-black text-white uppercase tracking-[0.2em]">Giá niêm yết mới</label>
                                        <span className="text-[10px] font-black text-neon-green uppercase border border-neon-green/30 px-3 py-1 rounded-full">Matic Marketplace</span>
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-neon-green" />
                                        <input 
                                            type="number"
                                            placeholder="0"
                                            value={resalePrice}
                                            onChange={(e) => setResalePrice(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-8 pl-20 pr-8 text-4xl font-black text-white focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all placeholder:text-gray-800"
                                        />
                                    </div>
                                </div>

                                {/* Calculation Breakdown */}
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex justify-between items-center px-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Phí bản quyền (Royalty Fee)</p>
                                            <div className="group relative">
                                                <Info className="w-3 h-3 text-gray-600 cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
                                                    Khoản phí ({ticket.event.royalty_fee_percent}%) trích lại cho Ban tổ chức dựa trên giá bán của bạn.
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-red-500">-{royaltyFee.toLocaleString()} VND</p>
                                    </div>
                                    
                                    <div className="p-8 bg-neon-green/5 rounded-[2rem] border border-neon-green/20 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-neon-green uppercase tracking-[0.2em]">Số tiền bạn thực nhận</p>
                                            <p className="text-4xl font-black text-white tracking-tighter">
                                                {netProfit.toLocaleString()} <span className="text-lg text-neon-green">VND</span>
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="w-16 h-16 bg-neon-green rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(82,196,45,0.3)] animate-pulse">
                                                <CheckCircle2 className="w-8 h-8 text-black" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Warning Section */}
                            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Lưu ý quan trọng</p>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                        Sau khi xác nhận niêm yết, vé của bạn sẽ bị <b>tạm khóa (không thể sử dụng QR code)</b> cho đến khi có người mua hoặc bạn thực hiện gỡ bài đăng.
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button 
                                onClick={handleResaleConfirm}
                                disabled={isListing || !resalePrice || resalePrice <= 0}
                                className="w-full bg-neon-green hover:bg-neon-hover disabled:opacity-20 text-black font-black uppercase tracking-[0.2em] py-6 rounded-[1.5rem] text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-neon-green/20 active:scale-[0.98] border-none"
                            >
                                {isListing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Mã hóa & Đưa lên sàn...
                                    </>
                                ) : (
                                    <>
                                        <Tag className="w-5 h-5" />
                                        Xác nhận niêm yết vé ngay
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Marketplace Guidelines */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 text-neon-green">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Bảo vệ người bán</span>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-medium capitalize">Tiền bán vé sẽ được chuyển tự động vào ví BASTICKET của bạn ngay khi giao dịch hoàn tất.</p>
                            </div>
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 text-neon-green">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ký gửi an toàn</span>
                                </div>
                                <p className="text-[11px] text-gray-500 leading-relaxed font-medium capitalize">Hệ thống sẽ thay mặt bạn quản lý vé NFT và chuyển quyền sở hữu cho người mua mới.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResaleTicket;
