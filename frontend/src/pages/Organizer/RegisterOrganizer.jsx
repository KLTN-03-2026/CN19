import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Building2, UserCircle, Briefcase, Mail, Phone } from 'lucide-react';

const RegisterOrganizer = () => {
  const { register, handleSubmit } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setIsLoading(true);
    // Giả lập gọi API đăng ký Organizer
    setTimeout(() => {
      toast.success('Đăng ký Ban Tổ Chức thành công! Đang chờ duyệt.');
      setIsLoading(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      
      {/* Khung Card chính */}
      <div className="w-full max-w-[550px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col transition-colors z-20">
        
        {/* Header Tím/Neon */}
        <div className="border-b border-gray-100 dark:border-dark-border pt-10 pb-6 px-8 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Lớp màu nhấn hắt sáng nhẹ ở Header */}
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-neon-green via-blue-500 to-purple-500"></div>
          
          <Building2 className="w-12 h-12 text-neon-green mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-wide text-center">
            Trở thành Ban Tổ Chức
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm text-center">
            Hợp tác cùng nền tảng BlockTix để phát hành vé NFT bảo mật, chống gian lận và quản lý doanh thu tự động.
          </p>
        </div>

        {/* Form Content */}
        <form className="p-8 flex flex-col space-y-4" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên Tổ Chức / Cá Nhân</label>
              <input
                type="text"
                {...register("organizerName", { required: true })}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
                placeholder="VD: BASTICKET JSC"
              />
              <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người Đại Diện</label>
              <input
                type="text"
                {...register("representativeName", { required: true })}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
                placeholder="Họ và tên"
              />
               <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400">
                <UserCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Liên Hệ</label>
            <input
              type="email"
              {...register("email", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder="Email công ty"
            />
             <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số Điện Thoại</label>
            <input
              type="text"
              {...register("phone", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder="Hotline hoặc di động"
            />
            <div className="absolute top-[32px] right-0 pr-3 flex items-center text-gray-400">
              <Phone className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả Tổ Chức / Pháp nhân</label>
            <textarea
              {...register("description", { required: true })}
              rows="3"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-dark-border text-gray-900 dark:text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors resize-none"
              placeholder="Vài nét về tổ chức của bạn và các sự kiện dự kiến tổ chức..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 mt-2 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center space-x-2 ${
              !isLoading
                ? 'bg-neon-green hover:bg-neon-hover text-black shadow-[0_0_15px_rgba(82,196,45,0.4)]' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Đang gửi hồ sơ...' : 'Gửi Đăng Ký Ban Tổ Chức'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterOrganizer;
