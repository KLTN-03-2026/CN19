# BASTICKET Project 🌟

Chào mừng bạn đến với **BASTICKET**, hệ thống quản lý, phân phối và kiểm soát vé sự kiện thông minh ứng dụng công nghệ Web3. 

BASTICKET giải quyết các vấn đề gian lận (vé giả, chợ đen) trong ngành sự kiện truyền thống thông qua việc phát hành vé dưới dạng NFT trên nền tảng Blockchain, kết hợp với Trí tuệ nhân tạo (AI) giúp quy trình định danh Ban tổ chức trở nên minh bạch và tự động hóa.

![Usecase Tổng Quát BASTICKET](./docs/images/usecase-tong-quat.png)

---

## 🌟 Chức năng chính (Key Features)
### 👨‍💼 Dành cho Khách hàng (Customer)
- **Đăng nhập linh hoạt:** Đăng ký / Đăng nhập qua Email, Số điện thoại, và tài khoản Google. (Tích hợp Cloudflare Turnstile để chống Spam/Bot).
- **Trải nghiệm Web3 mượt mà:** Tự động tạo và quản lý ví Web3 (Custodial Wallet) ẩn danh, người dùng không cần hiểu biết về Crypto vẫn sử dụng được.
- **Thanh toán & Mint Vé NFT:** Mua vé và nhận vé dưới định dạng **NFT**, đảm bảo tính duy nhất và không thể làm giả.
- **Check-in thông minh:** Sử dụng vé tại cổng sự kiện thông qua quét mã QR động.

### 🏢 Dành cho Ban Tổ Chức (Organizer)
- **Xác thực định danh eKYC:** Đăng ký hồ sơ xác minh tự động thông qua eKYC (OCR Căn cước công dân và Face Liveness/FaceMatch khuôn mặt).
- **Quản lý sự kiện toàn diện:** Khởi tạo sự kiện, thiết lập sơ đồ giá vé, cấu hình số lượng và các đặc quyền.
- **Quét mã kiểm soát vé:** Theo dõi số lượng check-in thống kê theo thời gian thực tại điểm diễn ra sự kiện.

### 🎫 Dành cho Nhân viên soát vé (Staff / Checker)
- **Kiểm soát vé nhanh chóng:** Cổng quét mã QR động được thiết kế tối ưu hóa tốc độ, giúp nhân viên soát vé quét bằng điện thoại/thiết bị chuyên dụng cực nhanh.
- **Ngăn chặn vé giả (Anti-fraud):** Kiểm tra tính hợp lệ và tự động cập nhật trạng thái "Đã check-in", triệt tiêu tình trạng một vé quét qua nhiều cổng.

### 🛡️ Dành cho Quản trị viên (Admin)
- **Kiểm duyệt tự động & thủ công:** Xét duyệt hồ sơ Ban Tổ Chức (dựa trên kết quả eKYC) và kiểm soát nội dung các sự kiện.
- **Báo cáo Thống kê:** Quản lý toàn diện tài khoản, lịch sử lệnh và doanh thu hệ thống.

---
###  Luồng hoạt động cốt lõi (Core Workflow)
1. **User Request:** Khách hàng chọn vé và gửi yêu cầu thanh toán.
2. **AI Verification:** Dữ liệu hành vi được đánh giá để chấm điểm Bot (Risk Score).
3. **Escrow Payment:** Khách hàng thanh toán qua VNPAY/MoMo, hệ thống BASTICKET tạm giữ tiền.
4. **Smart Contract (Blockchain):** Sau khi thanh toán thành công, hệ thống "đúc" (Mint) vé dưới dạng một NFT duy nhất và chuyển vào ví nội bộ của user.
5. **Event Completion:** Sự kiện kết thúc, Admin duyệt lệnh, tiền được chuyển từ ví Escrow sang tài khoản ngân hàng của Ban tổ chức.

## 🛠️ Công nghệ sử dụng
Hệ thống sử dụng các bộ framework và công nghệ hiện đại:

| Thành phần | Công nghệ |
| :--- | :--- |
| **Package Manager** | npm / pip |
| **Runtime** | Node.js (v18+) / Python (v3.9+) |
| **Backend** | Express.js (Node.js) |
| **Frontend Web** | React 19 (Vite) |
| **Mobile App (Scan vé)**| React Native |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Blockchain** | Solidity, Hardhat, Ethers.js |
| **AI Service** | Python (Hỗ trợ eKYC Ban Tổ Chức) |
| **UI/UX** | Tailwind CSS v4.x, Framer Motion, Lucide |

---

## 🏗️ Cấu trúc thư mục
Dự án được tổ chức theo cấu trúc đa dịch vụ (Multi-service):

```text
BASTICKET/
├── backend/                    # ExpressJS Backend (Cung cấp RESTful API)
│   ├── src/                    # Mã nguồn chính API logic
│   ├── prisma/                 # Schema & Database Migrations
│   └── package.json
├── frontend/                   # React + Vite Frontend (Giao diện người dùng)
│   ├── src/                    # Mã nguồn React components & pages
│   └── package.json
├── mobile/                     # Ứng dụng React Native dành cho Nhân viên soát vé
│   ├── src/                    # Logic Camera quét QR Code
│   └── package.json
├── smart-contracts/            # Môi trường Blockchain (Smart Contracts)
│   ├── contracts/              # Mã nguồn Solidity phát hành vé NFT
│   └── package.json
├── ai-service/                 # Dịch vụ Trí tuệ Nhân tạo 
│   ├── src/                    # Logic AI (Định danh điện tử eKYC bằng hình ảnh)
│   └── requirements.txt
└── README.md                   # Tài liệu hướng dẫn
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
* Node.js v18+ & npm.
* PostgreSQL.
* Python v3.9+ (Để khởi chạy AI Service).

### 2. Thiết lập môi trường (.env)
Tạo tệp `.env` riêng biệt tại từng thư mục (`backend`, `frontend`, `smart-contracts`, `ai-service`) dựa trên cấu hình dự án của bạn (tham khảo `.env.example` nếu có).

> Ví dụ ở `backend/.env`:
```env
# Database configuration
DATABASE_URL="postgresql://user:password@localhost:5432/basticket_db"

# JWT Security
JWT_SECRET=your_jwt_secret

# Payment Gateways (Cơ chế Escrow VNPAY / MoMo)
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret

# Anti-Bot (Cloudflare Turnstile)
TURNSTILE_SECRET_KEY=your_turnstile_key

# Firebase & Cloudinary Credentials...
```

### 3. Chạy Local (Để phát triển nhanh)

**🖥️ Smart Contracts (Local Blockchain Node)**  
Khởi chạy môi trường local blockchain giả lập phục vụ deploy và test Web3:
```bash
cd smart-contracts
npm install
npx hardhat node

# Mở một terminal mới và chạy lệnh sau để deploy:
npx hardhat run scripts/deploy.js --network localhost
```

**⚙️ Khởi chạy Backend (API)**  
Cung cấp API cho hệ thống, mặc định cổng `http://localhost:5000` (Tùy cấu hình):
```bash
cd backend
npm install

# Tạo Prisma Client và đồng bộ DB
npx prisma generate
npx prisma db push

# Chạy dev mode
npm run dev
```

**🌐 Khởi chạy Frontend (Web)**  
Chạy Client giao diện người dùng, mặc định cổng `http://localhost:5173`:
```bash
cd frontend
npm install
npm run dev
```

**📱 Khởi chạy Mobile App (React Native Scan QR)**  
Khởi chạy ứng dụng soát vé dành cho thiết bị di động (sử dụng Expo hoặc React Native CLI):
```bash
cd mobile
npm install
npx expo start
# Quét mã QR hiện trên terminal bằng ứng dụng Expo Go trên điện thoại để test
```

**🧠 Khởi chạy AI Service (Server xử lý eKYC)**  
Khởi chạy phân hệ Python độc lập để chấm điểm Liveness và FaceMatch:
```bash
cd ai-service
pip install -r requirements.txt
python src/main.py
```

---

## 🗄️ Quản lý Cơ sở dữ liệu (Prisma)
Khi làm việc với Database (như bảng User, Organizer, Tickets...), bạn sử dụng các lệnh sau trong thư mục `backend`:

*   **Tạo bản thay đổi database (Migration):**  
    `npx prisma db push`
*   **Chạy dữ liệu mẫu ban đầu (Seed Data):**  
    `npm run seed`
*   **Mở giao diện UI quản lý DB (Prisma Studio):**  
    `npx prisma studio`

---

## 🤝 Về Dự Án
Đây là dự án Khóa Luận Tốt Nghiệp (Mã KLTN-03-2026/CN19). Nếu bạn gặp vấn đề hoặc muốn đóng góp tính năng bổ sung, vui lòng liên hệ nhóm phát triển trực tiếp.
