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
import { useTranslation } from 'react-i18next';
import { ticketService } from '../../services/ticket.service';
import { marketplaceService } from '../../services/marketplace.service';
import toast from 'react-hot-toast';

import { useSystemConfig } from '../../hooks/useSystemConfig';

const ResaleTicket = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        royaltyFee: royaltyPercent, 
        resaleTransactionFee: transactionFeePercent, 
        resalePriceCap,
        gasFee,
        loading: configLoading
    } = useSystemConfig();
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
            toast.error(t('resale.error_load') || 'Không thể tải thông tin vé.');
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
            toast.error(t('resale.error_invalid_price') || 'Vui lòng nhập giá bán hợp lệ.');
            return;
        }

        const originalPrice = Number(ticket.ticket_tier.price);
        const priceLimit = Number(ticket.event.resale_price_limit_percent || 107);
        const maxResalePrice = originalPrice * (priceLimit / 100);

        if (resalePrice > maxResalePrice) {
            toast.error(t('resale.error_price_limit', { limit: priceLimit, max: maxResalePrice.toLocaleString() }) || `Giá bán không được vượt quá ${priceLimit}% giá gốc: ${maxResalePrice.toLocaleString()} VND`);
            return;
        }

        try {
            setIsListing(true);
            if (isEditing) {
                // Cập nhật bài đăng hiện có
                await marketplaceService.updateListing(activeListingId, Number(resalePrice), selectedMerchandise);
                toast.success(t('resale.success_update') || 'Cập nhật bài đăng thành công!');
            } else {
                const res = await marketplaceService.createListing(ticket.id, resalePrice, selectedMerchandise);
                toast.success(t('resale.success_create') || res.message || 'Đăng bán vé thành công!');
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
        if (!window.confirm(t('resale.confirm_cancel_msg') || 'Bạn có chắc chắn muốn hủy bài đăng này? Vé sẽ được mở khóa để sử dụng bình thường.')) return;
        
        try {
            setIsCancelling(true);
            await marketplaceService.deleteListing(activeListingId);
            toast.success(t('resale.success_cancel') || 'Đã hủy bài đăng thành công.');
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
    
    // Calculations based on dynamic system config

    const merchandiseTotal = ticket.order?.merchandise_items
        ?.filter(item => selectedMerchandise.includes(item.id))
        ?.reduce((acc, item) => acc + (Number(item.unit_price) * item.quantity), 0) || 0;

    // Lấy phí từ Sự kiện (Ưu tiên) hoặc Hệ thống (Fallback)
    const eventResalePlatformFee = ticket.event.resale_platform_fee_percent !== null 
        ? Number(ticket.event.resale_platform_fee_percent) 
        : transactionFeePercent;
    
    const eventResaleGasFee = ticket.event.resale_gas_fee !== null 
        ? Number(ticket.event.resale_gas_fee) 
        : gasFee;

    const eventRoyaltyPercent = ticket.event.royalty_fee_percent !== null
        ? Number(ticket.event.royalty_fee_percent)
        : royaltyPercent;

    // Phí hệ thống (Người mua trả đã bao gồm - Hệ thống thu từ tổng tiền)
    const systemFee = (parseFloat(resalePrice || 0) * eventResalePlatformFee) / 100 + eventResaleGasFee; 
    
    // Phí bản quyền (Trả cho BTC) = % Bản quyền * Giá niêm yết
    const royaltyFee = (parseFloat(resalePrice || 0) * eventRoyaltyPercent) / 100;
    
    // Tổng số tiền người mua phải trả (Vé + Sản phẩm + Phí hệ thống cộng thêm)
    const buyerPays = parseFloat(resalePrice || 0) + merchandiseTotal + systemFee; 
    
    // Số tiền người bán thực nhận (Giá vé - Phí bản quyền + Giá trị sản phẩm)
    const netProfit = (parseFloat(resalePrice || 0) - royaltyFee) + merchandiseTotal; 


    return (
        <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-500 pt-10 pb-10 px-4 sm:px-8 relative overflow-hidden">
            {/* Background elements - Enhanced Neon Glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-green/10 blur-[130px] rounded-full animate-pulse duration-[4000ms]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-5xl mx-auto space-y-4 relative z-10">
                {/* Navigation & Header */}
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <Link 
                        to="/my-tickets" 
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-neon-hover dark:hover:text-neon-green transition-colors text-[12px] font-black group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        {t('resale.back_to_list')}
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                        <div className="space-y-2">
                            <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase leading-[1.1] tracking-tighter">
                                {isEditing ? t('resale.title_edit') : t('resale.title_list')} {t('resale.title_suffix')}
                            </h1>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/20 rounded-xl">
                            <Shield className="w-3.5 h-3.5 text-neon-green" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-tight">{t('resale.blockchain_verify')}</span>
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
                                        {t('resale.resale_asset')}
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
                                            {new Date(ticket.event.event_date).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                            {ticket.event.location_address}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-neon-green/[0.02] rounded-2xl border border-gray-100 dark:border-neon-green/10">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400">{t('resale.tier_pos')}</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">
                                            {ticket.ticket_tier.tier_name}
                                        </p>
                                        <p className="text-[10px] font-black text-neon-hover dark:text-neon-green uppercase truncate">
                                            {ticket.ticket_tier.section_name || (i18n.language === 'vi' ? 'Khu vực chung' : 'General Area')}
                                        </p>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 ">{t('resale.nft_id')}</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase">#{ticket.nft_token_id || (i18n.language === 'vi' ? 'CHƯA ĐÚC' : 'NOT MINTED')}</p>
                                        <p className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase">{t('resale.status_label')}: {t('resale.status_valid')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats - More Compact */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="px-3 py-3 bg-white dark:bg-[#0c0c0d] border border-gray-200 dark:border-white/5 rounded-2xl space-y-1">
                                <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase">{t('resale.original_price')}</p>
                                <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                                    {ticket.ticket_tier.price.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} <span className="text-[10px] text-neon-green">VND</span>
                                </p>
                            </div>
                             <div className="p-4 bg-white dark:bg-[#0c0c0d] border border-gray-200 dark:border-white/5 rounded-2xl space-y-1">
                                <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase">{t('resale.price_cap')} (+{Number(ticket.event.resale_price_limit_percent || 107) - 100}%)</p>
                                 <p className="text-lg font-black text-red-500 tracking-tight">
                                    {(ticket.ticket_tier.price * (Number(ticket.event.resale_price_limit_percent || 107) / 100)).toLocaleString()} <span className="text-[10px] text-red-500/50">VND</span>
                                 </p>
                            </div>
                        </div>

                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-red-500 uppercase">{t('resale.important_note')}</p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                    {t('resale.lock_qr_desc')}
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
                                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase">{t('resale.config_price_title')}</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-neon-green border border-neon-green/20 px-2 py-0.5 rounded-lg">{t('resale.anti_speculation')}</span>
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
                                                ≈ {Number(resalePrice).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
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
                                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase mt-4">{t('resale.merch_optional')}</h4>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {ticket.order.merchandise_items
                                            .filter(item => !item.is_redeemed && (!item.owner_id || item.owner_id === authUser?.userId || item.owner_id === authUser?.id))
                                            .map((item) => (
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
                                                            <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">{t('resale.merch_quantity')}: {item.quantity}</p>
                                                            <span className="text-[9px] font-black text-neon-green">|</span>
                                                            <p className="text-[9px] font-black text-neon-green uppercase tracking-tight">{Number(item.unit_price).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} VND</p>
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
                                        <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight mt-4">{t('resale.settlement_title')}</h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl space-y-1 border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                            <span>{t('resale.listing_price')}</span>
                                            <span>{Number(resalePrice || 0).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} VND</span>
                                        </div>
                                        {merchandiseTotal > 0 && (
                                            <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                                <span>{t('resale.merch_value')}</span>
                                                <span className="text-blue-500">+{merchandiseTotal.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} VND</span>
                                            </div>
                                        )}
                                         <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                             <span>{t('resale.system_fee')} {t('resale.fee_detail', { percent: eventResalePlatformFee, gas: eventResaleGasFee.toLocaleString() })}</span>
                                             <span className="text-red-500">+{systemFee.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                         </div>
                                         <div className="flex items-center justify-between text-[10px] font-black text-gray-500 dark:text-gray-400 ">
                                             <span className="text-orange-500">{t('resale.royalty_fee')} {t('resale.royalty_detail', { percent: eventRoyaltyPercent })}</span>
                                             <span className="text-orange-500">-{royaltyFee.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                         </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl space-y-1 border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 dark:text-gray-400">
                                            {t('resale.buyer_pays_label')}
                                        </div>
                                        <p className="text-lg font-black text-blue-500 leading-none">{buyerPays.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} <span className="text-[10px]">VND</span></p>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-neon-green/5 rounded-3xl border border-neon-green/20 flex items-center justify-between gap-6 shadow-inner">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-neon-green">{t('resale.net_profit_label')} {t('resale.net_profit_desc', { percent: eventRoyaltyPercent })}</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                                            {Number(netProfit).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} <span className="text-sm text-neon-green">VND</span>
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
                                                {t('resale.processing_btn')}
                                            </>
                                        ) : (
                                            <>
                                                {isEditing ? t('resale.update_btn') : t('resale.confirm_btn')}
                                            </>
                                        )}
                                    </button>

                                    {isEditing && (
                                        <button 
                                            onClick={handleCancelListing}
                                            disabled={isCancelling}
                                            className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black uppercase py-4 rounded-2xl text-[13px] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                                        >
                                            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : t('resale.cancel_btn')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Footer Trust Info */}
                            <div className="grid grid-cols-2 mt-8 gap-4">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Shield className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-tight">{t('resale.secure_smart_contract')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 justify-end">
                                    <AlertCircle className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-tight">{t('resale.ai_anti_fraud')}</span>
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
