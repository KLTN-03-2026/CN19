import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Ticket, 
  Download, 
  Share2,
  Loader2,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useOrder } from '../../hooks/useOrder';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [order, setOrder] = useState(null);
  const { verifyVNPayReturn } = useOrder();

  useEffect(() => {
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const momoResultCode = searchParams.get('resultCode');

    const verify = async () => {
      try {
        if (vnpResponseCode) {
          // Chuyển searchParams thành object sạch
          const params = Object.fromEntries(searchParams.entries());
          const res = await verifyVNPayReturn(params);
          if (res?.isFeeOrder) {
            const eventId = res.orderId.replace('FEE-', '');
            toast.success('Đã nộp phí & Hoàn tất hủy sự kiện thành công qua cổng thanh toán trực tuyến!');
            navigate(`/organizer/events/${eventId}/cancellation-fee`, { replace: true });
            return;
          }
          setOrder(res?.order);
          setStatus('success');
          toast.success(t('paymentResult.toastSuccessVNPay'));
        } else if (momoResultCode === '0' || searchParams.get('orderId')?.startsWith('FEE')) {
          const orderIdParam = searchParams.get('orderId');
          if (orderIdParam?.startsWith('FEE')) {
            const eventId = orderIdParam.replace('FEE-', '');
            toast.success('Đã nộp phí & Hoàn tất hủy sự kiện thành công qua cổng thanh toán trực tuyến!');
            navigate(`/organizer/events/${eventId}/cancellation-fee`, { replace: true });
            return;
          }
          setStatus('success');
          toast.success(t('paymentResult.toastSuccessMoMo'));
        } else if (vnpResponseCode || momoResultCode) {
          setStatus('failed');
          toast.error(t('paymentResult.toastErrorGeneric'));
        }
      } catch (err) {
        setStatus('failed');
        if (err.response?.data?.order) {
          setOrder(err.response.data.order);
        }
        toast.error(err.response?.data?.error || t('paymentResult.toastErrorVerify'));
      }
    };

    if (vnpResponseCode || momoResultCode) {
      verify();
    } else {
      setStatus('processing');
    }
  }, [searchParams, verifyVNPayReturn, t]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] pt-8 pb-20 flex items-center justify-center transition-colors duration-500">
      <div className="max-w-xl w-full px-6">
        
        <div className="bg-white dark:bg-[#111114] rounded-[3rem] p-10 border border-gray-200 dark:border-white/5 shadow-2xl text-center relative overflow-hidden">
          
          {/* Decorative background for success/fail */}
          <div className={`absolute top-0 inset-x-0 h-2 ${status === 'success' ? 'bg-neon-green' : status === 'failed' ? 'bg-red-500' : 'bg-gray-200'} `}></div>

          {status === 'processing' && (
            <div className="py-10">
              <Loader2 className="w-16 h-16 text-neon-green animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('paymentResult.verifying')}</h2>
              <p className="text-gray-500 mt-2 font-medium">{t('paymentResult.verifyingDesc')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-neon-green/20 relative">
                  <CheckCircle2 className="w-10 h-10 text-neon-green" />
                  <div className="absolute inset-0 bg-neon-green rounded-full animate-ping opacity-20"></div>
               </div>
               
               <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3 leading-none">
                   {searchParams.get('orderId')?.startsWith('FEE') ? (
                      <>Nộp phí bồi hoàn <br/><span className="text-neon-green">thành công!</span></>
                   ) : order?.order_type === 'TICKET_TRANSFER' ? (
                      <>Chuyển nhượng <br/><span className="text-neon-green">thành công!</span></>
                   ) : (
                      <>{t('paymentResult.successTitlePart1')} <br/><span className="text-neon-green">{t('paymentResult.successTitlePart2')}</span></>
                   )}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-xs mx-auto text-sm leading-relaxed">
                   {searchParams.get('orderId')?.startsWith('FEE')
                     ? "Đã nộp phí & Hoàn tất hủy sự kiện thành công. Hệ thống đang tự động hoàn tiền cho khách hàng."
                     : order?.order_type === 'TICKET_TRANSFER' 
                     ? `Vé NFT đã được chuyển đến ${order?.metadata?.receiver_email || 'người nhận'} thành công.`
                     : t('paymentResult.successDesc')}
                </p>

               <div className="grid grid-cols-1 gap-4 mb-10">
                  {searchParams.get('orderId')?.startsWith('FEE') ? (
                     <Link 
                       to="/organizer/my-events"
                       className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 hover:border-neon-green/50 hover:bg-neon-green/5 transition-all group"
                     >
                       <button className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Ticket className="w-5 h-5 text-neon-green" />
                       </button>
                       <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">Quản lý sự kiện</span>
                     </Link>
                  ) : (
                     <Link 
                       to="/my-tickets"
                       className="flex flex-col items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 hover:border-neon-green/50 hover:bg-neon-green/5 transition-all group"
                     >
                       <button className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Ticket className="w-5 h-5 text-neon-green" />
                       </button>
                       <span className="text-[10px] font-black uppercase text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">{t('paymentResult.viewTickets')}</span>
                     </Link>
                  )}
               </div>

               <Link 
                 to="/events"
                 className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
               >
                 {t('paymentResult.exploreMore')} <ArrowRight className="w-5 h-5" />
               </Link>
            </div>
          )}

          {status === 'failed' && (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <XCircle className="w-10 h-10 text-red-500" />
               </div>
               
               <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                   {order?.order_type === 'TICKET_TRANSFER' ? (
                      <>Chuyển nhượng <span className="text-red-500">bị gián đoạn</span></>
                   ) : (
                      <>{t('paymentResult.failedTitlePart1')} <span className="text-red-500">{t('paymentResult.failedTitlePart2')}</span></>
                   )}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 text-sm">
                   {order?.order_type === 'TICKET_TRANSFER'
                     ? "Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán. Yêu cầu chuyển nhượng của bạn vẫn đang được giữ trong 15 phút."
                     : t('paymentResult.failedDesc')}
                </p>

               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => navigate(-1)}
                    className="w-full py-4 bg-neon-green text-black font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-neon-green/20"
                  >
                    {t('paymentResult.retryPayment')} <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link 
                    to="/events"
                    className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white font-black uppercase text-[10px] rounded-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    {t('paymentResult.cancelAndBack')}
                  </Link>
               </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-6 flex flex-col items-center gap-6">
           <div className="flex items-center gap-8">
              <ShieldCheck className="w-6 h-6 text-gray-300" />
              <Smartphone className="w-6 h-6 text-gray-300" />
              <Ticket className="w-6 h-6 text-gray-300" />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase text-center leading-relaxed">
             {t('paymentResult.securityInfo')}
           </p>
        </div>

      </div>
    </div>
  );
};

export default PaymentResult;
