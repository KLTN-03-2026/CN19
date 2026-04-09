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

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState('processing'); // processing, success, failed

  useEffect(() => {
    // 1. Phân tích kết quả từ VNPay
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    
    // 2. Phân tích kết quả từ MoMo
    const momoResultCode = searchParams.get('resultCode');

    if (vnpResponseCode === '00' || momoResultCode === '0') {
      setStatus('success');
      toast.success('Thanh toán thành công! Vé đang được đúc.');
    } else if (vnpResponseCode || momoResultCode) {
      setStatus('failed');
      toast.error('Giao dịch không thành công hoặc bị hủy.');
    } else {
      // Nếu không có param, có thể do truy cập trực tiếp
      setStatus('processing');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] pt-32 pb-20 flex items-center justify-center transition-colors duration-500">
      <div className="max-w-xl w-full px-6">
        
        <div className="bg-white dark:bg-[#111114] rounded-[3rem] p-10 border border-gray-200 dark:border-white/5 shadow-2xl text-center relative overflow-hidden">
          
          {/* Decorative background for success/fail */}
          <div className={`absolute top-0 inset-x-0 h-2 ${status === 'success' ? 'bg-neon-green' : status === 'failed' ? 'bg-red-500' : 'bg-gray-200'} `}></div>

          {status === 'processing' && (
            <div className="py-10">
              <Loader2 className="w-16 h-16 text-neon-green animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Đang xác thực...</h2>
              <p className="text-gray-500 mt-2 font-medium">Vui lòng chờ trong giây lát trong khi chúng tôi xử lý giao dịch.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-neon-green/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-neon-green/20 relative">
                  <CheckCircle2 className="w-12 h-12 text-neon-green" />
                  <div className="absolute inset-0 bg-neon-green rounded-full animate-ping opacity-20"></div>
               </div>
               
               <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2 leading-none">
                  Tuyệt phẩm <br/><span className="text-neon-green">Đã thuộc về bạn!</span>
               </h2>
               <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-xs mx-auto text-sm leading-relaxed">
                  Giao dịch thành công. Vé NFT đang được hệ thống tự động đúc và gửi vào ví của bạn.
               </p>

               <div className="grid grid-cols-2 gap-4 mb-10">
                  <Link 
                    to="/my-tickets"
                    className="flex flex-col items-center gap-3 p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 hover:border-neon-green/50 hover:bg-neon-green/5 transition-all group"
                  >
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                       <Ticket className="w-5 h-5 text-neon-green" />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">Xem vé ngay</span>
                  </Link>

                  <div 
                    className="flex flex-col items-center gap-3 p-5 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group cursor-pointer"
                  >
                    <button className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                       <Share2 className="w-5 h-5 text-blue-500" />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">Khoe với bạn</span>
                  </div>
               </div>

               <Link 
                 to="/events"
                 className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
               >
                 Khám phá thêm sự kiện <ArrowRight className="w-5 h-5" />
               </Link>
            </div>
          )}

          {status === 'failed' && (
            <div className="animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                  <XCircle className="w-12 h-12 text-red-500" />
               </div>
               
               <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                  Giao dịch <span className="text-red-500">Bị gián đoạn</span>
               </h2>
               <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 text-sm">
                  Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán. Ghế/Vé của bạn vẫn đang được giữ trong 10 phút.
               </p>

               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => navigate(-1)}
                    className="w-full py-5 bg-neon-green text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-neon-green/20"
                  >
                    Thử thanh toán lại <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link 
                    to="/events"
                    className="w-full py-5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Hủy bỏ và quay lại
                  </Link>
               </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-10 flex flex-col items-center gap-6">
           <div className="flex items-center gap-8">
              <ShieldCheck className="w-6 h-6 text-gray-300" />
              < स्मार्टफोन className="w-6 h-6 text-gray-300" />
              <Ticket className="w-6 h-6 text-gray-300" />
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center leading-relaxed">
             Bảo mật bởi hệ thống Blockchain Polygon <br/> & Công nghệ AI Chống Bot của BASTICKET.
           </p>
        </div>

      </div>
    </div>
  );
};

export default PaymentResult;
