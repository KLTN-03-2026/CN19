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
            home: "Home", events: "Events", marketplace: "Marketplace", blog: "Blog", organizer: "For Organizers"
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
              orgLink: "Are you an Organizer?", orgLinkSub: "View Organizer Terms here →",
              s1Title: "1. Introduction",
              s1p1: "Welcome to BASTICKET – The next-generation event ticketing platform powered by Blockchain and AI.",
              s1p2: "By transacting on our platform, you agree to comply with these Terms of Use. BASTICKET acts as an intermediary connecting Event Organizers and Customers, ensuring ticket authenticity through Smart Contracts.",
              s2Title: "2. NFT Ticket Ownership",
              s2p1: "Each ticket purchased on BASTICKET is a unique digital asset (NFT) on the Polygon network.",
              s2i1: "You have full ownership rights to manage this NFT ticket in your system wallet.",
              s2i2: "NFT tickets contain encrypted metadata including: Event ID, ticket type, and Organizer's digital signature.",
              s3Title: "3. Booking Process",
              s3p1: "The ticketing process is automated through the web interface. You must provide accurate information including Email and Phone Number to identify your assets.",
              s3p2: "The system will 'Mint' the NFT ticket immediately after successful payment. Blockchain processing time may range from 10-60 seconds.",
              s4Title: "4. Payment & Fees",
              s4p1: "Ticket prices listed on the website are inclusive of applicable taxes. In addition to the ticket price, you may be charged:",
              s4i1: "System utility fee (System Fee).",
              s4i2: "Blockchain network transaction fee (Gas Fee) – usually covered by BASTICKET.",
              s4i3: "Payment gateway fee (VNPAY / International Card).",
              s5Title: "5. Transfer & Resale",
              s5p1: "BASTICKET supports a secondary market (Marketplace) allowing users to liquidate tickets:",
              s5transfer: "Transfer", s5transferDesc: "You can gift your ticket to a friend via Email. Royalty fees may apply depending on Organizer settings.",
              s5resale: "Resale", s5resaleDesc: "Resale price cannot exceed the 'Price Ceiling' set by the Organizer to prevent scalping.",
              s6Title: "6. Refund Policy",
              s6p1: "NFT tickets are non-refundable by default after successful minting, except in the following cases:",
              s6i1: "The event is completely canceled by the Organizer.",
              s6i2: "The event changes time/location and you cannot attend (request must be submitted within 48h).",
              s6i3: "Technical error from the BASTICKET system preventing ticket issuance.",
              s7Title: "7. Account Security",
              s7p1: "To protect your NFT ticket assets, BASTICKET strongly recommends the following security practices:",
              s7i1: "Use a strong, unique password of at least 12 characters, including uppercase letters, numbers, and special symbols.",
              s7i2: "Never share your login credentials, OTP code, or account information with anyone, including BASTICKET staff (we will never ask for your password).",
              s7i3: "Log out of your account on shared or public devices after use.",
              s7i4: "If you detect any suspicious activity on your account, change your password immediately and contact BASTICKET support."
            },
            organizerTerms: {
              title: "Organizer", titleHighlight: "Terms",
              subtitle: "Regulations for organizations and individuals using the BASTICKET platform to issue and manage event tickets.",
              badge: "Last updated: April 01, 2026",
              nav: ["1. Partnership & Registration", "2. Event Creation Rules", "3. Ticket & NFT Management", "4. Revenue & Payment", "5. Service Fees & Royalties", "6. Organizer Responsibilities"],
              s1Title: "1. Partnership & Registration",
              s1p1: "Organizers (BTC) must provide complete legal or personal information to activate a partner account. BASTICKET reserves the right to reject non-transparent applications.",
              s1p2: "BTC is solely responsible for the accuracy of event content published on the platform.",
              s2Title: "2. Event Creation Rules",
              s2p1: "Events are only made public after the system verifies venue and permit information (if required). BTC has the right to:",
              s2i1: "Set multiple ticket tiers (VIP, Standard, Early Bird) with different quantities and prices.",
              s2i2: "Enable/Disable the Transfer and Resale features on the Marketplace per ticket tier.",
              s3Title: "3. Ticket & NFT Management",
              s3p1: "BASTICKET automatically 'Mints' NFT tickets on the Polygon blockchain for customers on behalf of the BTC. BTC commits to recognizing the validity of NFT tickets successfully scanned through the system's Scanner app.",
              s4Title: "4. Revenue & Payment",
              s4p1: "Revenue reconciliation process:", s4i1: "Ticket sales proceeds are held by the payment gateway.", s4i2: "BTC requests a withdrawal after the event concludes successfully.", s4i3: "Reconciliation processing time: 3-5 business days after the event.",
              s5Title: "5. Service Fees & Royalties",
              s5p1: "BTC agrees to pay BASTICKET a service fee for each successfully sold ticket. The Royalty mechanism on the Marketplace works as follows:",
              s5boxTitle: "Marketplace Fee Mechanism",
              s5boxDesc: "BTC has the right to set a Royalty Fee % (e.g., 5-10%) for each resale of a ticket on the secondary market. This fee is directly deducted from the buyer's price and added to the BTC's revenue.",
              s6Title: "6. Organizer Responsibilities",
              s6p1: "BTC is fully responsible and bears the cost of refunds if:", s6i1: "The event is canceled due to BTC or reasons attributable to BTC.", s6i2: "Key event information is changed without timely notice.", s6i3: "Fraudulent acts or copyright violations related to event content.",
              partnerCta: "Want to partner with BASTICKET?",
              partnerCtaDesc: "Register as a partner today to receive the best support for NFT ticket management solutions.",
              partnerBtn: "Register as Organizer", contactBtn: "Business Inquiry"
            },
            privacy: {
              title: "Privacy", titleHighlight: "Policy",
              subtitle: "Our commitment to protecting your privacy and personal data is BASTICKET's top priority.",
              nav: ["1. Data Collection", "2. Data Usage", "3. Blockchain Transparency", "4. Data Security", "5. Your Rights", "6. Contact"],
              s1Title: "1. Personal Information Collection",
              s1card1Title: "Information you provide", s1card1Desc: "Full name, email, phone number, and encrypted password when registering an account or purchasing a ticket.",
              s1card2Title: "Transaction information", s1card2Desc: "Ticket purchase history, generated Blockchain wallet addresses, and payment data via VNPAY.",
              s3Title: "3. Blockchain Transparency",
              s3p1: "When an NFT ticket is minted, data about the ticket ID and event ID is publicly recorded on the Polygon network. This data cannot be deleted or modified. However, your actual personal information (Name, Email) is stored securely in BASTICKET's private database and is NOT publicly visible on the blockchain.",
              s4Title: "4. Data Security",
              s4t1: "Password Encryption", s4d1: "We use the powerful Bcrypt hashing algorithm to protect your password. BASTICKET staff cannot view your actual password.",
              s4t2: "AI Monitoring", s4d2: "The AI system continuously monitors suspicious access behaviors to prevent account hijacking attacks.",
              s5Title: "5. Your Rights",
              s5r1: "Right to access and request extraction of personal data.",
              s5r2: "Right to request correction of inaccurate information.",
              s5r3: "Right to request account deletion (after all NFT tickets have expired or been used).",
              s5r4: "Right to withdraw consent for marketing notifications.",
              s2Title: "2. How We Use Your Data",
              s2p1: "BASTICKET collects and uses your information solely for the following purposes. We do not sell or share personal data with third parties for advertising.",
              s2u1Title: "Service Delivery", s2u1Desc: "Processing ticket purchases, issuing NFT tickets, and sending order confirmation emails.",
              s2u2Title: "Account Management", s2u2Desc: "Verifying identity, managing your wallet, and recovering your account.",
              s2u3Title: "Security & Fraud Prevention", s2u3Desc: "Detecting suspicious activities and protecting your account from unauthorized access.",
              s2u4Title: "Platform Improvement", s2u4Desc: "Analyzing usage trends to improve features, performance, and user experience.",
              s6Title: "6. Contact Us",
              s6p1: "If you have any questions about this Privacy Policy or wish to exercise your rights regarding your personal data, please contact us via:",
              s6emailLabel: "Support Email",
              s6responseLabel: "Response Time",
              s6responseTime: "Within 24 business hours"
            },
            refund: {
              title: "Refund", titleHighlight: "Policy",
              subtitle: "Transparent refund processes and conditions protecting the interests of both customers and organizers.",
              badge: "Last updated: April 01, 2026",
              warningTitle: "General Rule for NFT Tickets",
              warningDesc: "Event tickets are digital assets (NFT) minted upon payment. By the nature of events, tickets are NON-REFUNDABLE by default unless the Organizer announces changes or cancellation.",
              casesTitle: "Refundable Cases",
              case1Title: "Event Canceled", case1Desc: "BTC announces complete cancellation with no replacement schedule.",
              case2Title: "Major Schedule Change", case2Desc: "BTC changes date/time or venue and allows refunds.",
              case3Title: "Issuance Error", case3Desc: "Customer pays successfully but the system cannot create the NFT ticket.",
              processTitle: "Request Process",
              step1Title: "Submit Request", step1Desc: "Use the 'Request Refund' feature in your ticket management section.",
              step2Title: "System Verification", step2Desc: "The System reviews the request within 3-5 business days.",
              step3Title: "Process Funds", step3Desc: "Money is transferred back to the original payment gateway (VNPAY/MoMo.",
              step4Title: "Complete", step4Desc: "Confirmation email sent upon successful refund.",
              notesTitle: "Timing & Fees",
              note1: "System Fee and Gas Fee are generally non-refundable as these are infrastructure costs incurred when creating the NFT ticket.",
              note2: "Time for funds to return depends on your bank: typically 7-15 business days for international cards and 3-5 days for domestic ATM (VNPAY).",
              note3: "In case of dispute between BTC and Customer, BASTICKET will act as intermediary based on Blockchain transaction data to make a final decision."
            },
            faq: {
              title: "Help", titleHighlight: "Center",
              searchPlaceholder: "Search your question...",
              cats: { account: "Account & Security", ticket: "Tickets & Usage", marketplace: "Marketplace & Transfer", payment: "Payment & Refunds", app: "App & Technical" },
              noResults: "Sorry, no questions found matching your keyword.",
              stillNeedHelp: "Still need help?",
              supportDesc: "BASTICKET's support team is always ready to help you 24/7.",
              contactBtn: "Submit Support Request",
              q1: "What is an NFT ticket and why do I need it?", a1: "An NFT ticket (Non-Fungible Token) is a digitized ticket authenticated on the Blockchain. It absolutely prevents ticket counterfeiting and allows you to own, transfer, and sell tickets transparently and securely.",
              q2: "Do I need my own cryptocurrency wallet to buy tickets?", a2: "No. BASTICKET automatically creates and manages a secure wallet for you through your Email account. You can purchase tickets using regular VND via VNPAY or MoMo.",
              q7: "How do I reset my password?", a7: "Click 'Forgot Password' on the login page. We will send a reset link to your registered email address. The link is valid for 15 minutes.",
              q8: "Can I change the email address linked to my account?", a8: "Currently, changing your registered email requires contacting BASTICKET support to verify your identity before updating.",
              q3: "Where do I receive my ticket after payment?", a3: "After successful payment, your ticket will appear in 'My Tickets'. The system will also send a confirmation email with ticket details.",
              q4: "How do I use my ticket at the event?", a4: "Simply open 'My Tickets', select your ticket, and display the dynamic QR code to the event staff. Note: This QR code changes continuously for security, so do not use screenshots.",
              q9: "Can I transfer my ticket to another person?", a9: "Yes. Go to 'My Tickets', select the ticket, and use the 'Transfer' feature. Enter the recipient's registered BASTICKET email. The NFT ticket will be transferred to their wallet instantly.",
              q10: "What if the QR code is not scannable at the event?", a10: "First, make sure your screen brightness is at maximum. If the issue persists, ask staff to manually verify via the ticket ID shown below the QR code, or call BASTICKET hotline for emergency support.",
              q5: "Can I resell my ticket above the original price?", a5: "Yes, but the resale price is limited by the 'Price Ceiling' set by the Organizer to protect fans from scalping.",
              q11: "How do I list my ticket on the Marketplace?", a11: "Go to 'My Tickets', select the ticket you want to sell, click 'Sell on Marketplace', set your desired price (within the Price Ceiling), and confirm. Your listing will be live immediately.",
              q12: "What is a Royalty Fee and who receives it?", a12: "A Royalty Fee is a percentage (e.g., 5-10%) set by the Organizer on each secondary resale. It is automatically deducted from the sale price and sent to the Organizer's account via Smart Contract.",
              q6: "How long does it take to receive a refund?", a6: "Depending on your bank, refunds typically arrive 3-5 business days (domestic ATM) or 7-15 days (international card).",
              q13: "What payment methods does BASTICKET support?", a13: "Currently, BASTICKET supports VNPAY (domestic ATM, QR code) and MoMo.",
              q14: "Why did my payment fail but money was still deducted?", a14: "This may be a temporary hold by your bank, not an actual charge. If the amount does not return within 24-48 hours, contact BASTICKET support with your transaction code for investigation.",
              q15: "Is there a BASTICKET mobile app?", a15: "Currently BASTICKET operates as a web application optimized for mobile browsers. A dedicated iOS and Android app is planned for future release.",
              q16: "Which browsers are best supported?", a16: "BASTICKET works best on the latest versions of Google Chrome, Microsoft Edge, and Safari. We recommend keeping your browser updated for the best experience with Web3 features."
            },
            blog: {
              title: "Explore", titleHighlight: "the NFT World",
              subtitle: "Stay updated on the latest trends in Blockchain technology, security, and top music events.",
              badge: "BASTICKET Newsletter",
              featuredLabel: "Featured",
              readMore: "Read Article"
            }
          }
        }
      },
      vi: {
        translation: {
          nav: {
            home: "Trang chủ", events: "Sự kiện", marketplace: "Chợ vé", blog: "Blog", organizer: "Dành cho BTC"
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
            for_you: {
              title: "Sự kiện dành cho",
              title_highlight: "Bạn",
              subtitle: "Lựa chọn của BASTICKET dành riêng cho gu của bạn"
            },
            time_filter: {
              title: "Sắp",
              title_highlight: "Diễn ra",
              subtitle: "Đừng bỏ lỡ những khoảnh khắc sắp tới",
              this_week: "Tuần này",
              this_month: "Tháng này"
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
          eventDetail: {
            loading: "Đang tải siêu phẩm...",
            notFound: "Không tìm thấy sự kiện",
            back: "Quay lại",
            musicEvent: "Sự kiện âm nhạc",
            onSale: "Đang mở bán",
            time: "Thời gian",
            location: "Địa điểm",
            pendingUpdate: "Đang chờ cập nhật",
            map: "Bản đồ",
            organizer: "Ban tổ chức",
            lowestPriceFrom: "Vé rẻ nhất chỉ từ",
            free: "MIỄN PHÍ",
            buyNow: "CHỌN VÉ NGAY",
            introduction: "Giới thiệu sự kiện",
            infoUpdating: "Thông tin đang được cập nhật...",
            importantNote: "Lưu ý quan trọng",
            note1: "Vui lòng kiểm tra kỹ hạng vé và thời gian trước khi thanh toán.",
            note2: "Vé đã mua không được hoàn trả dưới mọi hình thức trừ khi sự kiện bị hủy từ BTC.",
            note3: "Sự kiện sử dụng vé kỹ thuật số dưới dạng NFT sinh thái cao & Mã QR động bảo mật.",
            buyTicket: "Mua vé",
            ticketCategories: "hạng vé",
            unitPrice: "Đơn giá",
            soldOut: "HẾT VÉ",
            remaining: "CÒN",
            noTickets: "Sự kiện chưa có vé",
            subtotal: "Tổng Tạm Tính",
            checkoutNow: "Thanh toán ngay",
            locationMap: "Bản đồ địa điểm",
            noCoordinates: "Không có dữ liệu tọa độ",
            viewSeatingChart: "Sơ đồ khu vực",
            image: "Ảnh"
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
          },
          publicOrganizer: {
            notFound: "Không tìm thấy Ban tổ chức",
            joinedSince: "Tham gia từ",
            activeStatus: "Đang hoạt động",
            totalEvents: "SỰ KIỆN",
            status: "TRẠNG THÁI",
            follow: "Theo dõi ngay",
            about: "Về ban tổ chức",
            noDescription: "Ban tổ chức này chưa cập nhật thông tin giới thiệu chi tiết.",
            upcomingEvents: "Sự kiện sắp tới",
            pastEvents: "Sự kiện đã qua",
            blog: "Blog",
            noUpcomingEvents: "Ban tổ chức chưa có sự kiện nào sắp tới",
            noPastEvents: "Ban tổ chức chưa có sự kiện nào đã diễn ra",
            blogTitle: "Nhật ký trải nghiệm & Đánh giá",
            blogPlaceholder: "Blog là nơi khách hàng chia sẻ những khoảnh khắc và đánh giá sau khi tham gia sự kiện. Tính năng này sẽ sớm được ra mắt để kết nối cộng đồng yêu sự kiện!"
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
            newsletter_title: "Đăng ký nhận ưu đãi mới nhất",
            newsletter_subtitle: "Nhận thông tin về các sự kiện hot nhất ngay lập tức",
            email_placeholder: "Email của bạn...",
            subscribe_btn: "Đăng ký",
            description: "Nền tảng quản lý và phân phối vé sự kiện thế hệ mới, ứng dụng công nghệ Blockchain bảo mật tuyệt đối.",
            platform: {
                title: "Nền tảng",
                events: "Sự kiện",
                marketplace: "Marketplace",
                blog: "Blog",
                organizer: "Dành cho Ban tổ chức"
            },
            support: {
                title: "Hỗ trợ",
                help: "Trung tâm trợ giúp",
                terms: "Điều khoản sử dụng",
                privacy: "Chính sách bảo mật",
                refund: "Chính sách hoàn tiền"
            },
            connect: {
                title: "Kết nối",
                address: "Đại học Bách Khoa - Đại học Đà Nẵng, Việt Nam"
            },
            copyright: "ĐƯỢC XÂY DỰNG VỚI ❤️ DÀNH CHO CỘNG ĐỒNG WEB3."
          },
          support: {
            lastUpdated: "Cập nhật lần cuối: 01 tháng 04, 2026",
            ctaTitle: "Bạn cần hỗ trợ thêm?",
            ctaDesc: "Nếu có bất kỳ thắc mắc nào về điều khoản, vui lòng liên hệ đội ngũ CSKH của chúng tôi.",
            ctaEmail: "Gửi Email",
            ctaFaq: "Xem câu hỏi thường gặp",
            customerTerms: {
              title: "Điều khoản", titleHighlight: "Khách hàng",
              subtitle: "Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ đặt vé của BASTICKET.",
              badge: "Cập nhật lần cuối: 01 tháng 04, 2026",
              nav: ["1. Giới thiệu", "2. Quyền sở hữu vé NFT", "3. Quy trình đặt vé", "4. Thanh toán & Phí", "5. Chuyển nhượng & Bán lại", "6. Chính sách hoàn tiền", "7. Bảo mật tài khoản"],
              orgLink: "Bạn là Nhà tổ chức?", orgLinkSub: "Xem điều khoản Nhà tổ chức tại đây →",
              s1Title: "1. Giới thiệu",
              s1p1: "Chào mừng bạn đến với BASTICKET – Nền tảng phân phối vé sự kiện ứng dụng công nghệ Blockchain và AI.",
              s1p2: "Khi bạn thực hiện giao dịch trên hệ thống của chúng tôi, bạn đồng ý tuân thủ các Điều khoản sử dụng này. BASTICKET đóng vai trò là bên trung gian kết nối Nhà tổ chức sự kiện và Khách hàng, đảm bảo tính xác thực của vé thông qua hợp đồng thông minh.",
              s2Title: "2. Quyền sở hữu vé NFT",
              s2p1: "Mỗi vé được mua trên BASTICKET là một tài sản số (NFT) duy nhất trên mạng lưới Polygon.",
              s2i1: "Bạn sở hữu toàn quyền quản lý vé NFT này trong ví điện tử của mình trên hệ thống.",
              s2i2: "Vé NFT chứa các metadata được mã hóa bao gồm: ID sự kiện, loại vé, và chữ ký số của Nhà tổ chức.",
              s3Title: "3. Quy trình Đặt vé",
              s3p1: "Quy trình đặt vé tự động thông qua giao diện web. Bạn cần cung cấp thông tin chính xác bao gồm Email và Số điện thoại để định danh tài sản.",
              s3p2: "Hệ thống sẽ thực hiện 'Mint' (Đúc) vé NFT ngay sau khi thanh toán thành công. Thời gian xử lý Blockchain có thể dao động từ 10-60 giây.",
              s4Title: "4. Thanh toán & Phí",
              s4p1: "Giá vé niêm yết trên website đã bao gồm thuế (nếu có). Ngoài giá vé, bạn có thể phải trả:",
              s4i1: "Phí dịch vụ & Vận hành (8% phí sàn + 10.000đ phí Xác thực Blockchain/AI).",
              s4i2: "Phí giao dịch mạng lưới Blockchain (Gas Fee) - được BASTICKET hỗ trợ chi trả từ phí Xác thực.",
              s4i3: "Phí xử lý giao thức thanh toán (3% - đã bao gồm trong phí dịch vụ của BTC).",
              s5Title: "5. Chuyển nhượng & Bán lại",
              s5p1: "BASTICKET hỗ trợ thị trường thứ cấp (Marketplace) cho phép người dùng thanh khoản vé:",
              s5transfer: "Chuyển nhượng", s5transferDesc: "Bạn có thể tặng vé cho người khác qua Email. Người chuyển trả phí Xác thực 10.000đ/vé.",
              s5resale: "Bán lại", s5resaleDesc: "Giá bán không được vượt quá 108% giá gốc. Người bán chịu 3% phí bản quyền, người mua trả 3% phí giao dịch + 10.000đ phí Xác thực.",
              s6Title: "6. Chính sách Hoàn tiền",
              s6p1: "Vé NFT sau khi đã Mint thành công mặc định là KHÔNG hoàn trả, trừ các trường hợp sau:",
              s6i1: "Sự kiện bị hủy bỏ hoàn toàn bởi Nhà tổ chức.",
              s6i2: "Sự kiện thay đổi thời gian/địa điểm và bạn không thể tham dự (cần gửi yêu cầu trong 48h).",
              s6i3: "Lỗi kỹ thuật từ hệ thống BASTICKET dẫn đến việc không nhận được vé.",
              s7Title: "7. Bảo mật Tài khoản",
              s7p1: "Dề bảo vệ tài sản vé NFT của mình, BASTICKET khuyến nghị bạn thực hiện các biện pháp bảo mật sau:",
              s7i1: "Sử dụng mật khẩu mạnh, độc nhất tối thiểu 12 ký tự, bao gồm chữ hoa, số và ký tự đặc biệt.",
              s7i2: "Không bao giờ chia sẻ thông tin đăng nhập, mã OTP hay thông tin tài khoản cho bất kỳ ai, kể cả nhân viên BASTICKET (chúng tôi sẽ không bao giờ hỏi mật khẩu của bạn).",
              s7i3: "Người làm ra khỏi tài khoản sau khi sử dụng trên thiết bị công cộng hoặc máy tính dùng chung.",
              s7i4: "Nếu phát hiện hoạt động bất thường trên tài khoản, hãy đổi mật khẩu ngay và liên hệ BASTICKET để được hỗ trợ."
            },
            organizerTerms: {
              title: "Điều khoản", titleHighlight: "Nhà tổ chức",
              subtitle: "Quy định dành cho các đơn vị, cá nhân sử dụng nền tảng BASTICKET để phát hành và quản lý vé sự kiện.",
              badge: "Cập nhật lần cuối: 01 tháng 04, 2026",
              nav: ["1. Hợp tác & Đăng ký", "2. Quy định tạo sự kiện", "3. Quản lý Vé & NFT", "4. Doanh thu & Thanh toán", "5. Phí dịch vụ & Royalty", "6. Trách nhiệm Nhà tổ chức"],
              s1Title: "1. Hợp tác & Đăng ký",
              s1p1: "Nhà tổ chức (BTC) cần cung cấp đầy đủ thông tin pháp lý hoặc cá nhân để kích hoạt tài khoản đối tác. BASTICKET có quyền từ chối các yêu cầu không minh bạch.",
              s1p2: "BTC chịu trách nhiệm về tính chính xác của các nội dung sự kiện được đăng tải trên hệ thống.",
              s2Title: "2. Quy định Tạo Sự kiện",
              s2p1: "Sự kiện chỉ được công khai sau khi hệ thống xác thực thông tin về địa điểm và giấy phép (nếu yêu cầu). BTC có quyền:",
              s2i1: "Thiết lập nhiều hạng vé (VIP, Standard, Early Bird) với số lượng và giá khác nhau.",
              s2i2: "Bật/Tắt tính năng Chuyển nhượng và Bán lại trên Marketplace cho từng hạng vé.",
              s3Title: "3. Quản lý Vé & NFT",
              s3p1: "BASTICKET tự động 'Mint' vé NFT trên chuỗi khối Polygon cho khách hàng thay mặt BTC. BTC cam kết công nhận tính hợp pháp của vé NFT được quét thành công qua ứng dụng Scanner của hệ thống.",
              s4Title: "4. Doanh thu & Thanh toán",
              s4p1: "Quy trình đối soát tài chính:", s4i1: "Tiền bán vé được giữ bởi cổng thanh toán trung gian.", s4i2: "BTC yêu cầu rút tiền (Withdraw) sau khi sự kiện kết thúc thành công.", s4i3: "Thời gian xử lý đối soát: Từ 3-5 ngày làm việc sau sự kiện.",
              s5Title: "5. Phí Dịch vụ & Royalty",
              s5p1: "BTC đồng ý trả phí dịch vụ cho BASTICKET trên mỗi vé bán ra thành công. Cơ chế Royalty (Phí bản quyền) trên Marketplace hoạt động như sau:",
              s5boxTitle: "Cơ chế thu phí Hệ thống",
              s5boxDesc: "BTC trả 8% + 10.000đ trên mỗi vé sơ cấp. Đối với Marketplace, phí bản quyền (Royalty) cố định là 3% trên giá bán lại, tự động chuyển về ví BTC ngay khi khớp lệnh.",
              s6Title: "6. Trách nhiệm Nhà tổ chức",
              s6p1: "BTC chịu hoàn toàn trách nhiệm và chi phí hoàn tiền nếu:", s6i1: "Sự kiện bị hủy bỏ do BTC hoặc các nguyên nhân chủ quan từ phía BTC.", s6i2: "Thay đổi thông tin quan trọng của sự kiện mà không thông báo kịp thời.", s6i3: "Các hành vi gian lận hoặc vi phạm bản quyền nội dung sự kiện.",
              partnerCta: "Bạn muốn hợp tác cùng BASTICKET?",
              partnerCtaDesc: "Đăng ký trở thành đối tác ngay hôm nay để nhận hỗ trợ tốt nhất về giải pháp quản lý vé NFT.",
              partnerBtn: "Đăng ký Nhà tổ chức", contactBtn: "Liên hệ kinh doanh"
            },
            privacy: {
              title: "Chính sách", titleHighlight: "Bảo mật",
              subtitle: "Cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn là ưu tiên hàng đầu của BASTICKET.",
              nav: ["1. Thu thập thông tin", "2. Sử dụng thông tin", "3. Minh bạch Blockchain", "4. Bảo mật dữ liệu", "5. Quyền của người dùng", "6. Liên hệ"],
              s1Title: "1. Thu thập thông tin cá nhân",
              s1card1Title: "Thông tin bạn cung cấp", s1card1Desc: "Họ tên, email, số điện thoại, mật khẩu mã hóa khi đăng ký tài khoản hoặc mua vé.",
              s1card2Title: "Thông tin giao dịch", s1card2Desc: "Lịch sử mua vé, địa chỉ ví Blockchain phát sinh, và các dữ liệu thanh toán qua cổng VNPAY.",
              s3Title: "3. Đặc thù Minh bạch Blockchain",
              s3p1: "Khi một vé NFT được tạo ra (Mint), dữ liệu về ID vé và ID sự kiện sẽ được ghi công khai trên mạng lưới Polygon. Dữ liệu này không thể bị xóa hoặc sửa đổi. Tuy nhiên, thông tin cá nhân thực tế của bạn (Họ tên, Email) vẫn được lưu trữ bảo mật trong cơ sở dữ liệu riêng của BASTICKET và KHÔNG hiển thị công khai trên chuỗi khối.",
              s4Title: "4. Bảo mật dữ liệu",
              s4t1: "Mã hóa mật khẩu", s4d1: "Chúng tôi sử dụng thuật toán băm Bcrypt mạnh mẽ để bảo vệ mật khẩu của bạn. Nhân viên BASTICKET không thể xem thấy mật khẩu thực tế.",
              s4t2: "AI Monitoring", s4d2: "Hệ thống AI giám sát liên tục các hành vi truy cập đáng ngờ để ngăn chặn các cuộc tấn công chiếm đoạt tài khoản.",
              s5Title: "5. Quyền của người dùng",
              s5r1: "Quyền truy cập và yêu cầu trích xuất dữ liệu cá nhân.",
              s5r2: "Quyền yêu cầu đính chính thông tin không chính xác.",
              s5r3: "Quyền yêu cầu xóa tài khoản (sau khi tất cả vé NFT đã hết hạn hoặc được sử dụng).",
              s5r4: "Quyền rút lại sự đồng ý nhận thông báo marketing.",
              s2Title: "2. Cách chúng tôi sử dụng thông tin",
              s2p1: "BASTICKET chỉ thu thập và sử dụng thông tin của bạn vì các mục đích sau. Chúng tôi không bán hay chia sẻ dữ liệu cá nhân với bên thứ ba vì mục đích quảng cáo.",
              s2u1Title: "Cung cấp dịch vụ", s2u1Desc: "Xử lý mua vé, phát hành vé NFT, gửi email xác nhận đơn hàng.",
              s2u2Title: "Quản lý tài khoản", s2u2Desc: "Xác minh danh tính, quản lý ví và hỗ trợ khôi phục tài khoản.",
              s2u3Title: "Bảo mật & Chống gian lận", s2u3Desc: "Phát hiện hoạt động đáng ngờ và bảo vệ tài khoản khỏi truy cập trái phép.",
              s2u4Title: "Cải thiện nền tảng", s2u4Desc: "Phân tích xu hướng sử dụng để nâng cao tính năng, hiệu năng và trải nghiệm người dùng.",
              s6Title: "6. Liên hệ chúng tôi",
              s6p1: "Nếu bạn có bất kỳ câu hỏi nào về Chính sách Bảo mật này hoặc muốn thực hiện các quyền của mình đối với dữ liệu cá nhân, vui lòng liên hệ qua:",
              s6emailLabel: "Email hỗ trợ",
              s6responseLabel: "Thời gian phản hồi",
              s6responseTime: "Trong vòng 24 giờ làm việc"
            },
            refund: {
              title: "Chính sách", titleHighlight: "Hoàn tiền",
              subtitle: "Quy trình và điều kiện hoàn tiền minh bạch, bảo vệ quyền lợi của cả khách hàng và nhà tổ chức.",
              badge: "Cập nhật lần cuối: 01 tháng 04, 2026",
              warningTitle: "Quy tắc chung về vé NFT",
              warningDesc: "Vé sự kiện là tài sản kỹ thuật số (NFT) được Mint ngay khi thanh toán. Do tính chất của sự kiện, mặc định VÉ KHÔNG ĐƯỢC HOÀN TIỀN trừ khi có thông báo thay đổi hoặc hủy bỏ từ Nhà tổ chức.",
              casesTitle: "Các trường hợp được Hoàn tiền",
              case1Title: "Sự kiện bị hủy", case1Desc: "BTC thông báo hủy bỏ hoàn toàn sự kiện và không có lịch thay thế.",
              case2Title: "Thay đổi lịch lớn", case2Desc: "BTC thay đổi ngày giờ hoặc địa điểm và thông báo cho phép hoàn tiền.",
              case3Title: "Lỗi phát hành", case3Desc: "Khách thanh toán thành công nhưng hệ thống không thể tạo vé NFT.",
              processTitle: "Quy trình xử lý yêu cầu",
              step1Title: "Gửi yêu cầu", step1Desc: "Sử dụng chức năng 'Yêu cầu hoàn tiền' trong mục quản lý vé của bạn.",
              step2Title: "Hệ thống xác minh ", step2Desc: "Hệ thống kiểm duyệt yêu cầu trong 3-5 ngày làm việc.",
              step3Title: "Xử lý tiền", step3Desc: "Tiền được chuyển về cổng thanh toán gốc (VNPAY/MoMo).",
              step4Title: "Hoàn tất", step4Desc: "Thông báo xác nhận hoàn tiền thành công qua Email.",
              notesTitle: "Thời gian và Phí hoàn tiền",
              note1: "Phí dịch vụ (8%) và Phí Xác thực Blockchain/AI (10.000đ) sẽ không được hoàn lại vì đây là chi phí hạ tầng đã phát sinh ngay khi tạo vé NFT.",
              note2: "Thời gian tiền về tài khoản phụ thuộc vào Ngân hàng của bạn, thường từ 7-15 ngày làm việc đối với thẻ quốc tế và 3-5 ngày đối với ATM nội địa (VNPAY).",
              note3: "Nếu BTC và Khách hàng có tranh chấp, BASTICKET sẽ đóng vai trò trung gian dựa trên dữ liệu giao dịch Blockchain để đưa ra quyết định cuối cùng."
            },
            faq: {
              title: "Trung tâm", titleHighlight: "Trợ giúp",
              searchPlaceholder: "Tìm kiếm câu hỏi của bạn...",
              cats: { account: "Tài khoản & Bảo mật", ticket: "Mua vé & Sử dụng", marketplace: "Chợ vé & Chuyển nhượng", payment: "Thanh toán & Hoàn tiền", app: "Ứng dụng & Kỹ thuật" },
              noResults: "Rất tiếc, không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.",
              stillNeedHelp: "Vẫn còn thắc mắc?",
              supportDesc: "Đội ngũ hỗ trợ của BASTICKET luôn sẵn sàng giải đáp mọi vấn đề của bạn 24/7.",
              contactBtn: "Gửi yêu cầu hỗ trợ",
              q1: "Vé NFT là gì và tại sao tôi cần nó?", a1: "Vé NFT (Non-Fungible Token) là định dạng vé số hóa được xác thực trên Blockchain. Nó giúp ngăn chặn tuyệt đối việc làm giả vé và cho phép bạn sở hữu, chuyển nhượng vé một cách minh bạch và an toàn.",
              q2: "Tôi có cần ví tiền điện tử riêng để mua vé không?", a2: "Không cần. BASTICKET tự động tạo và quản lý ví bảo mật cho bạn thông qua tài khoản Email. Bạn có thể mua vé bằng tiền VND thông thường qua VNPAY hoặc MoMo.",
              q7: "Làm thế nào để đặt lại mật khẩu?", a7: "Nhấn 'Quên mật khẩu' trên trang đăng nhập. Chúng tôi sẽ gửi link đặt lại mật khẩu về email đã đăng ký của bạn. Link có hiệu lực trong vòng 15 phút.",
              q8: "Tôi có thể thay đổi email tài khoản không?", a8: "Hiện tại, việc thay đổi email đã đăng ký cần được thực hiện qua bộ phận hỗ trợ của BASTICKET để xác minh danh tính trước khi cập nhật.",
              q3: "Tôi nhận vé ở đâu sau khi thanh toán?", a3: "Sau khi thanh toán thành công, vé sẽ xuất hiện trong mục 'Vé của tôi'. Hệ thống cũng sẽ gửi một email xác nhận kèm thông tin vé cho bạn.",
              q4: "Làm thế nào để sử dụng vé tại sự kiện?", a4: "Bạn chỉ cần mở trang 'Vé của tôi', chọn vé và hiển thị mã QR động cho nhân viên kiểm soát. Lưu ý: Mã QR này thay đổi liên tục để bảo mật, vì vậy không nên sử dụng ảnh chụp màn hình.",
              q9: "Tôi có thể chuyển nhượng vé cho người khác không?", a9: "Được. Vào mục 'Vé của tôi', chọn vé và sử dụng chức năng 'Chuyển nhượng'. Nhập email BASTICKET của người nhận. Vé NFT sẽ được chuyển ngay vào ví của họ.",
              q10: "Mã QR không quét được tại cổng vào, phải làm sao?", a10: "Đảm bảo màn hình đủ sáng. Nếu vẫn không được, nhờ nhân viên kiểm tra bằng mã ID vé hiển thị bên dưới mã QR, hoặc liên hệ hotline BASTICKET để được hỗ trợ khẩn cấp.",
              q5: "Tôi có thể bán lại vé với giá cao hơn không?", a5: "Có, nhưng mức giá bán lại KHÔNG được vượt quá 8% so với giá gốc (theo luật Smart Contract) để ngăn chặn đầu cơ.",
              q11: "Làm thế nào để đăng vé lên Marketplace bán lại?", a11: "Vào 'Vé của tôi', chọn vé, nhấn 'Đăng bán trên Marketplace', đặt giá (tối đa +8%) và xác nhận. Người mua sẽ trả thêm phí giao dịch và xác thực.",
              q12: "Phí Royalty là gì và ai nhận được?", a12: "Phí Royalty cố định là 3% do Nhà tổ chức nhận được trên mỗi lần vé được bán lại ở thị trường thứ cấp. Khoản này tự động trừ khỏi giá bán của người bán.",
              q6: "Bao lâu thì tôi nhận được tiền hoàn?", a6: "Tùy thuộc vào ngân hàng, tiền hoàn thường về tài khoản sau 3-5 ngày làm việc (ATM nội địa) hoặc 7-15 ngày (Thẻ quốc tế).",
              q13: "BASTICKET hỗ trợ những phương thức thanh toán nào?", a13: "Hiện tại BASTICKET hỗ trợ VNPAY (ATM nội địa, QR code) và MoMo.",
              q14: "Thanh toán thất bại nhưng tài khoản bị trừ tiền, phải làm gì?", a14: "Đây có thể là khoản tạm giữ của ngân hàng, chưa phải giao dịch thực. Nếu sau 24-48 giờ tiền chưa về, hãy liên hệ BASTICKET hỗ trợ kèm mã giao dịch để được kiểm tra.",
              q15: "BASTICKET có ứng dụng điện thoại không?", a15: "Hiện tại BASTICKET hoạt động dưới dạng ứng dụng web được tối ưu cho trình duyệt di động. Ứng dụng iOS và Android đang được lên kế hoạch phát triển trong tương lai.",
              q16: "Trình duyệt nào được hỗ trợ tốt nhất?", a16: "BASTICKET hoạt động tốt nhất trên phiên bản mới nhất của Google Chrome, Microsoft Edge và Safari. Chúng tôi khuyến nghị cập nhật trình duyệt thường xuyên để trải nghiệm tốt nhất các tính năng Web3."
            },
            blog: {
              title: "Khám phá", titleHighlight: "Thế giới NFT",
              subtitle: "Cập nhật những xu hướng mới nhất về công nghệ Blockchain, bảo mật và các sự kiện âm nhạc đỉnh cao.",
              badge: "Bản tin BASTICKET",
              featuredLabel: "Nổi bật",
              readMore: "Đọc bài viết"
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
