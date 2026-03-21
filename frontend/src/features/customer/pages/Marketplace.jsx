import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_LISTINGS = [
  {
    id: 'LST-001',
    eventTitle: 'Đại Nhạc Hội BORN PINK VNP',
    date: '2026-05-12',
    location: 'Sân Vận Động Mỹ Đình, Hà Nội',
    tier: 'VIP Standing',
    askingPrice: 8500000,
    originalPrice: 9800000,
    sellerId: 'user_194',
    verified: true
  },
  {
    id: 'LST-002',
    eventTitle: 'Hội thảo Blockchain Summit 2026',
    date: '2026-06-15',
    location: 'Gem Center, TP.HCM',
    tier: 'Standard',
    askingPrice: 150000,
    originalPrice: 200000,
    sellerId: 'user_992',
    verified: true
  },
  {
    id: 'LST-003',
    eventTitle: 'EDM Festival Ravolution',
    date: '2026-04-20',
    location: 'SECC, TP.HCM',
    tier: 'GA Standing',
    askingPrice: 500000,
    originalPrice: 800000,
    sellerId: 'user_xyz',
    verified: false
  }
];

const Marketplace = () => {
  const handleBuy = (listing) => {
    toast.success(`Đang xử lý mua vé giảm giá của ${listing.eventTitle}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Chợ Vé Thứ Cấp</h1>
        <p className="mt-4 text-lg text-gray-600">Mua vé pass lại với giá rẻ hơn, đảm bảo an toàn tuyệt đối 100% qua Smart Contract.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_LISTINGS.map(listing => (
          <div key={listing.id} className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">{listing.tier}</span>
                {listing.verified && (
                  <span className="flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-semibold">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Đã xác thực
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={listing.eventTitle}>{listing.eventTitle}</h3>
              
              <div className="space-y-2 mt-4 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="truncate">{listing.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Tag className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Ngày: {new Date(listing.date).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 border-dashed">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Giá gốc:</span>
                  <span className="line-through text-gray-400">{listing.originalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-gray-900 font-medium">Giá nhượng:</span>
                  <span className="text-2xl font-extrabold text-indigo-600">{listing.askingPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button 
                onClick={() => handleBuy(listing)}
                className="w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center justify-center group shadow-md hover:shadow-indigo-500/30"
              >
                Mua ngay <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
