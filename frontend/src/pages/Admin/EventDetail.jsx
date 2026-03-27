import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar,
  MapPin,
  Clock,
  Tag,
  Building2,
  Shield,
  Ticket,
  ShoppingBag,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Package,
  TrendingUp,
  ChevronRight,
  User,
  Zap,
  CalendarDays
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEventById(id);
      setEvent(data);
    } catch (error) {
      toast.error('Lỗi khi tải thông tin sự kiện');
      navigate('/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (window.confirm('Bạn có chắc chắn muốn PHÊ DUYỆT sự kiện này?')) {
      try {
        await adminService.approveEvent(id, { action: 'approve' });
        toast.success('Đã phê duyệt sự kiện!');
        fetchEventDetail();
      } catch (error) {
        toast.error('Thao tác thất bại');
      }
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Lý do từ chối (Gửi cho BTC):');
    if (reason !== null) {
      try {
        await adminService.approveEvent(id, { action: 'reject', reason });
        toast.success('Đã từ chối sự kiện');
        fetchEventDetail();
      } catch (error) {
        toast.error('Thao tác thất bại');
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-vh-[400px] space-y-4 pt-20">
      <div className="w-12 h-12 border-4 border-neon-green/20 border-t-neon-green rounded-full animate-spin" />
      <p className="text-gray-500 font-bold animate-pulse">Đang soi chi tiết show...</p>
    </div>
  );

  if (!event) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/events')}
            className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Chi tiết sự kiện</h1>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                event.status === 'active' ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 
                event.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                'bg-gray-500/10 text-gray-500 border border-white/5'
              }`}>
                {event.status}
              </span>
            </div>
            <p className="text-gray-500 text-sm flex items-center space-x-2">
              <span className="opacity-60 font-medium">Mã show:</span>
              <span className="font-mono text-[11px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">{event.id}</span>
            </p>
          </div>
        </div>

        {event.status === 'pending' && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleReject}
              className="flex items-center space-x-2 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
            >
              <XCircle className="w-4 h-4" />
              <span>Từ chối</span>
            </button>
            <button 
              onClick={handleApprove}
              className="flex items-center space-x-2 px-6 py-3 bg-neon-green text-black rounded-2xl font-black text-xs uppercase hover:scale-105 transition-all shadow-lg shadow-neon-green/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Phê duyệt ngay</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Event Poster & Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm dark:shadow-2xl">
            <div className="aspect-video relative overflow-hidden group">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-neon-green/10 flex items-center justify-center">
                  <CalendarDays className="w-20 h-20 text-neon-green opacity-20" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                 <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2">
                    <Tag className="w-3 h-3 text-neon-green" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{event.category.name}</span>
                 </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
               <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter mb-2">{event.title}</h3>
                  <div 
                    onClick={() => navigate(`/admin/users/${event.organizer.user_id}`)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-neon-green cursor-pointer transition-colors group"
                  >
                    <Building2 className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    <span className="text-sm font-bold uppercase tracking-widest">{event.organizer.organization_name}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                    <div className="text-[10px] uppercase font-black text-gray-400 mb-1">Vé đã bán</div>
                    <div className="text-xl font-black text-neon-green">{event._count.tickets}</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                    <div className="text-[10px] uppercase font-black text-gray-400 mb-1">Đơn hàng</div>
                    <div className="text-xl font-black text-blue-500">{event._count.orders}</div>
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium tracking-wide uppercase text-[10px]">Phí tác quyền (Royalty)</span>
                    <span className="font-black text-neon-green bg-neon-green/10 px-2 py-0.5 rounded">{event.royalty_fee_percent}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium tracking-wide uppercase text-[10px]">Cho phép hoàn tiền</span>
                    <span className={`font-black uppercase text-[10px] ${event.allow_refund ? 'text-neon-green' : 'text-red-400'}`}>
                      {event.allow_refund ? 'Có' : 'Không'}
                    </span>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-8 text-white relative overflow-hidden group border border-white/10 shadow-2xl">
             <Zap className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
             <div className="relative">
                <div className="flex items-center space-x-2 text-blue-200 mb-4 tracking-widest uppercase font-black text-[10px]">
                   <Shield className="w-4 h-4" />
                   <span>Smart Contract</span>
                </div>
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-mono text-[10px] break-all leading-relaxed mb-4">
                   {event.smart_contract_address || 'Chưa triển khai hợp đồng'}
                </div>
                <p className="text-[10px] text-blue-100/60 italic leading-relaxed">
                   * Đây là địa chỉ Smart Contract quản lý toàn bộ vé NFT của sự kiện này trên Polygon Amoy.
                </p>
             </div>
          </div>
        </div>

        {/* Right Col: Tabs & Info */}
        <div className="lg:col-span-2 space-y-6">
           {/* Tabs */}
           <div className="flex items-center space-x-1 p-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl">
              {[
                { id: 'overview', label: 'Tổng quan show', icon: Info },
                { id: 'tiers', label: 'Cơ cấu Hạng vé', icon: Ticket },
                { id: 'location', label: 'Bản đồ & Địa điểm', icon: MapPin },
                { id: 'orders', label: 'Danh sách lệnh mua', icon: ShoppingBag }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-neon-green text-black shadow-lg shadow-neon-green/20' 
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
           </div>

           {/* Tab Content */}
           <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm dark:shadow-2xl min-h-[600px]">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Ngày tổ chức</span>
                        </label>
                        <div className="text-sm font-bold dark:text-white p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 uppercase tracking-wide">
                          {new Date(event.event_date).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Giờ G (Bắt đầu)</span>
                        </label>
                        <div className="text-sm font-bold dark:text-white p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                          {event.event_time || 'Chưa cập nhật'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Ngày kết thúc</span>
                        </label>
                        <div className="text-sm font-bold dark:text-white p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 uppercase tracking-wide">
                          {event.end_date ? new Date(event.end_date).toLocaleDateString('vi-VN') : 'Trong ngày'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Giờ kết thúc</span>
                        </label>
                        <div className="text-sm font-bold dark:text-white p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                          {event.end_time || 'Kéo dài tự do'}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-3 pt-4">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Mô tả chi tiết</label>
                      <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                         {event.description || 'Không có mô tả chi tiết.'}
                      </div>
                   </div>

                   <div className="pt-8 flex justify-end">
                      <button 
                        onClick={() => window.open(`/event/${event.id}`, '_blank')}
                        className="flex items-center space-x-3 px-8 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest dark:text-white"
                      >
                         <span>Trang chi tiết người dùng</span>
                         <ExternalLink className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              )}

              {activeTab === 'tiers' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">Cấu trúc phân hạng vé</h4>
                      <span className="text-[10px] font-bold text-gray-500">{event.ticket_tiers.length} hạng vé</span>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {event.ticket_tiers.map((tier, idx) => (
                        <div key={tier.id} className="p-6 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all">
                           <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-4">
                                 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-lg">
                                    {idx + 1}
                                 </div>
                                 <div>
                                    <div className="text-lg font-black dark:text-white uppercase tracking-tighter mb-0.5">{tier.tier_name}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tier.section_name || 'Khu vực Chung'}</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-xl font-black text-neon-green">
                                    {parseFloat(tier.price).toLocaleString()}đ
                                 </div>
                                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Giao dịch NFT</div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-gray-200/50 dark:border-white/5">
                              <div>
                                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                    <span className="text-gray-400">Đã bán</span>
                                    <span className="dark:text-white">{tier.quantity_total - tier.quantity_available}/{tier.quantity_total}</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-neon-green rounded-full shadow-[0_0_8px_rgba(50,255,100,0.5)]" 
                                      style={{ width: `${((tier.quantity_total - tier.quantity_available) / tier.quantity_total) * 100}%` }}
                                    />
                                 </div>
                              </div>
                              <div className="flex flex-col justify-end">
                                 <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sẵn có: <span className="text-blue-500">{tier.quantity_available} vé</span></div>
                              </div>
                           </div>

                           {tier.benefits && (
                             <div className="mt-4 p-3 bg-white dark:bg-white/5 rounded-xl text-[11px] text-gray-500 leading-relaxed italic">
                                "{tier.benefits}"
                             </div>
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-gray-50 dark:bg-white/5 rounded-[32px] p-8 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center space-x-4 mb-8">
                         <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                            <MapPin className="w-7 h-7" />
                         </div>
                         <div>
                            <h4 className="text-lg font-black dark:text-white uppercase tracking-tighter">Địa điểm tổ chức</h4>
                            <p className="text-sm text-gray-500">{event.location_address || 'Hội trường trực tuyến'}</p>
                         </div>
                      </div>

                      <div className="aspect-video bg-gray-200 dark:bg-white/10 rounded-[24px] overflow-hidden relative group border border-white/5 shadow-inner">
                         {event.latitude && event.longitude ? (
                           <iframe
                             width="100%"
                             height="100%"
                             frameBorder="0"
                             style={{ border: 0 }}
                             src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&hl=vi&z=14&output=embed`}
                             allowFullScreen
                             className="opacity-80 group-hover:opacity-100 transition-opacity grayscale-[20%] hover:grayscale-0"
                           />
                         ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                               <MapPin className="w-12 h-12 mb-4" />
                               <p className="font-black uppercase text-xs tracking-widest text-center px-20">Vị trí chưa được xác định<br/>(Dựa trên tọa độ)</p>
                            </div>
                         )}
                         
                         {/* Coordinates badge overlay */}
                         {(event.latitude && event.longitude) && (
                           <div className="absolute bottom-6 left-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white font-mono text-[10px] pointer-events-none">
                              Lat: {event.latitude} <br/>
                              Lng: {event.longitude}
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="flex flex-col items-center justify-center py-40 opacity-30 text-center">
                  <ShoppingBag className="w-16 h-16 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">Tính năng đang phát triển</p>
                  <p className="text-[10px] mt-2 italic px-20">Danh sách các cá nhân đã mua vé thành công và lịch sử thanh toán sẽ được cập nhật tại đây.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
