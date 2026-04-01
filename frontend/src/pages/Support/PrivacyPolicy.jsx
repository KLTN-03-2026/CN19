import React from 'react';
import { Shield, Eye, Lock, Database, Globe, UserCheck, Bell, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
    const sections = [
        { id: 'collection', title: '1. Thu thập thông tin', icon: Database },
        { id: 'usage', title: '2. Sử dụng thông tin', icon: Eye },
        { id: 'blockchain', title: '3. Minh bạch Blockchain', icon: Globe },
        { id: 'security', title: '4. Bảo mật dữ liệu', icon: Lock },
        { id: 'rights', title: '5. Quyền của người dùng', icon: UserCheck },
        { id: 'contact', title: '6. Liên hệ bảo mật', icon: Mail },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg pt-20 pb-20 transition-colors duration-500 text-gray-600 dark:text-gray-400">
            {/* Header Section */}
            <div className="relative h-[300px] flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-white/5">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] opacity-50 translate-y-[-50%]" />
                <div className="relative z-10 text-center space-y-4 px-6 text-gray-900 dark:text-white">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                        Chính sách <span className="text-neon-green italic">Bảo mật</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-gray-500 dark:text-gray-400">
                        Cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn là ưu tiên hàng đầu của BASTICKET. 
                        Chúng tôi minh bạch trong việc thu thập và sử dụng thông tin.
                    </p>
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
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold hover:text-neon-green hover:bg-neon-green/5 transition-all group"
                            >
                                <section.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                                {section.title}
                            </a>
                        ))}
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="lg:col-span-9 prose prose-gray dark:prose-invert max-w-none">
                    <section id="collection" className="mb-20 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">1. Thu thập thông tin cá nhân</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl space-y-4">
                                <h4 className="text-neon-green font-bold uppercase text-[10px] tracking-widest">Thông tin bạn cung cấp</h4>
                                <p className="text-sm leading-relaxed">Họ tên, email, số điện thoại, mật khẩu mã hóa khi đăng ký tài khoản hoặc mua vé.</p>
                            </div>
                            <div className="p-8 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl space-y-4">
                                <h4 className="text-neon-green font-bold uppercase text-[10px] tracking-widest">Thông tin giao dịch</h4>
                                <p className="text-sm leading-relaxed">Lịch sử mua vé, địa chỉ ví Blockchain phát sinh, và các dữ liệu thanh toán qua cổng VNPAY.</p>
                            </div>
                        </div>
                    </section>

                    <section id="blockchain" className="mb-20 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                            <Globe className="w-6 h-6 text-neon-green" />
                            3. Đặc thù Minh bạch Blockchain
                        </h2>
                        <div className="p-8 bg-neon-green/5 border border-neon-green/10 rounded-[2.5rem] space-y-6">
                            <p className="font-bold text-gray-800 dark:text-white">Lưu ý về tính phi tập trung:</p>
                            <p className="text-sm leading-relaxed">
                                Khi một vé NFT được tạo ra (Mint), dữ liệu về ID vé và ID sự kiện sẽ được ghi công khai trên mạng lưới <b>Polygon</b>. 
                                Dữ liệu này không thể bị xóa hoặc sửa đổi. Tuy nhiên, thông tin cá nhân thực tế của bạn (Họ tên, Email) vẫn được lưu trữ bảo mật trong cơ sở dữ liệu riêng của BASTICKET và KHÔNG hiển thị công khai trên chuỗi khối.
                            </p>
                        </div>
                    </section>

                    <section id="security" className="mb-20 scroll-mt-32">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">4. Bảo mật dữ liệu</h2>
                        <div className="space-y-6">
                            <div className="flex gap-6 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-xl">
                                    <Lock className="w-6 h-6 text-neon-green" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide">Mã hóa mật khẩu</p>
                                    <p className="text-sm leading-relaxed">Chúng tôi sử dụng thuật toán băm Bcrypt mạnh mẽ để bảo vệ mật khẩu của bạn. Nhân viên BASTICKET không thể xem thấy mật khẩu thực tế.</p>
                                </div>
                            </div>
                            <div className="flex gap-6 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-xl">
                                    <Shield className="w-6 h-6 text-neon-green" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide">AI Monitoring</p>
                                    <p className="text-sm leading-relaxed">Hệ thống AI giám sát liên tục các hành vi truy cập đáng ngờ để ngăn chặn các cuộc tấn công chiếm đoạt tài khoản.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="rights" className="mb-20 scroll-mt-32 border-t border-white/5 pt-20">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">5. Quyền của người dùng</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                            {[
                                'Quyền truy cập và yêu cầu trích xuất dữ liệu cá nhân.',
                                'Quyền yêu cầu đính chính thông tin không chính xác.',
                                'Quyền yêu cầu xóa tài khoản (sau khi tất cả vé NFT đã hết hạn hoặc được sử dụng).',
                                'Quyền rút lại sự đồng ý nhận thông báo marketing.'
                            ].map((right, i) => (
                                <li key={i} className="p-6 bg-white dark:bg-dark-card border border-gray-100 dark:border-white/5 rounded-2xl text-xs font-bold flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-neon-green" />
                                    {right}
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
