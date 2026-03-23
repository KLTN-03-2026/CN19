import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          nav: {
            home: "Home", events: "Events", marketplace: "Marketplace", organizer: "For Organizers"
          },
          auth: {
            login: "Sign In", signup: "Sign Up", welcome: "Welcome back to BASTICKET", welcome_desc: "Secure login to the system.",
            create: "Create Account", create_desc: "Automatically generates a secure Web3 Custodial Wallet for your tickets.",
            email: "Email address", email_phone: "Email or Phone number", forgot: "Forgot password?", pass: "Password", name: "Full Name", phone: "Phone Number", cpass: "Confirm Password",
            auth_btn: "Authenticating...", signin_btn: "Sign In", create_btn: "Sign Up", creating_btn: "Creating Web3 Wallet...",
            or: "OR", google: "Continue with Google",
            no_acc: "Don't have an account?", yes_acc: "Already have an account?",
            terms1: "By continuing, you have read and agree to the ", terms2: "Terms of Use", terms3: " and ", terms4: "Privacy Policy", terms5: " of BASTICKET."
          },
          home: {
            badge: "Powered by Blockchain",
            title1: "The complete", title2: "platform to", title_green1: "secure", title_green2: "event tickets",
            desc: "Stop fraud and counterfeiting with blockchain-powered NFT tickets. Secure, transparent, and verifiable ticketing for the modern world.",
            btn_explore: "Explore Events", btn_create: "Create Event",
            f1_title: "Anti-Fraud Protection", f1_desc: "Every ticket is a unique NFT on the blockchain, making counterfeiting impossible.",
            f2_title: "Instant Verification", f2_desc: "Verify ticket authenticity instantly at event entrances with QR codes.",
            f3_title: "Secure Marketplace", f3_desc: "Buy and sell tickets safely with transparent pricing and ownership history.",
            f4_title: "Smart Contracts", f4_desc: "Automated ticket management with programmable rules and royalties."
          }
        }
      },
      vi: {
        translation: {
          nav: {
            home: "Trang chủ", events: "Sự kiện", marketplace: "Chợ vé", organizer: "Dành cho BTC"
          },
          auth: {
            login: "Đăng nhập", signup: "Đăng ký", welcome: "Chào mừng trở lại BASTICKET", welcome_desc: "Đăng nhập an toàn vào hệ thống.",
            create: "Tạo tài khoản", create_desc: "Hệ thống tự động khởi tạo Ví Ẩn Web3 siêu bảo mật.",
            email: "Địa chỉ Email", email_phone: "Email hoặc Số điện thoại", forgot: "Quên mật khẩu?", pass: "Mật khẩu", name: "Họ và Tên", phone: "Số điện thoại", cpass: "Xác nhận Mật khẩu",
            auth_btn: "Đang xác thực...", signin_btn: "Đăng nhập", create_btn: "Tạo tài khoản", creating_btn: "Đang tạo Ví Web3...",
            or: "Hoặc", google: "Tiếp tục với Google",
            no_acc: "Chưa có tài khoản?", yes_acc: "Đã có tài khoản rồi?",
            terms1: "Bằng việc tiếp tục, bạn đã đọc và đồng ý với ", terms2: "Điều khoản sử dụng", terms3: " và ", terms4: "Chính sách bảo mật thông tin cá nhân", terms5: " của BASTICKET"
          },
          home: {
            badge: "Sức mạnh Blockchain",
            title1: "Nền tảng", title2: "toàn diện giúp", title_green1: "bảo mật", title_green2: "vé sự kiện",
            desc: "Chặn đứng nạn lừa đảo và vé giả. Minh bạch, an toàn và cực kỳ dễ dàng để sở hữu tấm vé NFT kỹ thuật số đắt giá.",
            btn_explore: "Khám phá Sự kiện", btn_create: "Tạo Sự kiện Mới",
            f1_title: "Chống Vé Giả", f1_desc: "Mỗi vé là một NFT duy nhất trên blockchain. Trẻ em cũng biết vé này không thể làm giả.",
            f2_title: "Xác Thực Tức Thì", f2_desc: "Nhân viên cầm điện thoại quét mã QR động (Dynamic QR) check-in sự kiện chỉ tốn đúng 1 giây.",
            f3_title: "Chợ Vé An Toàn", f3_desc: "Bạn có việc bận? Cứ pass lại vé lên Chợ. Smart Contract sẽ tự động khóa và chuyển tiền giữa người mua và bán cực minh bạch.",
            f4_title: "Hợp Đồng Thông Minh", f4_desc: "Tính năng siêu phàm dành cho Ban Tổ Chức. Cứ mỗi vé mồi bán lại, tự động trích % tiền cò chảy thẳng về túi BTC."
          }
        }
      }
    },
    lng: 'vi', // Mặc định luôn khởi động bằng Tiếng Việt
    fallbackLng: 'vi', // Nếu lỗi dịch thuật thì ưu tiên dùng Tiếng Việt
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;
