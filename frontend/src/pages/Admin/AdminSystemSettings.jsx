import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  CreditCard, 
  Cpu, 
  Save, 
  Lock, 
  AlertTriangle, 
  Mail, 
  Globe, 
  Percent, 
  Banknote, 
  Database,
  Key,
  Smartphone,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Info,
  Calendar,
  Package
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const AdminSystemSettings = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [pendingChanges, setPendingChanges] = useState({});

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/config');
            setConfig(res.data.data);
            setPendingChanges(res.data.data);
        } catch (error) {
            toast.error('Không thể tải cấu hình hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setPendingChanges(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveRequest = () => {
        const criticalKeys = [
            'event_platform_fee_percent', 
            'product_platform_fee_percent',
            'event_marketplace_fee_percent', 
            'withdrawal_fee_percent',
            'smart_contract_address',
            'rpc_url'
        ];
        
        const hasCriticalChanges = criticalKeys.some(key => pendingChanges[key] !== config[key]);
        
        if (hasCriticalChanges) {
            setShowOtpModal(true);
        } else {
            saveConfig();
        }
    };

    const saveConfig = async () => {
        try {
            setSaving(true);
            await api.put('/admin/config', {
                settings: pendingChanges,
                otp_code: otpCode || '123456'
            });
            toast.success('Đã lưu các thay đổi');
            setConfig(pendingChanges);
            setShowOtpModal(false);
            setOtpCode('');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Lỗi cập nhật cấu hình');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
                <p className="mt-4 text-xs text-slate-500 font-bold">Đang tải cấu hình...</p>
            </div>
        );
    }

    const tabs = [
        { id: 'general', label: 'Cấu hình chung', icon: Globe },
        { id: 'finance', label: 'Quản lý phí', icon: CreditCard },
        { id: 'blockchain', label: 'Blockchain', icon: Cpu },
        { id: 'security', label: 'Bảo mật', icon: ShieldCheck },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header - Unified with system branding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-neon-green/10 rounded-2xl shadow-sm border border-neon-green/20">
                        <Settings className="w-6 h-6 text-neon-green" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Cài đặt hệ thống</h1>
                        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium tracking-tight mt-0.5">Tham số vận hành & Cấu hình kỹ thuật</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {JSON.stringify(config) !== JSON.stringify(pendingChanges) && (
                        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl uppercase tracking-wider animate-pulse">
                            Có thay đổi chưa lưu
                        </span>
                    )}
                    <button 
                        onClick={handleSaveRequest}
                        disabled={saving || JSON.stringify(config) === JSON.stringify(pendingChanges)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-neon-green text-white dark:text-black rounded-xl font-black uppercase text-[11px] transition-all disabled:opacity-50 disabled:pointer-events-none hover:opacity-90 shadow-lg shadow-zinc-900/10 dark:shadow-neon-green/10 active:scale-95"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu cấu hình
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 mt-6">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 shrink-0">
                    <nav className="space-y-1.5">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-6 py-2.5 rounded-2xl text-[14px] font-bold transition-all duration-300 group relative ${
                                    activeTab === tab.id 
                                    ? 'bg-neon-green text-black shadow-xl shadow-neon-green/20 border-2 border-neon-green' 
                                    : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-slate-200 dark:border-white/10 hover:border-neon-green/30 hover:bg-slate-50 dark:hover:bg-white/10 hover:shadow-lg shadow-sm'
                                }`}
                            >
                                <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-black/10' : 'bg-slate-100 dark:bg-white/10 group-hover:bg-neon-green/10'}`}>
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-black' : 'text-gray-400 group-hover:text-neon-green'}`} />
                                </div>
                                <span>{tab.label}</span>
                                <ChevronRight className={`ml-auto w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white dark:bg-[#111114] border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm overflow-hidden">
                    <div className="p-8 md:p-10">
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-neon-green" />
                                    <div>
                                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Thông tin chung</h2>
                                        <p className="text-slate-500 dark:text-gray-400 font-medium text-xs tracking-tight">Thương hiệu & Thông tin liên hệ</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Tên nền tảng</label>
                                        <input 
                                            type="text"
                                            value={pendingChanges.site_name}
                                            onChange={e => handleChange('site_name', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Email hỗ trợ</label>
                                        <input 
                                            type="email"
                                            value={pendingChanges.support_email}
                                            onChange={e => handleChange('support_email', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2 p-4 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex items-center justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Chế độ bảo trì</h3>
                                                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium tracking-tight mt-1">Ngăn chặn truy cập của người dùng để bảo trì kỹ thuật.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleChange('maintenance_mode', pendingChanges.maintenance_mode === 'true' ? 'false' : 'true')}
                                            className={`w-14 h-8 rounded-full transition-all relative ${pendingChanges.maintenance_mode === 'true' ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-300 dark:bg-white/10'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${pendingChanges.maintenance_mode === 'true' ? 'left-7' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'finance' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-neon-green" />
                                    <div>
                                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Quản lý phí</h2>
                                        <p className="text-slate-500 dark:text-gray-400 font-medium text-xs tracking-tight">Cấu hình các loại phí giao dịch</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {/* Event Fees Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Cấu hình phí cho Vé Sự Kiện</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Phí nền tảng sự kiện (Primary)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.event_platform_fee_percent}
                                                        onChange={e => handleChange('event_platform_fee_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Phí giao dịch vé</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.event_transaction_fee_percent}
                                                        onChange={e => handleChange('event_transaction_fee_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-white/5"></div>

                                    {/* Product Fees Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Package className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Cấu hình phí cho Sản Phẩm (Merchandise)</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Phí nền tảng sản phẩm</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.product_platform_fee_percent}
                                                        onChange={e => handleChange('product_platform_fee_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Phí giao dịch sản phẩm</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.product_transaction_fee_percent}
                                                        onChange={e => handleChange('product_transaction_fee_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-white/5"></div>

                                    {/* Resale Fees Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Percent className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Cấu hình Bán lại (Marketplace)</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Biên độ giá bán lại tối đa (so với giá gốc)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.resale_price_cap_percent}
                                                        onChange={e => handleChange('resale_price_cap_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Phí giao dịch bán lại</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.resale_transaction_fee_percent}
                                                        onChange={e => handleChange('resale_transaction_fee_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-white/5"></div>

                                    {/* Other Finance Fees Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Banknote className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Cấu hình thanh toán & Rút tiền</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Phí rút tiền doanh thu</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.withdrawal_fee_percent}
                                                        onChange={e => handleChange('withdrawal_fee_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Mức rút tối thiểu</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.min_withdrawal_amount}
                                                        onChange={e => handleChange('min_withdrawal_amount', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">VNĐ</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Tác quyền mặc định (Royalty)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.default_royalty_percent}
                                                        onChange={e => handleChange('default_royalty_percent', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</div>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Ước tính phí Gas (Blockchain)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        value={pendingChanges.system_gas_fee}
                                                        onChange={e => handleChange('system_gas_fee', e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">VNĐ</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'blockchain' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex items-center gap-3">
                                    <Cpu className="w-5 h-5 text-neon-green" />
                                    <div>
                                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Blockchain</h2>
                                        <p className="text-slate-500 dark:text-gray-400 font-medium text-xs tracking-tight">Hạ tầng mạng lưới & Smart Contract</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Địa chỉ Smart Contract chính</label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text"
                                                value={pendingChanges.smart_contract_address}
                                                onChange={e => handleChange('smart_contract_address', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">RPC Endpoint URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={pendingChanges.rpc_url}
                                                onChange={e => handleChange('rpc_url', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-neon-green" />
                                    <div>
                                        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">An toàn & Bảo mật</h2>
                                        <p className="text-slate-500 dark:text-gray-400 font-medium text-xs tracking-tight">Ngưỡng rủi ro & Xác thực quản trị</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Ngưỡng rủi ro BOT (0-1)</label>
                                        <div className="relative">
                                            <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="number"
                                                step="0.1"
                                                value={pendingChanges.bot_risk_threshold}
                                                onChange={e => handleChange('bot_risk_threshold', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-neon-green transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 tracking-tight ml-1">Xác thực 2 lớp (OTP)</label>
                                        <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-neon-green/10 rounded-lg">
                                                    <Smartphone className="w-4 h-4 text-neon-green" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 dark:text-gray-300 tracking-tight">Bắt buộc khi lưu</span>
                                            </div>
                                            <div className="w-10 h-5 bg-neon-green rounded-full relative cursor-pointer">
                                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-md"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="px-8 py-5 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                        <Info className="w-4 h-4 text-slate-400" />
                        <p className="text-slate-400 font-bold tracking-tight">Nhật ký thay đổi được ghi lại bởi Admin Logs</p>
                    </div>
                </div>
            </div>

            {/* Verification Modal */}
            {showOtpModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setShowOtpModal(false)}></div>
                    <div className="relative bg-white dark:bg-[#111114] w-full max-w-sm rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 md:p-10 text-center space-y-6">
                            <div className="w-16 h-16 bg-neon-green/10 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-neon-green/10">
                                <Lock className="w-8 h-8 text-neon-green" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Xác nhận bảo mật</h3>
                                <p className="text-[11px] text-slate-500 dark:text-gray-400 font-bold tracking-tight mt-2 leading-relaxed">Nhập mã OTP để xác nhận các thay đổi cốt lõi.</p>
                            </div>

                            <div className="relative">
                                <input 
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value)}
                                    placeholder="••••••"
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5rem] focus:outline-none focus:border-neon-green transition-all dark:text-white"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setShowOtpModal(false)}
                                    className="flex-1 py-3.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-xl transition-all active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={saveConfig}
                                    disabled={otpCode.length < 6 || saving}
                                    className="flex-1 py-3.5 bg-zinc-900 dark:bg-neon-green text-white dark:text-black text-[10px] font-black uppercase rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-neon-green/10 active:scale-95"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSystemSettings;
