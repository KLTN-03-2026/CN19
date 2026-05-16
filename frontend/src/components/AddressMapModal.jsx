import React, { useState, useEffect } from 'react';
import { X, MapPin, Search, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import provinces2025 from '../assets/data/provinces_2025.json';
import wards2025 from '../assets/data/wards_2025.json';

// Fix issue vắng bóng Icon mặc định của Leaflet trong Vite/React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component con xử lý bắt sự kiện Click ghim Marker
function LocationMarker({ position, setPosition }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  useEffect(() => {
    if (position && position.lat && position.lng) {
      map.flyTo(position, map.getZoom() > 14 ? map.getZoom() : 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const AddressMapModal = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation();

  // --- States Dropdown Tỉnh Thành ---
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  // --- States Lựa chọn ---
  const [selectedProv, setSelectedProv] = useState(null);
  const [wardSearch, setWardSearch] = useState('');
  const [filteredWards, setFilteredWards] = useState([]);
  const [showWardList, setShowWardList] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [selectedWard, setSelectedWard] = useState(null);
  const [detailAdd, setDetailAdd] = useState('');

  // State nhận diện cắm cờ
  const [position, setPosition] = useState({ lat: 10.7798, lng: 106.6999 });

  // 1. Fetch Provinces lần đầu
  useEffect(() => {
    if (isOpen) {
      setProvinces(provinces2025);
    }
  }, [isOpen]);

  // 2. Fetch Districts khi Province đổi
  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    const prov = provinces.find(p => p.code == provCode);
    setSelectedProv(prov);
    setWardSearch('');
    setSelectedWard(null);
    setWards([]);
    setFilteredWards([]);

    if (provCode) {
      setIsLoadingWards(true);
      
      // Fetch toàn bộ danh sách từ API để đảm bảo số lượng (đầy đủ)
      fetch(`https://provinces.open-api.vn/api/p/${provCode}?depth=3`)
        .then(res => res.json())
        .then(data => {
            if (data && data.districts) {
               let allWards = data.districts.flatMap(d => d.wards || []);
               
               // Gộp thêm dữ liệu 2025 nếu có (để bổ sung xã sáp nhập mới như Quỳnh Phú)
               if (wards2025[provCode]) {
                 const localWards = wards2025[provCode].map(w => ({ ...w, isApiResult: true }));
                 localWards.forEach(lw => {
                   if (!allWards.find(aw => aw.name === lw.name)) {
                     allWards.unshift(lw); // Đưa xã mới lên đầu list
                   }
                 });
               }

               allWards.sort((a, b) => a.name.localeCompare(b.name));
               setWards(allWards);
               setFilteredWards(allWards);
            }
        })
        .finally(() => setIsLoadingWards(false));
        
      geocodeAndFly(`${prov.name}, Việt Nam`);
    }
  };

  const handleWardSearchChange = (e) => {
    const val = e.target.value;
    setWardSearch(val);
    setShowWardList(true);

    if (val.trim() === '') {
      setFilteredWards(wards);
      return;
    }

    // 1. Lọc local nhanh
    const localMatches = wards.filter(w => 
      w.name.toLowerCase().includes(val.toLowerCase())
    );
    setFilteredWards(localMatches);

    // 2. Tự động truy vấn API Bản đồ toàn cầu để lấy các xã mới sáp nhập 2025
    if (selectedProv && val.length > 1) {
      setIsLoadingWards(true);
      const delayFn = setTimeout(async () => {
        try {
          const query = `${val}, ${selectedProv.name}, Việt Nam`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8`);
          const data = await res.json();
          if (data && data.length > 0) {
            const apiMatches = data.map(item => ({
              name: item.address.suburb || item.address.village || item.address.town || item.address.quarter || item.display_name.split(',')[0],
              code: 'api-' + item.place_id,
              lat: item.lat,
              lng: item.lon,
              isApiResult: true,
              full_name: item.display_name
            }));
            
            setFilteredWards(prev => {
               // Ưu tiên kết quả từ API Map (vì nó cập nhật 2025) lên đầu
               const combined = [...apiMatches];
               prev.forEach(p => {
                 if (!combined.find(c => c.name.toLowerCase() === p.name.toLowerCase())) {
                   combined.push(p);
                 }
               });
               return combined;
            });
          }
        } catch (err) {
          console.error("Map Search Error:", err);
        } finally {
          setIsLoadingWards(false);
        }
      }, 700);
      return () => clearTimeout(delayFn);
    }
  };

  const handleSelectWard = (ward) => {
    setSelectedWard(ward);
    setWardSearch(ward.name);
    setShowWardList(false);
    
    if (ward.isApiResult) {
      setPosition({ lat: parseFloat(ward.lat), lng: parseFloat(ward.lng) });
    } else {
      geocodeAndFly(`${ward.name}, ${selectedProv?.name}, Việt Nam`);
    }
  };

  // 4. Debounce: Tự động Search số nhà
  useEffect(() => {
    if (detailAdd && detailAdd.trim().length > 2 && selectedWard) {
      const delayFn = setTimeout(() => {
        geocodeAndFly(`${detailAdd}, ${selectedWard.name}, ${selectedProv?.name}, Việt Nam`);
      }, 1500);
      return () => clearTimeout(delayFn);
    }
  }, [detailAdd, selectedWard, selectedProv]);

  // Hàm chuyển text Address -> Tọa độ OSN Nominatim (Free)
  const geocodeAndFly = async (queryAddress) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddress)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPosition({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = () => {
    if (!selectedProv || !selectedWard || !detailAdd.trim()) {
        toast.error(t('map.err_incomplete'));
        return;
    }
    const fullString = `${detailAdd}, ${selectedWard.name}, ${selectedProv.name}`;
    onConfirm({
        text: fullString,
        lat: position.lat,
        lng: position.lng
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative min-h-[500px]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-[1001]">
          <X className="w-6 h-6 text-gray-500" />
        </button>

        {/* Nửa Trái: Form nhập liệu */}
        <div className="w-full md:w-[40%] p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <MapPin className="text-neon-green" /> {t('map.title')}
            </h2>
            <p className="text-gray-500 text-sm mb-8">{t('map.subtitle')}</p>
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('map.province_label')}</label>
              <select onChange={handleProvinceChange} className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-neon-green outline-none">
                <option value="">{t('map.province_placeholder')}</option>
                {provinces.map(p => <option key={p.code} value={p.code} className="text-black">{p.name}</option>)}
              </select>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">Phường / Xã / Thị trấn (Cấp cơ sở)</label>
              <div className="relative">
                <div className="relative">
                  <input 
                    type="text"
                    value={wardSearch}
                    onChange={handleWardSearchChange}
                    onFocus={() => setShowWardList(true)}
                    disabled={!selectedProv || isLoadingWards}
                    placeholder={isLoadingWards ? "Đang tải danh sách..." : "Chọn hoặc tìm kiếm..."}
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-neon-green outline-none disabled:opacity-50 placeholder-gray-400"
                  />
                  {isLoadingWards && (
                    <div className="absolute right-3 top-3.5">
                      <div className="w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Dropdown List & Search */}
                <AnimatePresence>
                  {showWardList && filteredWards.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-[290]" onClick={() => setShowWardList(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-[300] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-[250px] overflow-y-auto"
                      >
                        {filteredWards.length > 0 ? filteredWards.map((w, idx) => (
                          <button
                            key={w.code || idx}
                            onClick={() => handleSelectWard(w)}
                            className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 transition-colors flex items-center justify-between ${w.isApiResult ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex flex-col">
                              <span className={w.isApiResult ? 'font-bold text-blue-700' : 'font-medium text-gray-700'}>
                                {w.name}
                              </span>
                              {w.isApiResult && (
                                <span className="text-[9px] text-gray-400 truncate max-w-[200px]">{w.full_name}</span>
                              )}
                            </div>
                            {w.isApiResult && (
                              <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Chuẩn 2025</span>
                            )}
                          </button>
                        )) : (
                          <div className="p-8 text-center text-gray-400 text-sm italic">
                            Không tìm thấy dữ liệu. Thử gõ tên khác...
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('map.detail_label')}</label>
              <textarea 
                value={detailAdd} onChange={e => setDetailAdd(e.target.value)} 
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-neon-green outline-none resize-none placeholder-gray-500"
                rows="3" placeholder={t('map.detail_placeholder')}
              ></textarea>
              <p className="text-[10px] text-gray-400 mt-1 italic">{t('map.debounce_hint')}</p>
            </div>
          </div>

          <button onClick={handleSubmit} className="w-full py-4 mt-6 bg-neon-green hover:bg-neon-hover text-black font-bold text-lg rounded-xl shadow-[0_0_15px_rgba(82,196,45,0.4)] transition-all">
            {t('map.confirm_btn')}
          </button>
        </div>

        {/* Nửa Phải: Bản đồ (Map) */}
        <div className="w-full md:w-[60%] h-[300px] md:h-auto relative bg-gray-200">
          <MapContainer 
            center={[position.lat, position.lng]} 
            zoom={13} 
            className="w-full h-full z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default AddressMapModal;
