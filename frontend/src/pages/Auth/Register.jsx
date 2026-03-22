import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Info, Eye, EyeOff, User, Phone, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] bg-dark-card border border-dark-border rounded-2xl shadow-2xl relative overflow-hidden flex flex-col glow-card-green">
        
        {/* Header Dark Mode */}
        <div className="border-b border-dark-border pt-8 pb-6 px-8 flex flex-col items-center justify-center">
          <ShieldCheck className="w-12 h-12 text-neon-green mb-4" />
          <h2 className="text-3xl font-bold text-white tracking-wide">
            Create Account
          </h2>
          <p className="text-gray-400 mt-2 text-sm text-center">Automatically generates a secure Web3 Custodial Wallet for your tickets.</p>
        </div>

        {/* Form Content */}
        <form className="p-8 flex flex-col space-y-4" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="relative">
            <input
              type="text"
              {...register("full_name", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-[#0a0a0a] border border-dark-border text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder="Full Name"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
              <User className="w-5 h-5" />
            </div>
          </div>
          
          <div className="relative">
            <input
              type="email"
              {...register("email", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-[#0a0a0a] border border-dark-border text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder="Email address"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
              <Info className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              {...register("phone_number", { required: true })}
              className="w-full pl-4 pr-10 py-3 bg-[#0a0a0a] border border-dark-border text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder="Phone Number"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
              <Phone className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", { required: true, minLength: 6 })}
              className="w-full pl-4 pr-10 py-3 bg-[#0a0a0a] border border-dark-border text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder="Password (min 6 chars)"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-neon-green"
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
              className="w-full pl-4 pr-10 py-3 bg-[#0a0a0a] border border-dark-border text-white rounded-xl focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-colors"
              placeholder="Confirm Password"
            />
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}

          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-[15px] transition-all mt-4 ${
              isFormValid 
                ? 'bg-neon-green hover:bg-neon-hover text-black shadow-[0_0_15px_rgba(82,196,45,0.4)]' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating Web3 Wallet...' : 'Sign Up'}
          </button>

          {/* Ngăn cách */}
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-dark-border"></div>
            <span className="mx-4 text-sm text-gray-500 font-medium">OR</span>
            <div className="flex-grow border-t border-dark-border"></div>
          </div>

          {/* Google Button Oauth */}
          <button type="button" className="w-full flex items-center justify-center bg-transparent border border-gray-600 text-white rounded-xl p-3 hover:bg-white/5 transition-colors font-medium">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex flex-col items-center space-y-3 pt-3">
            <div className="text-[14px] text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-neon-green font-semibold hover:text-neon-hover">
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
