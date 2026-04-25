const vnMyEvent = {
  header: {
    title: "Vé của tôi",
    subtitle: "Quản lý bộ sưu tập vé NFT của bạn và trải nghiệm các sự kiện hàng đầu cùng hệ thống bảo mật Blockchain Polygon.",
    error_loading: "Không thể tải danh sách vé.",
    error_not_owner: "Bạn không còn sở hữu vé này.",
    error_invalid_auth: "Vé không khả dụng để xác thực.",
    error_get_qr: "Không thể lấy mã QR.",
    scan_success: "Tuyệt vời! Vé đã được xác thực thành công."
  },
  stats: {
    total: "Tổng sở hữu",
    upcoming: "Sắp diễn ra",
    transferred: "Đã chuyển nhượng",
    sold: "Vé đã bán"
  },
  controls: {
    search_placeholder: "Tìm kiếm hành trình của bạn...",
    filter_date_label: "Lọc theo ngày"
  },
  tabs: {
    all: "Tất cả vé",
    upcoming: "Sắp diễn ra",
    past: "Lịch sử tham gia",
    reselling: "Trên chợ",
    transferred: "Đã chuyển nhượng",
    sold: "Đã bán",
    cancelled: "Bị hủy"
  },
  status: {
    available: "Khả dụng",
    scanned: "Đã quét",
    cancelled: "Bị hủy",
    reselling: "Đang đăng bán",
    transferred: "Đã chuyển",
    sold: "Đã bán",
    history: "Lịch sử thu thập"
  },
  labels: {
    tier: "Hạng vé",
    location: "Vị trí / Area",
    general_area: "Khu vực chung",
    ticket_no: "Số vé",
    nft_price: "Giá NFT",
    nft_id: "NFT ID"
  },
  buttons: {
    write_blog: "Viết blog",
    transfer: "Chuyển",
    resale: "Bán lại",
    locked: "Đã khóa",
    listed: "Đã đăng",
    edit_listing: "Chỉnh sửa bài đăng",
    use_ticket: "Sử dụng vé",
    view_scan_history: "Xem lịch sử quét",
    view_nft: "Chi tiết vé NFT",
    view_event: "Trang sự kiện"
  },
  confirm_cancel_listing: "Bạn có chắc chắn muốn hủy bài đăng bán vé này? Vé sẽ được mở khóa để sử dụng bình thường.",
  cancel_listing_success: "Đã hủy bài đăng thành công.",
  update_price_success: "Đã cập nhật giá bán thành công.",
  edit_modal: {
    title: "Quản lý bài đăng",
    subtitle: "Bạn muốn thực hiện hành động nào với vé đang đăng bán này?",
    cancel_title: "Hủy bài đăng",
    cancel_desc: "Gỡ khỏi Chợ và mở khóa để sử dụng.",
    update_price_title: "Cập nhật giá",
    update_price_desc: "Thay đổi giá bán của vé này.",
    new_price_label: "Giá bán mới (VNĐ)",
    save_btn: "Cập nhật giá",
    back_btn: "Quay lại"
  },
  security: {
    polygon: "Polygon Secured",
    verification: "Blockchain Verification"
  },
  empty: {
    title: "Chưa có dấu ấn",
    desc: "Kho lưu trữ của bạn hiện không có tài sản nào khớp với tiêu chí lọc này.",
    btn: "Khám phá sự kiện ngay"
  },
  qr_modal: {
    title: "NFT-Gate Security Active",
    expired: "Mã đã hết hạn",
    expired_desc: "Vui lòng cấp lại mã QR mới để xác thực.",
    refresh_btn: "Cấp lại mã mới",
    countdown: "Token tự hủy sau",
    disclaimer: "Tài sản NFT được xác minh bởi BASTICKET. Vui lòng trình diện mã tại cổng soát vé chính thức.",
    success_title: "Xác thực thành công",
    success_subtitle: "Chúc bạn có một sự kiện tuyệt vời!"
  }
};

export default vnMyEvent;
