import React from 'react';
import { Shield, FileText, ChevronRight, Scale, AlertCircle, RefreshCw, Lock, Handshake, CreditCard, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrganizerTerms = () => {
    const sections = [
        { id: 'intro', title: '1. Hợp tác & Đăng ký', icon: Handshake },
        { id: 'event-creation', title: '2. Quy định Tạo Sự kiện', icon: LayoutDashboard },
        { id: 'ticket-management', title: '3. Quản lý Vé & NFT', icon: Shield },
        { id: 'revenue', title: '4. Doanh thu & Thanh toán', icon: CreditCard },
        { id: 'fees', title: '5. Phí Dịch vụ & Royalty', icon: Scale },
        { id: 'responsibilities', title: '6. Trách nhiệm Nhà tổ chức', icon: AlertCircle },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg pt-20 pb-20 transition-colors duration-500">
            {/* Header Section */}
            <div className="relative h-[300px] flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-white/5">
                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] opacity-50 translate-y-[-50%]" />
                <div className="relative z-10 text-center space-y-4 px-6">
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        Điều khoản <span className="text-neon-green italic">Nhà tổ chức</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-gray-500 dark:text-gray-400">
                        Quy định dành cho các đơn vị, cá nhân sử dụng nền tảng BASTICKET để phát hành và quản lý vé sự kiện. 
                        Chúng tôi cam kết minh bạch và bảo vệ quyền lợi đối tác.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-neon-green uppercase tracking-widest pt-4">
                        <Handshake className="w-4 h-4" />
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
                </aside>

                {/* Content Area */}
                <main className="lg:col-span-9 prose prose-gray dark:prose-invert max-w-none">
                    <section id="intro" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">1</span>
                            Hợp tác & Đăng ký
                        </h2>
                        <div className="space-y-4 text-gray-600 dark:text-gray-400 font-medium leading-relaxed bg-gray-50 dark:bg-white/[0.02] p-8 rounded-[2rem] border border-gray-100 dark:border-white/5">
                            <p>Nhà tổ chức (BTC) cần cung cấp đầy đủ thông tin pháp lý hoặc cá nhân để kích hoạt tài khoản đối tác. BASTICKET có quyền từ chối các yêu cầu không minh bạch.</p>
                            <p>BTC chịu trách nhiệm về tính chính xác của các nội dung sự kiện được đăng tải trên hệ thống.</p>
                        </div>
                    </section>

                    <section id="event-creation" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">2</span>
                            Quy định Tạo Sự kiện
                        </h2>
                        <div className="space-y-6 text-gray-600 dark:text-gray-400 font-medium">
                            <p>Sự kiện chỉ được công khai sau khi hệ thống xác thực thông tin về địa điểm và giấy phép (nếu yêu cầu). BTC có quyền:</p>
                            <ul className="list-none space-y-4 pl-0">
                                <li className="flex gap-4 items-start p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 rounded-2xl">
                                    <LayoutDashboard className="w-5 h-5 text-neon-green shrink-0" />
                                    <span>Thiết lập nhiều hạng vé (VIP, Standard, Early Bird) với số lượng và giá khác nhau.</span>
                                </li>
                                <li className="flex gap-4 items-start p-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 rounded-2xl">
                                    <Shield className="w-5 h-5 text-neon-green shrink-0" />
                                    <span>Bật/Tắt tính năng Chuyển nhượng và Bán lại trên Marketplace cho từng hạng vé.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section id="ticket-management" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">3</span>
                            Quản lý Vé & NFT
                        </h2>
                        <div className="space-y-4 text-gray-600 dark:text-gray-400 font-medium">
                            <p>BASTICKET tự động "Mint" vé NFT trên chuỗi khối Polygon cho khách hàng thay mặt BTC. BTC cam kết công nhận tính hợp pháp của vé NFT được quét thành công qua ứng dụng Scanner của hệ thống.</p>
                            <p>Mỗi vé NFT là hữu duy nhất và không thể làm giả. BTC chấp nhận kết quả kiểm soát vé của hệ thống là căn cứ cuối cùng để khách hàng tham dự sự kiện.</p>
                        </div>
                    </section>

                    <section id="revenue" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">4</span>
                            Doanh thu & Thanh toán
                        </h2>
                        <div className="bg-neon-green/5 border border-neon-green/20 p-8 rounded-[2.5rem] space-y-4">
                            <p className="text-sm font-bold text-gray-800 dark:text-white">Quy trình đối soát tài chính:</p>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li>• Tiền bán vé được giữ bởi cổng thanh toán trung gian.</li>
                                <li>• BTC yêu cầu rút tiền (Withdraw) sau khi sự kiện kết thúc thành công.</li>
                                <li>• Thời gian xử lý đối soát: Từ 3-5 ngày làm việc sau sự kiện.</li>
                            </ul>
                        </div>
                    </section>

                    <section id="fees" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">5</span>
                            Phí Dịch vụ & Royalty
                        </h2>
                        <div className="space-y-6 text-gray-600 dark:text-gray-400 font-medium">
                            <p>BTC đồng ý trả phí dịch vụ cho BASTICKET trên mỗi vé bán ra thành công. Ngoài ra, cơ chế <b>Royalty (Phí bản quyền)</b> trên Marketplace hoạt động như sau:</p>
                            <div className="p-8 bg-dark-card border border-white/5 rounded-3xl">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-neon-green" />
                                    Cơ chế thu phí Marketplace
                                </h4>
                                <p className="text-sm">BTC có quyền thiết lập <b>% Phí bản quyền</b> (ví dụ 5-10%) cho mỗi lần vé được bán lại trên thị trường thứ cấp. Khoản phí này được trích trực tiếp từ giá bán của khách hàng và cộng vào doanh thu của BTC.</p>
                            </div>
                        </div>
                    </section>

                    <section id="responsibilities" className="mb-16 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm">6</span>
                            Trách nhiệm Nhà tổ chức
                        </h2>
                        <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl flex gap-6 items-start">
                            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-800 dark:text-white">BTC chịu hoàn toàn trách nhiệm và chi phí hoàn tiền nếu:</p>
                                <ul className="text-sm text-gray-500 space-y-2">
                                    <li>• Sự kiện bị hủy bỏ do BTC hoặc các nguyên nhân chủ quan từ phía BTC.</li>
                                    <li>• Thay đổi thông tin quan trọng của sự kiện mà không thông báo kịp thời.</li>
                                    <li>• Các hành vi gian lận hoặc vi phạm bản quyền nội dung sự kiện.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            {/* CTA Section */}
            <div className="max-w-[1400px] mx-auto px-6 mt-20">
                <div className="p-12 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-[3.5rem] text-center space-y-6 shadow-2xl">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Bạn muốn hợp tác cùng BASTICKET?</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-bold max-w-xl mx-auto">Đăng ký trở thành đối tác ngay hôm nay để nhận được sự hỗ trợ tốt nhất về giải pháp quản lý vé NFT.</p>
                    <div className="flex flex-wrap justify-center gap-4 pt-4">
                        <Link to="/organizer-register" className="px-8 py-4 bg-neon-green text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all outline-none border-none">Đăng ký Nhà tổ chức</Link>
                        <a href="mailto:partner@basticket.com" className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all outline-none border-none shadow-[0_0_20px_rgba(0,0,0,0.5)]">Liên hệ kinh doanh</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerTerms;
