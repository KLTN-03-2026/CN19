import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Ticket, Shield, RefreshCw, Smartphone, CreditCard, Search } from 'lucide-react';

const FAQ = () => {
    const categories = [
        { id: 'account', title: 'Tài khoản & Bảo mật', icon: Shield },
        { id: 'ticket', title: 'Mua vé & Sử dụng', icon: Ticket },
        { id: 'marketplace', title: 'Chợ vé & Chuyển nhượng', icon: RefreshCw },
        { id: 'payment', title: 'Thanh toán & Hoàn tiền', icon: CreditCard },
        { id: 'app', title: 'Ứng dụng & Kỹ thuật', icon: Smartphone },
    ];

    const faqs = [
        { 
            cat: 'account', 
            q: 'Vé NFT là gì và tại sao tôi cần nó?', 
            a: 'Vé NFT (Non-Fungible Token) là định dạng vé số hóa được xác thực trên Blockchain. Nó giúp ngăn chặn tuyệt đối việc làm giả vé và cho phép bạn sở hữu, chuyển nhượng vé một cách minh bạch và an toàn.' 
        },
        { 
            cat: 'account', 
            q: 'Tôi có cần ví tiền điện tử riêng để mua vé không?', 
            a: 'Không cần. BASTICKET tự động tạo và quản lý ví bảo mật cho bạn thông qua tài khoản Email. Bạn có thể mua vé bằng tiền VND thông thường qua VNPAY.' 
        },
        { 
            cat: 'ticket', 
            q: 'Tôi nhận vé ở đâu sau khi thanh toán?', 
            a: 'Sau khi thanh toán thành công, vé sẽ xuất hiện trong mục "Vé của tôi". Hệ thống cũng sẽ gửi một email xác nhận kèm thông tin vé cho bạn.' 
        },
        { 
            cat: 'ticket', 
            q: 'Làm thế nào để sử dụng vé tại sự kiện?', 
            a: 'Bạn chỉ cần mở trang "Vé của tôi", chọn vé và hiển thị mã QR động cho nhân viên kiểm soát. Lưu ý: Mã QR này thay đổi liên tục để bảo mật, vì vậy không nên sử dụng ảnh chụp màn hình.' 
        },
        { 
            cat: 'marketplace', 
            q: 'Tôi có thể bán lại vé với giá cao hơn không?', 
            a: 'Có, nhưng mức giá bán lại bị giới hạn bởi "Giá trần" do Nhà tổ chức quy định để bảo vệ người hâm mộ khỏi tình trạng vé chợ đen.' 
        },
        { 
            cat: 'payment', 
            q: 'Bao lâu thì tôi nhận được tiền hoàn?', 
            a: 'Tùy thuộc vào ngân hàng, tiền hoàn thường về tài khoản sau 3-5 ngày làm việc (ATM nội địa) hoặc 7-15 ngày (Thẻ quốc tế).' 
        }
    ];

    const [activeCat, setActiveCat] = useState('ticket');
    const [openIndex, setOpenIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFaqs = faqs.filter(f => 
        (activeCat === 'all' || f.cat === activeCat) && 
        (f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-20 pb-20 transition-colors duration-500">
            {/* Hero Search Section */}
            <div className="relative py-24 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-neon-green/5 blur-[120px] opacity-30" />
                <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10 w-full">
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        Trung tâm <span className="text-neon-green italic">Trợ giúp</span>
                    </h1>
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm câu hỏi của bạn..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-[2.5rem] py-6 pl-16 pr-8 text-sm md:text-base font-medium shadow-2xl focus:outline-none focus:border-neon-green transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 pt-8">
                {/* Column: Categories Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-4">Danh mục trợ giúp</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCat(cat.id)}
                                className={`flex items-center gap-4 p-5 rounded-3xl text-left transition-all duration-300 border ${
                                    activeCat === cat.id 
                                    ? 'bg-neon-green border-neon-green shadow-xl shadow-neon-green/20 scale-[1.02]' 
                                    : 'bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/5 hover:border-neon-green/30 text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <cat.icon className={`w-5 h-5 ${activeCat === cat.id ? 'text-black' : 'text-neon-green'}`} />
                                <span className={`text-[13px] font-black uppercase tracking-tight ${activeCat === cat.id ? 'text-black' : 'dark:text-white'}`}>
                                    {cat.title}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Support Card */}
                    <div className="mt-8 p-8 bg-dark-card border border-white/5 rounded-[2.5rem] space-y-6 overflow-hidden relative">
                        <HelpCircle className="absolute -right-4 -top-4 w-24 h-24 text-neon-green opacity-5 rotate-12" />
                        <h4 className="text-lg font-black text-white uppercase tracking-tighter relative z-10">Vẫn còn thắc mắc?</h4>
                        <p className="text-xs font-bold text-gray-500 leading-relaxed relative z-10">Đội ngũ hỗ trợ của BASTICKET luôn sẵn sàng giải đáp mọi vấn đề của bạn 24/7.</p>
                        <a href="mailto:support@basticket.com" className="block w-full py-4 bg-white/5 hover:bg-neon-green hover:text-black border border-white/10 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all relative z-10 outline-none border-none">Gửi yêu cầu hỗ trợ</a>
                    </div>
                </div>

                {/* Column: FAQ Accordion */}
                <div className="lg:col-span-8 space-y-4">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, index) => (
                            <div 
                                key={index} 
                                className={`group overflow-hidden rounded-[2rem] border transition-all duration-500 ${
                                    openIndex === index 
                                    ? 'bg-white dark:bg-white/[0.03] border-neon-green/40 shadow-2xl' 
                                    : 'bg-white/50 dark:bg-white/[0.01] border-gray-100 dark:border-white/5 hover:border-neon-green/20'
                                }`}
                            >
                                <button 
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                    className="w-full p-8 flex items-center justify-between text-left"
                                >
                                    <span className={`text-sm md:text-base font-black uppercase tracking-tight pr-8 transition-colors ${openIndex === index ? 'text-neon-green' : 'text-gray-900 dark:text-white'}`}>
                                        {faq.q}
                                    </span>
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${openIndex === index ? 'bg-neon-green text-black rotate-180' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </button>
                                
                                {openIndex === index && (
                                    <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                                        <div className="h-px bg-gray-100 dark:bg-white/5 mb-8" />
                                        <p className="text-sm md:text-[15px] font-medium text-gray-600 dark:text-gray-400 leading-[1.8]">
                                            {faq.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-6 bg-white dark:bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10 opacity-60">
                            <Search className="w-16 h-16 text-gray-500 mx-auto" />
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Rất tiếc, không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
