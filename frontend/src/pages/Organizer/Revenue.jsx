import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Revenue = () => {
  const [stats, setStats] = useState({
    balance: 0,
    pendingRevenue: 0,
    totalWithdrawn: 0,
    bankInfo: {
        bank_name: '',
        account_number: '',
        account_holder: ''
    },
    recentTransactions: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Bank Form State
  const [bankForm, setBankForm] = useState({
      bank_name: '',
      account_number: '',
      account_holder: ''
  });

  const fetchStats = async () => {
    try {
      const response = await api.get('/organizer/revenue/summary');
      setStats(response.data);
      setBankForm(response.data.bankInfo);
      setIsLoading(false);
    } catch (error) {
      console.warn('Data fetch issue:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 100000) {
        return toast.error('Số tiền rút tối thiểu là 100,000đ');
    }
    if (Number(withdrawAmount) > stats.balance) {
        return toast.error('Số dư khả dụng không đủ');
    }

    setIsSubmitting(true);
    try {
      await api.post('/organizer/revenue/withdraw', { amount: withdrawAmount });
      
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
          await api.put('/organizer/revenue/bank-info', bankForm);
          
          toast.success('Cập nhật thông tin ngân hàng thành công.');
          setShowBankModal(false);
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
          <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent uppercase tracking-tight">
            QUẢN LÝ DOANH THU
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">Theo dõi số dư và quản lý các giao dịch rút tiền của bạn.</p>
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
        <div className="relative group overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300">
           <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Wallet className="w-24 h-24 text-blue-600" />
           </div>
           <div className="relative z-10">
              <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Số dư khả dụng
              </span>
              <div className="text-4xl font-black tracking-tighter mb-6 text-gray-900 dark:text-white">
                {stats.balance.toLocaleString()}
                <span className="text-lg ml-2 font-medium text-gray-400 dark:text-zinc-500 font-sans">VND</span>
              </div>
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="w-full py-3 bg-blue-600 text-white font-black uppercase text-sm rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                Rút tiền ngay <ArrowUpRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Pending Revenue */}
        <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
           <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-2 mb-4">
             <Clock className="w-4 h-4 text-yellow-500" />
             Doanh thu chờ duyệt
           </span>
           <div className="text-3xl font-black tracking-tighter mb-2 text-gray-900 dark:text-white">
             {stats.pendingRevenue.toLocaleString()}
             <span className="text-sm ml-2 font-medium text-gray-400 dark:text-zinc-500 font-sans">VND</span>
           </div>
           <div className="text-[11px] text-gray-500 dark:text-zinc-500 leading-relaxed bg-gray-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 flex flex-col gap-2">
             <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-yellow-600" />
                <span>Số tiền này sẽ khả dụng 3 ngày sau khi sự kiện kết thúc thành công.</span>
             </div>
             <Link 
                to="/organizer/orders"
                className="mt-2 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
             >
                Xem chi tiết đơn hàng <ExternalLink className="w-3 h-3" />
             </Link>
           </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
           <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase flex items-center gap-2 mb-4">
             <TrendingUp className="w-4 h-4 text-blue-500" />
             Tổng tiền đã rút
           </span>
           <div className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white">
             {stats.totalWithdrawn.toLocaleString()}
             <span className="text-sm ml-2 font-medium text-gray-400 dark:text-zinc-500 font-sans">VND</span>
           </div>
           <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center text-xs text-gray-400 dark:text-zinc-500 font-medium italic">
              <span>Đã xử lý tất cả yêu cầu</span>
              <History className="w-3 h-3" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Table Giao dịch */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
               <h2 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                 <History className="w-5 h-5 text-blue-600" />
                 Lịch sử giao dịch
               </h2>
               <button className="text-xs text-gray-400 dark:text-zinc-400 hover:text-blue-600 transition-colors">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              {stats.recentTransactions.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-zinc-500 bg-gray-50/50 dark:bg-zinc-950/50">
                    <tr>
                      <th className="px-6 py-4 font-bold">Thời gian</th>
                      <th className="px-6 py-4 font-bold">Loại</th>
                      <th className="px-6 py-4 font-bold text-right">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {stats.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="text-gray-700 dark:text-zinc-300 font-medium">{format(new Date(tx.created_at), 'dd/MM/yyyy')}</div>
                           <div className="text-[10px] text-gray-400 dark:text-zinc-500">{format(new Date(tx.created_at), 'HH:mm')}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                             tx.type === 'REVENUE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                           }`}>
                             {tx.type === 'REVENUE' ? 'Doanh thu vé' : 'Rút tiền'}
                           </span>
                           <div className="text-[11px] text-gray-400 dark:text-zinc-500 block mt-1 truncate max-w-[200px]">{tx.description}</div>
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
                <div className="p-12 text-center text-gray-400 dark:text-zinc-500 italic">Chưa có giao dịch nào được ghi nhận.</div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Info Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-8 rounded-3xl sticky top-24 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Thông tin thanh toán
                </h3>
                <button 
                  onClick={() => setShowBankModal(true)}
                  className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors group"
                >
                   <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </button>
             </div>

             {stats.bankInfo.bank_name ? (
               <div className="space-y-6">
                  <div className="relative p-6 bg-gradient-to-br from-blue-600/5 to-white dark:from-blue-900/20 dark:to-zinc-950 border border-blue-600/20 dark:border-blue-500/20 rounded-2xl overflow-hidden group">
                     <div className="absolute -bottom-4 -right-4 bg-blue-600/5 dark:bg-blue-500/5 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                     <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1">Tên ngân hàng</div>
                     <div className="text-lg font-black text-blue-600 dark:text-blue-400 mb-4 uppercase">{stats.bankInfo.bank_name}</div>
                     
                     <div className="flex justify-between items-end">
                        <div>
                           <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1">Số tài khoản</div>
                           <div className="text-xl font-mono tracking-wider text-gray-900 dark:text-white">**** **** {stats.bankInfo.account_number.slice(-4)}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1">Chủ tài khoản</div>
                           <div className="text-sm font-bold uppercase text-gray-900 dark:text-white">{stats.bankInfo.account_holder}</div>
                        </div>
                     </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-500 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 italic bg-gray-50 dark:bg-zinc-950/30">
                    Lưu ý: Mọi yêu cầu rút tiền sẽ được chuyển tự động về tài khoản mặc định này.
                  </div>
               </div>
             ) : (
               <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-2xl">
                 <AlertCircle className="w-10 h-10 text-gray-200 dark:text-zinc-800 mx-auto mb-4" />
                 <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4">Bạn chưa cấu hình thông tin ngân hàng.</p>
                 <button 
                   onClick={() => setShowBankModal(true)}
                   className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                 >
                   Thiết lập ngay
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Modal Rút tiền */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
           <div className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 w-full max-w-md p-8 rounded-3xl shadow-2xl">
              <h2 className="text-2xl font-black mb-2 flex items-center gap-2 text-gray-900 dark:text-white uppercase tracking-tight">
                 <Banknote className="w-6 h-6 text-blue-600" />
                 RÚT TIỀN
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8 border-b border-gray-50 dark:border-zinc-800 pb-4">
                Chuyển lợi nhuận về tài khoản ngân hàng của bạn.
              </p>
              
              <form onSubmit={handleWithdraw}>
                 <div className="mb-8">
                   <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest block mb-4">Số tiền muốn rút (VND)</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Nhập số tiền..."
                        className="w-full bg-white dark:bg-zinc-950 border-b-2 border-gray-200 dark:border-zinc-800 focus:border-blue-600 text-3xl font-black py-4 outline-none transition-all pr-12 text-gray-900 dark:text-white"
                        required
                        min="100000"
                      />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 font-bold">VNĐ</span>
                   </div>
                   <div className="flex justify-between mt-4 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-gray-400 dark:text-zinc-500">Số dư hiện có:</span>
                      <span className="text-blue-600 dark:text-blue-400">{stats.balance.toLocaleString()}đ</span>
                   </div>
                 </div>

                 <div className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 mb-8">
                    <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase mb-2">Chuyển đến tài khoản:</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">{stats.bankInfo.bank_name}</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-500">{stats.bankInfo.account_number} - {stats.bankInfo.account_holder}</div>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 py-4 text-gray-400 dark:text-zinc-500 text-sm font-bold uppercase hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-sm rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-600/20"
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Modal Bank Info */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={() => setShowBankModal(false)}></div>
           <div className="relative bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 w-full max-w-md p-8 rounded-3xl shadow-2xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white uppercase">
                 <CreditCard className="w-5 h-5 text-blue-600" />
                 Cập nhật Ngân hàng
              </h2>
              <form onSubmit={handleUpdateBank} className="space-y-4 text-left">
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase block mb-1 tracking-widest">Tên ngân hàng (VD: VCB, MBBank...)</label>
                   <input 
                      type="text" 
                      value={bankForm.bank_name}
                      onChange={(e) => setBankForm({...bankForm, bank_name: e.target.value.toUpperCase()})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 p-3 rounded-xl focus:border-blue-600 outline-none transition-all text-gray-900 dark:text-white font-bold"
                      required
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase block mb-1 tracking-widest">Số tài khoản</label>
                   <input 
                      type="text" 
                      value={bankForm.account_number}
                      onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 p-3 rounded-xl focus:border-blue-600 outline-none transition-all text-gray-900 dark:text-white font-bold"
                      required
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase block mb-1 tracking-widest">Tên chủ tài khoản (Không dấu)</label>
                   <input 
                      type="text" 
                      value={bankForm.account_holder}
                      onChange={(e) => setBankForm({...bankForm, account_holder: e.target.value.toUpperCase()})}
                      className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 p-3 rounded-xl focus:border-blue-600 outline-none transition-all text-gray-900 dark:text-white font-black"
                      required
                   />
                 </div>
                 
                 <div className="pt-4 flex gap-3 font-black">
                    <button 
                      type="button" 
                      onClick={() => setShowBankModal(false)}
                      className="flex-1 py-3 text-gray-400 dark:text-zinc-500 text-xs uppercase hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Đóng
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-blue-600 text-white text-xs uppercase rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                    >
                      {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
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
