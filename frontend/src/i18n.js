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
            home: "Home", events: "Events", marketplace: "Marketplace", blog: "Blog", community: "Community", organizer: "For Organizers"
          },
          auth: {
            login: "Sign In", signup: "Sign Up", welcome: "Welcome back to BASTICKET", welcome_desc: "Secure login to the system.",
            create: "Create Account", create_desc: "Automatically generates a secure Web3 Custodial Wallet for your tickets.",
            email: "Email address", email_phone: "Email or Phone number", forgot: "Forgot password?", pass: "Password", name: "Full Name", dob: "Date of Birth", phone: "Phone Number", cpass: "Confirm Password",
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
            for_you: {
              title: "Events For",
              title_highlight: "You",
              subtitle: "BASTICKET's curated picks tailored to your taste"
            },
            time_filter: {
              title: "Coming",
              title_highlight: "Up",
              subtitle: "Don't miss what's happening next",
              this_week: "This Week",
              this_month: "This Month"
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
          eventDetail: {
            loading: "Loading masterpiece...",
            notFound: "Event not found",
            back: "Back",
            musicEvent: "Music Event",
            onSale: "On Sale",
            time: "Time",
            location: "Location",
            pendingUpdate: "Pending update",
            map: "Map",
            organizer: "Organizer",
            lowestPriceFrom: "Lowest price from",
            free: "FREE",
            buyNow: "BUY TICKETS NOW",
            introduction: "Event Introduction",
            infoUpdating: "Information is being updated...",
            importantNote: "Important Note",
            note1: "Please double-check ticket tier and time before checkout.",
            note2: "Purchased tickets are non-refundable unless canceled by the Organizer.",
            note3: "The event uses digital tickets as eco-friendly NFTs & Dynamic QR codes.",
            buyTicket: "Buy Tickets",
            ticketCategories: "tiers",
            unitPrice: "Price",
            soldOut: "SOLD OUT",
            remaining: "LEFT:",
            noTickets: "No tickets available yet",
            subtotal: "Subtotal",
            checkoutNow: "Checkout Now",
            locationMap: "Location Map",
            noCoordinates: "No coordinate data",
            viewSeatingChart: "View Seating Chart",
            image: "Image"
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
          },
          publicOrganizer: {
            notFound: "Organizer not found",
            joinedSince: "Joined since",
            activeStatus: "Active",
            totalEvents: "EVENTS",
            status: "STATUS",
            follow: "Follow Now",
            about: "About the organizer",
            noDescription: "This organizer hasn't updated their detailed introduction yet.",
            upcomingEvents: "Upcoming Events",
            pastEvents: "Past Events",
            blog: "Blog",
            noUpcomingEvents: "No upcoming events from this organizer",
            noPastEvents: "No past events from this organizer",
            blogTitle: "Experience Journal & Reviews",
            blogPlaceholder: "Blog is where customers share moments and reviews after attending events. This feature will be launched soon to connect the event-loving community!"
          },
          common: {
            back: "Back",
            backHome: "Back Home",
            events: "events",
            viewDetails: "View Details",
            ended: "Ended",
            loading: "Loading..."
          },
          footer: {
            newsletter_title: "Subscribe for exclusive offers",
            newsletter_subtitle: "Receive updates on the hottest events immediately",
            email_placeholder: "Your email...",
            subscribe_btn: "Join Now",
            description: "Next-generation event ticketing platform, powered by secure Blockchain technology.",
            platform: {
                title: "Platform",
                events: "Events",
                marketplace: "Marketplace",
                blog: "Blog",
                organizer: "For Organizers"
            },
            support: {
                title: "Support",
                help: "Help Center",
                terms: "Terms of Service",
                privacy: "Privacy Policy",
                refund: "Refund Policy"
            },
            connect: {
                title: "Connect",
                address: "DUT - University of Danang, Vietnam"
            },
            copyright: "BUILT WITH ❤️ FOR THE WEB3 COMMUNITY."
          },
          support: {
            lastUpdated: "Last updated: April 01, 2026",
            ctaTitle: "Need more help?",
            ctaDesc: "If you have any questions about our policies, please contact our support team.",
            ctaEmail: "Send Email",
            ctaFaq: "View FAQ",
            customerTerms: {
              title: "Customer", titleHighlight: "Terms",
              subtitle: "Please read the following terms carefully before using BASTICKET's ticketing service.",
              badge: "Last updated: April 01, 2026",
              nav: ["1. Introduction", "2. NFT Ticket Ownership", "3. Booking Process", "4. Payment & Fees", "5. Transfer & Resale", "6. Refund Policy", "7. Account Security"],
              s1Title: "1. Introduction",
              s2Title: "2. NFT Ticket Ownership",
              s3Title: "3. Booking Process",
              s4Title: "4. Payment & Fees",
              s5Title: "5. Transfer & Resale",
              s6Title: "6. Refund Policy",
              s7Title: "7. Account Security"
            },
            organizerTerms: {
              title: "Organizer", titleHighlight: "Terms",
              subtitle: "Regulations for organizations and individuals using the BASTICKET platform.",
              badge: "Last updated: April 01, 2026",
              nav: ["1. Partnership & Registration", "2. Event Creation Rules", "3. Ticket Management", "4. Revenue & Payment", "5. Service Fees", "6. Responsibilities"],
              s1Title: "1. Partnership & Registration",
              s2Title: "2. Event Creation Rules",
              s6Title: "6. Organizer Responsibilities"
            },
            privacy: {
              title: "Privacy", titleHighlight: "Policy",
              subtitle: "Our commitment to protecting your privacy and personal data.",
              nav: ["1. Data Collection", "2. Data Usage", "3. Blockchain Transparency", "4. Data Security", "5. Your Rights", "6. Contact"],
              s1Title: "1. Personal Information Collection",
              s3Title: "3. Blockchain Transparency",
              s4Title: "4. Data Security",
              s5Title: "5. Your Rights",
              s6Title: "6. Contact Us"
            },
            refund: {
              title: "Refund", titleHighlight: "Policy",
              subtitle: "Transparent refund processes protecting interests of both parties.",
              badge: "Last updated: April 01, 2026",
              warningTitle: "General Rule for NFT Tickets",
              casesTitle: "Refundable Cases",
              processTitle: "Request Process"
            },
            faq: {
              title: "Help", titleHighlight: "Center",
              searchPlaceholder: "Search your question...",
              cats: { account: "Account", ticket: "Tickets", marketplace: "Marketplace", payment: "Payment", app: "Technical" },
              noResults: "Sorry, no questions found matching your keyword.",
              stillNeedHelp: "Still need help?",
              contactBtn: "Submit Support Request"
            },
            blog: {
              title: "Explore", titleHighlight: "the NFT World",
              subtitle: "Stay updated on the latest trends in Blockchain technology and events.",
              badge: "BASTICKET Newsletter",
              readMore: "Read Article"
            }
          },
          checkout: {
            title: "Complete Checkout",
            orderNumber: "Order:",
            holdTime: "Payment window",
            holdTimeDesc: "Tickets are being held for you",
            eventUpcoming: "Upcoming Event",
            officialTicket: "Official Ticket",
            digitalTicket: "NFT Digital Ticket",
            ticketDetails: "Ticket Tier Details",
            quantity: "Quantity:",
            blockchainVerified: "Verified by Polygon Blockchain",
            orderSummary: "Order Summary",
            subtotal: "Subtotal",
            serviceFee: "Service Fee",
            free: "Free",
            totalToPay: "Total to Pay",
            selectMethod: "Select Payment Method",
            payNow: "PAY NOW",
            expired: "Order has expired. Please try again.",
            initializing: "Initializing...",
            syncing: "Syncing Secure Pay...",
            vnpayGateway: "VNPay Gateway",
            momoWallet: "MoMo Wallet",
            instant: "Instant",
            secure: "Secure",
            active: "Active",
            verified: "Verified",
            paymentMethod: "Payment Method",
            addons: "Add-ons & Accessories",
            couponCode: "Promo Code",
            apply: "Apply",
            merchandiseTotal: "Merchandise Subtotal",
            discount: "Discount",
            couponApplied: "Coupon applied successfully",
            invalidCoupon: "Invalid or expired coupon",
            remove: "Remove",
            stock: "Left:",
            selectVoucher: "Select Voucher",
            availableVouchers: "Available Vouchers",
            minSpend: "Min Spend",
            expiry: "Expiry",
            noAvailableVouchers: "No vouchers available for this event.",
            condition: "Condition"
          }
        }
      },
      vi: {
        translation: {
          nav: {
            home: "Trang chủ", events: "Sự kiện", marketplace: "Chợ vé", blog: "Blog", community: "Cộng đồng", organizer: "Dành cho BTC"
          },
          auth: {
            login: "Đăng nhập", signup: "Đăng ký", welcome: "Chào mừng trở lại BASTICKET", welcome_desc: "Đăng nhập an toàn vào hệ thống.",
            create: "Tạo tài khoản", create_desc: "Hệ thống tự động khởi tạo Ví Ẩn Web3 siêu bảo mật.",
            email: "Địa chỉ Email", email_phone: "Email hoặc Số điện thoại", forgot: "Quên mật khẩu?", pass: "Mật khẩu", name: "Họ và Tên", dob: "Ngày tháng năm sinh", phone: "Số điện thoại", cpass: "Xác nhận Mật khẩu",
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
            click_to_pin: "Click để ghim trên bản đồ",
            setup_location: "Thiết lập Vị trí",
            province_label: "Tỉnh / Thành phố (*)",
            province_placeholder: "-- Chọn Tỉnh/Thành phố --",
            district_label: "Quận / Huyện (*)",
            district_placeholder: "-- Chọn Quận/Huyện --",
            ward_label: "Phường / Xã (*)",
            ward_placeholder: "-- Chọn Phường/Xã --",
            detail_label: "Số nhà, Tên đường cụ thể (*)",
            detail_placeholder: "VD: 123 Nguyễn Sinh Cung...",
            debounce_hint: "* Bản đồ sẽ tự động tìm vị trí sau 1.5 giây khi bạn ngừng gõ.",
            confirm_btn: "Xác nhận Địa chỉ",
            map_instruction: "Click vào bản đồ để ghim đúng vị trí!",
            err_incomplete: "Vui lòng chọn đủ Phường/Xã và nhập số nhà!"
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
            for_you: {
              title: "Sự kiện cho",
              title_highlight: "Riêng bạn",
              subtitle: "Gợi ý từ BASTICKET dựa trên sở thích của bạn"
            },
            time_filter: {
              title: "Sắp",
              title_highlight: "Diễn ra",
              subtitle: "Đừng bỏ lỡ những sự kiện hot nhất",
              this_week: "Tuần này",
              this_month: "Tháng này"
            },
            categories: {
              title: "Khám phá theo Thể loại",
              view_all: "Xem Tất Cả",
              all: "Tất cả", music: "Âm nhạc", workshop: "Hội thảo", sports: "Thể thao", theater: "Sân khấu", festival: "Lễ hội", food: "Ẩm thực", travel: "Du lịch", charity: "Từ thiện"
            },
            events: {
              title: "Sự kiện", title_highlight: "Sắp tới",
              subtitle: "Khám phá những show diễn đẳng cấp nhất đang chờ đón bạn.",
              view_all: "Xem tất cả show",
              not_found: "Không có sự kiện nào trong danh mục này"
            },
            features: {
              title_part1: "Tại sao chọn", title_highlight: "BASTICKET?",
              secure_title: "Bảo mật Tuyệt đối", secure_desc: "Vé NFT chống giả mạo 100% trên Blockchain.",
              instant_title: "Giao dịch Tức thì", instant_desc: "Mua, bán và chuyển nhượng vé chỉ trong vài giây.",
              market_title: "Chợ vé An toàn", market_desc: "Thanh khoản vé minh bạch, tự động nhận tiền qua Smart Contract.",
              smart_title: "Hợp đồng Thông minh", smart_desc: "Tự động hóa quy trình, trích xuất lợi nhuận trực tiếp về ví.",
              trust_stat: "Người dùng tin tưởng"
            }
          },
          eventDetail: {
            loading: "Đang tải siêu phẩm...",
            notFound: "Không tìm thấy sự kiện",
            back: "Quay lại",
            musicEvent: "Sự kiện Âm nhạc",
            onSale: "Đang mở bán",
            time: "Thời gian",
            location: "Địa điểm",
            pendingUpdate: "Đang cập nhật",
            map: "Bản đồ",
            organizer: "Ban tổ chức",
            lowestPriceFrom: "Giá thấp nhất từ",
            free: "MIỄN PHÍ",
            buyNow: "CHỌN VÉ NGAY",
            introduction: "Giới thiệu Sự kiện",
            infoUpdating: "Thông tin đang được cập nhật...",
            importantNote: "Lưu ý quan trọng",
            note1: "Vui lòng kiểm tra kỹ loại vé và thời gian trước khi thanh toán.",
            note2: "Vé đã mua không thể hoàn trả trừ khi sự kiện bị hủy bởi BTC.",
            note3: "Sự kiện sử dụng vé điện tử NFT & QR code động thân thiện môi trường.",
            buyTicket: "Mua vé",
            ticketCategories: "loại vé",
            unitPrice: "Giá vé",
            soldOut: "HẾT VÉ",
            remaining: "CÒN LẠI:",
            noTickets: "Chưa có loại vé khả dụng",
            subtotal: "Tạm tính",
            checkoutNow: "Thanh toán ngay",
            locationMap: "Bản đồ địa điểm",
            noCoordinates: "Chưa có dữ liệu tọa độ",
            viewSeatingChart: "Xem sơ đồ ghế",
            image: "Hình ảnh"
          },
          explore: {
            title: "Khám phá", title_highlight: "Sự kiện",
            subtitle: "Tìm kiếm show diễn hoàn hảo phù hợp với phong cách của bạn.",
            filters: "Bộ lọc",
            search_placeholder: "Tên sự kiện, nghệ sĩ...",
            category_label: "Thể loại",
            price_label: "Khoảng giá",
            date_label: "Chọn ngày",
            clear_all: "Xóa tất cả",
            no_results: "Không tìm thấy sự kiện nào phù hợp với bộ lọc.",
            found: "Tìm thấy {{count}} sự kiện"
          },
          profile: {
            title: "Hồ sơ", user: "Người dùng",
            tabs: {
              info: "Thông tin cá nhân",
              wallet: "Ví & Bảo mật",
              security: "Thiết lập tài khoản"
            },
            labels: {
              name: "Họ và Tên", phone: "Số điện thoại", dob: "Ngày sinh", address: "Địa chỉ", email: "Địa chỉ Email",
              save: "Lưu thay đổi", cancel: "Hủy bỏ", edit: "Chỉnh sửa hồ sơ",
              save_success: "Cập nhật hồ sơ thành công!", update_failed: "Cập nhật thất bại, vui lòng thử lại."
            },
            roles: {
              admin: "Quản trị viên", organizer: "Nhà tổ chức", customer: "Khách hàng"
            },
            placeholders: {
               address: "VD: 123 Quận 1, TP. HCM"
            },
            wallet: {
              title: "Ví Custodial", desc: "Quản lý an toàn bởi BASTICKET", address: "Địa chỉ ví", balance: "Số dư",
              no_wallet: "Chưa kết nối ví", network: "Mạng lưới", type: "Loại ví"
            },
            security: {
              title: "Bảo mật tài khoản", desc: "Quản lý mật khẩu và các thiết lập an toàn.", change_pass: "Đổi mật khẩu",
              pass_desc: "Luôn giữ mật khẩu của bạn an toàn và riêng tư.", preferences: "Tùy chọn", email_notif: "Thông báo qua Email",
              old_pass: "Mật khẩu cũ", new_pass: "Mật khẩu mới", confirm_new_pass: "Xác nhận mật khẩu mới",
              change_success: "Đổi mật khẩu thành công!", change_failed: "Đổi mật khẩu thất bại."
            },
            forgot: {
              title: "Quên mật khẩu", desc: "Nhập email để nhận mã OTP khôi phục.",
              email_placeholder: "Nhập email của bạn...", send_btn: "Gửi mã OTP",
              verify_title: "Xác thực OTP", verify_desc: "Nhập mã đã gửi đến email và mật khẩu mới.",
              otp_label: "Mã OTP", new_pass_label: "Mật khẩu mới", reset_btn: "Đặt lại mật khẩu",
              success: "Đã đặt lại mật khẩu thành công!"
            },
            organizer: {
              title: "Thông tin BTC", name: "Tên tổ chức", kyc: "Trạng thái KYC", desc: "Mô tả"
            }
          },
          publicOrganizer: {
            notFound: "Không tìm thấy nhà tổ chức",
            joinedSince: "Tham gia từ",
            activeStatus: "Đang hoạt động",
            totalEvents: "SỰ KIỆN",
            status: "TRẠNG THÁI",
            follow: "Theo dõi ngay",
            about: "Về nhà tổ chức",
            noDescription: "Nhà tổ chức này chưa cập nhật giới thiệu chi tiết.",
            upcomingEvents: "Sự kiện sắp tới",
            pastEvents: "Sự kiện đã qua",
            blog: "Blog",
            noUpcomingEvents: "Chưa có sự kiện sắp tới nào",
            noPastEvents: "Chưa có sự kiện đã qua nào",
            blogTitle: "Nhật ký trải nghiệm & Đánh giá",
            blogPlaceholder: "Blog là nơi khách hàng chia sẻ khoảnh khắc và đánh giá sau sự kiện. Tính năng sẽ sớm ra mắt!"
          },
          common: {
            back: "Quay lại",
            backHome: "Về trang chủ",
            events: "sự kiện",
            viewDetails: "Xem chi tiết",
            ended: "Đã kết thúc",
            loading: "Đang tải..."
          },
          footer: {
            newsletter_title: "Đăng ký nhận ưu đãi độc quyền",
            newsletter_subtitle: "Nhận cập nhật về các sự kiện hot nhất ngay lập tức",
            email_placeholder: "Email của bạn...",
            subscribe_btn: "Tham gia ngay",
            description: "Nền tảng phát hành vé sự kiện thế hệ mới, ứng dụng công nghệ Blockchain bảo mật.",
            platform: {
                title: "Nền tảng",
                events: "Sự kiện",
                marketplace: "Chợ vé",
                blog: "Blog",
                organizer: "Dành cho BTC"
            },
            support: {
                title: "Hỗ trợ",
                help: "Trung tâm trợ giúp",
                terms: "Điều khoản dịch vụ",
                privacy: "Chính sách bảo mật",
                refund: "Chính sách hoàn tiền"
            },
            connect: {
                title: "Kết nối",
                address: "DUT - Đại học Đà Nẵng, Việt Nam"
            },
            copyright: "BUILT WITH ❤️ FOR THE WEB3 COMMUNITY."
          },
          support: {
            lastUpdated: "Cập nhật mới nhất: 01/04/2026",
            ctaTitle: "Cần hỗ trợ thêm?",
            ctaDesc: "Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ đội ngũ của chúng tôi.",
            ctaEmail: "Gửi Email",
            ctaFaq: "Xem FAQ",
            customerTerms: {
              title: "Điều khoản", titleHighlight: "Khách hàng",
              subtitle: "Vui lòng đọc kỹ các điều khoản trước khi sử dụng dịch vụ của BASTICKET.",
              badge: "Cập nhật: 01/04/2026",
              nav: ["1. Giới thiệu", "2. Quyền sở hữu vé NFT", "3. Quy trình đặt vé", "4. Thanh toán & Phí", "5. Chuyển nhượng & Bán lại", "6. Chính sách hoàn tiền", "7. Bảo mật tài khoản"]
            },
            organizerTerms: {
              title: "Điều khoản", titleHighlight: "Nhà tổ chức",
              subtitle: "Quy định dành cho tổ chức và cá nhân sử dụng BASTICKET.",
              badge: "Cập nhật: 01/04/2026",
              nav: ["1. Hợp tác", "2. Sự kiện", "3. Vé & NFT", "4. Doanh thu", "5. Phí dịch vụ", "6. Trách nhiệm"]
            },
            privacy: {
              title: "Chính sách", titleHighlight: "Bảo mật",
              subtitle: "Cam kết bảo tồn quyền riêng tư và dữ liệu cá nhân của bạn.",
              nav: ["1. Thu thập", "2. Sử dụng", "3. Blockchain", "4. Bảo mật", "5. Quyền lợi", "6. Liên hệ"]
            },
            refund: {
              title: "Chính sách", titleHighlight: "Hoàn tiền",
              subtitle: "Quy trình hoàn tiền minh bạch bảo vệ quyền lợi hai bên.",
              badge: "Cập nhật: 01/04/2026"
            },
            faq: {
              title: "Trung tâm", titleHighlight: "Trợ giúp",
              searchPlaceholder: "Tìm kiếm...",
              cats: { account: "Tài khoản", ticket: "Vé", marketplace: "Chợ vé", payment: "Thanh toán", app: "Kỹ thuật" },
              contactBtn: "Gửi yêu cầu hỗ trợ"
            },
            blog: {
              title: "Khám phá", titleHighlight: "Thế giới NFT",
              subtitle: "Cập nhật xu hướng công nghệ Blockchain và sự kiện.",
              badge: "Bản tin BASTICKET",
              readMore: "Xem bài viết"
            }
          },
          checkout: {
            title: "Hoàn tất Thanh toán",
            orderNumber: "Đơn hàng:",
            holdTime: "Thời gian thanh toán",
            holdTimeDesc: "Vé đang được giữ cho bạn",
            eventUpcoming: "Sự kiện Sắp diễn ra",
            officialTicket: "Vé chính thức",
            digitalTicket: "Vé NFT Digital",
            ticketDetails: "Chi tiết hạng vé",
            quantity: "Số lượng:",
            blockchainVerified: "Xác thực bởi Polygon Blockchain",
            orderSummary: "Tổng đơn hàng",
            subtotal: "Tạm tính",
            serviceFee: "Phí dịch vụ",
            free: "Miễn phí",
            totalToPay: "Tổng tiền cần trả",
            selectMethod: "Chọn phương thức thanh toán",
            payNow: "THANH TOÁN NGAY",
            expired: "Đơn hàng đã hết hạn thanh toán.",
            initializing: "Đang khởi tạo...",
            syncing: "Đang đồng bộ thanh toán...",
            vnpayGateway: "Cổng VNPay",
            momoWallet: "Ví MoMo",
            instant: "Tức thì",
            secure: "Bảo mật",
            active: "Hoạt động",
            verified: "Đã xác thực",
            paymentMethod: "Phương thức thanh toán",
            addons: "Sản phẩm mua kèm",
            couponCode: "Mã giảm giá",
            apply: "Áp dụng",
            merchandiseTotal: "Tổng tiền phụ kiện",
            discount: "Giảm giá",
            couponApplied: "Áp dụng mã giảm giá thành công",
            invalidCoupon: "Mã không hợp lệ hoặc hết hạn",
            remove: "Gỡ bỏ",
            stock: "Còn lại:",
            selectVoucher: "CHỌN MÃ",
            availableVouchers: "Mã giảm giá khả dụng",
            minSpend: "Đơn tối thiểu",
            expiry: "Hạn dùng",
            noAvailableVouchers: "Chưa có mã giảm giá nào khả dụng cho sự kiện này.",
            condition: "Điều kiện"
          }
        }
      }
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
