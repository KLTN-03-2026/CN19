import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle2, User as UserIcon } from 'lucide-react';

const WebcamCapture = ({ onCapture }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setImgSrc(null);
    onCapture(null);
  };

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "user"
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-md mx-auto">
      <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden border-4 border-dashed border-white/10 bg-black shadow-2xl flex items-center justify-center group">
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={() => setIsCameraReady(true)}
              className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-neon-green/30 rounded-full flex items-center justify-center">
                 <div className="w-[80%] h-[85%] border border-neon-green/20 rounded-full"></div>
              </div>
            </div>
            
            {!isCameraReady && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/80 animate-pulse">
                  <div className="text-center">
                     <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                     <p className="text-xs font-black text-gray-500 uppercase tracking-widest leading-relaxed">Đang khởi tạo<br/>Máy ảnh...</p>
                  </div>
               </div>
            )}
          </>
        ) : (
          <div className="w-full h-full relative animate-in zoom-in duration-500">
            <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-neon-green/10 flex items-center justify-center border-4 border-neon-green/50 rounded-[3rem]">
               <CheckCircle2 className="w-20 h-20 text-neon-green drop-shadow-lg" />
            </div>
          </div>
        )}
      </div>

      <div className="w-full flex gap-4">
        {!imgSrc ? (
          <button
            onClick={capture}
            disabled={!isCameraReady}
            className="flex-1 bg-neon-green hover:bg-neon-hover disabled:bg-gray-800 disabled:text-gray-600 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-neon-green/10"
          >
            <Camera className="w-5 h-5" />
            Chụp khuôn mặt
          </button>
        ) : (
          <button
            onClick={retake}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Chụp lại ảnh mới
          </button>
        )}
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black text-gray-500 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
           <UserIcon className="w-3 h-3 text-neon-green" /> Mẹo chụp ảnh
        </p>
        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
           Hãy đảm bảo gương mặt của bạn <b>nằm trong khung hình oval</b>,<br/>không đeo kính râm hoặc khẩu trang.
        </p>
      </div>
    </div>
  );
};

export default WebcamCapture;
