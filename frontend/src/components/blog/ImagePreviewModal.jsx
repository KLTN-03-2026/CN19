import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImagePreviewModal = ({ images, currentIndex, onClose, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      >
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent z-10">
          <div className="text-white text-sm font-bold bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="flex items-center gap-3">
             <a 
                href={images[currentIndex]} 
                download 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
                title="Tải ảnh về"
             >
                <Download className="w-5 h-5" />
             </a>
             <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition-all border border-white/10 group"
             >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </div>

        {/* Previous Button */}
        {images.length > 1 && currentIndex > 0 && (
          <button 
            onClick={handlePrev}
            className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10 border border-white/10 group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Main Image Container */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-5xl max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img 
            src={images[currentIndex]} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl selectable-none"
            alt={`Image ${currentIndex + 1}`}
          />
        </motion.div>

        {/* Next Button */}
        {images.length > 1 && currentIndex < images.length - 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all z-10 border border-white/10 group"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Thumbnail Strip (Optional, for premium field) */}
        {images.length > 1 && (
            <div className="absolute bottom-6 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(idx);
                        }}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            idx === currentIndex ? 'border-neon-green scale-110' : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                    >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                ))}
            </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ImagePreviewModal;
