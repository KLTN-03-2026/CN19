const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Service xử lý gửi Email thông báo
 */
const EmailService = {
    /**
     * Gửi email thông báo đặt vé thành công
     */
    sendBookingSuccessEmail: async (order, customer, event) => {
        try {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);
            const formattedDate = format(new Date(event.event_date), 'eeee, dd/MM/yyyy', { locale: vi });

            const mailOptions = {
                from: `"BASTICKET Notification" <${process.env.EMAIL_USER}>`,
                to: customer.email,
                subject: `[BASTICKET] Xác nhận đặt vé thành công - #${order.order_number}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0c; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a1c;">
                        <div style="background-color: #000; padding: 40px 20px; text-align: center; border-bottom: 2px solid #52c41d;">
                            <h1 style="color: #52c41d; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Thanh Toán Thành Công</h1>
                            <p style="color: #888; margin-top: 10px;">Cảm ơn bạn đã tin tưởng lựa chọn BASTICKET</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <div style="background: rgba(255,255,255,0.05); border-radius: 15px; padding: 20px; margin-bottom: 25px;">
                                <h2 style="color: #52c41d; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid rgba(82, 196, 29, 0.2); pb: 10px;">Chi tiết đơn hàng</h2>
                                <table style="width: 100%; border-collapse: collapse; color: #ccc; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #888;">Mã đơn hàng:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: bold;">#${order.order_number}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #888;">Sự kiện:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #fff; font-weight: bold;">${event.title}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #888;">Thời gian:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #fff;">${formattedDate} | ${event.event_time || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #888;">Địa điểm:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #fff;">${event.location_address}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 15px 0 8px 0; color: #888; border-top: 1px solid rgba(255,255,255,0.1);">Tổng thanh toán:</td>
                                        <td style="padding: 15px 0 8px 0; text-align: right; color: #52c41d; font-size: 20px; font-weight: 900; border-top: 1px solid rgba(255,255,255,0.1);">${formattedPrice}</td>
                                    </tr>
                                </table>
                            </div>

                            <div style="text-align: center; margin-top: 35px;">
                                <a href="http://localhost:5173/my-tickets" style="background-color: #52c41d; color: #000; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; transition: transform 0.2s;">XEM VÉ CỦA TÔI</a>
                                <p style="color: #666; font-size: 12px; margin-top: 20px;">Bạn có thể xem mã QR và NFT của vé trong mục "Ví vé" trên ứng dụng hoặc website.</p>
                            </div>
                        </div>

                        <div style="background-color: #000; padding: 20px; text-align: center; color: #444; font-size: 11px; border-top: 1px solid #1a1a1c;">
                            &copy; 2026 BASTICKET System. Bảo mật bởi công nghệ Blockchain & NFT.
                        </div>
                    </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`[Email] Đã gửi thông báo thành công đơn ${order.order_number}: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error('[Email Error] Không thể gửi mail thông báo:', error);
            // Không throw lỗi ra ngoài để tránh làm treo process thanh toán chính
            return null;
        }
    }
};

module.exports = EmailService;
