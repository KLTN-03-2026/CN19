import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Ticket, Shield, RefreshCw, Smartphone, CreditCard, Search, ArrowRight } from 'lucide-react';
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
        <div className="min-h-screen bg-white dark:bg-[#0a0a0c] transition-colors duration-500 font-sans selection:bg-neon-green/30">
            
            {/* 🔍 COMPACT SEARCH HERO */}
            <header className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-12 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-full mb-2">
                            <HelpCircle className="w-3 h-3 text-neon-green" />
                            <span className="text-[10px] font-black text-gray-400 leading-none">Trung tâm trợ giúp</span>
                        </div>
                        <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white uppercase leading-tight tracking-tight">
                            {t(`${k}.title`)} <span className="text-neon-green">{t(`${k}.titleHighlight`)}</span>
                        </h1>
                    </div>
                    
                    <div className="relative w-full md:w-[400px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t(`${k}.searchPlaceholder`)}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#111114] border border-gray-100 dark:border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-neon-green transition-all shadow-sm"
                        />
                    </div>
                </div>
            </header>

            {/* 📜 MAIN CONTENT GRID (Strict 1400px & Gap-6) */}
            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-20">
                <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* SIDEBAR: CATEGORIES (Strict 350px width) */}
                    <aside className="w-full lg:w-[350px] shrink-0 space-y-4">
                        <div className="bg-white dark:bg-[#111114] rounded-3xl border border-gray-100 dark:border-white/5 p-4 shadow-sm sticky top-24">
                            <nav className="space-y-1">
                                {categories.map((cat) => (
                                    <button 
                                        key={cat.id} 
                                        onClick={() => { setActiveCat(cat.id); setOpenIndex(0); }}
                                        className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all group ${
                                            activeCat === cat.id
                                            ? 'bg-neon-green text-black shadow-lg shadow-neon-green/10 active:scale-95'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5'
                                        }`}
                                    >
                                        <cat.icon className={`w-4 h-4 shrink-0 ${activeCat === cat.id ? 'text-black' : 'text-neon-green group-hover:scale-110 transition-transform'}`} />
                                        <span className="text-[11px] font-black uppercase tracking-tight">
                                            {cats && cats[cat.id]}
                                        </span>
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
                                <h4 className="text-[10px] font-black text-gray-800 dark:text-white uppercase mb-4 ml-2">{t(`${k}.stillNeedHelp`)}</h4>
                                <a 
                                    href="mailto:basticket.noreply@gmail.com"
                                    className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-[11px] font-black text-neon-green group hover:border-neon-green/30 transition-all shadow-sm"
                                >
                                    {t(`${k}.contactBtn`)}
                                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT Area (Flexible-1) */}
                    <div className="flex-1 space-y-3">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <div 
                                    key={index}
                                    className={`group overflow-hidden rounded-3xl border transition-all duration-300 ${
                                        openIndex === index
                                        ? 'bg-white dark:bg-[#111114] border-neon-green/40 shadow-xl'
                                        : 'bg-white dark:bg-[#111114] border-gray-100 dark:border-white/5 hover:border-neon-green/20'
                                    }`}
                                >
                                    <button 
                                        onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                        className="w-full p-6 text-left flex items-start gap-4"
                                    >
                                        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${openIndex === index ? 'bg-neon-green text-black' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>
                                            <HelpCircle className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`text-sm sm:text-[14px] font-black uppercase leading-tight transition-colors ${openIndex === index ? 'text-neon-green' : 'text-gray-900 dark:text-white'}`}>
                                                {faq.q}
                                            </h3>
                                            {openIndex === index && (
                                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="h-px bg-gray-50 dark:bg-white/5 mb-4" />
                                                    <p className="text-xs sm:text-[13px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                                                        {faq.a}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0 pt-1">
                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-neon-green' : ''}`} />
                                        </div>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center bg-gray-50/50 dark:bg-[#111114] border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl">
                                <Search className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-4" />
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t(`${k}.noResults`)}</h4>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default FAQ;
