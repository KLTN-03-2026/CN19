import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { X, Info, Eye, EyeOff, User, Phone } from 'lucide-react';
import { authService } from '../../services/auth.service';

const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const emailVal = watch("email", "");
  const passVal = watch("password", "");
  const confirmPassVal = watch("confirmPassword", "");
  const nameVal = watch("full_name", "");
  const phoneVal = watch("phone_number", "");
  
  const isFormValid = emailVal && passVal && confirmPassVal && nameVal && phoneVal;

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await authService.register(data);
      toast.success('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900/80 px-4 fixed inset-0 z-50 py-10 overflow-y-auto">
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl relative overflow-hidden flex flex-col my-auto">
        
        <Link to="/" className="absolute top-4 right-4 text-white hover:bg-white/20 p-1 rounded-full z-10 transition-colors">
          <X className="w-6 h-6" />
        </Link>

        {/* Header xanh lá Ticketbox style */}
        <div className="bg-[#2bc265] pt-8 pb-6 px-8 relative flex items-center">
          <h2 className="text-3xl font-bold text-white tracking-wide">
            Đăng ký
          </h2>
          <div className="absolute right-6 bottom-0 translate-y-2">
            <span className="text-5xl drop-shadow-md">🐕</span>
          </div>
        </div>

        {/* Form Content */}
        <form className="p-8 pt-8 flex flex-col space-y-4" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="relative">
            <input
              type="text"
              {...register("full_name", { required: true })}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2bc265] focus:ring-1 focus:ring-[#2bc265]"
              placeholder="Họ và tên"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              <User className="w-5 h-5" />
            </div>
          </div>
          
          <div className="relative">
            <input
              type="email"
              {...register("email", { required: true })}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2bc265] focus:ring-1 focus:ring-[#2bc265]"
              placeholder="Email"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              <Info className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              {...register("phone_number", { required: true })}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2bc265] focus:ring-1 focus:ring-[#2bc265]"
              placeholder="Số điện thoại"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
              <Phone className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", { required: true, minLength: 6 })}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2bc265] focus:ring-1 focus:ring-[#2bc265]"
              placeholder="Mật khẩu (từ 6 ký tự)"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword", { 
                required: true,
                validate: value => value === passVal || "Mật khẩu không khớp"
              })}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2bc265] focus:ring-1 focus:ring-[#2bc265]"
              placeholder="Xác nhận mật khẩu"
            />
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3.5 rounded-lg font-bold text-[15px] transition-colors mt-2 ${
              isFormValid 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                : 'bg-[#e0e0e0] text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Đang tạo ví Web3...' : 'Tạo tài khoản'}
          </button>

          <div className="flex flex-col items-center space-y-3 pt-3">
            <div className="text-[14px] text-gray-500 font-medium">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-[#2bc265] font-semibold hover:text-[#23a555]">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
