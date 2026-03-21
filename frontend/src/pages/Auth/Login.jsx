import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { X, Info, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';

const Login = () => {
  const { register, handleSubmit, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.login);

  const emailVal = watch("email", "");
  const passVal = watch("password", "");
  const isFormValid = emailVal.length > 0 && passVal.length > 0;

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await authService.login(data);
      // Lưu vào Zustand store + LocalStorage
      setAuth(res.user, res.token);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900/80 px-4 fixed inset-0 z-50">
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
        
        <Link to="/" className="absolute top-4 right-4 text-white hover:bg-white/20 p-1 rounded-full z-10 transition-colors">
          <X className="w-6 h-6" />
        </Link>

        {/* Header xanh */}
        <div className="bg-[#2bc265] pt-10 pb-6 px-8 relative flex items-center">
          <h2 className="text-3xl font-bold text-white tracking-wide">
            Đăng nhập
          </h2>
          <div className="absolute right-6 bottom-0 translate-y-2">
            <span className="text-6xl drop-shadow-md">🐶</span>
          </div>
        </div>

        {/* Form Content */}
        <form className="p-8 pt-10 flex flex-col space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="relative">
            <input
              type="text"
              {...register("email", { required: true })}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2bc265] focus:ring-1 focus:ring-[#2bc265]"
              placeholder="Nhập email đăng nhập"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              <Info className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", { required: true })}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2bc265] focus:ring-1 focus:ring-[#2bc265]"
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

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3.5 rounded-lg font-bold text-[15px] transition-colors ${
              isFormValid 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                : 'bg-[#e0e0e0] text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Đang xác thực...' : 'Tiếp tục'}
          </button>

          <div className="flex flex-col items-center space-y-3 pt-2">
            <a href="#" className="text-[14px] text-gray-500 hover:text-gray-800 font-medium">
              Quên mật khẩu?
            </a>
            <div className="text-[14px] text-gray-500 font-medium pt-2">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-[#2bc265] font-semibold hover:text-[#23a555]">
                Tạo tài khoản ngay
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
