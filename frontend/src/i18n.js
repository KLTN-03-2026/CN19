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
          org: {
            partner_with: "Partner With",
            desc: "Issue event tickets using Blockchain technology (NFT). Absolute fraud prevention, transparent payments, and automated management processes.",
            benefit1: "Integrated Custodial Web3 Wallet",
            benefit2: "Smart Contracts for Secondary Royalties",
            benefit3: "Absolute Data Security Commitment",
            footer: "© 2026 BASTICKET Partner Portal",
            step1: "1. Information",
            step2: "2. KYC Profile",
            setup_acc: "Account Setup",
            upload_kyc: "Upload Profile Documents",
            name_label: "Organization / Personal Name (*)",
            name_placeholder: "Business or individual name",
            address_label: "Specific Address",
            desc_label: "Organization Description",
            desc_placeholder: "A few words about your organization...",
            continue: "Continue",
            upload_desc: "Please upload your Business License or Identity Card (for individuals) for system verification.",
            drag_drop: "Drag & drop file here",
            or_click: "or click to select folder",
            supported_files: "Supports JPG, PNG, PDF < 5MB",
            submit_btn: "Submit Request",
            otp_title: "OTP Verification",
            otp_desc: "A 6-digit verification code has been sent to your Email. Please check your inbox.",
            configuring: "Configuring Blockchain...",
            confirm_register: "Confirm Registration",
            resend_in: "Resend code in ",
            resend_now: "Resend code now",
            data_encrypted: "Your identity data is encrypted and used solely for internal review purposes according to BASTICKET's privacy policy.",
            error_fill: "Please fill in all information correctly.",
            error_file_type: "Only JPG, PNG, PDF files are supported",
            error_file_size: "File size exceeds 5MB",
            error_missing_file: "Please upload verification documents (ID/License)",
            error_otp_length: "Please enter all 6 OTP digits",
            success_submit: "Profile securely encrypted and submitted successfully!"
          },
          map: {
            click_to_pin: "Click to pin on map",
            setup_location: "Setup Location",
            province_label: "Province / City (*)",
            province_placeholder: "-- Select Province/City --",
            district_label: "District (*)",
            district_placeholder: "-- Select District --",
            ward_label: "Ward / Commune (*)",
            ward_placeholder: "-- Select Ward/Commune --",
            detail_label: "House Number, Street Details (*)",
            detail_placeholder: "E.g., 123 Nguyen Sinh Cung Street...",
            debounce_hint: "* The map will automatically search for the street location 1.5s after you stop typing.",
            confirm_btn: "Confirm Address",
            map_instruction: "Click on the map to pin precisely!",
            err_incomplete: "Please select Ward/Commune and enter specific house number!"
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
          org: {
            partner_with: "Hợp Tác Cùng",
            desc: "Phát hành vé sự kiện bằng công nghệ Blockchain (NFT). Chống gian lận tuyệt đối, thanh toán minh bạch và tự động hóa quy trình quản lý của bạn.",
            benefit1: "Ví Blockchain Custodial tích hợp sẵn",
            benefit2: "Smart Contract thu tiền bản quyền thứ cấp",
            benefit3: "Cam kết bảo mật dữ liệu tuyệt đối",
            footer: "© 2026 BASTICKET Partner Portal",
            step1: "1. Thông tin",
            step2: "2. Hồ sơ KYC",
            setup_acc: "Thiết lập Tài khoản",
            upload_kyc: "Tải lên Hồ sơ năng lực",
            name_label: "Tên Tổ chức / Cá nhân (*)",
            name_placeholder: "Tên doanh nghiệp hoặc cá nhân",
            address_label: "Địa chỉ cụ thể",
            desc_label: "Mô tả tổ chức",
            desc_placeholder: "Vài nét về tổ chức của bạn...",
            continue: "Tiếp Tục",
            upload_desc: "Vui lòng tải lên Giấy Phép Kinh Doanh hoặc Căn Cước Công Dân (đối với cá nhân) để hệ thống định danh.",
            drag_drop: "Kéo & thả file vào đây",
            or_click: "hoặc click để chọn thư mục",
            supported_files: "Hỗ trợ JPG, PNG, PDF < 5MB",
            submit_btn: "Gửi Yêu Cầu Duyệt",
            otp_title: "Xác thực OTP",
            otp_desc: "Mã xác minh 6 số đã được gửi qua Email của bạn. Vui lòng kiểm tra hộp thư.",
            configuring: "Đang cấu hình Blockchain...",
            confirm_register: "Xác Nhận Đăng Ký",
            resend_in: "Gửi lại mã sau ",
            resend_now: "Gửi lại mã ngay",
            data_encrypted: "Dữ liệu định danh của bạn được mã hóa và chỉ sử dụng cho mục đích kiểm duyệt nội bộ theo chính sách bảo mật của BASTICKET.",
            error_fill: "Vui lòng điền đầy đủ và chính xác thông tin.",
            error_file_type: "Chỉ hỗ trợ file JPG, PNG, PDF",
            error_file_size: "Kích thước file vượt quá 5MB",
            error_missing_file: "Vui lòng tải lên tài liệu xác minh (CCCD/GPKD)",
            error_otp_length: "Vui lòng nhập đủ 6 số OTP",
            success_submit: "Hồ sơ đã được mã hóa và gửi thành công!"
          },
          map: {
            click_to_pin: "Bấm vào để cắm cờ bản đồ",
            setup_location: "Thiết lập Vị trí",
            province_label: "Tỉnh / Thành phố (*)",
            province_placeholder: "-- Chọn Tỉnh/Thành --",
            district_label: "Quận / Huyện (*)",
            district_placeholder: "-- Chọn Quận/Huyện --",
            ward_label: "Phường / Xã (*)",
            ward_placeholder: "-- Chọn Phường/Xã --",
            detail_label: "Số nhà, Chi tiết đường (*)",
            detail_placeholder: "Ví dụ: 123 Đường Nguyễn Sinh Cung...",
            debounce_hint: "* 1.5s sau khi bạn nhập, bản đồ sẽ tự động rà soát vị trí đường.",
            confirm_btn: "Xác Nhận Địa Chỉ",
            map_instruction: "Nhấp chuột để cắm cờ chính xác!",
            err_incomplete: "Vui lòng chọn đầy đủ Xã/Phường và nhập số nhà cụ thể!"
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
