import React, { useState, useRef, useEffect } from 'react';
import { 
    MessageSquare, 
    X, 
    Send, 
    Bot, 
    Sparkles, 
    Loader2, 
    TrendingUp, 
    PenTool, 
    BarChart2,
    Minimize2
} from 'lucide-react';
import { aiService } from '../../services/ai.service';
import { organizerService } from '../../services/organizer.service';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const AIAssistant = () => {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { 
            role: 'assistant', 
            content: `Xin chào **${user?.full_name || 'BTC'}**! Tôi là trợ lý AI của BASTICKET. Tôi có thể giúp gì cho bạn hôm nay?` 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [realStats, setRealStats] = useState(null);
    const messagesEndRef = useRef(null);

    // Lấy dữ liệu thật từ Backend khi mở chat
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await organizerService.getDashboardStats();
                if (response.data) {
                    setRealStats(response.data);
                }
            } catch (error) {
                console.error('Lỗi khi lấy stats cho AI:', error);
            }
        };
        if (isOpen && !realStats) {
            fetchStats();
        }
    }, [isOpen, realStats]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Chuẩn bị context với dữ liệu THẬT từ Database
            const context = {
                org_name: user?.full_name || 'Ban tổ chức',
                total_events: realStats?.total_events || 0,
                total_revenue: realStats?.total_revenue?.toLocaleString('vi-VN') || '0',
                total_tickets: realStats?.total_tickets_sold || 0,
                fill_rate: `${realStats?.fill_rate || 0}%`,
                royalty_revenue: realStats?.total_royalty_revenue?.toLocaleString('vi-VN') || '0',
                upcoming_count: realStats?.upcoming_events_count || 0,

                // Sự kiện
                recent_events: realStats?.my_events?.map(e => `- ${e.name} (Bán: ${e.sold}/${e.total} vé, Trạng thái: ${e.status})`).join('\n') || 'Chưa có',

                // Phân bổ doanh thu theo sự kiện
                revenue_dist: realStats?.event_revenue_distribution?.map(d => `- ${d.name}: ${d.value?.toLocaleString('vi-VN')} VNĐ`).join('\n') || 'Chưa có',

                // Sản phẩm
                top_merch: realStats?.top_merchandise?.map(m => `- ${m.name} (Bán: ${m.sold_quantity}, Doanh thu: ${m.revenue?.toLocaleString('vi-VN')} VNĐ)`).join('\n') || 'Chưa có',

                // Doanh thu theo ngày
                daily_revenue: realStats?.revenue_chart?.map(item => `- Ngày ${item.date}: ${item.revenue.toLocaleString('vi-VN')} VNĐ`).join('\n') || 'Chưa có',

                // Thông báo gần đây
                recent_logs: realStats?.notifications?.map(n => `- ${n.label} (${new Date(n.time).toLocaleString('vi-VN')})`).join('\n') || 'Không có thông báo mới',

                // Blog
                total_blogs: realStats?.total_blogs || 0,
                published_blogs: realStats?.published_blogs || 0,
                recent_blogs: realStats?.recent_blogs?.map(b => `- "${b.title}" (Trạng thái: ${b.status}, Ngày tạo: ${new Date(b.created_at).toLocaleDateString('vi-VN')})`).join('\n') || 'Chưa có bài viết nào',

                // Người tham gia
                total_participants: realStats?.total_participants || 0,
                event_participants: realStats?.event_participants?.map(p => `- ${p.event_name}: ${p.participant_count} người tham gia`).join('\n') || 'Chưa có dữ liệu'
            };

            const res = await aiService.chat(text, context);
            
            if (res.status === 'success') {
                setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
            } else {
                throw new Error(res.message);
            }
        } catch (error) {
            toast.error("Trợ lý AI đang bận một chút...");
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Xin lỗi, tôi gặp một chút trục trặc khi kết nối. Bạn vui lòng thử lại sau nhé!" 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickActions = [
        { icon: <PenTool className="w-3.5 h-3.5" />, text: "Viết mô tả sự kiện mới", prompt: "Hãy giúp tôi viết một mô tả sự kiện ca nhạc sôi động cho giới trẻ." },
        { icon: <TrendingUp className="w-3.5 h-3.5" />, text: "Tư vấn bán vé", prompt: "Làm thế nào để tăng doanh số bán vé trong tuần cuối trước khi sự kiện diễn ra?" },
        { icon: <BarChart2 className="w-3.5 h-3.5" />, text: "Phân tích xu hướng", prompt: "Các loại sự kiện nào đang hot nhất trong tháng này?" }
    ];

    return (
        <div className="z-[9999] font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-0 right-0 md:right-16 w-[320px] md:w-[360px] max-h-[600px] h-[70vh] bg-white dark:bg-[#1a1a1e] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-xs">AI Assistant</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] font-bold text-white/70 uppercase">Đang trực tuyến</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0 border border-blue-600/20">
                                            <Sparkles className="w-4 h-4 text-blue-600" />
                                        </div>
                                    )}
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-white/5'
                                    }`}>
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                    </div>
                                    <div className="bg-gray-100 dark:bg-white/5 p-4 rounded-2xl rounded-tl-none border border-gray-200 dark:border-white/5">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions Area */}
                    {!isLoading && messages.length === 1 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {quickActions.map((action, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleSend(action.prompt)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                >
                                    {action.icon}
                                    {action.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 pt-1">
                        <div className="relative flex items-center">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Nhập câu hỏi của bạn..."
                                className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl py-3 pl-4 pr-12 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none dark:text-white"
                            />
                            <button 
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 p-2 bg-blue-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-24 right-6 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 bg-blue-600 text-white shadow-blue-600/40"
                >
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            )}
        </div>
    );
};

export default AIAssistant;
