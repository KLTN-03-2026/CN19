import React from 'react';
import { AlertCircle, CreditCard, Clock, CheckCircle2, XCircle, Info, RefreshCcw, ArrowLeft, Sparkles, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const RefundPolicy = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const k = 'support.refund';

    const steps = [
        { icon: CreditCard, title: t(`${k}.step1Title`), desc: t(`${k}.step1Desc`) },
        { icon: Clock, title: t(`${k}.step2Title`), desc: t(`${k}.step2Desc`) },
        { icon: RefreshCcw, title: t(`${k}.step3Title`), desc: t(`${k}.step3Desc`) },
        { icon: CheckCircle2, title: t(`${k}.step4Title`), desc: t(`${k}.step4Desc`) },
    ];

    const cases = [
        { title: t(`${k}.case1Title`), desc: t(`${k}.case1Desc`) },
        { title: t(`${k}.case2Title`), desc: t(`${k}.case2Desc`) },
        { title: t(`${k}.case3Title`), desc: t(`${k}.case3Desc`) },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500 font-sans selection:bg-neon-green/30">
            
            {/* 🧭 NAVIGATION & TITLE AREA */}
            <header className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-8 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
                    <RefreshCcw className="w-3.5 h-3.5 text-neon-green" />
                    <span className="text-[10px] font-bold text-gray-400 leading-none">
                        Chính sách hoàn tiền
                    </span>
                </div>
                
                <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase leading-tight mb-1">
                    {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                </h1>
                
                <p className="max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {t(`${k}.subtitle`)}
                </p>
            </header>

            {/* 📜 MAIN LAYOUT */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-10 space-y-6">
                
                {/* ⚠️ IMPORTANT WARNING CARD */}
                <div className="bg-red-500/[0.03] dark:bg-red-500/[0.02] border border-red-500/20 rounded-3xl p-6 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="flex gap-6 items-start relative z-10 flex-col sm:flex-row">
                        <div className="space-y-2">
                            <h4 className=" text-sm sm:text-lg font-black text-gray-900 dark:text-white uppercase leading-tight">{t(`${k}.warningTitle`)}</h4>
                            <p className="text-xs sm:text-sm leading-relaxed font-medium text-gray-500 dark:text-gray-400">{t(`${k}.warningDesc`)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT CONTENT: CASES & NOTES */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Refund Cases Section */}
                        <section className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-4 sm:p-6 shadow-sm">
                            <h2 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-6 flex items-center gap-4">
                                {t(`${k}.casesTitle`)}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {cases.map((item, i) => (
                                    <div key={i} className="p-4 bg-gray-50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/5 rounded-2xl space-y-3 transition-colors hover:border-neon-green/30">
                                        <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center shadow-inner">
                                            <CheckCircle2 className="w-4 h-4 text-neon-green" />
                                        </div>
                                        <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase leading-tight">{item.title}</h3>
                                        <p className="text-[10px] sm:text-[11px] leading-relaxed font-bold text-gray-400">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* General Notes Section */}
                        <section className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-4 sm:p-6 shadow-sm">
                            <h2 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white uppercase leading-tight mb-6 flex items-center gap-3"> {t(`${k}.notesTitle`)}
                            </h2>
                            <div className="space-y-2 mt-">
                                {[t(`${k}.note1`), t(`${k}.note2`), t(`${k}.note3`)].map((note, i) => (
                                    <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 leading-relaxed">{note}</p>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT CONTENT: PROCESS STEPS */}
                    <div className="lg:col-span-4">
                        <section className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm h-full flex flex-col">
                            <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase leading-tight mb-8">{t(`${k}.processTitle`)}</h2>
                            <div className="flex-1 relative space-y-6">
                                {steps.map((step, i) => (
                                    <div key={i} className="relative flex gap-6 group">
                                        {i !== steps.length - 1 && (
                                            <div className="absolute left-6 top-12 bottom-[-24px] w-0.5 bg-gray-100 dark:bg-white/5" />
                                        )}
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm relative z-10 group-hover:border-neon-green/30 transition-all">
                                            <step.icon className="w-5 h-5 text-neon-green" />
                                        </div>
                                        <div className="pt-2">
                                            <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase mb-1">{step.title}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 group-hover:text-gray-500 transition-colors leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => navigate('/faq')}
                                className="mt-6 w-full py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[11px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                {t('support.ctaFaq', 'Check FAQs')}
                            </button>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RefundPolicy;
