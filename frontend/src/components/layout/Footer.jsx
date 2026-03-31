import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="relative z-10 bg-white dark:bg-[#0a0a0b] border-t border-gray-100 dark:border-white/5 pt-12 pb-8 transition-colors duration-500">
            {/* Top Section with Newsletter */}
            <div className="max-w-[1400px] mx-auto px-6 mb-12">
                <div className="relative overflow-hidden bg-neon-green rounded-[2.5rem] p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 group shadow-[0_20px_40px_-10px_rgba(82,196,45,0.25)]">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-[80px] -ml-20 -mb-20 opacity-30"></div>
                    
                    <div className="relative z-10 text-center lg:text-left max-w-xl">
                        <h3 className="text-2xl md:text-4xl font-black text-black uppercase leading-none mb-4 italic">
                            {t('footer.newsletter_title')}
                        </h3>
                        <p className="text-black/60 font-black uppercase tracking-[0.3em] text-[9px] md:text-[10px]">
                            {t('footer.newsletter_subtitle')}
                        </p>
                    </div>

                    <div className="relative z-10 w-full lg:w-auto">
                        <div className="flex bg-black p-2 rounded-[2rem] border border-white/10 shadow-2xl w-full lg:w-[450px]">
                            <input 
                                type="email" 
                                placeholder={t('footer.email_placeholder')}
                                className="bg-transparent border-none outline-none text-white px-6 py-3 font-black text-[10px] w-full placeholder:text-white/20 uppercase tracking-widest"
                            />
                            <button className="bg-neon-green hover:bg-neon-hover text-black px-8 py-3 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-black/40 whitespace-nowrap">
                                {t('footer.subscribe_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Links Grid */}
            <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                {/* Column 1: Brand */}
                <div className="space-y-6">
                    <Link to="/" className="flex items-center gap-3 group">
                        <Shield className="w-10 h-10 text-neon-green group-hover:rotate-12 transition-transform duration-500" />
                        <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
                            BASTICKET
                        </span>
                    </Link>
                    <p className="text-[10px] font-black text-gray-500 dark:text-white/30 leading-relaxed uppercase tracking-[0.2em]">
                        {t('footer.description')}
                    </p>
                    <div className="flex gap-3">
                        {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                            <a key={i} href="#" className="w-10 h-10 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-neon-green hover:border-neon-green hover:bg-neon-green/10 transition-all shadow-xl active:scale-90 group">
                                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Column 2: Platform */}
                <div>
                    <h4 className="text-[9px] font-black text-neon-green uppercase tracking-[0.5em] mb-6 italic border-l-4 border-neon-green pl-4">
                        {t('footer.platform.title')}
                    </h4>
                    <ul className="space-y-3">
                        {[
                            { key: 'events', path: '/events' },
                            { key: 'marketplace', path: '/marketplace' },
                            { key: 'nfts', path: '#' },
                            { key: 'rewards', path: '#' }
                        ].map((item) => (
                            <li key={item.key}>
                                <Link to={item.path} className="text-[10px] font-black text-gray-600 dark:text-white/50 hover:text-neon-green transition-all uppercase tracking-widest flex items-center group">
                                    <div className="w-0 h-[2px] bg-neon-green group-hover:w-3 transition-all opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-2" />
                                    {t(`footer.platform.${item.key}`)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 3: Support */}
                <div>
                    <h4 className="text-[9px] font-black text-neon-green uppercase tracking-[0.5em] mb-6 italic border-l-4 border-neon-green pl-4">
                        {t('footer.support.title')}
                    </h4>
                    <ul className="space-y-3">
                        {[
                            { key: 'help', path: '#' },
                            { key: 'terms', path: '#' },
                            { key: 'privacy', path: '#' },
                            { key: 'refund', path: '#' }
                        ].map((item) => (
                            <li key={item.key}>
                                <Link to={item.path} className="text-[10px] font-black text-gray-600 dark:text-white/50 hover:text-neon-green transition-all uppercase tracking-widest flex items-center group">
                                    <div className="w-0 h-[2px] bg-neon-green group-hover:w-3 transition-all opacity-0 group-hover:opacity-100 mr-0 group-hover:mr-2" />
                                    {t(`footer.support.${item.key}`)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4: Contact */}
                <div>
                    <h4 className="text-[9px] font-black text-neon-green uppercase tracking-[0.5em] mb-6 italic border-l-4 border-neon-green pl-4">
                        {t('footer.connect.title')}
                    </h4>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-neon-green shrink-0 group-hover:bg-neon-green group-hover:text-black transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <p className="text-[9px] font-black text-gray-600 dark:text-white/40 uppercase tracking-[0.2em] leading-relaxed pt-1">
                                {t('footer.connect.address')}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-neon-green shrink-0 group-hover:bg-neon-green group-hover:text-black transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <p className="text-[9px] font-black text-gray-600 dark:text-white/40 uppercase tracking-[0.2em]">
                                contact@basticket.tech
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar Section */}
            <div className="max-w-[1400px] mx-auto px-6 pt-8 border-t border-gray-100 dark:border-white/5">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                    <p className="text-[9px] font-black text-gray-400 dark:text-white/20 uppercase tracking-[0.5em] text-center lg:text-left">
                        © 2026 BASTICKET. {t('footer.copyright')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-10">
                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 dark:text-white/30 uppercase tracking-[0.3em] italic">
                            <Globe className="w-4 h-4 text-neon-green" />
                            BASTICKET WORLDWIDE
                        </div>
                        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden lg:block"></div>
                        <div className="flex items-center gap-6">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5 opacity-20 hover:opacity-100 hover:grayscale-0 grayscale transition-all cursor-pointer" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3 opacity-20 hover:opacity-100 hover:grayscale-0 grayscale transition-all cursor-pointer" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-7 opacity-20 hover:opacity-100 hover:grayscale-0 grayscale transition-all cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
