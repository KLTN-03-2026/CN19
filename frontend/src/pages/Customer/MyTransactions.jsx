import React, { useState, useEffect } from 'react';
import { 
    History, 
    Search, 
    Filter, 
    ChevronRight, 
    Calendar, 
    DollarSign, 
    ArrowRightLeft, 
    CreditCard, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    SearchX, 
    ArrowUpRight, 
    FileText,
    ExternalLink,
    Eye
} from 'lucide-react';
import { transactionService } from '../../services/transaction.service';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const MyTransactions = () => {
    const { t, i18n } = useTranslation();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'PRIMARY_PURCHASE', 'TRANSFER_FEE', 'MARKETPLACE_BUY'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'success', 'pending', 'cancelled'

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await transactionService.getMyTransactions();
            setTransactions(res.data || []);
        } catch (error) {
            toast.error(t('transactions.toast.error'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
            case 'paid':
                return t('transactions.status.success');
            case 'pending':
            case 'processing':
                return t('transactions.status.pending');
            case 'failed':
            case 'cancelled':
            case 'expired':
                return t('transactions.status.cancelled');
            default:
                return status;
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'success':
            case 'paid':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'pending':
            case 'processing':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'failed':
            case 'cancelled':
            case 'expired':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getTypeLabel = (type) => {
        return t(`transactions.type.${type}`) || type;
    };
    const filteredTransactions = transactions.filter(t => {
        // Loại bỏ giao dịch doanh thu khỏi trang lịch sử chi tiêu
        if (t.type === 'RESELL_REVENUE') return false;

        const matchesSearch = (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                             (t.transaction_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                             (t.event_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || t.type === activeTab;
        
        let matchesStatus = true;
        const s = t.status?.toLowerCase();
        if (statusFilter === 'success') {
            matchesStatus = ['success', 'completed', 'paid'].includes(s);
        } else if (statusFilter === 'cancelled') {
            matchesStatus = ['failed', 'cancelled', 'expired', 'pending', 'processing'].includes(s);
        }

        return matchesSearch && matchesTab && matchesStatus;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white transition-colors duration-500 pt-6 pb-10 overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-neon-green/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-blue-500/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-4 space-y-4">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <h1 className="text-xl md:text-3xl font-black leading-tight tracking-tighter">
                            {t('transactions.title')}
                        </h1>
                        <p className="text-[13px] text-gray-00 dark:text-gray-400 font-medium max-w-lg leading-relaxed">
                            {t('transactions.subtitle')}
                        </p>
                    </div>

                    {/* Stats Bar - Focused on Spending */}
                    <div className="grid grid-cols-3 gap-0 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl p-0.5 animate-in fade-in slide-in-from-bottom-10 duration-1000 w-full lg:w-auto">
                        <div className="px-4 py-2 border-r border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[8px] font-black text-gray-500 uppercase mb-0.5">{t('transactions.stats.count')}</p>
                            <h4 className="text-base font-black text-gray-900 dark:text-white">{filteredTransactions.length}</h4>
                        </div>
                        <div className="px-4 py-2 border-r border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[8px] font-black text-gray-500 uppercase mb-0.5">{t('transactions.stats.cancelled')}</p>
                            <h4 className="text-base font-black text-red-500">
                                {filteredTransactions.filter(t => ['failed', 'cancelled', 'expired'].includes(t.status?.toLowerCase())).length}
                            </h4>
                        </div>
                        <div className="px-4 py-2 text-center">
                            <p className="text-[8px] font-black text-gray-500 uppercase mb-0.5">{t('transactions.stats.total_spent')}</p>
                            <h4 className="text-base font-black text-neon-green">
                                {formatCurrency(transactions
                                    .filter(t => ['completed', 'success', 'paid'].includes(t.status?.toLowerCase()) && t.type !== 'RESELL_REVENUE')
                                    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                                )}
                            </h4>
                        </div>
                    </div>
                </header>

                {/* Controls Section */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-1 backdrop-blur-md">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within:text-neon-green transition-colors" />
                            <input 
                                type="text"
                                placeholder={t('transactions.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-transparent text-[12px] font-medium border-0 focus:ring-0 focus:outline-none placeholder:text-gray-500 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Filters & Tabs */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Filter Dropdown */}
                        <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-1 backdrop-blur-md">
                            <div className="flex items-center gap-2 px-4 py-2 group hover:bg-white/[0.02] rounded-xl transition-all cursor-pointer">
                                <Filter className="w-3.5 h-3.5 text-gray-400 group-hover:text-neon-green transition-colors" />
                                <select 
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent border-0 text-[12px] font-bold text-gray-600 dark:text-gray-400 focus:ring-0 focus:outline-none cursor-pointer pr-8"
                                >
                                    <option value="all" className="bg-white dark:bg-[#0a0a0a]">{t('transactions.status.all')}</option>
                                    <option value="success" className="bg-white dark:bg-[#0a0a0a]">{t('transactions.status.success')}</option>
                                    <option value="cancelled" className="bg-white dark:bg-[#0a0a0a]">{t('transactions.status.cancelled')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-1 backdrop-blur-md flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'all', label: t('transactions.tabs.all') },
                                { id: 'PRIMARY_PURCHASE', label: t('transactions.tabs.buy') },
                                { id: 'MARKETPLACE_BUY', label: t('transactions.tabs.resale') },
                                { id: 'TRANSFER_FEE', label: t('transactions.tabs.transfer') },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${
                                        activeTab === tab.id 
                                        ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10' 
                                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Transactions Table Section */}
                {loading ? (
                    <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-500 ">{t('transactions.table.info')}</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-500 ">{t('home.for_you.title')}</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-500 ">{t('blog.post.tag')}</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-500 ">{t('transactions.table.amount')}</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-500 ">{t('transactions.table.status')}</th>
                                        <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-500 text-right">{t('transactions.table.date')}</th>
                                        <th className="px-6 py-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.transaction_id} className="group hover:bg-neon-green/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                                                        {tx.transaction_id.toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                        ID: {tx.order_id || tx.transaction_id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 line-clamp-1 max-w-[200px]">
                                                    {tx.description.split(':').pop().trim()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                                    tx.type === 'TRANSFER_FEE' 
                                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                                    : tx.type === 'RESELL_REVENUE'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                    {getTypeLabel(tx.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`text-base font-black tracking-tight ${tx.type === 'RESELL_REVENUE' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {tx.type === 'RESELL_REVENUE' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit ${getStatusStyle(tx.status)}`}>
                                                    {['paid', 'success', 'completed'].includes(tx.status?.toLowerCase()) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    <span className="text-[9px] font-black uppercase">{getStatusLabel(tx.status)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-gray-900 dark:text-white">
                                                        {new Date(tx.timestamp).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-500 mt-0.5">
                                                        {new Date(tx.timestamp).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link 
                                                    to={`/my-transactions/${tx.order_id || tx.transaction_id}`}
                                                    className="inline-flex w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 items-center justify-center text-gray-400 hover:bg-neon-green hover:text-black transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-dark-card rounded-[4rem] p-24 text-center border border-gray-100 dark:border-dark-border space-y-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 blur-[100px] -z-10"></div>
                        <div className="w-32 h-32 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-50">
                            <SearchX className="w-16 h-16 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                {t('transactions.empty.title')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
                                {t('transactions.empty.desc')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTransactions;
