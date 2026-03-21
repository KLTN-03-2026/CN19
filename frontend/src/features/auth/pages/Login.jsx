import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { X, Info, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { loginApi } from '../api/auth.api';

const Login = () => {
  const { register, handleSubmit, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.login);

  // Quan sát email và password để bật tắt nút Tiếp tục
  const emailVal = watch("email", "");
  const passVal = watch("password", "");
  const isFormValid = emailVal.length > 0 && passVal.length > 0;

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await loginApi(data);
      setAuth(res.data.user, res.data.token);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900/80 px-4 fixed inset-0 z-50 pb-20">
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Nút Đóng (Mô phỏng popup) */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 right-4 text-white hover:bg-white/20 p-1 rounded-full z-10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header (Màu Xanh Lá) */}
        <div className="bg-[#2bc265] pt-10 pb-6 px-8 relative flex items-center">
          <h2 className="text-3xl font-bold text-white tracking-wide">
            Đăng nhập
          </h2>
          {/* Mascot (Avatar Chó) */}
          <div className="absolute right-6 bottom-0 translate-y-2">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/3069/3069172.png" 
              alt="Mascot" 
              className="w-20 h-20 object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Form Content */}
        <form className="p-8 pt-10 flex flex-col space-y-5" onSubmit={handleSubmit(onSubmit)}>
          
          {/* Input Email/Phone */}
          <div className="relative">
            <input
              type="text"
              {...register("email")}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập email hoặc số điện thoại"
            />
            <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
              <Info className="w-5 h-5" />
            </button>
          </div>

          {/* Input Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="Nhập mật khẩu"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Nút Tiếp tục */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3.5 rounded-lg font-bold text-[15px] transition-colors ${
              isFormValid 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                : 'bg-[#e0e0e0] text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
          </button>

          {/* Fake Captcha Cloudflare */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50/50 my-2">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 rounded-full p-1">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-800">Thành công!</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-500 tracking-wider">CLOUDFLARE</span>
              <div className="text-[9px] text-gray-400 mt-0.5">
                <a href="#" className="hover:underline">Quyền riêng tư</a> • <a href="#" className="hover:underline">Giúp đỡ</a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center space-y-3 pt-2">
            <a href="#" className="text-[15px] text-gray-500 hover:text-gray-800 font-medium">
              Quên mật khẩu?
            </a>
            <div className="text-[15px] text-gray-500 font-medium pt-2">
              Chưa có tài khoản?{' '}
            </div>
            <Link to="/register" className="text-[15px] text-[#2bc265] font-semibold hover:text-[#23a555] transition-colors">
              Tạo tài khoản ngay
            </Link>
          </div>

          {/* Hoặc Divider */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="mx-4 text-sm text-gray-500 font-medium">Hoặc</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Login Button */}
          <button type="button" className="w-full flex items-center justify-center bg-[#1a73e8] text-white rounded-lg p-1 hover:bg-[#155dbb] transition-colors shadow-sm">
            <div className="flex-grow flex flex-col items-start pl-3 py-1.5">
              <span className="text-sm font-medium leading-tight">Đăng nhập với tên Phương</span>
              <span className="text-xs text-white/80 leading-tight">tranminhphuong732004@gmail.com</span>
            </div>
            <div className="bg-white rounded p-1.5 mr-1 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </div>
          </button>

          {/* Terms Footer */}
          <div className="pt-4 text-[13px] text-gray-500 text-center leading-relaxed">
            Bằng việc tiếp tục, bạn đã đọc và đồng ý với{' '}
            <a href="#" className="text-[#2bc265] hover:underline">Điều khoản sử dụng</a> và{' '}
            <a href="#" className="text-[#2bc265] hover:underline">Chính sách bảo mật thông tin cá nhân</a> của BAS-Ticket
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;
