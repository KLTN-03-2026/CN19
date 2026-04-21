import React from 'react';
import { Shield, LayoutDashboard, AlertCircle, RefreshCw, CreditCard, Handshake, Sparkles, CheckCircle2, ArrowRight, Scale, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OrganizerTerms = () => {
    const { t } = useTranslation();
    const k = 'support.organizerTerms';
    const navIcons = [Handshake, LayoutDashboard, Shield, CreditCard, RefreshCw, AlertCircle];
    const navItems = t(`${k}.nav`, { returnObjects: true });

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500 font-sans selection:bg-neon-green/30">
            
            {/* 🧭 NAVIGATION & TITLE AREA (Strict Profile Header Style) */}
            <header className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
                    <Handshake className="w-3.5 h-3.5 text-neon-green" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        {t(`${k}.badge`)}
                    </span>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase leading-tight mb-2">
                    {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                </h1>
                
                <p className="max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {t(`${k}.subtitle`)}
                </p>
            </header>

            {/* 📜 MAIN LAYOUT (Strict Flex Col/Row Gap-6) */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20">
                
                {/* Mobile Quick Nav Bar */}
                <div className="lg:hidden sticky top-[72px] z-30 -mx-4 px-4 py-3 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 overflow-x-auto no-scrollbar flex items-center gap-2 mb-6">
                    {Array.isArray(navItems) && navItems.map((label, i) => (
                        <a 
                            key={i} 
                            href={`#s${i+1}`}
                            className="whitespace-nowrap px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-[11px] font-bold text-gray-400 hover:text-neon-green transition-colors"
                        >
                            {label}
                        </a>
                    ))}
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* SIDEBAR: STICKY NAVIGATION (Strict 350px Width) */}
                    <aside className="w-full lg:w-[350px] shrink-0 space-y-6">
                        <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm sticky top-24">
                            <nav className="space-y-1 mb-8">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-4 ml-2">Mục lục</p>
                                {Array.isArray(navItems) && navItems.map((label, i) => {
                                    const Icon = navIcons[i] || Shield;
                                    return (
                                        <a 
                                            key={i} 
                                            href={`#s${i+1}`}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-neon-green hover:bg-gray-50 dark:hover:bg-white/5 transition-all group"
                                        >
                                            <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            {label}
                                        </a>
                                    );
                                })}
                            </nav>

                            <div className="pt-6 border-t border-gray-50 dark:border-white/5">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-3 ml-2">Dành cho khách hàng</p>
                                <Link to="/customer-terms" className="flex items-center justify-between px-4 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-[11px] font-black text-neon-green group">
                                    Điều khoản khách hàng
                                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT Area (Flexible-1) */}
                    <div className="flex-1 space-y-6">
                        
                        <section id="s1" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">
                                        <span className="text-neon-green mr-2">01.</span>{t(`${k}.s1Title`)}
                                    </h2>
                                </div>
                                <div className="space-y-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                    <p>{t(`${k}.s1p1`)}</p>
                                    <p>{t(`${k}.s1p2`)}</p>
                                </div>
                            </div>
                        </section>

                        <section id="s2" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">
                                        <span className="text-neon-green mr-2">02.</span>{t(`${k}.s2Title`)}
                                    </h2>
                                </div>
                                <div className="space-y-6">
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{t(`${k}.s2p1`)}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[t(`${k}.s2i1`), t(`${k}.s2i2`)].map((item, i) => (
                                            <div key={i} className="flex gap-3 items-start p-4 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-100 dark:border-white/5">
                                                <Shield className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-normal">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="s3" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">
                                        <span className="text-neon-green mr-2">03.</span>{t(`${k}.s3Title`)}
                                    </h2>
                                </div>
                                <div className="space-y-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                    <p>{t(`${k}.s3p1`)}</p>
                                </div>
                            </div>
                        </section>

                        <section id="s4" className="scroll-mt-32">
                            <div className="bg-neon-green text-black rounded-3xl border border-neon-green/20 p-6 sm:p-8 shadow-lg shadow-neon-green/10 relative overflow-hidden">
                                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-black/5 rotate-12" />
                                <h4 className="text-[10px] font-black uppercase mb-4 opacity-50 tracking-widest leading-none">
                                    Quy trình dịch vụ
                                </h4>
                                <div className="space-y-6 relative z-10">
                                    <p className="text-base font-black leading-tight uppercase">{t(`${k}.s4p1`)}</p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                        {[t(`${k}.s4i1`), t(`${k}.s4i2`), t(`${k}.s4i3`)].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-[11px] font-bold lowercase first-letter:uppercase">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section id="s5" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">
                                        <span className="text-neon-green mr-2">05.</span>{t(`${k}.s5Title`)}
                                    </h2>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{t(`${k}.s5p1`)}</p>
                                <div className="p-5 bg-gray-50 dark:bg-white/[0.01] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex items-center gap-4">
                                    <RefreshCw className="w-5 h-5 text-neon-green shrink-0" />
                                    <div>
                                        <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase mb-1">{t(`${k}.s5boxTitle`)}</h4>
                                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{t(`${k}.s5boxDesc`)}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="s6" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">
                                        <span className="text-neon-green mr-2">06.</span>{t(`${k}.s6Title`)}
                                    </h2>
                                </div>
                                <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col sm:flex-row gap-4 items-start">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                    <div className="space-y-4">
                                        <p className="text-[13px] font-bold text-gray-800 dark:text-white">{t(`${k}.s6p1`)}</p>
                                        <ul className="text-[11px] text-gray-500 space-y-1.5 font-medium">
                                            {[t(`${k}.s6i1`), t(`${k}.s6i2`), t(`${k}.s6i3`)].map((item, i) => <li key={i} className="flex gap-2"><span>•</span>{item}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* 📍 PREMIUM PARTNER CTA */}
            <section className="max-w-[1400px] mx-auto px-4 sm:px-6 mb-20 text-center">
                <div className="bg-gray-900 dark:bg-[#111114] rounded-3xl border border-gray-800 dark:border-white/10 p-12 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                    
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase mb-4 tracking-tight relative z-10">
                        {t(`${k}.partnerCta`)}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium max-w-lg mx-auto mb-10 leading-relaxed relative z-10">
                        {t(`${k}.partnerCtaDesc`)}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                        <Link to="/organizer-register" className="px-8 py-4 bg-neon-green text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-transform">
                            {t(`${k}.partnerBtn`)}
                        </Link>
                        <a href="mailto:basticket.noreply@gmail.com" className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 hover:scale-105 transition-transform">
                            {t(`${k}.contactBtn`)}
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default OrganizerTerms;
