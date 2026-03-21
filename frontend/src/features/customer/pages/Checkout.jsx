import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const { event, tickets, total } = location.state || {};

  if (!event || !total) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy đơn hàng</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline">Quay lại trang chủ</button>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    // Giả lập gọi API tạo order và lấy payment URL (VNPay)
    setTimeout(() => {
      toast.success('Đã nhận phản hồi thanh toán Mock!');
      // TODO: Thường sẽ redirect user qua VNPay/MoMo
      // Sau khi thanh toán thành công webhook server mính sẽ xử lý mint vé
      toast('Thanh toán thành công. Đang mint NFT...', { icon: '💳' });
      navigate('/my-tickets');
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/events/${event.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại sự kiện
      </Link>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        {/* Left: Order Summary */}
        <div className="md:w-1/2 p-8 bg-gray-50 border-r border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tóm tắt đơn hàng</h2>
          
          <div className="flex items-center space-x-4 mb-6">
            <img src={event.image} alt={event.title} className="w-20 h-20 object-cover rounded-xl shadow-sm" />
            <div>
              <h3 className="font-bold text-gray-900 truncate">{event.title}</h3>
              <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-6">
            {Object.entries(tickets).map(([tierId, qty]) => {
              if (qty === 0) return null;
              const tier = event.tiers.find(t => t.id === Number(tierId));
              return (
                <div key={tierId} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{tier.name}</p>
                    <p className="text-sm text-gray-500">{qty} x {tier.price.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <p className="font-bold text-gray-900">{(qty * tier.price).toLocaleString('vi-VN')} đ</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 mt-6 pt-6">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-gray-900">Tổng thanh toán</span>
              <span className="font-extrabold text-2xl text-indigo-600">{total.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Right: Payment Method */}
        <div className="md:w-1/2 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Thanh toán</h2>

          <div className="space-y-4">
            <label className="flex items-center p-4 border rounded-xl border-indigo-600 bg-indigo-50 cursor-pointer transition-all">
              <input type="radio" name="payment" className="h-4 w-4 text-indigo-600" defaultChecked />
              <div className="ml-4 flex items-center">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">VN</div>
                <span className="ml-3 font-medium text-gray-900">Thanh toán VNPay</span>
              </div>
            </label>
            
            <label className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
              <input type="radio" name="payment" className="h-4 w-4 text-indigo-600" />
              <div className="ml-4 flex items-center">
                <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center font-bold">Mo</div>
                <span className="ml-3 font-medium text-gray-900">Ví MoMo</span>
              </div>
            </label>

            <label className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
              <input type="radio" name="payment" className="h-4 w-4 text-indigo-600" />
              <div className="ml-4 flex items-center">
                <CreditCard className="text-gray-600" />
                <span className="ml-3 font-medium text-gray-900">Thẻ Quốc tế (Visa/Mastercard)</span>
              </div>
            </label>
          </div>

          <div className="mt-8 flex items-start text-sm text-gray-500">
            <ShieldCheck className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
            <p>Giao dịch của bạn được bảo mật tuyệt đối. Hỗ trợ đối soát và kiểm chứng tự động bằng Web3 Smart Contract.</p>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full mt-8 py-4 rounded-xl font-bold shadow-lg flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {isProcessing ? 'Đang xử lý...' : `Thanh toán ${total.toLocaleString('vi-VN')} đ`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
