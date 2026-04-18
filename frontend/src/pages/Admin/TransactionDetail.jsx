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
import { userService } from '../../services/user.service';
import { exportToExcel } from '../../utils/excel';
import { toast } from 'react-hot-toast';

const TransactionDetail = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [receiverUser, setReceiverUser] = useState(null);

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

  const handleExportExcel = () => {
    if (!data) return;
    
    const statusText = data.status?.toLowerCase() === 'paid' ? 'Thành công' : 'Thất bại/Hủy';
    
    const exportData = [
      { 'Tiêu chí': 'Mã giao dịch', 'Thông tin chi tiết': id },
      { 'Tiêu chí': 'Loại hình', 'Thông tin chi tiết': orderType },
      { 'Tiêu chí': 'Trạng thái', 'Thông tin chi tiết': statusText },
      { 'Tiêu chí': 'Thời gian', 'Thông tin chi tiết': new Date(data.created_at).toLocaleString('vi-VN') },
      { 'Tiêu chí': 'Tổng giá trị', 'Thông tin chi tiết': `${(isMarketplace ? data.buyer_pay_amount : data.total_amount).toLocaleString()} đ` },
      { 'Tiêu chí': 'Phương thức', 'Thông tin chi tiết': data.payment_method || 'N/A' },
      { 'Tiêu chí': '---', 'Thông tin chi tiết': '---' },
      { 'Tiêu chí': 'Người gửi (Khách hàng)', 'Thông tin chi tiết': data.customer?.full_name || data.metadata?.customer_name || 'N/A' },
      { 'Tiêu chí': 'Email người gửi', 'Thông tin chi tiết': data.customer?.email || data.metadata?.customer_email || 'N/A' },
      { 'Tiêu chí': '---', 'Thông tin chi tiết': '---' },
      { 'Tiêu chí': 'Sự kiện', 'Thông tin chi tiết': data.event?.title || 'N/A' },
      { 'Tiêu chí': 'Mô tả giao dịch', 'Thông tin chi tiết': data.description || '' }
    ];

    const success = exportToExcel(exportData, `BASTICKET_Detail_${id}`);
    if (success) {
      toast.success('Xuất file thành công!');
    } else {
      toast.error('Lỗi khi xuất file Excel');
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [type, id]);

  useEffect(() => {
    const fetchReceiverInfo = async () => {
      if (data && !data.receiver && data.metadata?.receiver_email) {
        try {
          const res = await userService.findByEmail(data.metadata.receiver_email);
          if (res.data) {
            setReceiverUser(res.data);
          }
        } catch (error) {
          console.error("Error fetching receiver info:", error);
        }
      }
    };
    fetchReceiverInfo();
  }, [data]);

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
        <p className="text-gray-500 font-bold animate-pulse text-sm">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#111114] rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Không tìm thấy giao dịch</h2>
        <p className="text-gray-500 mt-2">Dữ liệu có thể đã bị xóa hoặc id không chính xác.</p>
        <button onClick={() => navigate(-1)} className="mt-8 px-6 py-3 bg-neon-green text-black font-bold rounded-2xl text-sm">Quay lại danh sách</button>
      </div>
    );
  }

  const isMarketplace = type === 'MARKETPLACE';
  const orderType = isMarketplace ? 'Thứ cấp (Chợ)' : (data.order_type === 'TICKET_TRANSFER' ? 'Chuyển nhượng' : 'Sơ cấp (Mua mới)');
  const status = data.status;

  const calculateFinancials = () => {
    if (!data) return { systemCommission: 0, btcRevenue: 0, resaleProfit: 0 };
    
    if (isMarketplace) {
      if (Number(data.commission_fee) > 0 || Number(data.organizer_royalty) > 0) {
        return {
          systemCommission: Number(data.platform_fee || 0),
          btcRevenue: Number(data.organizer_royalty || 0),
          resaleProfit: Number(data.resale_profit || 0)
        };
      }

      const platformFee = Number(data.platform_fee || 0);
      const buyerPay = Number(data.buyer_pay_amount || 0);
      const royalty = (buyerPay - platformFee) * 0.03;
      return { 
        systemCommission: platformFee, 
        btcRevenue: royalty,
        resaleProfit: (Number(data.seller_receive_amount || 0) - (buyerPay - platformFee))
      };
    } else {
      if (Number(data.commission_fee) > 0 || Number(data.organizer_revenue) > 0) {
        return {
          systemCommission: Number(data.platform_fee || 0),
          btcRevenue: Number(data.organizer_revenue || 0),
          resaleProfit: 0
        };
      }

      const ticketItems = data.items || [];
      const ticketPrice = ticketItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const ticketQty = ticketItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const merchPrice = (data.merchandise_items || []).reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      
      const commission = (ticketPrice * 0.08) + (ticketQty * 10000) + (merchPrice * 0.08);
      const totalAmount = Number(data.total_amount || 0);
      
      return { 
        systemCommission: commission, 
        btcRevenue: totalAmount - commission,
        resaleProfit: 0
      };
    }
  };

  const { systemCommission, btcRevenue, resaleProfit } = calculateFinancials();

  return (
    <div className="space-y-2 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
           <button 
              onClick={() => navigate(-1)}
              className="p-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-500 hover:text-neon-green transition-all shadow-sm active:scale-95"
           >
             <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Chi tiết giao dịch
              </h1>
              <div className="flex items-center mt-0.5">
                <p className="text-[11px] text-gray-500 font-bold opacity-70">
                  ID: {id} 
                </p>
                <button 
                  onClick={() => copyToClipboard(id)}
                  className="ml-2 text-gray-400 hover:text-neon-green transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
        </div>

         <div className="flex items-center space-x-2 ml-auto sm:ml-0">
            {status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'success' || status?.toLowerCase() === 'completed' ? (
              <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold">Thành công</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20 shadow-sm">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold">
                  {status?.toLowerCase() === 'pending' ? 'Chờ xử lý' : status?.toLowerCase() === 'failed' ? 'Thất bại' : status?.toLowerCase() === 'cancelled' ? 'Đã hủy' : status}
                </span>
              </div>
            )}
            
            <button 
              onClick={handleExportExcel}
              className="p-2.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-gray-500 hover:text-neon-green transition-all shadow-sm active:scale-95"
              title="Xuất Báo cáo Excel"
            >
              <Download className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Stats Summary Area - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-neon-green/5 blur-2xl -mr-3 -mt-3"></div>
            <p className="text-[11px] font-bold text-gray-400 relative z-10">Giá trị giao dịch</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1 relative z-10">
              {formatCurrency(isMarketplace ? data.buyer_pay_amount : data.total_amount)}
            </h3>
            <div className="mt-2 text-[11px] font-bold text-neon-green relative z-10 flex items-center">
               <div className="w-1 h-1 rounded-full bg-neon-green mr-1.5 animate-pulse"></div>
               Đã bao gồm các loại phí
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl -mr-3 -mt-3"></div>
            <p className="text-[11px] font-bold text-gray-400">
              Phí hệ thống {isMarketplace ? '(3%+10k)' : '(8%)'}
            </p>
            <h3 className="text-xl font-bold text-red-500 mt-1">
              {formatCurrency(systemCommission)}
            </h3>
            <div className="mt-2 text-[11px] font-bold text-gray-400 opacity-60">
              {isMarketplace ? 'Thanh khoản & Gas' : 'Phí vận hành & Gas'}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-neon-green/5 blur-2xl -mr-3 -mt-3"></div>
            <p className="text-[11px] font-bold text-gray-400">
              BTC nhận {isMarketplace ? '(Royalties)' : ''}
            </p>
            <h3 className="text-xl font-bold text-neon-green mt-1">
              {formatCurrency(btcRevenue)}
            </h3>
            <div className="mt-2 text-[11px] font-bold text-gray-400 opacity-60">
              Doanh thu thực tế
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl -mr-3 -mt-3"></div>
            <p className="text-[11px] font-bold text-gray-400">Loại hình</p>
            <h3 className="text-xl font-bold text-blue-500 mt-1">
              {orderType}
            </h3>
            <div className="mt-2 text-[11px] font-bold text-gray-400 opacity-60">
              {isMarketplace ? 'Thị trường c2c' : 'Thị trường b2c'}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
             <p className="text-[11px] font-bold text-gray-400">
                {isMarketplace ? 'Lợi nhuận người bán' : 'Thời gian & IP'}
             </p>
             {isMarketplace ? (
                <>
                  <h3 className={`text-xl font-bold mt-1 ${resaleProfit >= 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {resaleProfit >= 0 ? '+' : ''}{formatCurrency(resaleProfit)}
                  </h3>
                  <div className="mt-2 text-[11px] font-bold text-gray-400 opacity-60">
                    {resaleProfit >= 0 ? 'Có thanh khoản' : 'Bán lỗ/Hòa vốn'}
                  </div>
                </>
             ) : (
                <>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1 whitespace-nowrap">
                    {new Date(data.created_at).toLocaleString('vi-VN')}
                  </h3>
                  <div className="mt-2 text-[11px] font-bold text-gray-400 opacity-60">
                    IP: {data.ip_address || 'N/A'}
                  </div>
                </>
             )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:items-start">
        <div className="lg:col-span-1 space-y-3">
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4 shadow-sm">
               <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4 opacity-60">
                  Đối tượng liên quan
               </h2>
              <div className="space-y-3">
                   <div className="p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 mb-2">
                         {isMarketplace ? 'Người mua' : (data.order_type === 'TICKET_TRANSFER' ? 'Người gửi' : 'Người mua')}
                      </p>
                     <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center font-bold text-neon-green text-xs border border-neon-green/10 shadow-inner">
                           {isMarketplace ? data.buyer.full_name?.charAt(0) : data.customer.full_name?.charAt(0)}
                        </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                               {isMarketplace ? data.buyer.full_name : data.customer.full_name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-bold lowercase truncate opacity-80">
                               {isMarketplace ? data.buyer.email : data.customer.email}
                            </span>
                         </div>
                     </div>
                  </div>

                   {(isMarketplace || data.order_type === 'TICKET_TRANSFER') && (
                      <div className="p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-gray-400 mb-2">
                           {isMarketplace ? 'Người bán' : 'Người nhận'}
                        </p>
                       <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-500 text-xs border border-blue-500/10 shadow-inner">
                            {isMarketplace 
                               ? data.seller.full_name?.charAt(0) 
                               : (data.receiver?.full_name?.charAt(0) || '?')}
                         </div>
                         <div className="flex flex-col min-w-0">
                             <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {(() => {
                                  if (isMarketplace) return data.seller.full_name;
                                  const receiverEmail = (data.receiver?.email || data.metadata?.receiver_email || '').trim().toLowerCase();
                                  const organizerObj = data.event?.organizer || data.listing?.event?.organizer;
                                  const orgEmail = (organizerObj?.user?.email || organizerObj?.email || '').trim().toLowerCase();
                                  if (receiverEmail && orgEmail && receiverEmail === orgEmail) return organizerObj?.organization_name || 'Ban tổ chức';
                                  return data.receiver?.full_name || receiverUser?.full_name || data.receiver?.name || receiverUser?.name || data.metadata?.receiver_name || data.metadata?.receiver_full_name || (data.metadata?.receiver_email ? 'Chưa cập nhật tên' : 'Thông tin người nhận');
                                })()}
                             </span>
                             <span className="text-[10px] text-gray-500 font-bold lowercase truncate opacity-80">
                                {isMarketplace ? data.seller.email : (data.receiver?.email || data.receiver_email || data.metadata?.receiver_email || 'Email ẩn/N/A')}
                             </span>
                         </div>
                       </div>
                     </div>
                  )}
               </div>
            </div>

            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-4 shadow-sm">
               <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4 opacity-60">
                  Sự kiện liên quan
               </h2>
              <div className="space-y-4">
                 <div className="relative group overflow-hidden rounded-xl border border-gray-100 dark:border-white/5">
                    <img 
                        src={isMarketplace ? data.listing.event.image_url : data.event.image_url} 
                        className="w-full h-28 object-cover transition-transform duration-700 group-hover:scale-110"
                        alt="Event"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                       <p className="text-[11px] font-bold text-white opacity-80">
                          {new Date(isMarketplace ? data.listing.event.event_date : data.event.group_date || data.event.event_date).toLocaleDateString('vi-VN')}
                       </p>
                    </div>
                 </div>
                 <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                       {isMarketplace ? data.listing.event.title : data.event.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-bold flex items-start mt-2">
                       <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0 text-neon-green" />
                       {isMarketplace ? data.listing.event.location_address : data.event.location_address}
                    </p>
                 </div>
              </div>
            </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
               <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-5 opacity-60">
                  Nội dung đơn hàng
               </h2>
              <div className="space-y-3">
                  {isMarketplace ? (
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 gap-4">
                        <div className="flex items-center space-x-4">
                           <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/10 shadow-sm">
                              <Ticket className="w-6 h-6 text-orange-500" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white italic">Vé Marketplace</p>
                              <p className="text-[11px] text-gray-500 font-bold mt-1 opacity-70">Hạng: {data.ticket.ticket_tier.tier_name}</p>
                           </div>
                        </div>
                        <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-white/5">
                           <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(data.buyer_pay_amount)}</p>
                           <p className="text-[11px] text-neon-green font-bold">Số lượng: 1</p>
                        </div>
                     </div>
                  ) : (
                      <div className="space-y-3">
                        {data.items?.map((item, idx) => (
                          <div key={`ticket-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 gap-4">
                            <div className="flex items-center space-x-4">
                               <div className="w-12 h-12 rounded-xl bg-neon-green/10 flex items-center justify-center border border-neon-green/10 shadow-sm">
                                  <Ticket className="w-6 h-6 text-neon-green" />
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.ticket_tier.tier_name}</p>
                                  <p className="text-[11px] text-gray-400 font-bold mt-1">{formatCurrency(Number(item.unit_price))} / vé</p>
                               </div>
                            </div>
                            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-white/5">
                               <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(Number(item.subtotal))}</p>
                               <p className="text-[11px] text-neon-green font-bold">Số lượng: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {data.merchandise_items?.length > 0 && data.merchandise_items.map((m, idx) => (
                          <div key={`merch-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-500/5 dark:bg-blue-500/[0.02] rounded-2xl border border-blue-500/10 gap-4">
                            <div className="flex items-center space-x-4">
                               <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10 overflow-hidden shadow-sm">
                                  {m.merchandise?.image_url ? (
                                    <img src={m.merchandise.image_url} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <Zap className="w-6 h-6 text-blue-500" />
                                  )}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">{m.merchandise?.name}</p>
                                  <p className="text-[11px] text-gray-400 font-bold mt-1">{formatCurrency(Number(m.unit_price))} / sản phẩm</p>
                               </div>
                            </div>
                            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-blue-500/5">
                               <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(Number(m.subtotal))}</p>
                               <p className="text-[11px] text-blue-500 font-bold">Số lượng: {m.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                   )}
              </div>

               <div className="mt-6 space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-400 font-bold">Giá niêm yết</span>
                     <span className="text-gray-900 dark:text-white font-bold">
                        {formatCurrency(isMarketplace ? (Number(data.buyer_pay_amount) - Number(data.platform_fee)) : data.total_amount)}
                     </span>
                  </div>
                  {isMarketplace && (
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-400 font-bold">Copyright Royalties</span>
                       <span className="text-red-500 font-bold">
                          -3% ({formatCurrency((Number(data.buyer_pay_amount) - Number(data.platform_fee)) * 0.03)})
                       </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-gray-400 font-bold">Phí hệ thống & Gas</span>
                     <span className="text-neon-green font-bold">
                        +{formatCurrency(isMarketplace ? data.platform_fee : 0)}
                     </span>
                  </div>
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-4 gap-2">
                      <span className="text-gray-900 dark:text-white font-bold text-[11px] opacity-80">
                         {isMarketplace ? 'Total checkout value' : 'Total system revenue'}
                      </span>
                      <span className="text-2xl font-bold text-neon-green">
                         {formatCurrency(data.buyer_pay_amount || data.total_amount)}
                      </span>
                   </div>
                  {isMarketplace && (
                    <div className="p-4 bg-blue-500/5 dark:bg-blue-500/[0.02] rounded-2xl border border-blue-500/10 mt-5 flex justify-between items-center">
                       <span className="text-[11px] font-bold text-gray-500">Seller receive</span>
                       <span className="text-xl font-bold text-blue-500">{formatCurrency(data.seller_receive_amount)}</span>
                    </div>
                  )}
               </div>
            </div>

            <div className="bg-white dark:bg-[#111114] rounded-2xl border border-gray-100 dark:border-white/5 p-5 shadow-sm">
               <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-5 opacity-60">
                  Kỹ thuật & Bảo mật
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400">Thanh toán</p>
                      <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {!isMarketplace && data.payments && data.payments.length > 0 ? data.payments[0].method : 'Ví BASTICKET'}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold mt-1.5 opacity-70">
                            {(!isMarketplace && data.payments && data.payments.length > 0) ? `Ref: ${data.payments[0].transaction_id || 'N/A'}` : 'Nội bộ / On-chain'}
                          </p>
                      </div>
                   </div>
                  <div className="space-y-3">
                     <p className="text-[10px] font-bold text-gray-400">Bảo mật On-chain</p>
                     {isMarketplace && data.nft_transfer_tx_hash ? (
                       <a href={`https://amoy.polygonscan.com/tx/${data.nft_transfer_tx_hash}`} target="_blank" rel="noreferrer" className="block p-4 bg-neon-green/10 border border-neon-green/20 rounded-2xl group hover:shadow-lg hover:shadow-neon-green/5 transition-all">
                          <div className="flex items-center justify-between">
                             <div className="min-w-0">
                                <p className="text-sm font-bold text-neon-green">Polygon Network</p>
                                <p className="text-[10px] text-gray-500 font-bold truncate mt-1.5 opacity-70">{data.nft_transfer_tx_hash}</p>
                             </div>
                             <ExternalLink className="w-4 h-4 text-neon-green flex-shrink-0 ml-3" />
                          </div>
                       </a>
                     ) : (
                       <div className="p-4 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 opacity-50">
                          <p className="text-sm font-bold text-gray-400">Xác thực On-chain</p>
                          <p className="text-[10px] text-gray-500 font-bold mt-1.5">Dữ liệu an toàn</p>
                       </div>
                     )}
                  </div>
               </div>
               <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
                  <button className="text-xs font-bold text-gray-400 hover:text-neon-green transition-all flex items-center">
                     <Activity className="w-3.5 h-3.5 mr-2" />
                     View technical logs (JSON)
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
