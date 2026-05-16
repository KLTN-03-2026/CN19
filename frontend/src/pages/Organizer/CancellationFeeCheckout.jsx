import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    AlertTriangle, 
    Wallet, 
    ArrowLeft, 
    CheckCircle2, 
    Clock, 
    ShieldCheck, 
    Receipt, 
    Coins, 
    Loader2,
    HelpCircle,
    Building2,
    CreditCard,
    Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { organizerService } from '../../services/organizer.service';

const CancellationFeeCheckout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('revenue_wallet');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const res = await organizerService.getEventById(id);
            setEvent(res.data);
            if (res.data.status !== 'pending_cancellation_fee' && res.data.status !== 'cancelled') {
                toast.error('Sự kiện không ở trạng thái yêu cầu thanh toán phí hủy.');
                navigate(`/organizer/events/${id}`);
            }
        } catch (error) {
            toast.error('Không thể tải thông tin hóa đơn bồi hoàn.');
            navigate('/organizer/my-events');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!window.confirm('Xác nhận thanh toán toàn bộ chi phí bồi hoàn hủy sự kiện này? Tiền sẽ được gạch nợ từ nguồn tài khoản bạn chọn.')) return;
        
        try {
            setSubmitting(true);
            const res = await organizerService.payCancellationFee(id, paymentMethod);
            if (res?.payment_url) {
                window.location.href = res.payment_url;
                return;
            }
            toast.success(res.message || 'Thanh toán phí hủy và hoàn tất hủy sự kiện thành công!');
            fetchEventDetails();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message || 'Lỗi thanh toán phí bồi hoàn.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px]">Đang tổng hợp hóa đơn bồi hoàn hệ thống...</p>
            </div>
        );
    }

    if (!event) return null;

    const breakdown = event.cancellation_fee_breakdown || {
        primary_fee: 0,
        marketplace_fee: 0,
        total_fee: 0,
        is_paid: false
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-3 duration-500 font-sans">
            {/* Back Button */}
            <button 
                onClick={() => navigate('/organizer/my-events')}
                className="flex items-center space-x-2 text-xs font-black text-gray-500 hover:text-purple-600 transition-colors uppercase group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Quay lại Quản lý sự kiện</span>
            </button>

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-purple-500/30">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-[70px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-[70px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Cổng thanh toán & Quyết toán bồi hoàn</span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight uppercase">
                            {event.title}
                        </h1>
                        <p className="text-xs sm:text-sm text-purple-200/80 font-medium">
                            Ban tổ chức có trách nhiệm hoàn tất nghĩa vụ nộp chi phí vận hành hệ thống & Gas giao dịch để Admin thực hiện thủ tục bồi hoàn hoàn tiền cho người tham dự.
                        </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end justify-center shrink-0 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">Trạng thái đối soát</span>
                        <div className="flex items-center gap-2 mt-1">
                            {event.status === 'cancelled' || breakdown.is_paid ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
                                    <CheckCircle2 className="w-4 h-4" /> ĐÃ NỘP - HOÀN TẤT HỦY & HOÀN TIỀN
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
                                    <Clock className="w-4 h-4 animate-spin" /> CHỜ NỘP PHÍ HỦY SỰ KIỆN
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Itemized Breakdown */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
                                    <Coins className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Chi tiết chi phí phát sinh</h2>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5">Dữ liệu tổng hợp từ các giao dịch thành công</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-purple-600 uppercase bg-purple-500/10 px-2.5 py-1 rounded-lg">Polygon Amoy</span>
                        </div>

                        <div className="space-y-4 text-xs sm:text-sm font-medium">
                            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900 dark:text-white uppercase">Hoa hồng & Phí nền tảng vé sơ cấp</p>
                                    <p className="text-xs text-gray-500">Chi phí duy trì cổng thanh toán, hóa đơn và phí duy trì sàn vé sơ cấp.</p>
                                </div>
                                <span className="font-black text-gray-900 dark:text-white text-right shrink-0">{Number(breakdown.primary_fee || 0).toLocaleString()} đ</span>
                            </div>

                            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                                <div className="space-y-1">
                                    <p className="font-bold text-gray-900 dark:text-white uppercase">Phí Gas On-chain chuyển nhượng & Chợ thứ cấp</p>
                                    <p className="text-xs text-gray-500">Phí Gas Polygon đúc NFT và phí duy trì các giao dịch chuyển nhượng/bán lại thành công.</p>
                                </div>
                                <span className="font-black text-gray-900 dark:text-white text-right shrink-0">{Number(breakdown.marketplace_fee || 0).toLocaleString()} đ</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-base sm:text-lg">
                            <span className="font-black text-gray-900 dark:text-white uppercase">Tổng bồi hoàn cần nộp:</span>
                            <span className="font-black text-purple-600 text-xl sm:text-2xl">{Number(breakdown.total_fee || 0).toLocaleString()} đ</span>
                        </div>
                    </div>

                    {/* On-chain Assurance Card */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="space-y-1 text-xs">
                            <h4 className="font-black text-blue-600 uppercase tracking-tight">Cam kết minh bạch Blockchain</h4>
                            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                Ngay sau khi thanh toán thành công, biên bản đối soát tài chính và gạch nợ sẽ được ký số và băm lên mạng lưới <strong>Polygon Amoy Blockchain</strong>. Dữ liệu này vĩnh viễn không thể tẩy xóa hoặc thay đổi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Checkout & Payment Method Selection */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm flex flex-col">
                        <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight pb-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-purple-600" />
                            <span>Phương thức nộp phí</span>
                        </h3>

                        <div className="space-y-3">
                            <label 
                                onClick={() => setPaymentMethod('revenue_wallet')}
                                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                                    paymentMethod === 'revenue_wallet' 
                                    ? 'bg-purple-500/5 border-purple-500 shadow-md shadow-purple-500/10' 
                                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 hover:border-purple-500/30'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="payment_method" 
                                    checked={paymentMethod === 'revenue_wallet'}
                                    onChange={() => setPaymentMethod('revenue_wallet')}
                                    className="mt-1 text-purple-600 focus:ring-purple-500" 
                                />
                                <div className="space-y-0.5">
                                    <span className="block text-xs font-black text-gray-900 dark:text-white uppercase">Khấu trừ ví doanh thu sự kiện</span>
                                    <span className="block text-[11px] text-gray-500 font-medium">Hệ thống sẽ gạch nợ trực tiếp từ doanh thu bán vé đang tạm giữ (Escrow).</span>
                                </div>
                            </label>

                            <label 
                                onClick={() => setPaymentMethod('vnpay')}
                                className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                                    paymentMethod === 'vnpay' 
                                    ? 'bg-purple-500/5 border-purple-500 shadow-md shadow-purple-500/10' 
                                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 hover:border-purple-500/30'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="payment_method" 
                                    checked={paymentMethod === 'vnpay'}
                                    onChange={() => setPaymentMethod('vnpay')}
                                    className="mt-1 text-purple-600 focus:ring-purple-500" 
                                />
                                <div className="space-y-0.5">
                                    <span className="block text-xs font-black text-gray-900 dark:text-white uppercase">Cổng thanh toán trực tuyến (VNPay / MoMo)</span>
                                    <span className="block text-[11px] text-gray-500 font-medium">Thanh toán tự động qua ví điện tử MoMo, thẻ nội địa hoặc mã QR VNPay.</span>
                                </div>
                            </label>
                        </div>

                        {/* Action Checkout Button */}
                        <div className="pt-6 mt-auto border-t border-gray-100 dark:border-white/5">
                            {event.status !== 'cancelled' && !breakdown.is_paid ? (
                                <button 
                                    onClick={handleConfirmPayment}
                                    disabled={submitting}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Đang xử lý thanh toán...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            <span>Xác nhận & Nộp phí bồi hoàn ({Number(breakdown.total_fee || 0).toLocaleString()} đ)</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black text-xs uppercase text-center flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span>Đã nộp phí & Hoàn tất hủy sự kiện - Hệ thống đang tự động hoàn tiền cho khách hàng</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CancellationFeeCheckout;
