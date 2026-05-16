import React, { useState, useEffect } from 'react';
import { 
    ShoppingBag, 
    Calendar, 
    MapPin, 
    Search, 
    Clock, 
    QrCode, 
    Tag,
    Eye,
    AlertCircle,
    Loader2,
    LayoutGrid,
    List,
    CheckCircle2,
    X,
    ExternalLink,
    Sparkles,
    Package,
    ArrowRight,
    ArrowLeftRight,
    User,
    Info,
    Receipt
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import merchandiseService from '../../services/merchandise.service';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const MyProducts = () => {
    const { t, i18n } = useTranslation();
    const { gasFee: systemGasFee, resaleTransactionFee } = useSystemConfig();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'received'
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [showSoldInfoModal, setShowSoldInfoModal] = useState(false);
    const [showListingModal, setShowListingModal] = useState(false);
    const [isRedeemed, setIsRedeemed] = useState(false);

    const formatImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30';
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url}`;
    };

    useEffect(() => {
        fetchMerchandise();
    }, []);

    const fetchMerchandise = async () => {
        try {
            setLoading(true);
            const res = await merchandiseService.getMyMerchandise();
            setItems(res.data || []);
        } catch (error) {
            toast.error(t('merchandise.error_loading') || 'Không thể tải danh sách sản phẩm.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPickup = (item) => {
        setSelectedItem(item);
        setIsRedeemed(!!item.is_redeemed);
        setShowPickupModal(true);
    };

    // Polling trạng thái nhận hàng
    useEffect(() => {
        let pollTimer;
        if (showPickupModal && selectedItem && !isRedeemed) {
            pollTimer = setInterval(async () => {
                try {
                    const res = await merchandiseService.getMerchandiseItemById(selectedItem.id);
                    if (res.data?.is_redeemed === true) {
                        setSelectedItem(res.data);
                        setIsRedeemed(true);
                        toast.success(t('merchandise.details.pickup_success') || 'Tuyệt vời! Bạn đã nhận hàng thành công.');
                        // Làm mới danh sách ở nền
                        fetchMerchandise();
                    }
                } catch (error) {
                    console.error("Lỗi khi kiểm tra trạng thái sản phẩm:", error);
                }
            }, 3000);
        }
        return () => clearInterval(pollTimer);
    }, [showPickupModal, selectedItem, isRedeemed]);

    const handleViewListing = (item) => {
        setSelectedItem(item);
        setShowListingModal(true);
    };

    const handleViewSoldInfo = (item) => {
        setSelectedItem(item);
        setShowSoldInfoModal(true);
    };

    const getItemStatus = (item) => {
        if (item.status === 'sold') return 'sold';
        if (item.status === 'transferred') return 'transferred';
        if (item.status === 'listing') return 'listing';
        if (item.status === 'cancelled') return 'cancelled';
        if (item.is_redeemed || item.status === 'received') return 'received';
        return 'pending';
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.merchandise.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.merchandise.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.event_title?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        const currentStatus = getItemStatus(item);
        if (activeTab === 'all') return true;
        return currentStatus === activeTab;
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0
        }).format(price) + (i18n.language === 'vi' ? ' VNĐ' : ' VND');
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-3 py-1 rounded-full text-[10px] font-black border uppercase whitespace-nowrap inline-flex items-center gap-1.5";
        switch (status) {
            case 'pending':
                return <span className={`${baseClass} bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20`}><Clock className="w-2.5 h-2.5" />{t('merchandise.status.pending')}</span>;
            case 'received':
                return <span className={`${baseClass} bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20`}><CheckCircle2 className="w-2.5 h-2.5" />{t('merchandise.status.received')}</span>;
            case 'listing':
                return <span className={`${baseClass} bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20`}><Tag className="w-2.5 h-2.5" />{t('merchandise.status.listing')}</span>;
            case 'sold':
                return <span className={`${baseClass} bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20`}><Receipt className="w-2.5 h-2.5" />{t('merchandise.status.sold')}</span>;
            case 'transferred':
                return <span className={`${baseClass} bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20`}><ArrowLeftRight className="w-2.5 h-2.5" />{t('merchandise.status.transferred')}</span>;
            case 'cancelled':
                return <span className={`${baseClass} bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20`}><X className="w-2.5 h-2.5" />{t('merchandise.status.cancelled')}</span>;
            default:
                return <span className={`${baseClass} bg-gray-500/10 text-gray-500 border-gray-500/20`}>{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white transition-colors duration-500 pb-24 overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-neon-green/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-blue-500/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1450px] mx-auto px-6 md:px-12 pt-8 space-y-4">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="space-y-1">
                            <h1 className="text-xl md:text-3xl font-black uppercase leading-tight">
                                {t('merchandise.header.title')}
                            </h1>
                            <p className="text-[13px] text-gray-700 dark:text-gray-400 font-medium max-w-lg leading-relaxed">
                                {t('merchandise.header.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-0.5 animate-in fade-in slide-in-from-bottom-10 duration-1000 w-full lg:w-auto">
                        <div className="px-3 py-2.5 md:py-3 border-r border-b md:border-b-0 border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase mb-0.5">{t('merchandise.labels.total')}</p>
                            <h4 className="text-lg md:text-xl font-black text-gray-900 dark:text-white">{items.length}</h4>
                        </div>
                        <div className="px-3 py-2.5 md:py-3 border-b md:border-r md:border-b-0 border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase mb-0.5">{t('merchandise.status.pending')}</p>
                            <h4 className="text-lg md:text-xl font-black text-amber-500">{items.filter(i => (i.status || 'pending') === 'pending').length}</h4>
                        </div>
                        <div className="px-3 py-2.5 md:py-3 border-r border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase mb-0.5">{t('merchandise.status.listing')}</p>
                            <h4 className="text-lg md:text-xl font-black text-blue-500">{items.filter(i => i.status === 'listing').length}</h4>
                        </div>
                        <div className="px-3 py-2.5 md:py-3 text-center">
                            <p className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase mb-0.5">{t('merchandise.status.sold')}</p>
                            <h4 className="text-lg md:text-xl font-black text-purple-500">{items.filter(i => i.status === 'sold').length}</h4>
                        </div>
                    </div>
                </header>

                {/* Controls Section */}
                <div className="space-y-3">
                    <div className="relative group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl transition-all duration-300 focus-within:border-neon-green/50">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-green transition-colors" />
                        <input 
                            type="text"
                            placeholder={t('marketplace.filters.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-5 py-3.5 bg-transparent text-[13px] font-medium border-0 focus:ring-0 placeholder:text-gray-500 text-gray-900 dark:text-white"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="no-scrollbar overflow-x-auto flex-1">
                            <div className="flex gap-1.5 p-1 bg-white dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-xl w-max">
                                {[
                                    { id: 'all', label: t('merchandise.status.all') },
                                    { id: 'pending', label: t('merchandise.status.pending') },
                                    { id: 'received', label: t('merchandise.status.received') },
                                    { id: 'listing', label: t('merchandise.status.listing') },
                                    { id: 'sold', label: t('merchandise.status.sold') },
                                    { id: 'transferred', label: t('merchandise.status.transferred') },
                                    { id: 'cancelled', label: t('merchandise.status.cancelled') }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                                            activeTab === tab.id 
                                                ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10' 
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* View Mode Buttons */}
                        <div className="flex items-center gap-1 bg-white dark:bg-white/[0.01] border border-gray-200 dark:border-white/5 rounded-xl p-1 shrink-0">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-neon-green text-black' : 'text-gray-500 hover:bg-white/5'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-neon-green text-black' : 'text-gray-500 hover:bg-white/5'}`}
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>


                {/* Content */}
                <main className="min-h-[40rem]">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-[22rem] bg-white/[0.03] border border-white/5 rounded-[2rem] animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6" : "space-y-3"}>
                            {filteredItems.map((item, idx) => (
                                viewMode === 'grid' ? (
                                    <div 
                                        key={item.id}
                                        className={`group bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-[2rem] overflow-hidden hover:border-neon-green/20 transition-all duration-500 shadow-sm animate-in fade-in slide-in-from-bottom-6`}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        {/* Image */}
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            <img 
                                                src={item.merchandise.image_url} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                                                alt={item.merchandise.name}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            
                                            <div className="absolute top-3 left-3">
                                                {getStatusBadge(getItemStatus(item))}
                                            </div>
    
                                            {['pending', 'received'].includes(getItemStatus(item)) && (
                                                <div className="absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => handleViewPickup(item)}
                                                        className="w-full py-2 bg-neon-green text-black text-[9px] font-black uppercase rounded-lg flex items-center justify-center gap-2"
                                                    >
                                                        {item.is_redeemed ? <Eye className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
                                                        {item.is_redeemed ? t('merchandise.labels.view_details') : t('merchandise.labels.pickup_code')}
                                                    </button>
                                                </div>
                                            )}
    
                                            {['sold', 'transferred'].includes(getItemStatus(item)) && (
                                                <div className="absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => handleViewSoldInfo(item)}
                                                        className="w-full py-2 bg-neon-green text-black text-[9px] font-black uppercase rounded-lg flex items-center justify-center gap-2"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        {t('merchandise.labels.view_details')}
                                                    </button>
                                                </div>
                                            )}
    
                                            {getItemStatus(item) === 'listing' && (
                                                <div className="absolute bottom-3 left-3 right-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={() => handleViewListing(item)}
                                                        className="w-full py-2 bg-blue-500 text-white text-[9px] font-black uppercase rounded-lg flex items-center justify-center gap-2"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {t('merchandise.labels.listing_details_btn')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
    
                                        {/* Info */}
                                        <div className="p-4 space-y-3">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-neon-green uppercase tracking-tight line-clamp-1 flex-1">
                                                        {item.event_title}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 ml-2">
                                                        x{item.quantity}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-tight line-clamp-1">{item.merchandise.name}</h3>
                                            </div>
    
                                            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-500">{t('merchandise.labels.total')}</span>
                                                    <span className="text-[15px] font-black text-gray-900 dark:text-white">{formatPrice(item.subtotal)}</span>
                                                </div>
                                                <Link 
                                                    to={`/my-transactions/${item.transaction_id || item.transaction_number || item.mkt_transaction_number || item.order_id}`}
                                                    className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-neon-green rounded-lg transition-all"
                                                    title="Xem chi tiết giao dịch"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // List View Row
                                    <div 
                                        key={item.id}
                                        className="group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-3 flex items-center gap-4 hover:border-neon-green/30 transition-all animate-in fade-in slide-in-from-right-4"
                                    >
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                                            <img src={item.merchandise.image_url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-neon-green uppercase line-clamp-1">{item.event_title}</p>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{item.merchandise.name}</h3>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">{t('merchandise.labels.total')}</span>
                                                    <span className="text-xs font-black text-gray-900 dark:text-white">{formatPrice(item.subtotal)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase">{t('merchandise.labels.quantity')}</span>
                                                    <span className="text-xs font-black text-gray-900 dark:text-white">x{item.quantity}</span>
                                                </div>
                                            </div>
 
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="hidden sm:block">
                                                    {getStatusBadge(getItemStatus(item))}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {['pending', 'received'].includes(getItemStatus(item)) && (
                                                        <button 
                                                            onClick={() => handleViewPickup(item)}
                                                            className="p-2 bg-neon-green text-black rounded-xl hover:scale-105 transition-all"
                                                            title={item.is_redeemed ? t('merchandise.labels.view_details') : t('merchandise.labels.pickup_code')}
                                                        >
                                                            {item.is_redeemed ? <Eye className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    {['sold', 'transferred'].includes(getItemStatus(item)) && (
                                                        <button 
                                                            onClick={() => handleViewSoldInfo(item)}
                                                            className="p-2 bg-neon-green text-black rounded-xl hover:scale-105 transition-all"
                                                            title={t('merchandise.labels.view_details')}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {getItemStatus(item) === 'listing' && (
                                                        <button 
                                                            onClick={() => handleViewListing(item)}
                                                            className="p-2 bg-blue-500 text-white rounded-xl hover:scale-105 transition-all"
                                                        >
                                                            <Tag className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <Link 
                                                        to={`/my-transactions/${item.transaction_id || item.transaction_number || item.mkt_transaction_number || item.order_id}`}
                                                        className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-neon-green rounded-xl transition-all"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-dark-card border border-dashed border-gray-300 dark:border-white/10 rounded-[3rem] p-20 text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="w-8 h-8 text-gray-400 opacity-20" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-2">{t('merchandise.header.empty_title')}</h3>
                            <p className="text-[12px] text-gray-500 max-w-xs mx-auto mb-8 leading-relaxed">{t('merchandise.header.empty_desc')}</p>
                            <Link 
                                to="/events"
                                className="inline-flex items-center gap-2 bg-neon-green text-black px-8 py-3.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-neon-green/10"
                            >
                                {t('merchandise.header.explore_btn')}
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </main>
            </div>

            {/* Pickup Modal */}
            {showPickupModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowPickupModal(false)}></div>
                    <div className="relative bg-white dark:bg-dark-card w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 animate-in zoom-in-95 duration-300 mt-20">
                        <div className="bg-neon-green px-6 py-4 text-black relative">
                            <button onClick={() => setShowPickupModal(false)} className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all">
                                <X className="w-4 h-4" />
                            </button>
                            <h2 className="text-xl font-black uppercase leading-tight mb-1">{selectedItem.merchandise.name}</h2>
                            <p className="text-[9px] font-black opacity-60 uppercase">
                                {selectedItem.merchandise.event?.title || selectedItem.order?.event?.title || selectedItem.event_title || 'Sản phẩm sự kiện'}
                            </p>
                        </div>
                        
                        <div className="px-8 py-6 flex flex-col items-center space-y-5">
                            {isRedeemed ? (
                                <div className="w-full py-4 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-neon-green/20 blur-[30px] rounded-full animate-pulse"></div>
                                        <div className="relative w-20 h-20 bg-neon-green text-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(57,255,20,0.3)]">
                                            <CheckCircle2 className="w-10 h-10 stroke-[3px]" />
                                        </div>
                                        <div className="absolute -top-3 -right-3">
                                            <Sparkles className="w-6 h-6 text-neon-green animate-bounce" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-gray-900 dark:text-neon-green uppercase tracking-tight leading-none">
                                            {t('merchandise.details.pickup_success')}
                                        </h3>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[240px]">
                                            {t('merchandise.details.thank_you')}
                                        </p>
                                    </div>

                                    <div className="w-full p-4 bg-neon-green/5 rounded-2xl border border-neon-green/10 space-y-2.5">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                            <span>{t('merchandise.labels.event')}</span>
                                            <span className="text-gray-900 dark:text-white font-black text-right line-clamp-1 max-w-[150px]">
                                                {selectedItem.merchandise?.event?.title || selectedItem.order?.event?.title || 'Sự kiện hệ thống'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                            <span>{t('merchandise.details.order_number')}</span>
                                            <span className="text-gray-900 dark:text-white font-black">#{selectedItem.order?.order_number || 'N/A'}</span>
                                        </div>
                                        {selectedItem.scan_history?.[0]?.staff?.full_name && (
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                                <span>{t('merchandise.details.staff_name')}</span>
                                                <span className="text-neon-green font-black">{selectedItem.scan_history[0].staff.full_name}</span>
                                            </div>
                                        )}
                                        {selectedItem.scan_history?.[0]?.scanned_at && (
                                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                                                <span>{t('merchandise.details.pickup_date')}</span>
                                                <span className="text-gray-900 dark:text-white font-black">
                                                    {format(new Date(selectedItem.scan_history[0].scanned_at), 'HH:mm - dd/MM/yyyy')}
                                                </span>
                                            </div>
                                        )}
                                        <div className="h-[1px] bg-neon-green/10"></div>
                                        <div className="flex justify-center text-[9px] font-black text-neon-green/60 tracking-widest uppercase">
                                            Verified Protocol
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setShowPickupModal(false)}
                                        className="w-full py-3.5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-lg"
                                    >
                                        {t('merchandise.details.close_btn')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white p-5 rounded-[2rem] shadow-xl border-4 border-neon-green/20">
                                        <QRCodeSVG 
                                            value={JSON.stringify({ 
                                                type: 'MERCHANDISE_PICKUP',
                                                order_item_id: selectedItem.id,
                                                pickup_code: selectedItem.pickup_code || selectedItem.order?.order_number || 'N/A'
                                            })} 
                                            size={180}
                                            level="H"
                                        />
                                    </div>
                                    
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('merchandise.labels.pickup_code')}</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-[0.2em]">
                                            {selectedItem.pickup_code || selectedItem.order?.order_number?.slice(-6).toUpperCase() || 'N/A'}
                                        </p>
                                    </div>

                                    <div className="w-full p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4 text-neon-green" />
                                            <span className="text-[9px] font-black text-gray-900 dark:text-white uppercase">{t('merchandise.details.order_info')}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-relaxed italic">{t('merchandise.details.pickup_instruction')}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="px-8 py-4 bg-gray-50 dark:bg-black/40 text-center border-t border-gray-100 dark:border-white/5">
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Verified by BASTICKET Merchandise Protocol</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Sold Information Modal */}
            {showSoldInfoModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={() => setShowSoldInfoModal(false)}></div>
                    <div className="relative bg-white dark:bg-dark-card w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 animate-in zoom-in-95 duration-300 mt-15">
                        <div className="bg-neon-green p-4 text-black relative">
                            <button onClick={() => setShowSoldInfoModal(false)} className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-all">
                                <X className="w-4 h-4" />
                            </button>
                            <h2 className="text-xl font-black uppercase tracking-tight mb-1">{t('merchandise.details.sold_info')}</h2>
                            <p className="text-[9px] font-black opacity-80 uppercase">{selectedItem.merchandise.name}</p>
                        </div>
                        
                        <div className="p-8 space-y-4">
                            {/* Buyer Info */}
                            <div className="space-y-4">
                                 <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-neon-green" />
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-tight">{selectedItem.status === 'transferred' ? t('merchandise.details.recipient') : t('merchandise.details.buyer')}</span>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <img 
                                        src={selectedItem.buyer?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                                        className="w-12 h-12 rounded-full border-2 border-neon-green/30"
                                        alt="Buyer"
                                    />
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase">{selectedItem.buyer?.full_name || t('merchandise.details.anonymous')}</h4>
                                        <p className="text-[11px] text-gray-500 font-medium">{selectedItem.buyer?.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-neon-green" />
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-tight">{t('merchandise.details.transaction_details')}</span>
                                </div>
                                <div className="bg-gray-50 dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400">{t('merchandise.details.transaction_id')}</span>
                                        <span className="text-[11px] font-bold text-gray-900 dark:text-white tracking-wider">
                                            {selectedItem.status === 'transferred' ? '#GAS-TRANSFER' : (selectedItem.transaction_id?.slice(-8).toUpperCase() || 'N/A')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400">{t('merchandise.details.sold_date')}</span>
                                        <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                                            {new Date(selectedItem.sold_at).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400">{t('merchandise.details.sold_time')}</span>
                                        <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                                            {new Date(selectedItem.sold_at).toLocaleTimeString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-white/5">
                                        <span className="text-[10px] font-black text-gray-400">{t('merchandise.details.sold_price')}</span>
                                        <span className="text-sm font-black text-neon-green">{formatPrice(selectedItem.subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-5 bg-gray-50 dark:bg-black/40 text-center border-t border-gray-100 dark:border-white/5">
                            <p className="text-[8px] text-gray-500 font-bold tracking-tight">
                                {selectedItem.status === 'transferred' ? t('merchandise.details.transfer_success') : t('merchandise.details.marketplace_success')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Listing Detail Modal (High Fidelity) */}
            {showListingModal && selectedItem && selectedItem.listing_info && (
                <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 flex justify-center py-20 px-4">
                    <div className="relative w-full max-w-lg h-fit bg-dark-card border border-white/10 rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden mt-8">
                        {/* Modal Header Image - Reduced height */}
                        <div className="relative h-48 flex-shrink-0">
                            <img 
                                src={formatImageUrl(selectedItem.listing_info.ticket.event.image_url)} 
                                className="w-full h-full object-cover"
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/40 to-transparent" />
                            <button 
                                onClick={() => setShowListingModal(false)}
                                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            
                            <div className="absolute bottom-4 left-6 right-6">
                                <span className="px-2 py-1 bg-neon-green text-black text-[8px] font-black rounded-md mb-2 inline-block">
                                    <div className="flex items-center gap-1">
                                        <Tag className="w-2.5 h-2.5" />
                                        {t('merchandise.listing_modal.tag_title')}
                                    </div>
                                </span>
                                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter line-clamp-1">{selectedItem.listing_info.ticket.event.title}</h2>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="h-fit p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-tight">{t('merchandise.listing_modal.tier_position')}</p>
                                    <p className="text-sm font-black text-white uppercase tracking-tight">
                                        {selectedItem.listing_info.ticket.ticket_tier.tier_name} - {t('merchandise.listing_modal.general_area')}
                                    </p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-tight">{t('merchandise.listing_modal.nft_id')}</p>
                                    <p className="text-sm font-black text-neon-green tracking-tighter">
                                        #{selectedItem.listing_info.ticket.nft_token_id || '15'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-2">
                                <h4 className="text-[10px] font-black text-purple-400 uppercase flex items-center gap-2">
                                    <Info className="w-3 h-3" />
                                    {t('merchandise.listing_modal.important_note')}
                                </h4>
                                <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                    {t('merchandise.listing_modal.protocol_status')}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-tight">{t('merchandise.listing_modal.attached_products')}</span>
                                </div>
                                <div className="bg-blue-400/5 border border-blue-400/10 p-4 rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/5 bg-black">
                                            <img src={selectedItem.merchandise.image_url} className="w-full h-full object-cover" alt="Merch" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black text-white uppercase">{selectedItem.merchandise.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold">{t('merchandise.labels.quantity')}: {selectedItem.quantity}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-blue-400">{formatPrice(selectedItem.unit_price * selectedItem.quantity)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Fixed at bottom */}
                        <div className="p-6 bg-dark-card border-t border-white/5 flex-shrink-0">
                            {(() => {
                                const totalListingPrice = selectedItem.listing_info.asking_price;
                                const merchTotal = selectedItem.unit_price * selectedItem.quantity;
                                const ticketPrice = totalListingPrice - merchTotal;
                                const gasFee = selectedItem.listing_info.ticket?.event?.resale_gas_fee || systemGasFee;
                                // Ưu tiên dùng % phí từ snapshot của bài đăng
                                const platformFeePercent = selectedItem.listing_info.platform_fee_percent || (selectedItem.listing_info.ticket?.event?.resale_platform_fee_percent || resaleTransactionFee);
                                const platformFee = ticketPrice * platformFeePercent / 100;
                                const grandTotal = ticketPrice + platformFee + gasFee + merchTotal;
                                
                                return (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-y-2">
                                            <span className="text-[10px] font-bold text-gray-500">{t('merchandise.listing_modal.listing_price')}</span>
                                            <span className="text-[10px] font-bold text-white text-right">{formatPrice(ticketPrice)}</span>
                                            
                                            <span className="text-[10px] font-bold text-gray-500">{t('merchandise.listing_modal.platform_fee')} ({platformFeePercent}%)</span>
                                            <span className="text-[10px] font-bold text-white text-right">{formatPrice(platformFee)}</span>
                                            
                                            <span className="text-[10px] font-bold text-gray-500">{t('merchandise.listing_modal.gas_fee')}</span>
                                            <span className="text-[10px] font-bold text-white text-right">{formatPrice(gasFee)}</span>
                                            
                                            <span className="text-[10px] font-bold text-gray-500">{t('merchandise.listing_modal.attached_merch')}</span>
                                            <span className="text-[10px] font-bold text-white text-right">{formatPrice(merchTotal)}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-neon-green uppercase tracking-tight">{t('merchandise.listing_modal.grand_total')}</p>
                                                <p className="text-xl font-black text-white tracking-tighter">
                                                    {formatPrice(grandTotal)}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setShowListingModal(false)}
                                                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-black uppercase rounded-xl border border-white/5 transition-all"
                                            >
                                                {t('merchandise.listing_modal.close_btn')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProducts;
