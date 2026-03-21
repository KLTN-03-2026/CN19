import React, { useState } from 'react';
import { QrCode, ArrowRightLeft, Store, ExternalLink } from 'lucide-react';

const MOCK_TICKETS = [
  {
    id: 'TKT-101',
    eventTitle: 'Đại Nhạc Hội BORN PINK VNP',
    date: '2026-05-12',
    tier: 'VIP Standing',
    status: 'ACTIVE',
    tokenId: '45',
    txHash: '0x1A2B3C...4D5E'
  },
  {
    id: 'TKT-102',
    eventTitle: 'EDM Festival Ravolution',
    date: '2026-04-20',
    tier: 'GA Standing',
    status: 'USED',
    tokenId: '99',
    txHash: '0xF1E2D3...C4B5'
  }
];

const MyTickets = () => {
  const [activeTab, setActiveTab] = useState('ACTIVE');

  const filteredTickets = MOCK_TICKETS.filter(t => t.status === activeTab);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Ví Vé / My Tickets</h1>
      
      <div className="flex space-x-4 mb-8 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'ACTIVE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Vé sắp tới
        </button>
        <button 
          onClick={() => setActiveTab('USED')}
          className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'USED' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Vé đã sử dụng / Quá hạn
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTickets.map(ticket => (
          <div key={ticket.id} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 rounded-3xl p-1 relative overflow-hidden shadow-xl transform transition hover:-translate-y-2 duration-300">
            {/* Inner Card content */}
            <div className="bg-white h-full w-full rounded-[23px] flex flex-col relative z-10">
              
              {/* Header */}
              <div className="bg-indigo-50 p-6 rounded-t-[23px] border-b border-indigo-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 tracking-tight">{ticket.eventTitle}</h3>
                  <p className="text-indigo-600 font-medium mt-1">{new Date(ticket.date).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="bg-white px-3 py-1 rounded-full border border-indigo-200 text-indigo-700 font-bold text-sm shadow-sm">
                  {ticket.tier}
                </div>
              </div>
              
              {/* Detail Body */}
              <div className="p-6 flex-grow flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 text-sm">Mã vé</span>
                  <span className="font-mono font-bold text-gray-900">{ticket.id}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 text-sm">NFT Token ID</span>
                  <span className="font-mono bg-blue-50 text-blue-700 px-2 rounded">#{ticket.tokenId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">TxHash</span>
                  <a href="#" className="font-mono text-xs text-indigo-500 flex items-center hover:underline">
                    {ticket.txHash} <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>

              {/* Actions Footer */}
              {activeTab === 'ACTIVE' && (
                <div className="p-4 bg-gray-50 rounded-b-[23px] border-t border-gray-100 grid grid-cols-3 gap-2">
                  <button className="flex flex-col items-center justify-center p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors group">
                    <QrCode className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">Quét mã</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors group">
                    <ArrowRightLeft className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">Chuyển</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-2 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors group">
                    <Store className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">Marketplace</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Holographic effect elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 opacity-20 rounded-full blur-2xl transform -translate-x-10 translate-y-10 pointer-events-none"></div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
            <p>Không có vé nào trong mục này.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
