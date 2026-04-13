import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Ticket, 
  CreditCard, 
  Globe, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Hash,
  Activity,
  ChevronRight,
  ShieldCheck,
  Zap,
  Copy
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { toast } from 'react-hot-toast';

const TransactionDetail = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await adminService.getTransactionDetail(type, id);
      setData(res.data);
    } catch (error) {
      toast.error('Không thể tải chi tiết giao dịch');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [type, id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-black animate-pulse uppercase tracking-widest text-xs">Đang tải dữ liệu sâu...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#111114] rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Không tìm thấy giao dịch</h2>
        <p className="text-gray-500 mt-2">Dữ liệu có thể đã bị xóa hoặc ID không chính xác.</p>
        <button onClick={() => navigate(-1)} className="mt-8 px-6 py-3 bg-neon-green text-black font-black rounded-2xl uppercase text-xs tracking-widest">Quay lại danh sách</button>
      </div>
    );
  }

  const isMarketplace = type === 'MARKETPLACE';
  const orderType = isMarketplace ? 'Thứ cấp (Chợ)' : (data.order_type === 'TICKET_TRANSFER' ? 'Chuyển nhượng' : 'Sơ cấp (Mua mới)');
  const status = isMarketplace ? data.status : data.status;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Link to="/admin/transactions" className="hover:text-neon-green transition-all">Giao dịch</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-500">{type}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-neon-green">{id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center space-x-4">
             <button 
                onClick={() => navigate(-1)}
                className="p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-gray-500 hover:text-neon-green transition-all"
             >
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
               <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center space-x-3">
                 <Hash className="w-6 h-6 text-neon-green" />
                 <span>CHI TIẾT GIAO DỊCH</span>
               </h1>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 flex items-center">
                 <Activity className="w-3 h-3 mr-1.5 text-neon-green" />
                 ID: {id} 
                 <Copy className="w-3 h-3 ml-2 cursor-pointer hover:text-neon-green" onClick={() => copyToClipboard(id)} />
               </p>
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
           <button className="flex items-center space-x-2 px-5 py-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm">
             <Download className="w-4 h-4" />
             <span>Xuất PDF</span>
           </button>
           <button className="flex items-center space-x-2 px-5 py-3 bg-neon-green text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(82,196,45,0.3)] hover:scale-105 transition-all">
             <Zap className="w-4 h-4 fill-current" />
             <span>Hỗ trợ nhanh</span>
           </button>
        </div>
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-neon-green/5 blur-3xl -mr-8 -mt-8"></div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest relative z-10">Giá trị giao dịch</p>
           <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1 tracking-tighter relative z-10">
             {formatCurrency(isMarketplace ? data.buyer_pay_amount : data.total_amount)}
           </h3>
           <div className="mt-4 flex items-center space-x-2 text-[10px] font-bold text-neon-green uppercase tracking-widest relative z-10">
             <DollarSign className="w-3 h-3" />
             <span>Bao gồm tất cả phí</span>
           </div>
         </div>

         <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl -mr-8 -mt-8"></div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại hình</p>
           <h3 className="text-xl font-black text-blue-500 mt-2 uppercase tracking-tight italic">
             {orderType}
           </h3>
           <div className="mt-3 flex items-center text-[10px] font-bold text-gray-500 tracking-widest">
             {isMarketplace ? 'Thị trường thứ cấp (C2C)' : 'Thị trường sơ cấp (B2C)'}
           </div>
         </div>

         <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl -mr-8 -mt-8"></div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</p>
           <div className="mt-3">
              {status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'success' || status?.toLowerCase() === 'completed' ? (
                <span className="flex items-center space-x-2 text-green-500 bg-green-500/10 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase border border-green-500/20 w-fit">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hoàn tất thành công</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2 text-yellow-500 bg-yellow-500/10 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase border border-yellow-500/20 w-fit">
                  <Clock className="w-4 h-4" />
                  <span>{status}</span>
                </span>
              )}
           </div>
         </div>

         <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden relative group">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian/IP</p>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1 tracking-tighter">
              {new Date(isMarketplace ? new Date() : data.created_at).toLocaleString('vi-VN')}
            </h3>
            <div className="mt-4 flex flex-col space-y-1">
              <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">
                {data.ip_address || 'Không xác định'}
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                  Địa chỉ IP Người mua
              </span>
              {data.ip_address && (
                <button 
                  onClick={() => copyToClipboard(data.ip_address)} 
                  className="mt-2 text-[10px] text-neon-green font-black uppercase tracking-widest hover:underline w-fit"
                >
                  Sao chép IP
                </button>
              )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: People and Event */}
        <div className="lg:col-span-1 space-y-8">
           {/* Section: Participants */}
           <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm">
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center">
                 <User className="w-4 h-4 mr-3 text-neon-green" />
                 Đối tượng liên quan
              </h2>
              
              <div className="space-y-6">
                 {/* Buyer */}
                 <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Người mua (Khách hàng)</p>
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center font-black text-neon-green text-sm border border-neon-green/20">
                          {isMarketplace ? data.buyer.full_name?.charAt(0) : data.customer.full_name?.charAt(0)}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                             {isMarketplace ? data.buyer.full_name : data.customer.full_name}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium tracking-tight">
                             {isMarketplace ? data.buyer.email : data.customer.email}
                          </span>
                       </div>
                    </div>
                 </div>

                 {/* Seller (Only for Marketplace) */}
                 {isMarketplace && (
                    <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Người bán (Chủ cũ)</p>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center font-black text-blue-500 text-sm border border-blue-500/20">
                           {data.seller.full_name?.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-gray-900 dark:text-white">{data.seller.full_name}</span>
                           <span className="text-[10px] text-gray-500 font-medium tracking-tight">{data.seller.email}</span>
                        </div>
                      </div>
                    </div>
                 )}
              </div>
           </div>

           {/* Section: Event Info */}
           <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                 <Globe className="w-24 h-24" />
              </div>
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center">
                 <MapPin className="w-4 h-4 mr-3 text-neon-green" />
                 Sự kiện liên quan
              </h2>
              
              <div className="space-y-4">
                 <img 
                    src={isMarketplace ? data.listing.event.image_url : data.event.image_url} 
                    className="w-full h-40 object-cover rounded-2xl border border-gray-100 dark:border-white/5"
                    alt="Event"
                 />
                 <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                    {isMarketplace ? data.listing.event.title : data.event.title}
                 </h3>
                 <div className="flex flex-col space-y-2">
                    <div className="flex items-center text-[11px] text-gray-500 font-medium">
                       <Calendar className="w-3.5 h-3.5 mr-2 text-neon-green" />
                       {new Date(isMarketplace ? data.listing.event.event_date : data.event.event_date).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center text-[11px] text-gray-500 font-medium line-clamp-1">
                       <MapPin className="w-3.5 h-3.5 mr-2 text-neon-green shrink-0" />
                       {isMarketplace ? data.listing.event.location_address : data.event.location_address}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Transaction Content & Technicals */}
        <div className="lg:col-span-2 space-y-8">
           {/* Section: Items List */}
           <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-8 shadow-sm">
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center">
                 <Ticket className="w-4 h-4 mr-3 text-neon-green" />
                 Nội dung đơn hàng / vé
              </h2>

              <div className="space-y-4">
                 {isMarketplace ? (
                    /* Only 1 ticket for Marketplace */
                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-neon-green/30 transition-all">
                       <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                             <Ticket className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">Vé Marketplace</p>
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Hạng: {data.ticket.ticket_tier.tier_name}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(data.buyer_pay_amount)}</p>
                          <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest mt-0.5">Số lượng: 1</p>
                       </div>
                    </div>
                 ) : (
                    /* Multiple items for Order */
                    data.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-neon-green/30 transition-all">
                        <div className="flex items-center space-x-4">
                           <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center border border-neon-green/20">
                              <Ticket className="w-6 h-6 text-neon-green" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">{item.ticket_tier.tier_name}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{formatCurrency(Number(item.unit_price))} / vé</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(Number(item.subtotal))}</p>
                           <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest mt-0.5">Số lượng: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                 )}
              </div>

              {/* Financial Breakdown */}
              <div className="mt-12 space-y-4 pt-8 border-t border-gray-100 dark:border-white/5">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Tạm tính (Subtotal)</span>
                    <span className="text-gray-900 dark:text-white font-black tracking-tight">{formatCurrency(isMarketplace ? data.seller_receive_amount : data.total_amount)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Phí giao dịch {isMarketplace ? '(Platform Fee)' : ''}</span>
                    <span className="text-neon-green font-black tracking-tight">+{formatCurrency(isMarketplace ? data.platform_fee : 0)}</span>
                 </div>
                 <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/5">
                    <span className="text-gray-900 dark:text-white font-black uppercase tracking-[0.2em] text-xs">Tổng doanh thu hệ thống</span>
                    <span className="text-2xl font-black text-neon-green tracking-tighter">{formatCurrency(isMarketplace ? data.platform_fee : data.total_amount)}</span>
                 </div>
              </div>
           </div>

           {/* Section: Technical / Blockchain / Payments */}
           <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-8 shadow-sm">
              <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center">
                 <ShieldCheck className="w-4 h-4 mr-3 text-neon-green" />
                 Dữ liệu Kỹ thuật & Bảo mật
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Payments */}
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phương thức & Cổng thanh toán</p>
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                       <CreditCard className="w-6 h-6 text-neon-green" />
                       <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight italic">
                            {!isMarketplace && data.payments && data.payments.length > 0 
                                ? data.payments[0].method.toUpperCase() 
                                : 'Ví BASTICKET'}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                            {(!isMarketplace && data.payments && data.payments.length > 0) 
                                ? `Mã tham chiếu: ${data.payments[0].transaction_id || 'N/A'}`
                                : 'Giao dịch nội bộ / Blockchain'}
                          </p>
                       </div>
                    </div>
                 </div>

                 {/* Blockchain */}
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Xác thực Blockchain (Smart Contract)</p>
                    {isMarketplace && data.nft_transfer_tx_hash ? (
                      <a 
                        href={`https://amoy.polygonscan.com/tx/${data.nft_transfer_tx_hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 bg-neon-green/10 border border-neon-green/20 rounded-2xl group transition-all"
                      >
                         <div className="flex items-center space-x-3">
                            <Globe className="w-6 h-6 text-neon-green" />
                            <div>
                               <p className="text-sm font-black text-neon-green uppercase tracking-tight italic">Polygon Amoy</p>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-[120px]">{data.nft_transfer_tx_hash}</p>
                            </div>
                         </div>
                         <ExternalLink className="w-4 h-4 text-neon-green group-hover:scale-125 transition-all" />
                      </a>
                    ) : (
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5 opacity-50 italic">
                         <ShieldCheck className="w-6 h-6 text-gray-400" />
                         <div>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-tight">On-chain Validated</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Dữ liệu đã được nén</p>
                         </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Advanced JSON Toggle (Mock) */}
              <div className="mt-8">
                 <button className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-neon-green transition-all flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-green mr-2 animate-pulse"></div>
                    Dữ liệu phản hồi thô (JSON) - Dành cho kỹ thuật
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
