import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { X, ShieldCheck, ChevronRight } from 'lucide-react';
import axios from 'axios';

const COMPLEX_IMAGES = [
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514525253361-bee8d487900b?q=80&w=800&auto=format&fit=crop",
];

const PuzzleCaptcha = ({ isOpen, onClose, onSuccess, imageUrl }) => {
  const [captchaData, setCaptchaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const [currentImage, setCurrentImage] = useState("");
  
  const x = useMotionValue(0);
  const containerRef = useRef(null);
  
  // Kích thước chuẩn của puzzle
  const STAGE_W = 350;
  const STAGE_H = 200;
  const PIECE_SIZE = 80;

  const fetchCaptcha = async () => {
    setIsLoading(true);
    setStatus('idle');
    x.set(0);
    try {
      const randomImg = COMPLEX_IMAGES[Math.floor(Math.random() * COMPLEX_IMAGES.length)];
      setCurrentImage(imageUrl || randomImg);

      const res = await axios.get('http://localhost:5000/api/utils/captcha/generate');
      // Chúng ta sẽ chuẩn hóa dữ liệu tọa độ từ backend để khớp với STAGE
      setCaptchaData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch captcha', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCaptcha();
  }, [isOpen]);

  const handleDragEnd = () => {
    const userX = x.get();
    const targetX = captchaData?.x || 0;
    if (Math.abs(userX - targetX) <= 10) {
      setStatus('success');
      setTimeout(() => {
        onSuccess({ x: Math.round(userX), captchaSession: captchaData.captchaSession });
      }, 500);
    } else {
      setStatus('error');
      setTimeout(fetchCaptcha, 800);
    }
  };

  const sliderWidth = useTransform(x, [0, STAGE_W - 60], ['0%', '100%']);
  const handleColor = useTransform(x, [0, 50, STAGE_W - 60], 
    status === 'error' ? ['#ef4444', '#ef4444', '#ef4444'] : ['#ef4444', '#f97316', '#22c55e']
  );

  if (!isOpen) return null;

  // Đường dẫn vẽ hình răng cưa cho mảnh ghép
  const jigsawPath = "M 0,16 L 14,16 C 14,4 30,4 30,16 L 44,16 L 44,32 C 56,32 56,48 44,48 L 44,64 L 30,64 C 30,76 14,76 14,64 L 0,64 L 0,48 C 12,48 12,32 0,32 Z";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={status === 'error' ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1, scale: 1 }}
        className="relative w-full max-w-[400px] bg-black rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'success' ? 'bg-green-500' : 'bg-neon-green/10'}`}>
                <ShieldCheck className="w-5 h-5 text-white" />
             </div>
             <span className="text-xs font-black uppercase tracking-widest text-white/70">Xác minh bảo mật</span>
          </div>
          <button onClick={onClose} className="p-2 text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Visual Stage */}
          <div 
            ref={containerRef}
            style={{ width: STAGE_W, height: STAGE_H }}
            className="relative mx-auto bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl border border-white/5"
          >
            {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-neon-green rounded-full animate-spin" /></div>
            ) : (
                <>
                    {/* Background Image */}
                    <img src={currentImage} className="w-full h-full object-cover opacity-60" alt="bg" />

                    {/* The Dark Slot/Hole */}
                    <svg className="absolute z-10" style={{ left: captchaData?.x, top: captchaData?.y }} width="60" height="80">
                        <path d={jigsawPath} fill="black" fillOpacity="0.8" />
                        <path d={jigsawPath} fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
                    </svg>

                    {/* Source Hole (Lỗ hổng gốc nơi mảnh ghép bắt đầu) */}
                    <svg className="absolute z-10" style={{ left: 0, top: captchaData?.y }} width="60" height="80">
                         <path d={jigsawPath} fill="black" fillOpacity="0.4" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
                    </svg>

                    {/* THE PUZZLE PIECE (Mảnh ghép) */}
                    <motion.div
                       style={{ x, top: (captchaData?.y || 0), left: 0 }}
                       className="absolute z-20 pointer-events-none"
                    >
                        <svg width="60" height="80" viewBox="0 0 60 80" className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
                            <defs>
                                <clipPath id="puzzle-clip-path">
                                    <path d={jigsawPath} />
                                </clipPath>
                            </defs>
                            <image 
                                href={currentImage} 
                                x={-(captchaData?.x || 0)} 
                                y={-(captchaData?.y || 0)} 
                                width={STAGE_W} 
                                height={STAGE_H} 
                                preserveAspectRatio="xMidYMid slice"
                                clipPath="url(#puzzle-clip-path)" 
                            />
                            {/* Neon Glow & Border */}
                            <path d={jigsawPath} fill="none" stroke="#22ff00" strokeWidth="2.5" strokeOpacity="0.9" />
                            <path d={jigsawPath} fill="none" stroke="#22ff00" strokeWidth="1" className="animate-pulse" />
                        </svg>
                    </motion.div>
                </>
            )}
          </div>

          {/* Slider Control */}
          <div className="space-y-4">
              <div className="relative h-14 bg-white/5 rounded-2xl border border-white/10 p-1">
                  <motion.div style={{ width: sliderWidth, backgroundColor: handleColor }} className="absolute inset-0 opacity-10 rounded-2xl" />
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold uppercase text-white/20 tracking-[0.3em] pointer-events-none">
                     Trượt để khớp hình
                  </div>
                  <motion.div
                    style={{ x, backgroundColor: handleColor }}
                    drag="x"
                    dragConstraints={{ left: 0, right: STAGE_W - 60 }}
                    dragElastic={0}
                    onDragEnd={handleDragEnd}
                    className="absolute left-1 top-1 bottom-1 w-14 rounded-xl shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-30"
                  >
                     <ChevronRight className="w-6 h-6 text-white" />
                  </motion.div>
              </div>
              <p className="text-center text-[8px] text-white/20 font-black uppercase tracking-widest">Powered by BASTICKET Security</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PuzzleCaptcha;
