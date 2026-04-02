import React from 'react';
import { Shield, Eye, Lock, Database, Globe, UserCheck, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    const k = 'support.privacy';
    const navIcons = [Database, Eye, Globe, Lock, UserCheck, Mail];
    const navItems = t(`${k}.nav`, { returnObjects: true });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-10 transition-colors duration-500">
            <div className="relative h-[220px] flex items-center justify-center overflow-hidden border-b border-gray-200 dark:border-white/5">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] opacity-50" />
                <div className="relative z-10 text-center space-y-4 px-4">
                    <h1 className="text-2xl mt-8 md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-gray-600 dark:text-gray-400">{t(`${k}.subtitle`)}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <aside className="lg:col-span-3 hidden lg:block sticky top-32 h-fit">
                    <nav className="space-y-1">
                        {Array.isArray(navItems) && navItems.map((label, i) => {
                            const Icon = navIcons[i] || Shield;
                            return (
                                <a key={i} href={`#s${i+1}`}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-neon-green hover:bg-neon-green/5 transition-all group">
                                    {label}
                                </a>
                            );
                        })}
                    </nav>
                </aside>

                <main className="lg:col-span-9 space-y-6">
                    <section id="s1" className="scroll-mt-32">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">{t(`${k}.s1Title`)}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[{ title: t(`${k}.s1card1Title`), desc: t(`${k}.s1card1Desc`) }, { title: t(`${k}.s1card2Title`), desc: t(`${k}.s1card2Desc`) }].map((card, i) => (
                                <div key={i} className="p-8 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-3xl space-y-4">
                                    <h4 className="text-neon-green font-black uppercase text-[10px] tracking-widest">{card.title}</h4>
                                    <p className="text-sm leading-relaxed font-medium text-gray-600 dark:text-gray-400">{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="s2" className="scroll-mt-32">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">{t(`${k}.s2Title`)}</h2>
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{t(`${k}.s2p1`)}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { icon: Eye, title: t(`${k}.s2u1Title`), desc: t(`${k}.s2u1Desc`) },
                                    { icon: Database, title: t(`${k}.s2u2Title`), desc: t(`${k}.s2u2Desc`) },
                                    { icon: Shield, title: t(`${k}.s2u3Title`), desc: t(`${k}.s2u3Desc`) },
                                    { icon: Globe, title: t(`${k}.s2u4Title`), desc: t(`${k}.s2u4Desc`) },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start p-5 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl">
                                        <div className="w-9 h-9 rounded-xl bg-neon-green/10 flex items-center justify-center shrink-0">
                                            <item.icon className="w-4 h-4 text-neon-green" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wide mb-1">{item.title}</p>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="s3" className="scroll-mt-32">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                            {t(`${k}.s3Title`)}
                        </h2>
                        <div className="p-8 bg-neon-green/5 border border-neon-green/10 rounded-[2.5rem] space-y-4">
                            <p className="text-sm leading-relaxed font-medium text-gray-600 dark:text-gray-400">{t(`${k}.s3p1`)}</p>
                        </div>
                    </section>

                    <section id="s4" className="scroll-mt-32">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">{t(`${k}.s4Title`)}</h2>
                        <div className="space-y-6">
                            {[{ icon: Lock, title: t(`${k}.s4t1`), desc: t(`${k}.s4d1`) }, { icon: Shield, title: t(`${k}.s4t2`), desc: t(`${k}.s4d2`) }].map((item, i) => (
                                <div key={i} className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                        <item.icon className="w-6 h-6 text-neon-green" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white mb-2 uppercase tracking-wide">{item.title}</p>
                                        <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="s5" className="scroll-mt-32 border-t border-gray-200 dark:border-white/5 pt-8">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">{t(`${k}.s5Title`)}</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                            {[t(`${k}.s5r1`), t(`${k}.s5r2`), t(`${k}.s5r3`), t(`${k}.s5r4`)].map((right, i) => (
                                <li key={i} className="p-6 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-neon-green shrink-0" />{right}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section id="s6" className="scroll-mt-32 border-t border-gray-200 dark:border-white/5 pt-10">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">{t(`${k}.s6Title`)}</h2>
                        <div className="p-8 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-[2.5rem] space-y-6">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">{t(`${k}.s6p1`)}</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="mailto:basticket.noreply@gmail.com"
                                    className="flex items-center gap-3 px-6 py-4 bg-neon-green/10 border border-neon-green/20 rounded-2xl hover:bg-neon-green hover:text-black transition-all group">
                                    <Mail className="w-5 h-5 text-neon-green group-hover:text-black shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 group-hover:text-black uppercase tracking-widest">{t(`${k}.s6emailLabel`)}</p>
                                        <p className="text-sm font-bold text-neon-green group-hover:text-black">basticket.noreply@gmail.com</p>
                                    </div>
                                </a>
                                <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl">
                                    <UserCheck className="w-5 h-5 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t(`${k}.s6responseLabel`)}</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t(`${k}.s6responseTime`)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
``                    </section>
                </main>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
