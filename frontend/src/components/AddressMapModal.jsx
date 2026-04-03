import React, { useState, useEffect } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  // --- States Lựa chọn ---
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedDist, setSelectedDist] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [detailAdd, setDetailAdd] = useState('');

  // State nhận diện cắm cờ
  const [position, setPosition] = useState({ lat: 10.7798, lng: 106.6999 });

  // 1. Fetch Provinces lần đầu
  useEffect(() => {
    if (isOpen) {
      fetch('https://provinces.open-api.vn/api/p/')
        .then(res => res.json())
        .then(data => {
            if (data) setProvinces(data);
        })
        .catch(err => console.error("Province Error:", err));
    }
  }, [isOpen]);

  // 2. Fetch Districts khi Province đổi
  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    const prov = provinces.find(p => p.code == provCode);
    setSelectedProv(prov);
    setSelectedDist(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    if (provCode) {
      fetch(`https://provinces.open-api.vn/api/p/${provCode}?depth=2`)
        .then(res => res.json())
        .then(data => {
            if (data && data.districts) setDistricts(data.districts);
        });
        
      geocodeAndFly(`${prov.name}, Việt Nam`);
    }
  };

  // 3. Fetch Wards khi District đổi
  const handleDistrictChange = (e) => {
    const distCode = e.target.value;
    const dist = districts.find(d => d.code == distCode);
    setSelectedDist(dist);
    setSelectedWard(null);
    setWards([]);

    if (distCode) {
      fetch(`https://provinces.open-api.vn/api/d/${distCode}?depth=2`)
        .then(res => res.json())
        .then(data => {
            if (data && data.wards) setWards(data.wards);
        });

      geocodeAndFly(`${dist.name}, ${selectedProv?.name}, Việt Nam`);
    }
  };

  const handleWardChange = (e) => {
    const wardCode = e.target.value;
    const ward = wards.find(w => w.code == wardCode);
    setSelectedWard(ward);
    if(ward) {
        geocodeAndFly(`${ward.name}, ${selectedDist?.name}, ${selectedProv?.name}, Việt Nam`);
    }
  };

  // 4. Debounce: Tự động Search số nhà sau khi user ngưng gõ 1.5s
  useEffect(() => {
    if (detailAdd && detailAdd.trim().length > 2 && selectedWard) {
      const delayFn = setTimeout(() => {
        geocodeAndFly(`${detailAdd}, ${selectedWard.full_name}, ${selectedDist?.full_name}, ${selectedProv?.name}, Việt Nam`);
      }, 1500);
      return () => clearTimeout(delayFn);
    }
  }, [detailAdd, selectedWard, selectedDist, selectedProv]);

  // Hàm chuyển text Address -> Tọa độ OSN Nominatim (Free)
  const geocodeAndFly = async (queryAddress) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddress)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setPosition({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSubmit = () => {
    if (!selectedProv || !selectedDist || !selectedWard || !detailAdd.trim()) {
        toast.error(t('map.err_incomplete'));
        return;
    }
    const fullString = `${detailAdd}, ${selectedWard.name}, ${selectedDist.name}, ${selectedProv.name}`;
    onConfirm({
        text: fullString,
        lat: position.lat,
        lng: position.lng
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pt-24 p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Cửa sổ Popup */}
      <div className="relative bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        
        {/* Nút Đóng */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Nửa Trái: Form Điền */}
        <div className="w-full md:w-[40%] p-6 md:p-8 border-r border-gray-100 dark:border-dark-border flex flex-col bg-gray-50 dark:bg-[#111]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <MapPin className="text-neon-green" /> {t('map.setup_location')}
          </h2>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('map.province_label')}</label>
              <select onChange={handleProvinceChange} className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-neon-green outline-none">
                <option value="">{t('map.province_placeholder')}</option>
                {provinces.map(p => <option key={p.code} value={p.code} className="text-black">{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('map.district_label')}</label>
              <select onChange={handleDistrictChange} disabled={!selectedProv} className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-neon-green outline-none disabled:opacity-50">
                <option value="">{t('map.district_placeholder')}</option>
                {districts.map(d => <option key={d.code} value={d.code} className="text-black">{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">{t('map.ward_label')}</label>
              <select onChange={handleWardChange} disabled={!selectedDist} className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-neon-green outline-none disabled:opacity-50">
                <option value="">{t('map.ward_placeholder')}</option>
                {wards.map(w => <option key={w.code} value={w.code} className="text-black">{w.name}</option>)}
              </select>
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
            zoom={15} 
            scrollWheelZoom={true} 
            className="w-full h-[400px] md:h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
          
          <div className="absolute top-4 left-4 z-[400] bg-white dark:bg-dark-card px-4 py-2 rounded-lg shadow-lg text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 border border-gray-200 dark:border-dark-border">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
            {t('map.map_instruction')}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddressMapModal;
