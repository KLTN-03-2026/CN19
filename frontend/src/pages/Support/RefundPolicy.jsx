import React from 'react';
import { AlertCircle, CreditCard, Clock, CheckCircle2, XCircle, Info, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RefundPolicy = () => {
    const { t } = useTranslation();
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-10 transition-colors duration-500">
            <div className="relative h-[270px] flex items-center justify-center overflow-hidden border-b border-gray-200 dark:border-white/5">
                <div className="absolute inset-0 bg-red-500/5 blur-[120px] opacity-50" />
                <div className="relative z-10 text-center space-y-4 px-6">
                    <h1 className="text-2xl mt-8 md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-sm md:text-base font-medium text-gray-600 dark:text-gray-400">{t(`${k}.subtitle`)}</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-red-500 tracking-widest pt-4">
                        <span>{t(`${k}.badge`)}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] flex flex-col md:flex-row gap-8 items-center">
                    <div className="space-y-2 text-center md:text-left">
                        <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{t(`${k}.warningTitle`)}</h4>
                        <p className="text-sm leading-relaxed font-medium text-gray-600 dark:text-gray-400">{t(`${k}.warningDesc`)}</p>
                    </div>
                </div>

                <section className="space-y-6">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                        <div className="w-1 h-8 bg-neon-green" />{t(`${k}.casesTitle`)}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {cases.map((item, i) => (
                            <div key={i} className="p-8 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-3xl space-y-4 hover:border-neon-green/30 transition-colors">
                                <CheckCircle2 className="w-5 h-5 text-neon-green" />
                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase">{item.title}</h3>
                                <p className="text-[11px] leading-relaxed font-bold text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                        <div className="w-1 h-8 bg-neon-green" />{t(`${k}.processTitle`)}
                    </h2>
                    <div className="relative">
                        <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/5 hidden lg:block" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {steps.map((step, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-dark-bg border-4 border-gray-100 dark:border-dark-bg shadow-xl flex items-center justify-center">
                                        <div className="w-full h-full bg-neon-green/10 rounded-xl flex items-center justify-center text-neon-green">
                                            <step.icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{step.title}</h4>
                                        <p className="text-[10px] font-bold text-gray-500">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="p-8 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-[2.5rem] space-y-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Info className="w-5 h-5 text-neon-green" />{t(`${k}.notesTitle`)}
                    </h3>
                    <div className="space-y-4 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                        <p>• {t(`${k}.note1`)}</p>
                        <p>• {t(`${k}.note2`)}</p>
                        <p>• {t(`${k}.note3`)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
