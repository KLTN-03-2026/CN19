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
            hero: {
              badge: "Exploration: NFT Ticket World",
              title_part1: "Hunt", title_highlight1: "unique",
              title_part2: "tickets, Unparalleled", title_highlight2: "experience",
              subtitle: "Explore the World of NFT Tickets with absolute security and transparency.",
              search_placeholder: "Search by event name, artist, location...",
              search_button: "Search"
            },
            categories: {
              title: "Explore by Category",
              view_all: "View All",
              all: "All", music: "Music", workshop: "Workshop", sports: "Sports", theater: "Theater", festival: "Festival", food: "Food", travel: "Travel", charity: "Charity"
            },
            events: {
              title: "Upcoming", title_highlight: "Events",
              subtitle: "Discover the most prestigious shows waiting for you.",
              view_all: "View all shows",
              not_found: "No events in this category"
            },
            features: {
              title_part1: "Why choose", title_highlight: "BASTICKET?",
              secure_title: "Absolute Security", secure_desc: "NFT tickets are 100% counterfeit-proof on the Blockchain.",
              instant_title: "Instant Transactions", instant_desc: "Buy, sell, and transfer tickets in just seconds.",
              market_title: "Secure Market", market_desc: "Transparent ticket resale, automatic funds via Smart Contract.",
              smart_title: "Smart Contracts", smart_desc: "Automate processes, extract profits directly to your wallet.",
              trust_stat: "Trusted Users"
            }
          },
          explore: {
            title: "Explore", title_highlight: "Events",
            subtitle: "Finding the perfect show for your unique taste.",
            filters: "Filters",
            search_placeholder: "Event name, artist...",
            category_label: "Categories",
            price_label: "Price Range",
            date_label: "Select Date",
            clear_all: "Clear All",
            no_results: "We couldn't find any events matching your filters.",
            found: "Found {{count}} events"
          },
          profile: {
            title: "Profile", user: "User",
            tabs: {
              info: "Personal Info",
              wallet: "Wallet & Security",
              security: "Account Settings"
            },
            labels: {
              name: "Full Name", phone: "Phone Number", dob: "Date of Birth", address: "Address", email: "Email Address",
              save: "Save Changes", cancel: "Cancel", edit: "Edit Profile",
              save_success: "Profile updated successfully!", update_failed: "Update failed, please try again."
            },
            roles: {
              admin: "Administrator", organizer: "Organizer", customer: "Customer"
            },
            placeholders: {
               address: "Ex: 123 District 1, HCMC"
            },
            wallet: {
              title: "Custodial Wallet", desc: "Managed safely by BASTICKET", address: "Wallet Address", balance: "Balance",
              no_wallet: "No wallet connected", network: "Network", type: "Type"
            },
            security: {
              title: "Account Security", desc: "Manage your password and security settings.", change_pass: "Change Password",
              pass_desc: "Always keep your password safe and private.", preferences: "Preferences", email_notif: "Email Notifications",
              old_pass: "Old Password", new_pass: "New Password", confirm_new_pass: "Confirm New Password",
              change_success: "Password changed successfully!", change_failed: "Failed to change password."
            },
            forgot: {
              title: "Forgot Password", desc: "Enter your email to receive an OTP reset code.",
              email_placeholder: "Enter your email...", send_btn: "Send OTP",
              verify_title: "Verify OTP", verify_desc: "Enter the code sent to your email and your new password.",
              otp_label: "OTP Code", new_pass_label: "New Password", reset_btn: "Reset Password",
              success: "Password reset successfully!"
            },
            organizer: {
              title: "Organizer Info", name: "Organization Name", kyc: "KYC Status", desc: "Description"
            }
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
            map_instruction: "Nhập chuột để cắm cờ chính xác!",
            err_incomplete: "Vui lòng chọn đầy đủ Xã/Phường và nhập số nhà cụ thể!"
          },
          home: {
            hero: {
              badge: "Khám phá: Thế giới NFT Ticket",
              title_part1: "Săn vé", title_highlight1: "độc bản",
              title_part2: "Trải nghiệm", title_highlight2: "vô song",
              subtitle: "Khám phá thế giới NFT Ticket với sự bảo mật và minh bạch tuyệt đối.",
              search_placeholder: "Tìm theo tên sự kiện, nghệ sĩ, địa điểm...",
              search_button: "Tìm kiếm"
            },
            categories: {
              title: "Khám phá theo danh mục",
              view_all: "Xem tất cả",
              all: "Tất cả", music: "Âm nhạc", workshop: "Hội thảo", sports: "Thể thao", theater: "Sân khấu", festival: "Lễ hội", food: "Ẩm thực", travel: "Du lịch", charity: "Từ thiện"
            },
            events: {
              title: "Sự kiện", title_highlight: "Sắp diễn ra",
              subtitle: "Khám phá những show diễn đẳng cấp nhất đang chờ đón bạn.",
              view_all: "Xem tất cả show",
              not_found: "Không có sự kiện nào trong danh mục này"
            },
            features: {
              title_part1: "Tại sao chọn", title_highlight: "BASTICKET?",
              secure_title: "Bảo mật Tuyệt đối", secure_desc: "Vé NFT chống giả mạo 100% trên nền tảng Blockchain.",
              instant_title: "Giao dịch Tức thì", instant_desc: "Mua bán và chuyển nhượng vé chỉ trong vài giây.",
              market_title: "Chợ Vé An Toàn", market_desc: "Giao dịch pass vé minh bạch, tự động chuyển tiền qua Smart Contract.",
              smart_title: "Hợp Đồng Thông Minh", smart_desc: "Tự động hóa mọi quy trình, trích lợi nhuận trực tiếp về ví BTC.",
              trust_stat: "Người dùng tin tưởng"
            }
          },
          explore: {
            title: "Khám phá", title_highlight: "Sự kiện",
            subtitle: "Tìm kiếm show diễn hoàn hảo cho gu âm nhạc của bạn.",
            filters: "Bộ lọc",
            search_placeholder: "Tên sự kiện, nghệ sĩ...",
            category_label: "Danh mục",
            price_label: "Khoảng giá",
            date_label: "Chọn ngày",
            clear_all: "Xóa tất cả",
            no_results: "Không tìm thấy sự kiện nào khớp với bộ lọc của bạn.",
            found: "Tìm thấy {{count}} sự kiện"
          },
          profile: {
            title: "Hồ sơ", user: "Người dùng",
            tabs: {
              info: "Thông tin cá nhân",
              wallet: "Ví & Bảo mật",
              security: "Cài đặt tài khoản"
            },
            labels: {
              name: "Họ và tên", phone: "Số điện thoại", dob: "Ngày sinh", address: "Địa chỉ", email: "Địa chỉ Email",
              save: "Lưu thay đổi", cancel: "Hủy", edit: "Chỉnh sửa",
              save_success: "Cập nhật hồ sơ thành công!", update_failed: "Cập nhật thất bại, vui lòng thử lại."
            },
            roles: {
              admin: "Quản trị viên", organizer: "Ban tổ chức", customer: "Khách hàng"
            },
            placeholders: {
               address: "Ví dụ: 123 Quận 1, TP.HCM"
            },
            wallet: {
              title: "Ví Custodial", desc: "Được quản lý an toàn bởi BASTICKET", address: "Địa chỉ ví", balance: "Số dư",
              no_wallet: "Chưa kết nối ví", network: "Mạng lưới", type: "Loại ví"
            },
            security: {
              title: "Bảo mật tài khoản", desc: "Quản lý mật khẩu và các tùy chọn bảo mật của bạn.", change_pass: "Đổi mật khẩu",
              pass_desc: "Luôn giữ mật khẩu của bạn an toàn và riêng tư.", preferences: "Tùy chọn", email_notif: "Thông báo qua Email",
              old_pass: "Mật khẩu cũ", new_pass: "Mật khẩu mới", confirm_new_pass: "Xác nhận mật khẩu mới",
              change_success: "Đổi mật khẩu thành công!", change_failed: "Đổi mật khẩu thất bại."
            },
            forgot: {
              title: "Quên mật khẩu", desc: "Nhập email để nhận mã OTP khôi phục.",
              email_placeholder: "Nhập email của bạn...", send_btn: "Gửi mã OTP",
              verify_title: "Xác thực OTP", verify_desc: "Nhập mã đã gửi tới email và mật khẩu mới của bạn.",
              otp_label: "Mã OTP", new_pass_label: "Mật khẩu mới", reset_btn: "Đặt lại mật khẩu",
              success: "Đặt lại mật khẩu thành công!"
            },
            organizer: {
              title: "Thông tin Tổ chức", name: "Tên tổ chức", kyc: "Trạng thái KYC", desc: "Mô tả"
            }
          }
        }
      }
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
