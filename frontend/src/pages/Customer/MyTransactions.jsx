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
    const { i18n } = useTranslation();
    const isVi = i18n.language.startsWith('vi');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'PRIMARY_PURCHASE', 'TRANSFER_FEE', 'MARKETPLACE_BUY'

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await transactionService.getMyTransactions();
            setTransactions(res.data || []);
        } catch (error) {
            toast.error(isVi ? 'Không thể tải lịch sử giao dịch.' : 'Failed to load transaction history.');
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
                return 'Thành công';
            case 'pending':
            case 'processing':
                return 'Đang xử lý';
            case 'failed':
                return 'Thất bại';
            case 'cancelled':
                return 'Đã hủy';
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
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            'PRIMARY_PURCHASE': isVi ? 'Mua vé sơ cấp' : 'Primary Purchase',
            'MARKETPLACE_BUY': isVi ? 'Mua vé chợ đen' : 'Marketplace Purchase',
            'TRANSFER_FEE': isVi ? 'Chuyển nhượng' : 'Transfer',
            'RESELL_REVENUE': isVi ? 'Doanh thu bán lại' : 'Resell Revenue'
        };
        return labels[type] || type;
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || t.type === activeTab;
        
        // Khách hàng chỉ xem giao dịch thành công
        const isSuccessful = ['completed', 'success', 'paid'].includes(t.status?.toLowerCase());
        
        return matchesSearch && matchesTab && isSuccessful;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-500 flex flex-col pt-10 pb-20 px-4 sm:px-8 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-green/5 blur-[120px] rounded-full -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full -z-10"></div>

            <div className="max-w-[1400px] mx-auto space-y-8 relative z-10 w-full">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 text-neon-green font-black uppercase text-[10px] bg-neon-green/5 px-4 py-2 rounded-full border border-neon-green/20">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Financial Log / Giao dịch</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase leading-none">Lịch sử giao dịch</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                            Xem lại toàn bộ lịch sử nạp tiền, mua vé và phí dịch vụ của bạn.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder={isVi ? "Tìm ID, mô tả..." : "Search ID, description..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-neon-green/10 focus:border-neon-green transition-all w-full sm:w-80 dark:text-white shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="no-scrollbar overflow-x-auto pb-2">
                    <div className="flex gap-2 p-1.5 bg-gray-200/30 dark:bg-white/5 rounded-2xl w-max border border-gray-100 dark:border-dark-border backdrop-blur-xl">
                        {[
                            { id: 'all', label: isVi ? 'Tất cả' : 'All' },
                            { id: 'PRIMARY_PURCHASE', label: isVi ? 'Mua vé' : 'Purchase' },
                            { id: 'MARKETPLACE_BUY', label: isVi ? 'Mua lại' : 'Resale-Buy' },
                            { id: 'TRANSFER_FEE', label: isVi ? 'Chuyển nhượng' : 'Transfer' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-white dark:bg-neon-green text-neon-hover dark:text-black shadow-md' 
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transactions Table/List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-gray-200 dark:bg-dark-card rounded-2xl animate-pulse border border-transparent"></div>
                        ))}
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-white/[0.02]">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider w-40">{isVi ? 'Mã GD' : 'TX ID'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">{isVi ? 'Chi tiết' : 'Details'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider w-32">{isVi ? 'Thời gian' : 'Time'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider w-40 text-right">{isVi ? 'Số tiền' : 'Amount'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider w-32 text-center">{isVi ? 'Trạng thái' : 'Status'}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider w-20 text-center">{isVi ? 'Xem' : 'View'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.transaction_id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${tx.type === 'TRANSFER_FEE' ? 'bg-blue-500/10 text-blue-500' : 'bg-neon-green/10 text-neon-green'}`}>
                                                        {tx.type === 'TRANSFER_FEE' ? <ArrowRightLeft className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                                                        {tx.transaction_id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                        {tx.description}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                                                        {getTypeLabel(tx.type)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                        {new Date(tx.timestamp).toLocaleDateString('vi-VN')}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {new Date(tx.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className={`text-sm font-black ${tx.type === 'RESELL_REVENUE' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {tx.type === 'RESELL_REVENUE' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border whitespace-nowrap ${getStatusStyle(tx.status)}`}>
                                                        {getStatusLabel(tx.status)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-center">
                                                    {tx.type === 'PRIMARY_PURCHASE' ? (
                                                        <Link 
                                                            to={`/my-transactions/${tx.order_id || tx.transaction_id}`}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-neon-green transition-colors"
                                                            title={isVi ? "Xem chi tiết" : "View details"}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-gray-200 dark:text-white/5">-</span>
                                                    )}
                                                </div>
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
                                {isVi ? 'Không tìm thấy giao dịch' : 'No transactions found'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
                                {isVi ? 'Có vẻ như bạn chưa thực hiện giao dịch nào hoặc bộ lọc không khớp.' : 'It seems you haven\'t made any transactions yet or the filter doesn\'t match.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neon-green p-8 rounded-[2.5rem] text-black space-y-4 shadow-xl shadow-neon-green/10 flex flex-col justify-between">
                        <ArrowUpRight className="w-10 h-10 opacity-20 self-end" />
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest opacity-60">Tổng chi tiêu</p>
                            <h4 className="text-3xl font-black">
                                {formatCurrency(transactions
                                    .filter(t => ['completed', 'success', 'paid'].includes(t.status?.toLowerCase()))
                                    .reduce((acc, curr) => acc + (curr.type !== 'RESELL_REVENUE' ? curr.amount : 0), 0)
                                )}
                            </h4>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-dark-card p-8 rounded-[2.5rem] border border-gray-200 dark:border-dark-border flex flex-col justify-between">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{isVi ? 'Yêu cầu hóa đơn' : 'Request Invoice'}</p>
                            <p className="text-xs text-gray-500 mt-1">{isVi ? 'Liên hệ bộ phận chăm sóc khách hàng để nhận hóa đơn VAT.' : 'Contact support to receive VAT invoices.'}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-dark-card p-8 rounded-[2.5rem] border border-gray-200 dark:border-dark-border flex flex-col justify-between">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-4">
                            <ExternalLink className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{isVi ? 'Tra cứu Blockchain' : 'Blockchain Lookup'}</p>
                            <p className="text-xs text-gray-500 mt-1">{isVi ? 'Các giao dịch NFT được ghi lại trên mạng Polygon.' : 'NFT transactions are recorded on the Polygon network.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyTransactions;
