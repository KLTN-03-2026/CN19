import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  MapPin, 
  Globe,
  Phone
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="font-sans bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border pt-6 pb-6 transition-colors duration-300">
            {/* Top Section with Newsletter */}
            <div className="max-w-[1400px] mx-auto px-6 mb-12">
                <div className="bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border dark:glow-card-green rounded-3xl p-8 md:p- flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="text-center lg:text-left max-w-xl relative z-10">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('footer.newsletter_title', 'Đăng ký nhận tin')}
                        </h3>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {t('footer.newsletter_subtitle', 'Nhận thông báo sớm nhất về các sự kiện hot và vé NFT giới hạn.')}
                        </p>
                    </div>

                    <div className="w-full lg:w-auto relative z-10">
                        <div className="flex bg-white dark:bg-dark-bg p-1.5 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm w-full lg:w-[450px] focus-within:border-neon-green focus-within:ring-1 focus-within:ring-neon-green transition-all">
                            <input 
                                type="email" 
                                placeholder={t('footer.email_placeholder', 'Nhập email của bạn...')}
                                className="font-medium bg-transparent border-none outline-none text-gray-900 dark:text-white px-4 py-2 text-sm w-full placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                            <button className="bg-neon-green hover:bg-neon-hover text-white px-6 py-2.5 rounded-xl text-sm font-sans font-bold transition-colors whitespace-nowrap">
                                {t('footer.subscribe_btn', 'Đăng ký')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Links Grid */}
            <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-10">
                {/* Column 1: Brand */}
                <div className="space-y-6">
                    <Link to="/" className="flex items-center gap-3 group">
                        <Shield className="w-8 h-8 text-neon-green" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            BAS-TICKET
                        </span>
                    </Link>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                        {t('footer.description', 'Nền tảng phát hành vé sự kiện ứng dụng công nghệ Blockchain và AI. Chống gian lận tuyệt đối, thanh toán minh bạch.')}
                    </p>
                    <div className="flex gap-4">
                        {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                            <a key={i} href="#" className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-card border border-transparent dark:border-dark-border flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-neon-green hover:text-white dark:hover:bg-neon-green dark:hover:text-white dark:hover:border-neon-green transition-all">
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Column 2: Platform */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
                        {t('footer.platform.title', 'Nền tảng')}
                    </h4>
                    <ul className="space-y-4">
                        {[
                            { key: 'events', label: 'Sự kiện', path: '/events' },
                            { key: 'marketplace', label: 'Chợ vé (Marketplace)', path: '/marketplace' },
                            { key: 'blog', label: 'Blog', path: '/blog' },
                            { key: 'organizer', label: 'Dành cho Ban tổ chức', path: '/organizer-register' }
                        ].map((item) => (
                            <li key={item.key}>
                                <Link to={item.path} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-neon-green dark:hover:text-neon-green transition-colors">
                                    {t(`footer.platform.${item.key}`, item.label)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 3: Support */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
                        {t('footer.support.title', 'Hỗ trợ')}
                    </h4>
                    <ul className="space-y-4">
                        {[
                            { key: 'help', label: 'Trung tâm trợ giúp', path: '/faq' },
                            { key: 'terms', label: 'Điều khoản dịch vụ', path: '/customer-terms' },
                            { key: 'privacy', label: 'Chính sách bảo mật', path: '/privacy-policy' },
                            { key: 'refund', label: 'Chính sách hoàn tiền', path: '/refund-policy' }
                        ].map((item) => (
                            <li key={item.key}>
                                <Link to={item.path} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-neon-green dark:hover:text-neon-green transition-colors">
                                    {t(`footer.support.${item.key}`, item.label)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4: Contact */}
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
                        {t('footer.connect.title', 'Liên hệ')}
                    </h4>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-neon-green shrink-0 mt-0.5" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                                K33/29 Châu Văn Liêm, P.Thuận Phước, Q. Hải Châu, TP. Đà Nẵng
                            </span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-neon-green shrink-0" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                basticket.noreply@gmail.com
                            </span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-neon-green shrink-0" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                tranminhphuong732004@gmail.com
                            </span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-neon-green shrink-0" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {t('footer.connect.hotline', 'Hotline: 0962642853')}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar Section */}
            <div className="max-w-[1400px] mx-auto px-6 pt-8 border-t border-gray-200 dark:border-dark-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-500 text-center md:text-left">
                        © 2026 BAS-Ticket
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-500">
                            <Globe className="w-4 h-4 text-neon-green" />
                            <span>Vietnam</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300 dark:bg-dark-border hidden md:block"></div>
                        <div className="flex items-center gap-4 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                            <span className="text-sm font-bold text-gray-400 dark:text-gray-400 tracking-widest">VNPAY</span>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3.5 object-contain" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5 object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;