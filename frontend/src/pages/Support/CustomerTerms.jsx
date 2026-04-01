import React from 'react';
import { Shield, FileText, ChevronRight, Scale, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerTerms = () => {
    const sections = [
        { id: 'intro', title: '1. Giới thiệu', icon: FileText },
        { id: 'nft-ownership', title: '2. Quyền sở hữu vé NFT', icon: Shield },
        { id: 'booking', title: '3. Quy trình Đặt vé', icon: ChevronRight },
        { id: 'payment', title: '4. Thanh toán & Phí', icon: Scale },
        { id: 'resale', title: '5. Chuyển nhượng & Bán lại', icon: RefreshCw },
        { id: 'refund', title: '6. Chính sách Hoàn tiền', icon: AlertCircle },
        { id: 'security', title: '7. Bảo mật tài khoản', icon: Lock },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg pt-20 pb-20 transition-colors duration-500">
            {/* Header Section */}
            <div className="relative h-[300px] flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-white/5">
                <div className="absolute inset-0 bg-neon-green/5 blur-[120px] opacity-50 translate-y-[-50%]" />
                <div className="relative z-10 text-center space-y-4 px-6">
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        Điều khoản <span className="text-neon-green italic">Khách hàng</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-gray-500 dark:text-gray-400">
                        Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ đặt vé của BASTICKET. 
                        Điều khoản này quy định quyền lợi và trách nhiệm của bạn đối với các tài sản NFT.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-neon-green uppercase tracking-widest pt-4">
                        <Shield className="w-4 h-4" />
                        <span>Cập nhật lần cuối: 01 tháng 04, 2026</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sticky Sidebar Navigation */}
                <aside className="lg:col-span-3 hidden lg:block sticky top-32 h-fit">
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <a 
                                key={section.id}
                                href={`#${section.id}`}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-neon-green hover:bg-neon-green/5 transition-all group"
                            >
                                <section.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                {section.title}
                            </a>
                        ))}
                    </nav>
                    <div className="mt-8 p-6 bg-dark-card border border-white/5 rounded-3xl space-y-4">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bạn là Nhà tổ chức?</p>
                        <Link 
                            to="/organizer-terms" 
                            className="block text-xs font-black text-neon-green hover:underline uppercase tracking-tight"
                        >
                            Xem điều khoản Nhà tổ chức tại đây →
                        </Link>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="lg:col-span-9 prose prose-gray dark:prose-invert max-w-none">
                    <section id="intro" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">1</span>
                            Giới thiệu
                        </h2>
                        <div className="space-y-4 text-gray-600 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-white/[0.02] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5">
                            <p>Chào mừng bạn đến với <b>BASTICKET</b> – Nền tảng phân phối vé sự kiện ứng dụng công nghệ Blockchain và AI.</p>
                            <p>Khi bạn thực hiện giao dịch trên hệ thống của chúng tôi, bạn đồng ý tuân thủ các Điều khoản sử dụng này. BASTICKET đóng vai trò là bên trung gian kết nối Nhà tổ chức sự kiện và Khách hàng, đồng thời đảm bảo tính xác thực của vé thông qua hợp đồng thông minh (Smart Contract).</p>
                        </div>
                    </section>

                    <section id="nft-ownership" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">2</span>
                            Quyền sở hữu vé NFT
                        </h2>
                        <div className="space-y-6 text-gray-600 dark:text-gray-400 font-medium">
                            <p>Mỗi vé được mua trên BASTICKET là một tài sản số (NFT) duy nhất trên mạng lưới <b>Polygon</b>.</p>
                            <ul className="list-none space-y-4 pl-0">
                                <li className="flex gap-4 items-start p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 rounded-2xl">
                                    <Shield className="w-5 h-5 text-neon-green shrink-0" />
                                    <span>Bạn sở hữu toàn quyền quản lý vé NFT này trong ví điện tử của mình trên hệ thống.</span>
                                </li>
                                <li className="flex gap-4 items-start p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 rounded-2xl">
                                    <Shield className="w-5 h-5 text-neon-green shrink-0" />
                                    <span>Vé NFT chứa các metadata được mã hóa bao gồm: ID sự kiện, loại vé, và chữ ký số của Nhà tổ chức.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section id="booking" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">3</span>
                            Quy trình Đặt vé
                        </h2>
                        <div className="space-y-4 text-gray-600 dark:text-gray-400 font-medium">
                            <p>Quy trình đặt vé tự động thông qua giao diện web. Bạn cần cung cấp thông tin chính xác bao gồm Email và Số điện thoại để định danh tài sản.</p>
                            <p>Hệ thống sẽ thực hiện "Mint" (Đúc) vé NFT ngay sau khi thanh toán thành công. Thời gian xử lý Blockchain có thể dao động từ 10-60 giây.</p>
                        </div>
                    </section>

                    <section id="payment" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">4</span>
                            Thanh toán & Phí
                        </h2>
                        <div className="bg-neon-green/5 border border-neon-green/20 p-8 rounded-[2.5rem] space-y-4">
                            <p className="text-sm font-bold text-gray-800 dark:text-white">Giá vé niêm yết trên website đã bao gồm thuế (nếu có). Ngoài giá vé, bạn có thể phải trả các loại phí sau:</p>
                            <ul className="space-y-2 text-sm">
                                <li>• Phí tiện ích hệ thống (System Fee).</li>
                                <li>• Phí giao dịch mạng lưới Blockchain (Gas Fee) - thường được BASTICKET hỗ trợ chi trả.</li>
                                <li>• Phí cổng thanh toán (VNPAY/Thẻ quốc tế).</li>
                            </ul>
                        </div>
                    </section>

                    <section id="resale" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">5</span>
                            Chuyển nhượng & Bán lại
                        </h2>
                        <div className="space-y-6 text-gray-600 dark:text-gray-400 font-medium">
                            <p>BASTICKET hỗ trợ thị trường thứ cấp (Marketplace) cho phép người dùng thanh khoản vé:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl">
                                    <h4 className="text-neon-green font-black uppercase text-xs mb-3 tracking-widest leading-none pr-4 border-r-4 border-neon-green inline-block">Chuyển nhượng (Transfer)</h4>
                                    <p className="text-sm">Bạn có thể tặng vé cho bạn bè thông qua Email. Phí bản quyền có thể áp dụng tùy theo cài đặt của BTC.</p>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl">
                                    <h4 className="text-neon-green font-black uppercase text-xs mb-3 tracking-widest leading-none pr-4 border-r-4 border-neon-green inline-block">Bán lại (Resale)</h4>
                                    <p className="text-sm">Giá bán lại không được vượt quá <b>Giá trần</b> do Nhà tổ chức quy định để ngăn chặn tình trạng vé "chợ đen".</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="refund" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">6</span>
                            Chính sách Hoàn tiền
                        </h2>
                        <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl flex gap-6 items-start">
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-800 dark:text-white">Vé NFT sau khi đã Mint thành công mặc định là KHÔNG hoàn trả, trừ các trường hợp sau:</p>
                                <ul className="text-sm text-gray-500 space-y-2">
                                    <li>• Sự kiện bị hủy bỏ hoàn toàn bởi Nhà tổ chức.</li>
                                    <li>• Sự kiện thay đổi thời gian/địa điểm và bạn không thể tham dự (cần gửi yêu cầu trong 48h).</li>
                                    <li>• Lỗi kỹ thuật từ hệ thống BASTICKET dẫn đến việc không nhận được vé.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            {/* CTA Section */}
            <div className="max-w-[1400px] mx-auto px-6 mt-20">
                <div className="p-12 bg-neon-green rounded-[3.5rem] text-center space-y-6 shadow-2xl shadow-neon-green/20">
                    <h2 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter">Bạn cần hỗ trợ thêm?</h2>
                    <p className="text-black/70 font-bold max-w-xl mx-auto">Nếu có bất kỳ thắc mắc nào về điều khoản, vui lòng liên hệ với đội ngũ CSKH của chúng tôi.</p>
                    <div className="flex flex-wrap justify-center gap-4 pt-4">
                        <a href="mailto:support@basticket.com" className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Gửi Email</a>
                        <Link to="/faq" className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all border-none">Xem câu hỏi thường gặp</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerTerms;
