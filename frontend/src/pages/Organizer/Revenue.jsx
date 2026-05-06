import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CreditCard, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  History,
  Banknote,
  RefreshCcw,
  Edit2,
  ExternalLink,
  Building2,
  Hash,
  User
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

import { useSystemConfig } from '../../hooks/useSystemConfig';

const Revenue = () => {
  const { withdrawalFee, minWithdrawal } = useSystemConfig();
  const [stats, setStats] = useState({
    balance: 0,
    pendingRevenue: 0,
    totalWithdrawn: 0,
    bankInfo: {
        bank_name: '',
        account_number: '',
        account_holder: ''
    },
    recentTransactions: [],
    withdrawalRequests: []
  });
  const [activeTab, setActiveTab] = useState('transactions');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [allBanks, setAllBanks] = useState([]);
  const [searchBankQuery, setSearchBankQuery] = useState('');
  const amountInputRef = useRef(null);
  
  // Bank Form State
  const [bankForm, setBankForm] = useState({
      bank_name: '',
      account_number: '',
      account_holder: ''
  });

  const fetchStats = async () => {
    try {
      const summaryRes = await api.get('/revenue/summary');
      const historyRes = await api.get('/revenue/transactions');
      
      setStats({
          ...summaryRes.data,
          withdrawalRequests: historyRes.data.withdrawalRequests || []
      });
      setBankForm(summaryRes.data.bankInfo);
      setIsLoading(false);
    } catch (error) {
      console.warn('Data fetch issue:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBanks();
  }, []);

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

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < minWithdrawal) {
        return toast.error(`Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString()}đ`);
    }
    if (Number(withdrawAmount) > stats.balance) {
        return toast.error('Số dư khả dụng không đủ');
    }

    setIsSubmitting(true);
    try {
      await api.post('/revenue/withdraw', { amount: withdrawAmount });
      
      toast.success('Yêu cầu rút tiền đã được gửi.');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Lỗi khi rút tiền.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBank = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          await api.put('/revenue/bank-info', bankForm);
          
          toast.success('Cập nhật thông tin ngân hàng thành công.');
          setIsEditingBank(false);
          fetchStats();
      } catch (error) {
          toast.error('Không thể cập nhật thông tin ngân hàng.');
      } finally {
          setIsSubmitting(false);
      }
  };

  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-1 sm:p-1 min-h-screen bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            QUẢN LÝ DOANH THU
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-500 mt-1 font-medium">Theo dõi số dư và quản lý các giao dịch rút tiền của bạn.</p>
        </div>
        <button 
          onClick={() => fetchStats()}
          className="p-2 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Available Balance */}
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-[1.5rem] shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Wallet className="w-24 h-24 text-blue-600" />
           </div>
           <div className="relative z-10">
              <span className="text-[10px] font-black text-gray-600 dark:text-zinc-500 uppercase flex items-center gap-2 mb-2 tracking-tight">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                Số dư khả dụng
              </span>
              <div className="text-2xl font-black tracking-tighter mb-5 text-gray-900 dark:text-white">
                {stats.balance.toLocaleString()}
                <span className="text-xs ml-1.5 font-bold text-gray-400 dark:text-zinc-500">VND</span>
              </div>
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="w-full py-2.5 bg-blue-600 text-white font-black uppercase text-[10px] rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 active:scale-95"
              >
                Rút tiền ngay <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
           </div>
        </div>

        {/* Pending Revenue */}
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-[1.5rem] shadow-sm">
           <span className="text-[10px] font-black text-gray-600 dark:text-zinc-500 uppercase flex items-center gap-2 mb-2 tracking-tight">
             <Clock className="w-3.5 h-3.5 text-yellow-500" />
             Doanh thu chờ duyệt
           </span>
           <div className="text-2xl font-black tracking-tighter mb-2 text-gray-900 dark:text-white">
             {stats.pendingRevenue.toLocaleString()}
             <span className="text-xs ml-1.5 font-bold text-gray-400 dark:text-zinc-500">VND</span>
           </div>
           <div className="text-[11px] text-gray-700 dark:text-zinc-500 leading-relaxed bg-gray-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 flex flex-col gap-2">
             <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-yellow-600" />
                <span>Số tiền này sẽ khả dụng 3 ngày sau khi sự kiện kết thúc thành công.</span>
             </div>
             <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                <Link 
                    to="/organizer/orders"
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                    Xem chi tiết đơn hàng <ExternalLink className="w-3 h-3" />
                </Link>
                <Link 
                    to="/organizer/marketplace"
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                    Xem chi tiết hoa hồng <ExternalLink className="w-3 h-3" />
                </Link>
             </div>
           </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 p-6 rounded-[1.5rem] shadow-sm">
           <span className="text-[10px] font-black text-gray-600 dark:text-zinc-500 uppercase flex items-center gap-2 mb-2 tracking-tight">
             <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
             Tổng tiền đã rút
           </span>
           <div className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
             {stats.totalWithdrawn.toLocaleString()}
             <span className="text-xs ml-1.5 font-bold text-gray-400 dark:text-zinc-500">VND</span>
           </div>
           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-[10px] text-gray-400 dark:text-zinc-500 font-bold tracking-tight">
              <span>Hoàn tất xử lý</span>
              <History className="w-3 h-3" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Table Giao dịch */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#111114] border border-gray-300 dark:border-white/5 rounded-[1.5rem] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`pb-2 text-[11px] font-black uppercase transition-all border-b-2 ${activeTab === 'transactions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-700'}`}
                  >
                    Biến động số dư
                  </button>
                  <button 
                    onClick={() => setActiveTab('withdrawals')}
                    className={`pb-2 text-[11px] font-black uppercase transition-all border-b-2 ${activeTab === 'withdrawals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-700'}`}
                  >
                    Lịch sử rút tiền
                  </button>
               </div>
               <Link to="/organizer/reports" className="text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1">
                 Xem báo cáo chi tiết <ArrowUpRight className="w-3 h-3" />
               </Link>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              {activeTab === 'transactions' ? (
                stats.recentTransactions.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-tight text-gray-400 dark:text-zinc-500 bg-gray-50/50 dark:bg-zinc-950/50">
                      <tr>
                        <th className="px-6 py-4 font-bold">Thời gian</th>
                        <th className="px-6 py-4 font-bold">Nội dung giao dịch</th>
                        <th className="px-6 py-4 font-bold text-right">Số dư biến động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {stats.recentTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="text-gray-700 dark:text-zinc-300 font-bold">{format(new Date(tx.created_at), 'dd/MM/yyyy')}</div>
                             <div className="text-[10px] text-gray-400 dark:text-zinc-500">{format(new Date(tx.created_at), 'HH:mm')}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                               tx.type === 'REVENUE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                             }`}>
                               {tx.type === 'REVENUE' ? 'Cộng tiền' : 'Trừ tiền'}
                             </span>
                             <div className="text-[11px] font-medium text-gray-900 dark:text-zinc-300 block mt-1 truncate max-w-[250px]">{tx.description}</div>
                          </td>
                          <td className={`px-6 py-4 text-right font-black ${
                              tx.amount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                          }`}>
                             {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-400 dark:text-zinc-500 italic">Chưa có giao dịch ví nào.</div>
                )
              ) : (
                stats.withdrawalRequests.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase tracking-tight text-gray-400 dark:text-zinc-500 bg-gray-50/50 dark:bg-zinc-950/50">
                      <tr>
                        <th className="px-6 py-4 font-bold">Ngày yêu cầu</th>
                        <th className="px-6 py-4 font-bold">Thụ hưởng / Phí</th>
                        <th className="px-6 py-4 font-bold">Trạng thái</th>
                        <th className="px-6 py-4 font-bold text-right">Số tiền rút</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {stats.withdrawalRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                             <div className="text-gray-700 dark:text-zinc-300 font-bold">{format(new Date(req.created_at), 'dd/MM/yyyy')}</div>
                             <div className="text-[10px] text-gray-400 dark:text-zinc-500">{format(new Date(req.created_at), 'HH:mm')}</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="text-[11px] font-black text-gray-900 dark:text-white uppercase">{req.bank_name}</div>
                             <div className="text-[10px] text-red-500 font-bold">Phí: {Number(req.fee_amount || 0).toLocaleString()}đ</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1 w-fit ${
                               req.status === 'completed' ? 'bg-green-50 text-green-600 dark:bg-green-500/10' : 
                               req.status === 'rejected' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 
                               'bg-orange-50 text-orange-600 dark:bg-orange-500/10'
                             }`}>
                               {req.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : 
                                req.status === 'rejected' ? <AlertCircle className="w-3 h-3" /> : 
                                <Clock className="w-3 h-3 animate-pulse" />}
                               {req.status === 'completed' ? 'Thành công' : 
                                req.status === 'rejected' ? 'Đã từ chối' : 'Đang xử lý'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                             -{req.amount.toLocaleString()}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-400 dark:text-zinc-500 italic">Bạn chưa từng yêu cầu rút tiền.</div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bank Info Section */}
        <div className="lg:col-span-2">
            {/* Payment Info Card */}
            <div className="bg-white dark:bg-[#111114] p-8 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                     </div>
                     <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Thông tin thanh toán</h3>
                  </div>
                  {!isEditingBank && stats.bankInfo.bank_name && (
                    <button 
                      onClick={() => {
                        setBankForm(stats.bankInfo);
                        setIsEditingBank(true);
                      }}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg text-gray-400 transition-colors"
                    >
                       <Edit2 className="w-4 h-4" />
                    </button>
                  )}
               </div>

               {isEditingBank ? (
                 <form onSubmit={handleUpdateBank} className="space-y-4">
                    <div>
                       <label className="text-[10px] font-black text-gray-700 dark:text-zinc-500 uppercase block mb-1.5 tracking-tight">Chọn Ngân hàng</label>
                       
                       {/* Search Box */}
                       <div className="relative mb-3">
                          <input 
                             type="text" 
                             placeholder="Tìm tên ngân hàng hoặc mã (VD: VCB...)"
                             className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600 transition-all"
                             value={searchBankQuery}
                             onChange={(e) => setSearchBankQuery(e.target.value)}
                          />
                       </div>

                       {/* Logo Grid */}
                       <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-3 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-900/30 custom-scrollbar shadow-inner">
                          {allBanks
                            .filter(b => 
                              b.name.toLowerCase().includes(searchBankQuery.toLowerCase()) || 
                              b.shortName.toLowerCase().includes(searchBankQuery.toLowerCase()) ||
                              b.code.toLowerCase().includes(searchBankQuery.toLowerCase())
                            )
                            .map(bank => (
                               <button
                                 key={bank.id}
                                 type="button"
                                 onClick={() => {
                                   setBankForm({...bankForm, bank_name: bank.shortName + ' (' + bank.code + ')'});
                                   setSearchBankQuery('');
                                 }}
                                 className={`flex flex-col items-center justify-center p-1 rounded-xl border transition-all relative group h-16 ${
                                   bankForm.bank_name?.includes(bank.code)
                                     ? 'bg-blue-50 dark:bg-blue-600 border-blue-500 shadow-md scale-[1.02]'
                                     : 'bg-white dark:bg-white border-gray-100 dark:border-transparent hover:border-blue-300'
                                 }`}
                               >
                                  {bankForm.bank_name?.includes(bank.code) && (
                                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-lg z-10 border-2 border-white dark:border-zinc-900">
                                       <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                  )}
                                  <div className="w-full h-full flex items-center justify-center overflow-hidden p-1">
                                     <img 
                                       src={bank.logo} 
                                       alt={bank.shortName} 
                                       className="w-full h-full object-contain scale-150" 
                                     />
                                  </div>
                               </button>
                            ))
                          }
                       </div>
                       
                       {/* Selected Display */}
                       {bankForm.bank_name && (
                         <div className="mt-2 text-[10px] font-black text-blue-600 uppercase">
                            Đang chọn: {bankForm.bank_name}
                         </div>
                       )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-gray-700 dark:text-zinc-500 uppercase block mb-1.5 tracking-tight">Số tài khoản</label>
                          <input 
                             type="text" 
                             className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600 transition-all"
                             value={bankForm.account_number}
                             onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})}
                             required
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-700 dark:text-zinc-500 uppercase block mb-1.5 tracking-tight">Chủ tài khoản</label>
                          <input 
                             type="text" 
                             className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-600 transition-all uppercase"
                             value={bankForm.account_holder}
                             onChange={(e) => setBankForm({...bankForm, account_holder: e.target.value.toUpperCase()})}
                             required
                          />
                       </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                       <button 
                          type="button"
                          onClick={() => setIsEditingBank(false)}
                          className="flex-1 py-2.5 text-gray-400 text-[10px] font-black uppercase hover:text-gray-900 transition-colors"
                       >
                          Hủy
                       </button>
                       <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 py-2.5 bg-blue-600 text-white font-black uppercase text-[10px] rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                       >
                          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                       </button>
                    </div>
                 </form>
               ) : (
                 stats.bankInfo.bank_name ? (
                    <div className="space-y-4">
                       <div className="p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-50 dark:border-zinc-800/50">
                          <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase mb-1 tracking-tight">Ngân hàng</div>
                          <div className="text-sm font-black text-gray-900 dark:text-white">{stats.bankInfo.bank_name}</div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-50 dark:border-zinc-800/50">
                             <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase mb-1 tracking-tight">Số tài khoản</div>
                             <div className="text-sm font-black text-gray-900 dark:text-white">{stats.bankInfo.account_number}</div>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-2xl border border-gray-50 dark:border-zinc-800/50">
                             <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase mb-1 tracking-tight">Chủ tài khoản</div>
                             <div className="text-sm font-black text-gray-900 dark:text-white uppercase">{stats.bankInfo.account_holder}</div>
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-[1.5rem]">
                       <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                          <AlertCircle className="w-6 h-6 text-gray-300 dark:text-zinc-700" />
                       </div>
                       <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mb-6">Bạn chưa cấu hình thông tin ngân hàng.</p>
                       <button 
                          onClick={() => setIsEditingBank(true)}
                          className="px-8 py-3 bg-blue-600 text-white text-[11px] font-black uppercase rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                       >
                          Thiết lập ngay
                       </button>
                    </div>
                 )
               )}
            </div>
        </div>
      </div>

      {/* Modal Rút tiền */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
           <div className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 w-full max-w-md p-8 rounded-3xl shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-blue-600" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Rút tiền</h2>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-bold tracking-tight">Yêu cầu quyết toán doanh thu</p>
                 </div>
              </div>
              
              <form onSubmit={handleWithdraw} className="space-y-6">
                 <div className="space-y-4">
                   <div className="flex justify-between items-end px-1">
                      <label className="text-[10px] font-black text-gray-700 dark:text-zinc-500 uppercase tracking-tight">Số tiền rút (VND)</label>
                      <div className="text-sm font-black text-gray-700">
                          Số dư: <span className="text-blue-600 dark:text-blue-400">{stats.balance.toLocaleString()}đ</span>
                       </div>
                   </div>
                   
                   <div className="relative group">
                      <input 
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => {
                           let val = e.target.value.replace(/\D/g, '');
                           if (val.length > 1 && val.startsWith('0')) {
                               val = val.replace(/^0+/, '');
                               if (val === '') val = '0';
                           }
                           setWithdrawAmount(val);
                        }}
                        placeholder="Nhập số tiền..."
                        className="w-full bg-gray-50 dark:bg-zinc-950/50 border border-gray-100 dark:border-zinc-800/50 rounded-2xl px-4 py-4 text-xl font-black outline-none focus:border-blue-600 transition-all text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                        min={minWithdrawal}
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm uppercase">VND</span>
                   </div>
                   
                   {withdrawAmount && (
                      <div className="flex justify-end px-2 -mt-1 animate-in fade-in">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mr-2 flex items-center">Tương đương:</span>
                         <span className="text-sm font-black text-blue-600">{Number(withdrawAmount).toLocaleString('vi-VN')} VND</span>
                      </div>
                   )}
                   
                    {withdrawAmount && Number(withdrawAmount) >= minWithdrawal ? (
                      <div className="p-4 bg-blue-50/50 dark:bg-blue-600/5 rounded-2xl border border-blue-100 dark:border-blue-600/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                           <span className="text-gray-500 dark:text-zinc-500">Phí giao dịch ({withdrawalFee}%)</span>
                           <span className="text-red-500 font-black">- {(Number(withdrawAmount) * (withdrawalFee / 100)).toLocaleString()}đ</span>
                        </div>
                        <div className="h-px bg-blue-200/50 dark:bg-blue-600/20"></div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-black text-gray-700 dark:text-zinc-500 uppercase tracking-tight">Thực nhận</span>
                           <span className="text-2xl font-black text-green-600">{(Number(withdrawAmount) * (1 - withdrawalFee / 100)).toLocaleString()}đ</span>
                        </div>
                      </div>
                    ) : withdrawAmount ? (
                      <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800 w-full">
                         <AlertCircle className="w-4 h-4 text-gray-400" />
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Số tiền rút tối thiểu là {minWithdrawal.toLocaleString()} VND</span>
                      </div>
                    ) : null}
                 </div>

                 <div className="p-5 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-2xl">
                    <div className="text-[9px] text-gray-400 dark:text-zinc-500 font-black uppercase mb-3 tracking-tight flex items-center gap-2">
                       <CreditCard className="w-3 h-3 text-blue-600/50" /> Chuyển đến tài khoản
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white dark:bg-white rounded-lg flex items-center justify-center p-1 border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                          {allBanks.find(b => stats.bankInfo.bank_name?.includes(b.code)) ? (
                            <img 
                              src={allBanks.find(b => stats.bankInfo.bank_name?.includes(b.code))?.logo} 
                              alt="Bank Logo" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-[8px] font-black text-blue-600 uppercase text-center leading-none">
                               {stats.bankInfo.bank_name?.split(' ')[0] || 'Bank'}
                            </div>
                          )}
                       </div>
                       <div className="overflow-hidden">
                          <div className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">{stats.bankInfo.bank_name}</div>
                          <div className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 truncate">{stats.bankInfo.account_number} • {stats.bankInfo.account_holder}</div>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-2">
                    <button 
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 py-4 text-gray-400 dark:text-zinc-500 text-[11px] font-black uppercase hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting || withdrawAmount < minWithdrawal || withdrawAmount > stats.balance}
                      className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-[11px] rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Revenue;
