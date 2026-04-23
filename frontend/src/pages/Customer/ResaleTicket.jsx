import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Tag, 
    Coins, 
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
    const [selectedMerchandise, setSelectedMerchandise] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [activeListingId, setActiveListingId] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        fetchTicketDetail();
    }, [id]);

    const fetchTicketDetail = async () => {
        try {
            setLoading(true);
            const res = await ticketService.getTicketById(id);
            const ticketData = res.data;
            setTicket(ticketData);
            
            // Kiểm tra xem có bài đăng active không
            const activeListing = ticketData.marketplace_listings?.find(l => l.status === 'active');
            if (activeListing) {
                setIsEditing(true);
                setActiveListingId(activeListing.id);
                // Lấy giá vé từ metadata nếu có, nếu không lấy asking_price (trừ đi merchandise nếu có)
                const metadata = activeListing.metadata || {};
                setResalePrice(metadata.ticket_price || activeListing.asking_price);
                setSelectedMerchandise(metadata.merchandise_item_ids || []);
            } else {
                setResalePrice(ticketData.ticket_tier.price); // Default to original price
            }
        } catch (error) {
            toast.error('Không thể tải thông tin vé.');
            navigate('/my-tickets');
        } finally {
            setLoading(false);
        }
    };

    const toggleMerchandise = (itemId) => {
        setSelectedMerchandise(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId) 
                : [...prev, itemId]
        );
    };

    const handleResaleConfirm = async () => {
        if (!resalePrice || resalePrice <= 0) {
            toast.error('Vui lòng nhập giá bán hợp lệ.');
            return;
        }

        const originalPrice = Number(ticket.ticket_tier.price);
        const limitPercent = Number(ticket.event.resale_price_limit_percent || 108.0);
        const maxResalePrice = (originalPrice * limitPercent) / 100;

        if (resalePrice > maxResalePrice) {
            toast.error(`Giá bán không được vượt quá ${limitPercent}% giá gốc: ${maxResalePrice.toLocaleString()} VND`);
            return;
        }

        try {
            setIsListing(true);
            if (isEditing) {
                // Cập nhật bài đăng hiện có
                await marketplaceService.updateListing(activeListingId, Number(resalePrice), selectedMerchandise);
                toast.success('Cập nhật bài đăng thành công!');
            } else {
                const res = await marketplaceService.createListing(ticket.id, resalePrice, selectedMerchandise);
                toast.success(res.message || 'Đăng bán vé thành công!');
            }
            navigate('/my-tickets');
        } catch (error) {
            const errorMsg = error.response?.data?.details 
                ? `${error.response.data.error}: ${error.response.data.details}`
                : (error.response?.data?.error || 'Lỗi khi thực hiện thao tác.');
            toast.error(errorMsg);
        } finally {
            setIsListing(false);
        }
    };

    const handleCancelListing = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy bài đăng này? Vé sẽ được mở khóa để sử dụng bình thường.')) return;
        
        try {
            setIsCancelling(true);
            await marketplaceService.deleteListing(activeListingId);
            toast.success('Đã hủy bài đăng thành công.');
            navigate('/my-tickets');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi khi hủy bài đăng.');
        } finally {
            setIsCancelling(false);
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

    const event = ticket.event;
    const profit = Math.max(0, resalePrice - ticket.ticket_tier.price);
    
    // Phí từ database
    const royaltyPercent = Number(event.royalty_fee_percent || 3.0);
    const platformPercent = Number(event.resale_platform_fee_percent || 3.0);
    const gasFee = Number(event.resale_gas_fee || 10000);

    const merchandiseTotal = ticket.order?.merchandise_items
        ?.filter(item => selectedMerchandise.includes(item.id))
        ?.reduce((acc, item) => acc + (Number(item.unit_price) * item.quantity), 0) || 0;

    const royaltyFee = resalePrice > ticket.ticket_tier.price ? (ticket.ticket_tier.price * royaltyPercent) / 100 : 0; 
    const systemFee = (resalePrice * platformPercent) / 100 + gasFee; 
    
    // Tổng số tiền người mua phải trả (Vé + Sản phẩm + Phí)
    const buyerPays = parseFloat(resalePrice || 0) + merchandiseTotal + systemFee; 
    
    // Số tiền người bán thực nhận (Vé + Sản phẩm - Phí bản quyền)
    const netProfit = parseFloat(resalePrice || 0) + merchandiseTotal - royaltyFee; 


    return (
        <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-500 pt-10 pb-10 px-4 sm:px-8 relative overflow-hidden">
            {/* Background elements - Enhanced Neon Glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-green/10 blur-[130px] rounded-full animate-pulse duration-[4000ms]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
            </div>

            <div className="max-w-5xl mx-auto space-y-4 relative z-10">
                {/* Navigation & Header */}
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Link 
                        to="/my-tickets" 
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-neon-hover dark:hover:text-neon-green transition-colors text-[12px] font-black group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        Quay lại kho vé
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                        <div className="space-y-2">
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase leading-[1.1] tracking-tighter">
                                {isEditing ? 'Chỉnh sửa' : 'Niêm yết'} lên <br/> <span className="text-neon-hover dark:text-neon-green">Marketplace</span>
                            </h1>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/20 rounded-xl">
                            <Shield className="w-3.5 h-3.5 text-neon-green" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-tight">Xác thực Blockchain</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Side: Ticket Preview */}
                    <div className="lg:col-span-5 space-y-4 animate-in fade-in slide-in-from-left-6 duration-1000">
                        <div className="bg-white dark:bg-[#0c0c0d] rounded-3xl border border-gray-200 dark:border-white/5 shadow-xl overflow-hidden group relative">
                            <div className="relative aspect-[16/9] overflow-hidden">
                                <img 
                                    src={ticket.event.image_url} 
                                    alt={ticket.event.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0c0c0d] via-transparent to-transparent" />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-neon-green text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                                        TÀI SẢN BÁN LẠI
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 pt-2 space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase leading-tight tracking-tight group-hover:text-neon-hover dark:group-hover:text-neon-green transition-colors">
                                        {ticket.event.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 dark:text-gray-400 text-[11px] font-bold">
                                        <div className="flex items-center gap-1.5">
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
                                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400">Hạng vé / Vị trí</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">
                                            {ticket.ticket_tier.tier_name}
                                        </p>
                                        <p className="text-[10px] font-black text-neon-hover dark:text-neon-green uppercase truncate">
                                            {ticket.ticket_tier.section_name || 'Standard Area'}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 ">Mã định danh NFT</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">#{ticket.nft_token_id || 'CHƯA ĐÚC'}</p>
                                        <p className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase">Trạng thái: Hợp lệ</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats - More Compact */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="px-3 py-3 bg-white dark:bg-[#0c0c0d] border border-gray-200 dark:border-white/5 rounded-2xl space-y-1">
                                <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase">Giá mua gốc</p>
                                <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    {ticket.ticket_tier.price.toLocaleString('vi-VN')} <span className="text-[10px] text-neon-green">VND</span>
                                </p>
                            </div>
                            <div className="p-4 bg-white dark:bg-[#0c0c0d] border border-gray-200 dark:border-white/5 rounded-2xl space-y-1">
                                <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase">Giá trần (+8%)</p>
                                <p className="text-lg font-black text-red-500 tracking-tight">
                                    {(ticket.ticket_tier.price * 1.08).toLocaleString()} <span className="text-[10px] text-red-500/50">VND</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-red-500 uppercase">Lưu ý quan trọng</p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                    Sau khi niêm yết, vé sẽ bị <b>tạm khóa QR Code</b> cho đến khi giao dịch hoàn tất hoặc bạn gỡ bài đăng.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Resale Pricing Controls */}
                    <div className="lg:col-span-7 space-y-2">
                        <div className="bg-white dark:bg-[#0c0c0d] rounded-3xl border border-gray-200 dark:border-white/5 shadow-2xl p-8 md:p-10 space-y- relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-neon-green/5 blur-[80px] -z-10"></div>
                            
                            {/* Step 1: Price Input */}
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-md bg-neon-green text-black flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(57,255,20,0.3)]">01</span>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase">Cấu hình giá niêm yết</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-lg">Giao thức Chống đầu cơ</span>
                                </div>
                                
                                <div className="relative group">
                                    <Coins className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 group-focus-within:text-neon-green transition-colors" />
                                    <input 
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={resalePrice}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            // Giới hạn không cho nhập quá dài
                                            if (val.length <= 12) setResalePrice(val);
                                        }}
                                        className="w-full bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-14 pr-32 text-2xl font-black text-gray-900 dark:text-white focus:outline-none focus:border-neon-green focus:ring-4 focus:ring-neon-green/5 transition-all"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-end pointer-events-none">
                                        <span className="text-xs font-black text-neon-green uppercase tracking-tighter">VND</span>
                                        {resalePrice && (
                                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 animate-in fade-in slide-in-from-right-2">
                                                ≈ {Number(resalePrice).toLocaleString('vi-VN')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Merchandise Selection */}
                            {ticket.order?.merchandise_items?.length > 0 && (
                                <div className="space-y-4">
                                    <div className="relative flex items-center justify-start">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-gray-100 dark:border-white/5 mt-4"></div>
                                        </div>
                                        <div className="relative flex items-center gap-2 bg-white dark:bg-[#0c0c0d] pr-4">
                                            <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(37,99,235,0.4)] mt-4">02</span>
                                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase mt-4">Sản phẩm tặng kèm (Tùy chọn)</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {ticket.order.merchandise_items.map((item) => (
                                            <div 
                                                key={item.id}
                                                onClick={() => toggleMerchandise(item.id)}
                                                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                                    selectedMerchandise.includes(item.id)
                                                        ? 'bg-neon-green/10 border-neon-green/50 shadow-[0_0_15px_rgba(82,196,45,0.1)]'
                                                        : 'bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/5 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/5">
                                                        <img src={item.merchandise.image_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{item.merchandise.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Số lượng: {item.quantity}</p>
                                                            <span className="text-[9px] font-black text-neon-green">|</span>
                                                            <p className="text-[9px] font-black text-neon-green uppercase tracking-tight">{Number(item.unit_price).toLocaleString()} VND</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                    selectedMerchandise.includes(item.id)
                                                        ? 'bg-neon-green border-neon-green'
                                                        : 'bg-white/5 border-gray-200 dark:border-white/10 group-hover:border-white/30'
                                                }`}>
                                                    {selectedMerchandise.includes(item.id) && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Breakdown & Confirm */}
                            <div className="space-y-4">
                                <div className="relative flex items-center justify-start">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-gray-100 dark:border-white/5 mt-4"></div>
                                    </div>
                                    <div className="relative flex items-center gap-2 bg-white dark:bg-[#0c0c0d] pr-4">
                                        <span className="w-6 h-6 rounded-md bg-orange-500 text-white flex items-center justify-center font-black text-[10px] shadow-[0_0_10px_rgba(249,115,22,0.4)] mt-4">03</span>
                                        <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight mt-4">Quyết toán giao dịch</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl space-y-1 border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                            <span>Giá niêm yết vé</span>
                                            <span>{Number(resalePrice || 0).toLocaleString()} VND</span>
                                        </div>
                                        {merchandiseTotal > 0 && (
                                            <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                                <span>Giá trị sản phẩm kèm theo</span>
                                                <span className="text-blue-500">+{merchandiseTotal.toLocaleString()} VND</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                            <span>Phí hệ thống ({event.resale_platform_fee_percent}% + {Number(event.resale_gas_fee).toLocaleString()})</span>
                                            <span className="text-red-500">+{systemFee.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                            <span className="text-orange-500">Phí bản quyền BTC ({royaltyFee > 0 ? `${event.royalty_fee_percent}%` : '0đ'})</span>
                                            <span className="text-orange-500">-{royaltyFee.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl space-y-1 border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400">
                                            Giá hiển thị trên Chợ (Người mua trả)
                                        </div>
                                        <p className="text-lg font-black text-blue-500 leading-none">{buyerPays.toLocaleString()} <span className="text-[10px]">VND</span></p>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-neon-green/5 rounded-3xl border border-neon-green/20 flex items-center justify-between gap-6 shadow-inner">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-neon-green">Số tiền bạn nhận về (Vé + Sản phẩm - Phí BTC)</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                                            {Number(netProfit).toLocaleString('vi-VN')} <span className="text-sm text-neon-green">VND</span>
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-neon-green rounded-2xl flex items-center justify-center shadow-lg shadow-neon-green/20">
                                        <CheckCircle2 className="w-4 h-4 text-black" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={handleResaleConfirm}
                                        disabled={isListing || !resalePrice || resalePrice <= 0}
                                        className="w-full bg-neon-green hover:bg-neon-hover disabled:opacity-20 text-black font-black uppercase py-4 rounded-2xl text-[13px] flex items-center justify-center gap-3 transition-all shadow-[0_15px_30px_-10px_rgba(82,196,45,0.4)] active:scale-[0.98] border-none"
                                    >
                                        {isListing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Đang mã hóa dữ liệu...
                                            </>
                                        ) : (
                                            <>
                                                {isEditing ? 'Cập nhật trên chợ vé' : 'Xác nhận niêm yết ngay'}
                                            </>
                                        )}
                                    </button>

                                    {isEditing && (
                                        <button 
                                            onClick={handleCancelListing}
                                            disabled={isCancelling}
                                            className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black uppercase py-4 rounded-2xl text-[13px] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                        >
                                            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hủy bài đăng (Gỡ khỏi chợ)'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Footer Trust Info */}
                            <div className="grid grid-cols-2 mt-8 gap-4">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Shield className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-tight">Bảo mật Smart Contract</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 justify-end">
                                    <AlertCircle className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-tight">Chống gian lận AI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResaleTicket;
