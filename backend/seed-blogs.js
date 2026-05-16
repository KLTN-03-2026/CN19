const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBlogs() {
  console.log('🔄 Đang bắt đầu tạo các bài viết chính thức từ Admin BASTICKET...');

  try {
    // 1. Lấy tài khoản Admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@basticket.com' }
    });

    if (!admin) {
      console.error('❌ Không tìm thấy tài khoản Admin (admin@basticket.com)! Bỏ qua tạo bài viết.');
      return;
    }

    console.log(`✅ Đã tìm thấy tài khoản Admin: ${admin.full_name} (${admin.id})`);

    // 2. Chuẩn bị 3 bài viết chất lượng cao
    const blogs = [
      {
        author_id: admin.id,
        title: 'BASTICKET ra mắt Công nghệ Vé NFT & Kiểm soát Vé thông minh AI tại Việt Nam',
        slug: 'basticket-ra-mat-cong-nghe-ve-nft-ai',
        type: 'PLATFORM_NEWS',
        status: 'published',
        views: 1250,
        image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        images: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'],
        content: `
<h2>1. BASTICKET - Bước đột phá trong ngành Công nghiệp Biểu diễn và Sự kiện</h2>
<p>Ngày 16/05/2026, nền tảng phân phối và quản lý vé sự kiện trực tuyến <strong>BASTICKET</strong> chính thức đi vào hoạt động. Được phát triển trên nền tảng công nghệ Blockchain Polygon và Trí tuệ nhân tạo (AI), BASTICKET giải quyết triệt để vấn nạn vé giả, đầu cơ vé đen và thiếu minh bạch tài chính trong khâu tổ chức sự kiện tại Việt Nam.</p>

<h2>2. Vé NFT và Mã QR Động (Dynamic QR Token)</h2>
<p>Mỗi vé phát hành trên BASTICKET đều được định danh là một tài sản kỹ thuật số duy nhất (NFT) trên mạng lưới blockchain Polygon Amoy. Khi khách hàng check-in tại cổng sự kiện, hệ thống sử dụng công nghệ <strong>Mã QR Động</strong> (xoay vòng thay đổi mã thông báo sau mỗi 30 giây). Công nghệ này triệt tiêu hoàn toàn khả năng chụp màn hình sao chép mã QR để bán lại trái phép cho nhiều người.</p>

<h2>3. Tích hợp AI Nhận diện khuôn mặt & Chống gian lận</h2>
<p>Tại các sự kiện quy mô lớn trên 10,000 khán giả, hệ thống camera AI tại cổng kiểm soát vé có thể quét và đối chiếu dữ liệu sinh trắc học của khách hàng trong thời gian dưới 0.5 giây. Không chỉ tăng tốc độ lưu thông qua cổng lên gấp 3 lần so với quét mã vạch truyền thống, công nghệ AI còn tự động phát hiện và cảnh báo các hành vi check-in hộ hoặc sử dụng thẻ giả.</p>

<p><em>BASTICKET tự hào mở ra một kỷ nguyên mới cho thị trường vé biểu diễn: Minh bạch, An toàn và Vượt trội!</em></p>
        `
      },
      {
        author_id: admin.id,
        title: 'Hướng dẫn Quy trình Đăng ký Tổ chức Sự kiện và Chính sách Ký quỹ (Escrow)',
        slug: 'huong-dan-quy-trinh-ky-quy-escrow',
        type: 'PLATFORM_NEWS',
        status: 'published',
        views: 890,
        image_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80',
        images: ['https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80'],
        content: `
<h2>1. Hợp tác cùng BASTICKET: Nhanh chóng & Chuyên nghiệp</h2>
<p>Để đảm bảo quyền lợi tối đa cho người hâm mộ và uy tín của sàn, BASTICKET áp dụng quy trình xác thực định danh Ban tổ chức (eKYC) và mô hình tài chính Ký quỹ bảo lãnh (Escrow Smart Contract) chặt chẽ nhất hiện nay.</p>

<h2>2. Các bước khởi tạo Sự kiện dành cho Ban tổ chức:</h2>
<ul>
  <li><strong>Bước 1: Xác thực tài khoản BTC:</strong> Cung cấp Giấy phép ĐKKD hoặc CCCD định danh qua hệ thống eKYC tự động.</li>
  <li><strong>Bước 2: Cấu hình Sự kiện & Hạng vé:</strong> Thiết lập sơ đồ chỗ ngồi, giá vé các hạng (VIP, GA, Early Bird), và quy định chiết khấu hoa hồng bán vé thứ cấp (Royalty Fee).</li>
  <li><strong>Bước 3: Mở bán & Quản lý Doanh thu Ký quỹ:</strong> Toàn bộ tiền mua vé của khán giả sẽ được lưu trữ an toàn trên tài khoản Ký quỹ (Escrow) của sàn BASTICKET.</li>
</ul>

<h2>3. Cơ chế Giải ngân Ký quỹ (Escrow Release)</h2>
<p>Nhằm loại bỏ rủi ro Ban tổ chức hủy show đột ngột và trốn tránh hoàn tiền, doanh thu bán vé sẽ chỉ được giải ngân cho Ban tổ chức sau đúng <strong>24 giờ</strong> kể từ thời điểm sự kiện kết thúc thành công (không có sự cố tranh chấp hoặc khiếu nại quy mô lớn từ khán giả).</p>
<p>Trong trường hợp sự kiện bị hủy hoặc hoãn vô thời hạn, BASTICKET sẽ tự động kích hoạt hoàn 100% tiền vé về ví điện tử/tài khoản ngân hàng của từng khán giả mà không cần thủ tục rườm rà.</p>
        `
      },
      {
        author_id: admin.id,
        title: 'Khám phá Tính năng Chợ vé Thứ cấp (Resale Marketplace) - Giao dịch Minh bạch',
        slug: 'kham-pha-tinh-nang-cho-ve-thu-cap-resale',
        type: 'PLATFORM_NEWS',
        status: 'published',
        views: 1420,
        image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
        images: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'],
        content: `
<h2>1. Giải pháp chấm dứt Nạn đầu cơ và Phe vé đen</h2>
<p>Một trong những nỗi đau lớn nhất của khán giả yêu âm nhạc là không thể mua được vé gốc và phải đối mặt với rủi ro bị lừa đảo khi mua lại vé trên các hội nhóm mạng xã hội. Với tính năng <strong>Chợ vé Thứ cấp (Resale Marketplace)</strong> của BASTICKET, mọi giao dịch nhượng vé đều được thực thi và bảo đảm bởi Hợp đồng thông minh (Smart Contract).</p>

<h2>2. Ưu điểm vượt trội của Chợ vé BASTICKET:</h2>
<ul>
  <li><strong>Chuyển nhượng an toàn tuyệt đối:</strong> Vé chỉ đổi chủ khi người mua thực hiện thanh toán thành công qua cổng thanh toán VNPay/MoMo. Hợp đồng thông minh tự động sang tên quyền sở hữu NFT ngay tức khắc.</li>
  <li><strong>Giới hạn giá bán lại:</strong> Để chống tình trạng thổi giá cắt cổ, hệ thống cho phép Ban tổ chức thiết lập trần giá bán lại (từ 100% đến tối đa 300% giá gốc).</li>
  <li><strong>Chia sẻ Doanh thu cho Ban tổ chức (Royalty):</strong> Lần đầu tiên, Ban tổ chức sự kiện nhận được tiền bản quyền (royalty từ 5% - 15%) trên mỗi giao dịch thứ cấp phát sinh, tạo nguồn thu bền vững cho nghệ sĩ.</li>
</ul>

<p><em>Hãy truy cập ngay mục Chợ vé trên BASTICKET để tìm cho mình những tấm vé ưng ý nhất tới các lễ hội âm nhạc đỉnh cao!</em></p>
        `
      }
    ];

    // 3. Thực thi lưu vào Database
    for (const b of blogs) {
      const existing = await prisma.blog.findUnique({ where: { slug: b.slug } });
      if (existing) {
        console.log(`⚠️ Bài viết "${b.title}" đã tồn tại. Đang cập nhật...`);
        await prisma.blog.update({
          where: { slug: b.slug },
          data: b
        });
      } else {
        console.log(`➕ Đang tạo mới bài viết: "${b.title}"`);
        await prisma.blog.create({ data: b });
      }
    }

    console.log('🎉 Đã tạo thành công 3 bài viết chính thức của Admin lên Supabase!');
  } catch (error) {
    console.error('❌ Lỗi khi sinh dữ liệu bài viết:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBlogs();
