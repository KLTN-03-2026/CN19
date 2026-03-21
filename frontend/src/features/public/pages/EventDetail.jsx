import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Info, ArrowLeft, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../store/authStore';

const MOCK_EVENT = {
  id: 1,
  title: 'Đại Nhạc Hội BORN PINK VNP',
  description: 'Trải nghiệm đỉnh cao cùng các cô gái vàng trong làng trình diễn toàn cầu. Sự kiện quy mô lớn nhất năm với âm thanh, ánh sáng chuẩn quốc tế.',
  date: '2026-05-12T19:00:00Z',
  location: 'Sân Vận Động Mỹ Đình, Hà Nội',
  organizer: 'YG Entertainment VN',
  image: 'https://images.unsplash.com/photo-1540039155732-d68a93e38706',
  tiers: [
    { id: 101, name: 'VIP Standing', price: 9800000, max: 2 },
    { id: 102, name: 'CAT 1 Seated', price: 5800000, max: 4 },
    { id: 103, name: 'CAT 2 Seated', price: 3800000, max: 4 },
    { id: 104, name: 'GA Standing', price: 1200000, max: 6 }
  ]
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [selectedTickets, setSelectedTickets] = useState({});

  const handleTicketChange = (tierId, change, max) => {
    setSelectedTickets(prev => {
      const current = prev[tierId] || 0;
      const next = current + change;
      if (next < 0) return prev;
      if (next > max) {
        toast.error(`Bạn chỉ được mua tối đa ${max} vé hạng này.`);
        return prev;
      }
      return { ...prev, [tierId]: next };
    });
  };

  const totalTickets = Object.values(selectedTickets).reduce((a, b) => a + b, 0);
  const totalPrice = MOCK_EVENT.tiers.reduce((total, tier) => {
    return total + (selectedTickets[tier.id] || 0) * tier.price;
  }, 0);

  const handleCheckout = () => {
    if (totalTickets === 0) {
      toast.error('Vui lòng chọn ít nhất 1 vé');
      return;
    }
    if (!isAuthenticated) {
      toast('Vui lòng đăng nhập để tiếp tục Đặt vé', { icon: '🔐' });
      navigate('/login');
      return;
    }
    
    // Redirect to checkout with state
    navigate('/checkout', { 
      state: { event: MOCK_EVENT, tickets: selectedTickets, total: totalPrice } 
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Về trang chủ
      </Link>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="lg:flex">
          {/* Cột trái: Hình ảnh & Info */}
          <div className="lg:w-7/12">
            <div className="h-64 sm:h-80 md:h-96 w-full relative">
              <img src={MOCK_EVENT.image} alt={MOCK_EVENT.title} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Đang mở bán</span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-3 truncate">{MOCK_EVENT.title}</h1>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-gray-100 pb-8">
                <div className="flex items-start">
                  <Calendar className="w-6 h-6 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Thời gian</p>
                    <p className="text-gray-600">{new Date(MOCK_EVENT.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-gray-500 text-sm">19:00 - 23:00</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-indigo-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Địa điểm</p>
                    <p className="text-gray-600">{MOCK_EVENT.location}</p>
                    <a href="#" className="text-indigo-600 text-sm hover:underline">Xem bản đồ</a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2" /> Giới thiệu sự kiện
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {MOCK_EVENT.description}
                </p>
              </div>
              
              <div className="mt-8 bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-xl font-bold text-indigo-600 mr-4">
                  YG
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ban tổ chức</p>
                  <p className="font-bold text-gray-900">{MOCK_EVENT.organizer}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Chọn vé (Ticket Form) */}
          <div className="lg:w-5/12 bg-gray-50 p-8 border-l border-gray-100 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Ticket className="w-6 h-6 mr-3 text-indigo-600" /> Chọn hạng vé
            </h3>
            
            <div className="space-y-4 flex-grow">
              {MOCK_EVENT.tiers.map(tier => (
                <div key={tier.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{tier.name}</h4>
                      <p className="text-indigo-600 font-semibold">{tier.price.toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-50 pt-4 mt-2">
                    <span className="text-sm text-gray-500">Mua tối đa {tier.max} vé</span>
                    <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1">
                      <button 
                        onClick={() => handleTicketChange(tier.id, -1, tier.max)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm hover:bg-gray-100"
                        disabled={!selectedTickets[tier.id]}
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-semibold text-gray-900">
                        {selectedTickets[tier.id] || 0}
                      </span>
                      <button 
                        onClick={() => handleTicketChange(tier.id, 1, tier.max)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 shadow-sm hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total & Checkout button */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-100 to-white rounded-bl-full -mr-4 -mt-4 z-0"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Số lượng vé:</span>
                  <span className="font-bold text-gray-900">{totalTickets}</span>
                </div>
                <div className="flex justify-between items-end mb-6">
                  <span className="text-gray-600">Tổng cộng:</span>
                  <span className="text-3xl font-extrabold text-indigo-600">{totalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={totalTickets === 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all ${
                    totalTickets > 0 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02]' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Mua Vé Ngay
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
