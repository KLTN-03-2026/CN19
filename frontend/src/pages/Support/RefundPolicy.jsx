import React from 'react';
import { AlertCircle, CreditCard, Clock, CheckCircle2, XCircle, Info, RefreshCcw } from 'lucide-react';

const RefundPolicy = () => {
    const steps = [
        { title: 'Gửi yêu cầu', desc: 'Sử dụng chức năng "Yêu cầu hoàn tiền" trong mục quản lý vé của bạn.', icon: CreditCard },
        { title: 'Xác minh BTC', desc: 'Nhà tổ chức kiểm duyệt yêu cầu trong 3-5 ngày làm việc.', icon: Clock },
        { title: 'Xử lý tiền', desc: 'Tiền được chuyển về cổng thanh toán gốc (VNPAY/Thẻ tín dụng).', icon: RefreshCcw },
        { title: 'Hoàn tất', desc: 'Thông báo xác nhận hoàn tiền thành công qua Email.', icon: CheckCircle2 },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg pt-20 pb-20 transition-colors duration-500 text-gray-600 dark:text-gray-400">
            {/* Header Section */}
            <div className="relative h-[300px] flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-white/5">
                <div className="absolute inset-0 bg-red-500/5 blur-[120px] opacity-50 translate-y-[-50%]" />
                <div className="relative z-10 text-center space-y-4 px-6 text-gray-900 dark:text-white">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                        Chính sách <span className="text-neon-green italic">Hoàn tiền</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-gray-500 dark:text-gray-400">
                        Quy trình và điều kiện hoàn tiền minh bạch, bảo vệ quyền lợi của cả khách hàng và nhà tổ chức.
                        Chúng tôi cam kết xử lý công bằng dựa trên các bằng chứng thực tế.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest pt-4">
                        <AlertCircle className="w-4 h-4" />
                        <span>Cập nhật lần cuối: 01 tháng 04, 2026</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
                {/* 🔴 Non-Refundable Warning */}
                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                        <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Quy tắc chung về vé NFT</h4>
                        <p className="text-sm leading-relaxed font-medium">
                            Vé sự kiện là tài sản kỹ thuật số (NFT) được Mint ngay khi thanh toán. Do tính chất của sự kiện, 
                            mặc định <b>VÉ KHÔNG ĐƯỢC HOÀN TIỀN</b> trừ khi có thông báo thay đổi hoặc hủy bỏ từ Nhà tổ chức.
                        </p>
                    </div>
                </div>

                {/* ✅ Refundable Cases */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                        <div className="w-1 h-8 bg-neon-green" />
                        Các trường hợp được Hoàn tiền
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'Sự kiện bị hủy', desc: 'BTC thông báo hủy bỏ hoàn toàn sự kiện và không có lịch thay thế.' },
                            { title: 'Thay đổi lịch lớn', desc: 'BTC thay đổi ngày giờ hoặc địa điểm và thông báo cho phép hoàn tiền.' },
                            { title: 'Lỗi phát hành', desc: 'Khách thanh toán thành công nhưng hệ thống không thể tạo vé NFT.' }
                        ].map((item, i) => (
                            <div key={i} className="p-8 bg-dark-card border border-white/5 rounded-3xl space-y-4 hover:border-neon-green/30 transition-colors">
                                <CheckCircle2 className="w-5 h-5 text-neon-green" />
                                <h3 className="text-sm font-black text-white uppercase">{item.title}</h3>
                                <p className="text-[11px] leading-relaxed font-bold text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 🔄 Refund Process Timeline */}
                <section className="space-y-8">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-4 text-center md:text-left">
                        <div className="w-1 h-8 bg-neon-green" />
                        Quy trình xử lý yêu cầu
                    </h2>
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 dark:bg-white/5 -translate-y-1/2 hidden lg:block" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {steps.map((step, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-dark-bg border-4 border-white dark:border-dark-bg shadow-xl flex items-center justify-center">
                                        <div className="w-full h-full bg-neon-green/10 rounded-xl flex items-center justify-center text-neon-green">
                                            <step.icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{step.title}</h4>
                                        <p className="text-[10px] font-bold text-gray-500">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 💡 Additional Notes */}
                <div className="p-8 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[2.5rem] space-y-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Info className="w-5 h-5 text-neon-green" />
                        Thời gian và Phí hoàn tiền
                    </h3>
                    <div className="space-y-4 text-sm font-medium leading-relaxed">
                        <p>• Phí dịch vụ (System Fee) và Phí Blockchain (Gas Fee) thường sẽ <b>không được hoàn lại</b> vì đây là chi phí hạ tầng đã phát sinh khi tạo vé NFT.</p>
                        <p>• Thời gian tiền về tài khoản phụ thuộc vào Ngân hàng của bạn, thường từ 7-15 ngày làm việc đối với thẻ quốc tế và 3-5 ngày đối với ATM nội địa (VNPAY).</p>
                        <p>• Nếu BTC và Khách hàng có tranh chấp, BASTICKET sẽ đóng vai trò trung gian dựa trên dữ liệu giao dịch Blockchain để đưa ra quyết định cuối cùng.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
