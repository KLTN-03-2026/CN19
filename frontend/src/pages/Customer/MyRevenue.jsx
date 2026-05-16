import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Download,
  Calendar,
  Building2,
  User,
  Hash,
  Loader2,
  DollarSign,
  Eye,
  ArrowRight,
  Search
} from 'lucide-react';
import { revenueService } from '../../services/revenue.service';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useSystemConfig } from '../../hooks/useSystemConfig';

const MyRevenue = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const queryClient = useQueryClient();
    const { minWithdrawal } = useSystemConfig();
    const [allBanks, setAllBanks] = useState([]);

    const fetchBanks = async () => {
        try {
            const response = await fetch('https://api.vietqr.io/v2/banks');
            const data = await response.json();
            if (data.code === '00') {
                setAllBanks(data.data);
            }
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    React.useEffect(() => {
        fetchBanks();
    }, []);

    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['revenue-summary'],
        queryFn: revenueService.getSummary
    });

    const { data: resaleOrders, isLoading: isOrdersLoading } = useQuery({
        queryKey: ['resale-orders'],
        queryFn: resaleOrdersFetch
    });

    // Cần định nghĩa lại hàm fetch hoặc dùng queryFn trực tiếp
    async function resaleOrdersFetch() {
        return revenueService.getResaleOrders();
    }

    const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
        queryKey: ['revenue-transactions'],
        queryFn: revenueService.getTransactions
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // Dữ liệu cho biểu đồ tròn
    const chartData = [
        { name: t('revenue.chart.available'), value: Number(summary?.balance || 0), color: '#10b981' },
        { name: t('revenue.chart.pending'), value: Number(summary?.pendingRevenue || 0), color: '#3b82f6' },
        { name: t('revenue.chart.withdrawn'), value: Number(summary?.totalWithdrawn || 0), color: '#8b5cf6' }
    ].filter(item => item.value > 0);

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                <div>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-neon-green mb-2"
                    >
                        <Wallet className="w-4 h-4" />
                        <span className="text-xs font-black">{t('revenue.subtitle')}</span>
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase"
                    >
                        {t('revenue.title')}
                    </motion.h1>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setActiveTab('withdraw')}
                        className="px-6 py-3.5 bg-neon-green hover:bg-neon-hover text-black font-black uppercase text-[11px] rounded-2xl transition-all shadow-lg shadow-neon-green/20 hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        {t('revenue.withdraw_button')}
                    </button>
                </div>
            </div>

            {/* Main Stats Area - NEW LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-5">
                {/* Left: Compact Stats Cards (col-span-5) */}
                <div className="lg:col-span-5 grid grid-cols-1 gap-3">
                    <StatCard 
                        title={t('revenue.stats.balance')} 
                        value={formatCurrency(summary?.balance)} 
                        icon={Wallet} 
                        color="#10b981"
                        delay={0.1}
                        compact
                    />
                    <StatCard 
                        title={t('revenue.stats.pending_revenue')} 
                        value={formatCurrency(summary?.pendingRevenue)} 
                        icon={TrendingUp} 
                        color="#3b82f6"
                        delay={0.2}
                        compact
                    />
                    <StatCard 
                        title={t('revenue.stats.total_withdrawn')} 
                        value={formatCurrency(summary?.totalWithdrawn)} 
                        icon={CheckCircle2} 
                        color="#8b5cf6"
                        delay={0.3}
                        compact
                    />
                </div>

                {/* Right: Pie Chart Distribution (col-span-7) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-7 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6"
                >
                    <div className="flex-1 w-full h-[250px] min-h-[250px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1a1a1a', 
                                            border: 'none', 
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            color: '#fff'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => formatCurrency(value)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-xs font-bold uppercase">
                                Chưa có dữ liệu tài chính
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-4 w-full px-4">
                        <h4 className="text-[11px] font-black text-gray-500 uppercase border-b border-gray-100 dark:border-white/5 pb-2 mb-4">
                            {t('revenue.chart.title')}
                        </h4>
                        {chartData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-gray-900 dark:text-white group-hover:text-neon-green transition-colors">
                                    {formatCurrency(item.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit mb-5">
                <TabButton 
                    active={activeTab === 'overview'} 
                    onClick={() => setActiveTab('overview')} 
                    label={t('revenue.tabs.sold_orders')} 
                />
                <TabButton 
                    active={activeTab === 'withdraw'} 
                    onClick={() => setActiveTab('withdraw')} 
                    label={t('revenue.tabs.withdraw_bank')} 
                />
                <TabButton 
                    active={activeTab === 'transactions'} 
                    onClick={() => setActiveTab('transactions')} 
                    label="Biến động số dư" 
                />
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
                            <div className="pl-8 py-3.5 border-b border-gray-50 dark:border-dark-border flex items-center justify-between">
                                <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm">{t('revenue.table.title')}</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-white/[0.02] text-[11px] font-black text-gray-600 uppercase">
                                            <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase ">{t('revenue.table.event_ticket')}</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase">{t('revenue.table.buyer')}</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase">{t('revenue.table.price')}</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase">{t('revenue.table.commission')}</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase">{t('revenue.table.status')}</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase">{t('revenue.table.time')}</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase">{t('revenue.table.details')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                                        {isOrdersLoading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan="6" className="px-6 py-8">
                                                        <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-2xl w-full"></div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : resaleOrders?.data?.length > 0 ? (
                                            resaleOrders.data.map((tx) => (
                                                <tr key={tx.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                                                                <img 
                                                                    src={tx.ticket?.event?.image_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=200'} 
                                                                    className="w-full h-full object-cover"
                                                                    alt={tx.ticket?.event?.title}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase leading-tight line-clamp-1 mb-1">
                                                                    {tx.ticket?.event?.title}
                                                                </h4>
                                                                <span className="inline-block px-1.5 py-0.5 rounded-[4px] bg-neon-green/10 text-neon-green text-[9px] font-bold">
                                                                    {tx.ticket?.ticket_tier?.tier_name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="text-center">
                                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{tx.buyer?.full_name}</p>
                                                            <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{tx.buyer?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-5 text-right font-black text-sm text-gray-600">
                                                        {formatCurrency(tx.buyer_pay_amount)}
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="text-sm font-black text-neon-green">
                                                            {formatCurrency(tx.seller_receive_amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                                tx.status === 'cancelled' || tx.ticket?.event?.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                                : (tx.is_settled
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400')
                                                            }`}>
                                                                {tx.status === 'cancelled' || tx.ticket?.event?.status === 'cancelled' ? '🔴 Đã hủy' : (tx.is_settled ? t('revenue.table.status_settled') : t('revenue.table.status_pending'))}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase">
                                                            {format(new Date(tx.created_at), 'dd/MM/yyyy')}
                                                        </p>
                                                        <p className="text-[9px] text-gray-500/60 font-medium">
                                                            {format(new Date(tx.created_at), 'HH:mm')}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <button 
                                                            onClick={() => setSelectedOrder(tx)}
                                                            className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 hover:bg-neon-green hover:text-black transition-all group/btn"
                                                        >
                                                            <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <TrendingUp className="w-12 h-12 text-gray-200 dark:text-white/10 mb-4" />
                                                        <p className="text-gray-500 font-bold uppercase text-xs">{t('revenue.table.no_orders')}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : activeTab === 'transactions' ? (
                    <motion.div
                        key="transactions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl overflow-hidden shadow-sm">
                            <div className="pl-8 py-4 border-b border-gray-50 dark:border-dark-border flex items-center justify-between">
                                <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm">Lịch sử biến động số dư ví</h3>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-8">
                                    {transactionsData?.transactions?.length || 0} giao dịch
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-white/[0.02] text-[11px] font-black text-gray-600 uppercase">
                                            <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase">Mã GD & Thời gian</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Số tiền</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Loại GD</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Nội dung</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                                        {isTransactionsLoading ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan="4" className="px-6 py-8">
                                                        <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-2xl w-full"></div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : transactionsData?.transactions?.length > 0 ? (
                                            transactionsData.transactions.map((tx) => (
                                                <tr key={tx.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-mono font-black text-gray-400 uppercase">#{tx.id.substring(0, 8)}</span>
                                                            <span className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                                                                {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`text-sm font-black ${tx.amount >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
                                                            {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                                                            tx.type === 'REFUND' ? 'bg-green-500/10 text-green-500' :
                                                            tx.type === 'DEPOSIT' ? 'bg-blue-500/10 text-blue-500' :
                                                            'bg-orange-500/10 text-orange-500'
                                                        }`}>
                                                            {tx.type === 'REFUND' ? 'Hoàn tiền' : tx.type === 'DEPOSIT' ? 'Nạp tiền' : 'Rút tiền'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2 max-w-md">
                                                            {tx.description || 'Giao dịch ví'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-20 text-center text-gray-500 font-bold uppercase text-xs">
                                                    Chưa có phát sinh biến động số dư
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="withdraw"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* Withdrawal Form */}
                        <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">{t('revenue.withdrawal.title')}</h3>
                            </div>
                            <WithdrawalForm 
                                balance={summary?.balance} 
                                systemSettings={summary?.systemSettings}
                                onComplete={() => queryClient.invalidateQueries(['revenue-summary'])} 
                            />
                        </div>

                        {/* Bank Info */}
                        <div key="bank" className="lg:col-span-1 p-6 md:p-8 rounded-[2.5rem] bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">{t('revenue.bank.title')}</h3>
                            </div>
                            <BankInfoForm 
                                initialData={summary?.bankInfo} 
                                allBanks={allBanks} 
                                onComplete={() => queryClient.invalidateQueries(['revenue-summary'])} 
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <TransactionDetailModal 
                        order={selectedOrder} 
                        onClose={() => setSelectedOrder(null)} 
                        formatCurrency={formatCurrency}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, delay, subtitle, compact }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl ${compact ? 'p-4 sm:p-5' : 'p-6'} shadow-sm relative overflow-hidden group h-full flex items-center`}
    >
        <div 
            className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-10"
            style={{ backgroundColor: color }}
        ></div>
        <div className="relative z-10 flex items-center gap-4 w-full">
            <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0"
                style={{ backgroundColor: `${color}20`, color: color }}
            >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5 truncate">{title}</p>
                <h3 className={`font-black text-gray-900 dark:text-white truncate ${compact ? 'text-base sm:text-lg' : 'text-2xl'}`}>{value}</h3>
                {!compact && subtitle && <p className="text-[10px] text-gray-600 font-medium truncate">{subtitle}</p>}
            </div>
        </div>
    </motion.div>
);

const TabButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${
            active 
            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' 
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
        }`}
    >
        {label}
    </button>
);

const WithdrawalForm = ({ balance, systemSettings, onComplete }) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const feePercent = systemSettings?.withdrawal_fee_percent || 0;
    const minWithdrawalValue = systemSettings?.min_withdrawal_amount || 100000;
    
    const feeAmount = (Number(amount) * feePercent) / 100;
    const netAmount = Number(amount) - feeAmount;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || Number(amount) < minWithdrawalValue) {
            return toast.error(`${t('revenue.messages.min_withdrawal')} (${new Intl.NumberFormat('vi-VN').format(minWithdrawalValue)}đ)`);
        }
        if (Number(amount) > balance) return toast.error(t('revenue.messages.insufficient_balance'));

        setIsSubmitting(true);
        try {
            await revenueService.withdraw(amount);
            toast.success(t('revenue.messages.withdrawal_requested'));
            setAmount('');
            onComplete();
        } catch (error) {
            toast.error(error.response?.data?.error || t('revenue.messages.error_withdrawal'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 mb-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-wider">{t('revenue.withdrawal.amount_label')}</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={t('revenue.withdrawal.amount_placeholder')}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-3 font-bold text-sm focus:ring-2 focus:ring-neon-green/30 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm uppercase">VNĐ</div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">{t('revenue.withdrawal.available_balance_label')}</span>
                    <span className="text-sm font-black text-neon-green">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600">Phí giao dịch ({feePercent}%):</span>
                    <span className="text-sm font-black text-red-500">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(feeAmount)}</span>
                </div>
                {amount > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                        <span className="text-xs font-bold text-gray-600">Thực nhận:</span>
                        <span className="text-sm font-black text-neon-green">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(netAmount)}</span>
                    </div>
                )}
            </div>

            <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('revenue.withdrawal.confirm_btn')}
            </button>
        </form>
    );
};

const BankInfoForm = ({ initialData, onComplete, allBanks }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        bank_name: initialData?.bank_name || '',
        account_number: initialData?.account_number || '',
        account_holder: initialData?.account_holder || ''
    });
    const [isEditing, setIsEditing] = useState(!initialData?.account_number);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Kiểm tra validation
        if (!formData.bank_name.trim() || !formData.account_number.trim() || !formData.account_holder.trim()) {
            toast.error(t('revenue.messages.validation_error'));
            return;
        }

        setIsSubmitting(true);
        try {
            await revenueService.updateBankInfo(formData);
            toast.success(t('revenue.messages.update_success'));
            setIsEditing(false);
            onComplete();
        } catch (error) {
            toast.error(t('revenue.messages.update_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isEditing) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <InfoRow icon={Building2} label={t('revenue.bank.label_bank')} value={formData.bank_name} />
                    <InfoRow icon={Hash} label={t('revenue.bank.label_account')} value={formData.account_number} />
                    <InfoRow icon={User} label={t('revenue.bank.label_holder')} value={formData.account_holder} />
                </div>
                <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black uppercase text-[10px] rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                >
                    {t('revenue.bank.change_info')}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1 tracking-wider">{t('revenue.bank.label_bank')}</label>
                
                {/* Bank Search & Selector */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder={t('revenue.bank.bank_name_placeholder') || "Tìm tên ngân hàng..."}
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl pl-11 pr-5 py-3.5 font-medium text-sm outline-none focus:border-neon-green/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[180px] overflow-y-auto p-3 border border-gray-100 dark:border-white/5 rounded-2xl bg-gray-50/50 dark:bg-white/[0.01] custom-scrollbar shadow-inner">
                        {allBanks
                            .filter(b => 
                                b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                b.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                b.code.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(bank => (
                                <button
                                    key={bank.id}
                                    type="button"
                                    onClick={() => {
                                        setFormData({...formData, bank_name: bank.shortName + ' (' + bank.code + ')'});
                                        setSearchQuery('');
                                    }}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all relative h-14 ${
                                        formData.bank_name?.includes(bank.code)
                                            ? 'bg-neon-green/10 border-neon-green shadow-md scale-[1.05] z-10'
                                            : 'bg-white dark:bg-white/5 border-gray-100 dark:border-transparent hover:border-neon-green/30'
                                    }`}
                                >
                                    {formData.bank_name?.includes(bank.code) && (
                                        <div className="absolute -top-1 -right-1 bg-neon-green text-black rounded-full p-0.5 shadow-lg z-20 border-2 border-white dark:border-dark-card">
                                            <CheckCircle2 className="w-2.5 h-2.5 stroke-[3px]" />
                                        </div>
                                    )}
                                    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white rounded-lg p-1 shadow-sm group-hover:scale-105 transition-transform">
                                        <img 
                                            src={bank.logo} 
                                            alt={bank.shortName} 
                                            className="w-full h-full object-contain" 
                                        />
                                    </div>
                                </button>
                            ))
                        }
                    </div>

                    {formData.bank_name && (
                        <div className="px-4 py-2 bg-neon-green/5 border border-neon-green/10 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                            <Building2 className="w-3.5 h-3.5 text-neon-green" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-tight">
                                {formData.bank_name}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <InputRow label={t('revenue.bank.label_account')} value={formData.account_number} onChange={(v) => setFormData({...formData, account_number: v})} placeholder={t('revenue.bank.account_placeholder')} />
            <InputRow label={t('revenue.bank.label_holder')} value={formData.account_holder} onChange={(v) => setFormData({...formData, account_holder: v.toUpperCase()})} placeholder={t('revenue.bank.holder_placeholder')} />
            
            <div className="flex gap-3 pt-2">
                {initialData?.account_number && (
                    <button 
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 font-black uppercase text-[10px] rounded-2xl transition-all"
                    >
                        {t('revenue.bank.cancel_btn')}
                    </button>
                )}
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-neon-green text-black font-black uppercase text-[10px] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('revenue.bank.save_btn')}
                </button>
            </div>
        </form>
    );
};

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-500">
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-[9px] font-black text-gray-500 uppercase">{label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{value}</p>
        </div>
    </div>
);

const InputRow = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-500 uppercase ml-1 ">{label}</label>
        <input 
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl px-5 py-3 font-medium text-sm focus:ring-2 focus:ring-neon-green/30 outline-none transition-all"
        />
    </div>
);

const TransactionDetailModal = ({ order, onClose, formatCurrency }) => {
    const { t } = useTranslation();
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center mt-20 justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header & Banner */}
                <div className="relative h-38 sm:h-45 overflow-hidden">
                    <img 
                        src={order.ticket?.event?.image_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=800'} 
                        className="w-full h-full object-cover"
                        alt={order.ticket?.event?.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all z-10"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                    
                    <div className="absolute bottom-6 left-8 right-8">
                        <div className="flex items-center gap-2 text-neon-green mb-2">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px] font-black">
                                {order.ticket?.event?.event_date ? format(new Date(order.ticket.event.event_date), 'dd MMMM, yyyy', { locale: vi }) : 'N/A'}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase line-clamp-1">
                            {order.ticket?.event?.title}
                        </h2>
                    </div>
                </div>

                <div className="p-5 sm:p-6 space-y-3">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div>
                                    <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5">{t('revenue.modal.transaction_id')}</p>
                                    <p className="text-xs font-black text-gray-900 dark:text-white">#{order.transaction_number}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div>
                                    <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5">{t('revenue.modal.buyer_info')}</p>
                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{order.buyer?.full_name}</p>
                                    <p className="text-[10px] text-gray-600 font-medium">{order.buyer?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <div>
                                    <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5">{t('revenue.modal.ticket_type')}</p>
                                    <p className="text-xs font-black text-gray-900 dark:text-white">{order.ticket?.ticket_tier?.tier_name}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div>
                                    <p className="text-[9px] font-black text-gray-600 uppercase mb-0.5">{t('revenue.modal.status_label')}</p>
                                    {order.status === 'cancelled' || order.ticket?.event?.status === 'cancelled' ? (
                                        <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded">🔴 Đã hủy</span>
                                    ) : order.is_settled ? (
                                        <span className="text-[10px] font-black text-neon-green bg-neon-green/10 px-2 py-0.5 rounded">{t('revenue.table.status_settled')}</span>
                                    ) : (
                                        <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">{t('revenue.table.status_pending')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary Table */}
                    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-4 space-y-1">
                        <div className="flex justify-between items-center py-2 text-xs font-bold text-gray-600 dark:text-gray-400">
                            <span>{t('revenue.modal.buyer_pay')}</span>
                            <span className="text-gray-900 dark:text-white">{formatCurrency(order?.buyer_pay_amount)}</span>
                        </div>
                        
                        {/* Phí sàn = Tổng trả - (Lợi nhuận + Bản quyền) - Gas */}
                        <div className="flex justify-between items-center py-2 text-xs font-bold text-red-500/80">
                            <span>{t('revenue.modal.platform_fee')}</span>
                            <span>-{formatCurrency(Math.max(0, Number(order?.buyer_pay_amount || 0) - (Number(order?.seller_receive_amount || 0) + Number(order?.organizer_royalty || 0)) - Number(order?.gas_fee || 0)))}</span>
                        </div>

                        {Number(order?.gas_fee) > 0 && (
                            <div className="flex justify-between items-center py-2 text-xs font-bold text-red-500/80">
                                <span>Phí Gas hệ thống</span>
                                <span>-{formatCurrency(order?.gas_fee)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center py-2 text-xs font-bold text-red-500/80 border-b border-dashed border-gray-100 dark:border-white/5 pb-4">
                            <span>{t('revenue.modal.royalty_fee')}</span>
                            <span>-{formatCurrency(order?.organizer_royalty)}</span>
                        </div>
                        
                        <div className="pt-4 flex justify-between items-center">
                            <span className="text-[11px] font-black text-gray-900 dark:text-white uppercase">{t('revenue.modal.net_profit')}</span>
                            <span className="text-xl font-black text-neon-green">{formatCurrency(order?.seller_receive_amount)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {t('revenue.modal.close_btn')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MyRevenue;
