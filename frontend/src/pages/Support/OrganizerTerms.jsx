import React from 'react';
import { Shield, LayoutDashboard, AlertCircle, RefreshCw, CreditCard, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OrganizerTerms = () => {
    const { t } = useTranslation();
    const k = 'support.organizerTerms';
    const navIcons = [Handshake, LayoutDashboard, Shield, CreditCard, RefreshCw, AlertCircle];
    const navItems = t(`${k}.nav`, { returnObjects: true });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-10 transition-colors duration-500">
            <div className="relative h-[270px] flex items-center justify-center overflow-hidden border-b border-gray-200 dark:border-white/5">
                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] opacity-50" />
                <div className="relative z-10 text-center space-y-4 px-6">
                    <h1 className="text-2xl md:text-3xl mt-8 font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-gray-600 dark:text-gray-400">{t(`${k}.subtitle`)}</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-neon-green tracking-widest pt-4">
                        <span>{t(`${k}.badge`)}</span>
                    </div>
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
                    {[
                        { id: 's1', num: '1', title: t(`${k}.s1Title`), content: <div className="space-y-2  text-gray-600 dark:text-gray-400 font-medium leading-relaxed bg-white dark:bg-white/[0.02] p-8 rounded-[2rem] border border-gray-200 dark:border-white/5"><p>{t(`${k}.s1p1`)}</p><p>{t(`${k}.s1p2`)}</p></div> },
                        { id: 's2', num: '2', title: t(`${k}.s2Title`), content: (
                            <div className="space-y-4 text-gray-600 dark:text-gray-400 font-medium">
                                <p>{t(`${k}.s2p1`)}</p>
                                <ul className="list-none space-y-4">
                                    {[t(`${k}.s2i1`), t(`${k}.s2i2`)].map((item, i) => (
                                        <li key={i} className="flex gap-4 items-start p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-2xl">
                                            <Shield className="w-5 h-5 text-neon-green shrink-0" /><span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )},
                        { id: 's3', num: '3', title: t(`${k}.s3Title`), content: <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">{t(`${k}.s3p1`)}</p> },
                        { id: 's4', num: '4', title: t(`${k}.s4Title`), content: (
                            <div className="p-8 bg-neon-green/5 border border-neon-green/20 rounded-[2.5rem] space-y-4">
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{t(`${k}.s4p1`)}</p>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    {[t(`${k}.s4i1`), t(`${k}.s4i2`), t(`${k}.s4i3`)].map((item, i) => <li key={i}>• {item}</li>)}
                                </ul>
                            </div>
                        )},
                        { id: 's5', num: '5', title: t(`${k}.s5Title`), content: (
                            <div className="space-y-6 text-gray-600 dark:text-gray-400 font-medium">
                                <p>{t(`${k}.s5p1`)}</p>
                                <div className="p-8 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-3xl">
                                    <h4 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2"><RefreshCw className="w-4 h-4 text-neon-green" />{t(`${k}.s5boxTitle`)}</h4>
                                    <p className="text-sm">{t(`${k}.s5boxDesc`)}</p>
                                </div>
                            </div>
                        )},
                        { id: 's6', num: '6', title: t(`${k}.s6Title`), content: (
                            <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl flex gap-6 items-start">
                                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                                <div className="space-y-4">
                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{t(`${k}.s6p1`)}</p>
                                    <ul className="text-sm text-gray-500 space-y-2">
                                        {[t(`${k}.s6i1`), t(`${k}.s6i2`), t(`${k}.s6i3`)].map((item, i) => <li key={i}>• {item}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )},
                    ].map(section => (
                        <section key={section.id} id={section.id} className="scroll-mt-32">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-4">
                                <span className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-sm shrink-0">{section.num}</span>
                                {section.title}
                            </h2>
                            {section.content}
                        </section>
                    ))}
                </main>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 mt-10">
                <div className="p-10 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-[3.5rem] text-center space-y-6 shadow-2xl">
                    <h2 className="text-3xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t(`${k}.partnerCta`)}</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-bold max-w-xl mx-auto">{t(`${k}.partnerCtaDesc`)}</p>
                    <div className="flex flex-wrap justify-center gap-4 pt-2">
                        <Link to="/organizer-register" className="px-8 py-4 bg-neon-green text-black rounded-2xl font-black uppercase text-xs hover:scale-105 transition-all">{t(`${k}.partnerBtn`)}</Link>
                        <a href="mailto:basticket.noreply@gmail.com" className="px-8 py-4 bg-gray-900 dark:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">{t(`${k}.contactBtn`)}</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerTerms;
