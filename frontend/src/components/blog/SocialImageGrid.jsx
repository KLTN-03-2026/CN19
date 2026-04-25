import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

const SocialImageGrid = ({ images = [], variant = 'grid' }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  if (!images || images.length === 0) return null;

  const count = images.length;

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return url.includes('/video/') || url.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  const MediaItem = ({ url, onClick, className = "" }) => {
    const isVideo = isVideoUrl(url);
    return (
      <div 
        className={`relative group cursor-zoom-in overflow-hidden ${className}`}
        onClick={onClick}
      >
        {isVideo ? (
          <div className="w-full h-full relative bg-black">
            <video src={url} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
            </div>
          </div>
        ) : (
          <img 
            src={url} 
            className="w-full h-full object-cover hover:brightness-90 transition-all" 
            alt="" 
          />
        )}
      </div>
    );
  };

  const renderGrid = () => {
    switch (count) {
      case 1:
        return (
          <div className="w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
            <MediaItem 
               url={images[0]} 
               onClick={() => handleImageClick(0)} 
               className="w-full max-h-[500px]"
            />
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[300px]">
            {images.slice(0, 2).map((img, i) => (
              <MediaItem key={i} url={img} onClick={() => handleImageClick(i)} className="w-full h-full" />
            ))}
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[400px]">
             <MediaItem url={images[0]} onClick={() => handleImageClick(0)} className="w-full h-full" />
             <div className="grid grid-rows-2 gap-[2px]">
                <MediaItem url={images[1]} onClick={() => handleImageClick(1)} className="w-full h-full" />
                <MediaItem url={images[2]} onClick={() => handleImageClick(2)} className="w-full h-full" />
             </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[400px]">
            {images.slice(0, 4).map((img, i) => (
              <MediaItem key={i} url={img} onClick={() => handleImageClick(i)} className="w-full h-full" />
            ))}
          </div>
        );

      default: // 5 or more
        return (
            <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[400px]">
               <MediaItem url={images[0]} onClick={() => handleImageClick(0)} className="w-full h-full" />
               <div className="grid grid-cols-2 grid-rows-2 gap-[2px]">
                  <MediaItem url={images[1]} onClick={() => handleImageClick(1)} className="w-full h-full" />
                  <MediaItem url={images[2]} onClick={() => handleImageClick(2)} className="w-full h-full" />
                  <MediaItem url={images[3]} onClick={() => handleImageClick(3)} className="w-full h-full" />
                  <div 
                    className="relative h-full w-full cursor-zoom-in group"
                    onClick={() => handleImageClick(4)}
                  >
                     {isVideoUrl(images[4]) ? (
                        <div className="w-full h-full relative bg-black">
                            <video src={images[4]} className="w-full h-full object-cover brightness-[0.4]" />
                        </div>
                     ) : (
                        <img 
                            src={images[4]} 
                            className="w-full h-full object-cover brightness-[0.4] hover:brightness-50 transition-all" 
                            alt="" 
                        />
                     )}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-2xl font-black">+{count - 4}</span>
                     </div>
                  </div>
               </div>
            </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {renderGrid()}

      {selectedImageIndex !== null && (
        <ImagePreviewModal
          images={images}
          currentIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
          onNavigate={(index) => setSelectedImageIndex(index)}
        />
      )}
    </motion.div>
  );
};

export default SocialImageGrid;
