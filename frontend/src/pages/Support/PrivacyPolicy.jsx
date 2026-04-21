import React from 'react';
import { Shield, Eye, Lock, Database, Globe, UserCheck, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    const k = 'support.privacy';
    const navIcons = [Database, Eye, Globe, Lock, UserCheck, Mail];
    const navItems = t(`${k}.nav`, { returnObjects: true });

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500 font-sans selection:bg-neon-green/30">
            
            {/* 🧭 NAVIGATION & TITLE AREA */}
            <header className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
                    <Lock className="w-3.5 h-3.5 text-neon-green" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Bảo mật dữ liệu
                    </span>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase leading-tight mb-2">
                    {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                </h1>
                
                <p className="max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {t(`${k}.subtitle`)}
                </p>
            </header>

            {/* 📜 MAIN LAYOUT */}
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
                    
                    {/* SIDEBAR */}
                    <aside className="w-full lg:w-[350px] shrink-0 space-y-6">
                        <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 shadow-sm sticky top-24">
                            <nav className="space-y-1">
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
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 space-y-6">
                        
                        <section id="s1" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-6">{t(`${k}.s1Title`)}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[{ title: t(`${k}.s1card1Title`), desc: t(`${k}.s1card1Desc`) }, { title: t(`${k}.s1card2Title`), desc: t(`${k}.s1card2Desc`) }].map((card, i) => (
                                        <div key={i} className="p-5 bg-gray-50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/5 rounded-2xl">
                                            <h4 className="text-neon-green font-black uppercase text-[10px] tracking-widest mb-3">{card.title}</h4>
                                            <p className="text-[11px] leading-relaxed font-bold text-gray-600 dark:text-gray-400">{card.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="s2" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm space-y-6">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">{t(`${k}.s2Title`)}</h2>
                                <p className="text-[13px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed">{t(`${k}.s2p1`)}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: Eye, title: t(`${k}.s2u1Title`), desc: t(`${k}.s2u1Desc`) },
                                        { icon: Database, title: t(`${k}.s2u2Title`), desc: t(`${k}.s2u2Desc`) },
                                        { icon: Shield, title: t(`${k}.s2u3Title`), desc: t(`${k}.s2u3Desc`) },
                                        { icon: Globe, title: t(`${k}.s2u4Title`), desc: t(`${k}.s2u4Desc`) },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 items-start p-5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl">
                                            <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center shrink-0">
                                                <item.icon className="w-5 h-5 text-neon-green" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-gray-800 dark:text-white uppercase mb-1">{item.title}</p>
                                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="s3" className="scroll-mt-32">
                            <div className="bg-neon-green/5 border border-neon-green/10 rounded-3xl p-6 sm:p-8 shadow-sm">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-4 flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-neon-green" /> {t(`${k}.s3Title`)}
                                </h2>
                                <p className="text-[13px] leading-relaxed font-bold text-gray-600 dark:text-gray-400">{t(`${k}.s3p1`)}</p>
                            </div>
                        </section>

                        <section id="s4" className="scroll-mt-32">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm space-y-8">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">{t(`${k}.s4Title`)}</h2>
                                <div className="space-y-6">
                                    {[{ icon: Lock, title: t(`${k}.s4t1`), desc: t(`${k}.s4d1`) }, { icon: Shield, title: t(`${k}.s4t2`), desc: t(`${k}.s4d2`) }].map((item, i) => (
                                        <div key={i} className="flex gap-6 items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center shrink-0">
                                                <item.icon className="w-6 h-6 text-neon-green" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-black text-gray-800 dark:text-white mb-2 uppercase">{item.title}</p>
                                                <p className="text-xs font-bold leading-relaxed text-gray-500 dark:text-gray-400">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section id="s5" className="scroll-mt-32 border-t border-gray-100 dark:border-white/5 pt-10">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-8">{t(`${k}.s5Title`)}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[t(`${k}.s5r1`), t(`${k}.s5r2`), t(`${k}.s5r3`), t(`${k}.s5r4`)].map((right, i) => (
                                    <div key={i} className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-green shrink-0" />{right}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section id="s6" className="scroll-mt-32 pt-10">
                            <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-8">{t(`${k}.s6Title`)}</h2>
                                <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed mb-8">{t(`${k}.s6p1`)}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <a href="mailto:basticket.noreply@gmail.com"
                                        className="flex items-center gap-4 px-6 py-5 bg-neon-green/10 border border-neon-green/20 rounded-2xl hover:bg-neon-green transition-all group">
                                        <Mail className="w-6 h-6 text-neon-green group-hover:text-black shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-gray-500 group-hover:text-black uppercase tracking-widest mb-1">{t(`${k}.s6emailLabel`)}</p>
                                            <p className="text-xs font-black text-neon-green group-hover:text-black uppercase tracking-tight">basticket.noreply@gmail.com</p>
                                        </div>
                                    </a>
                                    <div className="flex items-center gap-4 px-6 py-5 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl">
                                        <UserCheck className="w-6 h-6 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{t(`${k}.s6responseLabel`)}</p>
                                            <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{t(`${k}.s6responseTime`)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
