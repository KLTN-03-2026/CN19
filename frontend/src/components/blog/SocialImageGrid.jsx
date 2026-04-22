import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ImagePreviewModal from './ImagePreviewModal';

const SocialImageGrid = ({ images = [], variant = 'grid' }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  if (!images || images.length === 0) return null;

  const count = images.length;

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const renderGrid = () => {
    switch (count) {
      case 1:
        return (
          <div 
            className="w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5"
            onClick={() => handleImageClick(0)}
          >
            <img 
              src={images[0]} 
              alt="Post content" 
              className="w-full max-h-[500px] object-cover hover:scale-[1.02] transition-transform duration-700 cursor-zoom-in" 
            />
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[300px]">
            {images.map((img, i) => (
              <img 
                key={i} 
                src={img} 
                onClick={() => handleImageClick(i)}
                className="w-full h-full object-cover hover:brightness-90 transition-all cursor-zoom-in" 
                alt="" 
              />
            ))}
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[400px]">
             <img 
                src={images[0]} 
                onClick={() => handleImageClick(0)}
                className="w-full h-full object-cover border-r border-gray-100 dark:border-white/5 hover:brightness-90 transition-all cursor-zoom-in" 
                alt="" 
             />
             <div className="grid grid-rows-2 gap-[2px]">
                <img 
                    src={images[1]} 
                    onClick={() => handleImageClick(1)}
                    className="w-full h-full object-cover hover:brightness-90 transition-all cursor-zoom-in" 
                    alt="" 
                />
                <img 
                    src={images[2]} 
                    onClick={() => handleImageClick(2)}
                    className="w-full h-full object-cover hover:brightness-90 transition-all cursor-zoom-in" 
                    alt="" 
                />
             </div>
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[400px]">
            {images.map((img, i) => (
              <img 
                key={i} 
                src={img} 
                onClick={() => handleImageClick(i)}
                className="w-full h-full object-cover hover:brightness-90 transition-all cursor-zoom-in" 
                alt="" 
              />
            ))}
          </div>
        );

      default: // 5 or more
        return (
            <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 h-[400px]">
               <img 
                    src={images[0]} 
                    onClick={() => handleImageClick(0)}
                    className="w-full h-full object-cover border-r border-gray-100 dark:border-white/5 hover:brightness-90 transition-all cursor-zoom-in" 
                    alt="" 
               />
               <div className="grid grid-cols-2 grid-rows-2 gap-[2px]">
                  <img 
                    src={images[1]} 
                    onClick={() => handleImageClick(1)}
                    className="w-full h-full object-cover hover:brightness-90 transition-all cursor-zoom-in" 
                    alt="" 
                  />
                  <img 
                    src={images[2]} 
                    onClick={() => handleImageClick(2)}
                    className="w-full h-full object-cover hover:brightness-90 transition-all cursor-zoom-in" 
                    alt="" 
                  />
                  <img 
                    src={images[3]} 
                    onClick={() => handleImageClick(3)}
                    className="w-full h-full object-cover hover:brightness-90 transition-all cursor-zoom-in" 
                    alt="" 
                  />
                  <div 
                    className="relative h-full w-full cursor-zoom-in"
                    onClick={() => handleImageClick(4)}
                  >
                     <img 
                        src={images[4]} 
                        className="w-full h-full object-cover brightness-[0.4] hover:brightness-50 transition-all" 
                        alt="" 
                     />
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
