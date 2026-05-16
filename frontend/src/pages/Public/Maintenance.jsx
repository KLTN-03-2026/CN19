import React from 'react';
import { Settings, Hammer, Clock, Globe } from 'lucide-react';

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 font-['Outfit'] overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-green/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
            
            <div className="max-w-2xl w-full text-center space-y-12 relative z-10">
                {/* Animated Icon Group */}
                <div className="relative inline-block">
                    <div className="p-8 bg-zinc-900/50 border-2 border-white/5 rounded-[2.5rem] backdrop-blur-xl shadow-2xl relative z-10 animate-bounce duration-[2000ms]">
                        <Settings className="w-20 h-20 text-neon-green animate-spin-slow" style={{ animationDuration: '8s' }} />
                    </div>
                    <div className="absolute -top-4 -right-4 p-4 bg-neon-green text-black rounded-2xl shadow-xl shadow-neon-green/20 animate-pulse">
                        <Hammer className="w-6 h-6" />
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
                        Đang <span className="text-neon-green">Bảo Trì</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                        Hệ thống đang được nâng cấp để mang lại trải nghiệm tốt nhất cho bạn. Chúng tôi sẽ sớm quay trở lại.
                    </p>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm group hover:border-neon-green/30 transition-all duration-500">
                        <Clock className="w-6 h-6 text-neon-green mb-3 mx-auto group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-sm">Dự kiến</h3>
                        <p className="text-gray-500 text-xs mt-1">15 - 30 phút</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm group hover:border-neon-green/30 transition-all duration-500">
                        <Settings className="w-6 h-6 text-neon-green mb-3 mx-auto group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-sm">Nâng cấp</h3>
                        <p className="text-gray-500 text-xs mt-1">Hệ thống Core</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm group hover:border-neon-green/30 transition-all duration-500">
                        <Globe className="w-6 h-6 text-neon-green mb-3 mx-auto group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold text-sm">Khu vực</h3>
                        <p className="text-gray-500 text-xs mt-1">Toàn quốc</p>
                    </div>
                </div>

                <div className="pt-10">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-white/10 rounded-full text-xs font-bold text-gray-400">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        Vui lòng không tắt trình duyệt
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow linear infinite;
                }
            `}</style>
        </div>
    );
};

export default Maintenance;
