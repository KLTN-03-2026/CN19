import React, { useState } from 'react';
import { Search, Calendar, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Đại Nhạc Hội BORN PINK VNP',
    date: '2026-05-12T19:00:00Z',
    location: 'Sân Vận Động Mỹ Đình, Hà Nội',
    image: 'https://images.unsplash.com/photo-1540039155732-d68a93e38706',
    price: '1.200.000 VNĐ'
  },
  {
    id: 2,
    title: 'Hội thảo Blockchain Summit 2026',
    date: '2026-06-15T08:00:00Z',
    location: 'Gem Center, TP. Hồ Chí Minh',
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7',
    price: '200.000 VNĐ'
  },
  {
    id: 3,
    title: 'EDM Festival Ravolution',
    date: '2026-04-20T16:00:00Z',
    location: 'SECC, TP. Hồ Chí Minh',
    image: 'https://images.unsplash.com/photo-1470229722913-7c090be5f526',
    price: '800.000 VNĐ'
  }
];

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="w-full">
      {/* Hero Banner Area */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819"
            alt="Concert background"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 text-center shadow-sm">
            Khám Phá Hàng Ngàn Sự Kiện Sắp Diễn Ra
          </h1>
          <p className="mt-4 text-xl text-gray-300 text-center max-w-3xl mx-auto mb-10">
            Nền tảng đặt vé tích hợp Web3 hiện đại nhất. Giao dịch an toàn, chống lừa đảo 100%.
          </p>

          <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-2xl flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-lg leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all"
                placeholder="Tìm kiếm sự kiện, nghệ sĩ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="w-full md:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 md:py-3 md:px-10 shadow-lg hover:shadow-indigo-500/50 transition-all cursor-pointer">
              Tìm vé
            </button>
          </div>
        </div>
      </div>

      {/* Featured Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Sự kiện Nổi Bật</h2>
          <Link to="/events" className="text-indigo-600 hover:text-indigo-800 font-medium hidden sm:block">
            Xem tất cả &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_EVENTS.map(event => (
            <Link key={event.id} to={`/events/${event.id}`} className="group block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="relative h-48 w-full overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-700 shadow-sm">
                  {event.price}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{new Date(event.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
