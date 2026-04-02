import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Ticket, Shield, RefreshCw, Smartphone, CreditCard, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FAQ = () => {
    const { t } = useTranslation();
    const k = 'support.faq';
    const cats = t(`${k}.cats`, { returnObjects: true });

    const categories = [
        { id: 'account', icon: Shield },
        { id: 'ticket', icon: Ticket },
        { id: 'marketplace', icon: RefreshCw },
        { id: 'payment', icon: CreditCard },
        { id: 'app', icon: Smartphone },
    ];

    const faqs = [
        { cat: 'account', q: t(`${k}.q1`), a: t(`${k}.a1`) },
        { cat: 'account', q: t(`${k}.q2`), a: t(`${k}.a2`) },
        { cat: 'account', q: t(`${k}.q7`), a: t(`${k}.a7`) },
        { cat: 'account', q: t(`${k}.q8`), a: t(`${k}.a8`) },
        { cat: 'ticket',  q: t(`${k}.q3`), a: t(`${k}.a3`) },
        { cat: 'ticket',  q: t(`${k}.q4`), a: t(`${k}.a4`) },
        { cat: 'ticket',  q: t(`${k}.q9`), a: t(`${k}.a9`) },
        { cat: 'ticket',  q: t(`${k}.q10`), a: t(`${k}.a10`) },
        { cat: 'marketplace', q: t(`${k}.q5`), a: t(`${k}.a5`) },
        { cat: 'marketplace', q: t(`${k}.q11`), a: t(`${k}.a11`) },
        { cat: 'marketplace', q: t(`${k}.q12`), a: t(`${k}.a12`) },
        { cat: 'payment', q: t(`${k}.q6`), a: t(`${k}.a6`) },
        { cat: 'payment', q: t(`${k}.q13`), a: t(`${k}.a13`) },
        { cat: 'payment', q: t(`${k}.q14`), a: t(`${k}.a14`) },
        { cat: 'app',     q: t(`${k}.q15`), a: t(`${k}.a15`) },
        { cat: 'app',     q: t(`${k}.q16`), a: t(`${k}.a16`) },
    ];

    const [activeCat, setActiveCat] = useState('ticket');
    const [openIndex, setOpenIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFaqs = faqs.filter(f =>
        f.cat === activeCat &&
        (f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pb-10 transition-colors duration-500">
            {/* Hero Search */}
            <div className="relative py-10 flex items-center justify-center overflow-hidden border-b border-gray-200 dark:border-white/5">
                <div className="absolute inset-0 bg-neon-green/5 blur-[120px] opacity-30" />
                <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10 w-full">
                    <h1 className="text-2xl md:text-3xl font-black mt-10 text-gray-900 dark:text-white uppercase tracking-tighter">
                        {t(`${k}.title`)} <span className="text-neon-green ">{t(`${k}.titleHighlight`)}</span>
                    </h1>
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t(`${k}.searchPlaceholder`)}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-[2.5rem] py-4 pl-16 pr-8 text-sm md:text-base font-medium shadow-2xl focus:outline-none focus:border-neon-green transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
                {/* Categories */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="grid grid-cols-1 gap-2">
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={() => { setActiveCat(cat.id); setOpenIndex(-1); }}
                                className={`flex items-center gap-4 p-5 rounded-3xl text-left transition-all duration-300 border ${
                                    activeCat === cat.id
                                    ? 'bg-neon-green border-neon-green shadow-xl shadow-neon-green/20 scale-[1.02]'
                                    : 'bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/5 hover:border-neon-green/30 text-gray-500 dark:text-gray-400'
                                }`}>
                                <cat.icon className={`w-5 h-5 ${activeCat === cat.id ? 'text-black' : 'text-neon-green'}`} />
                                <span className={`text-[13px] font-black uppercase tracking-tight ${activeCat === cat.id ? 'text-black' : 'text-gray-800 dark:text-white'}`}>
                                    {cats && cats[cat.id]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 p-8 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-[2.5rem] space-y-6 overflow-hidden relative">
                        <HelpCircle className="absolute -right-4 -top-4 w-24 h-24 text-neon-green opacity-5 rotate-12" />
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter relative z-10">{t(`${k}.stillNeedHelp`)}</h4>
                        <p className="text-xs font-bold text-gray-500 leading-relaxed relative z-10">{t(`${k}.supportDesc`)}</p>
                        <a href="mailto:basticket.noreply@gmail.com"
                            className="block w-full py-4 bg-gray-100 dark:bg-white/5 hover:bg-neon-green hover:text-black border border-gray-200 dark:border-white/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all relative z-10 text-gray-700 dark:text-gray-300">
                            {t(`${k}.contactBtn`)}
                        </a>
                    </div>
                </div>

                {/* Accordion */}
                <div className="lg:col-span-8 space-y-4">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, index) => (
                            <div key={index}
                                className={`group overflow-hidden rounded-[2rem] border transition-all duration-500 ${
                                    openIndex === index
                                    ? 'bg-white dark:bg-white/[0.03] border-neon-green/40 shadow-2xl'
                                    : 'bg-white/70 dark:bg-white/[0.01] border-gray-200 dark:border-white/5 hover:border-neon-green/20'
                                }`}>
                                <button onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                    className="w-full p-6 flex items-center justify-between text-left">
                                    <span className={`text-sm md:text-base font-black tracking-tight pr-8 transition-colors ${openIndex === index ? 'text-neon-green' : 'text-gray-900 dark:text-white'}`}>
                                        {faq.q}
                                    </span>
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${openIndex === index ? 'bg-neon-green text-black rotate-180' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </button>
                                {openIndex === index && (
                                    <div className="px-8 pb-8">
                                        <div className="h-px bg-gray-100 dark:bg-white/5 mb-8" />
                                        <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-400 leading-[1.8]">{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-6 bg-white dark:bg-white/[0.01] rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10">
                            <Search className="w-16 h-16 text-gray-400 mx-auto" />
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">{t(`${k}.noResults`)}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
