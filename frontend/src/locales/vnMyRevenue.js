const vnMyRevenue = {
    revenue: {
        title: "Tổng quan doanh thu",
        subtitle: "Tài chính của tôi",
        withdraw_button: "Rút tiền ngay",
        stats: {
            total_revenue: "Tổng doanh thu",
            available_balance: "Doanh thu khả dụng",
            pending_revenue: "Đang chờ xử lý",
            total_withdrawn: "Tổng tiền đã rút",
            balance: "Số dư khả dụng"
        },
        chart: {
            title: "Phân bổ nguồn thu",
            no_data: "Chưa có dữ liệu tài chính",
            available: "Khả dụng",
            pending: "Đang chờ",
            withdrawn: "Đã rút"
        },
        tabs: {
            sold_orders: "Đơn hàng đã bán",
            withdraw_bank: "Rút tiền & Ngân hàng"
        },
        table: {
            title: "Danh sách vé đã bán",
            event_ticket: "Sự kiện / Vé",
            buyer: "Người mua",
            price: "Giá bán",
            commission: "Hoa hồng nhận",
            status: "Trạng thái",
            time: "Thời gian",
            details: "Chi tiết",
            status_settled: "Đã về ví",
            status_pending: "Chờ sự kiện",
            no_orders: "Chưa có đơn hàng nào được bán"
        },
        withdrawal: {
            title: "Yêu cầu rút tiền",
            available_balance: "Số dư khả dụng",
            available_balance_label: "Số dư khả dụng:",
            amount_label: "Số tiền muốn rút (VND)",
            amount_placeholder: "Nhập số tiền...",
            confirm_btn: "Xác nhận rút tiền",
            processing: "Đang xử lý..."
        },
        bank: {
            title: "Thông tin thụ hưởng",
            label_bank: "Ngân hàng",
            label_account: "Số tài khoản",
            label_holder: "Chủ tài khoản",
            change_info: "Thay đổi thông tin",
            bank_name_placeholder: "VD: Vietcombank, Techcombank...",
            account_placeholder: "Nhập số tài khoản...",
            holder_placeholder: "Viết hoa không dấu (VD: NGUYEN VAN A)",
            save_btn: "Lưu thông tin",
            cancel_btn: "Hủy"
        },
        messages: {
            validation_error: "Vui lòng nhập đầy đủ thông tin hưởng thụ!",
            update_success: "Cập nhật thông tin ngân hàng thành công!",
            update_error: "Lỗi khi cập nhật thông tin",
            min_withdrawal: "Số tiền tối thiểu là 100,000đ",
            insufficient_balance: "Số dư không đủ",
            withdrawal_requested: "Yêu cầu rút tiền đã được gửi!",
            error_withdrawal: "Lỗi khi yêu cầu rút tiền"
        },
        modal: {
            transaction_id: "Mã giao dịch",
            buyer_info: "Người mua",
            ticket_type: "Loại vé",
            status_label: "Trạng thái đối soát",
            buyer_pay: "Giá người mua thanh toán:",
            platform_fee: "(-) Phí sàn hệ thống (Platform Fee)",
            royalty_fee: "(-) Phí bản quyền BTC (Royalty)",
            net_profit: "LỢI NHUẬN THỰC NHẬN:",
            close_btn: "ĐÓNG CHI TIẾT"
        }
    }
};

export default vnMyRevenue;
