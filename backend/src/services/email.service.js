const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { vi } = require('date-fns/locale');
const SystemConfigService = require('./system-config.service');

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
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';
            const supportEmail = config.support_email || 'support@basticket.com';
            
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount);
            const formattedDate = format(new Date(event.event_date), 'eeee, dd/MM/yyyy', { locale: vi });

            const mailOptions = {
                from: `"${siteName} Notification" <${process.env.EMAIL_USER}>`,
                to: customer.email,
                subject: `[${siteName}] Xác nhận đặt vé thành công - #${order.order_number}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0c; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a1c;">
                        <div style="background-color: #000; padding: 40px 20px; text-align: center; border-bottom: 2px solid #52c41d;">
                            <h1 style="color: #52c41d; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Thanh Toán Thành Công</h1>
                            <p style="color: #888; margin-top: 10px;">Cảm ơn bạn đã tin tưởng lựa chọn ${siteName}</p>
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
                            &copy; 2026 ${siteName} System. Bảo mật bởi công nghệ Blockchain & NFT.
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
    },

    /**
     * Gửi email xác nhận chuyển nhượng vé thành công (Cho người gửi)
     */
    sendTransferSuccessEmail: async (sender, receiver, ticket) => {
        try {
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';

            const mailOptions = {
                from: `"${siteName} Notification" <${process.env.EMAIL_USER}>`,
                to: sender.email,
                subject: `[${siteName}] Giao dịch chuyển nhượng vé thành công`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0c; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a1c;">
                        <div style="background-color: #000; padding: 40px 20px; text-align: center; border-bottom: 2px solid #52c41d;">
                            <h1 style="color: #52c41d; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Chuyển Nhượng Hoàn Tất</h1>
                            <p style="color: #888; margin-top: 10px;">Quyền sở hữu vé đã được cập nhật trên Blockchain</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p style="color: #ccc; font-size: 15px;">Chào <b>${sender.full_name || 'bạn'}</b>,</p>
                            <p style="color: #888; font-size: 14px; line-height: 1.6;">Vé của bạn cho sự kiện <b>${ticket.event.title}</b> đã được chuyển nhượng thành công cho người dùng <b>${receiver.full_name || receiver.email}</b> sau khi hoàn tất phí hệ thống.</p>

                            <div style="background: rgba(255,255,255,0.05); border-radius: 15px; padding: 20px; margin: 25px 0;">
                                <table style="width: 100%; border-collapse: collapse; color: #ccc; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #888;">Chứng chỉ NFT:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #fff; font-family: monospace;">#${ticket.nft_token_id || 'ID_NFT'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #888;">Người nhận:</td>
                                        <td style="padding: 8px 0; text-align: right; color: #52c41d; font-weight: bold;">${receiver.full_name || receiver.email}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="color: #666; font-size: 11px; text-align: center;">Hợp đồng thông minh đã xác thực và thay đổi địa chỉ ví sở hữu vĩnh viễn.</p>
                        </div>

                        <div style="background-color: #000; padding: 20px; text-align: center; color: #444; font-size: 11px; border-top: 1px solid #1a1a1c;">
                            &copy; 2026 ${siteName} System. Secured by Polygon Blockchain.
                        </div>
                    </div>
                `
            };
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[Email Error] Transfer success mail failed:', error);
        }
    },

    /**
     * Gửi email thông báo nhận vé thành công (Cho người nhận)
     */
    sendTicketReceivedEmail: async (receiver, sender, ticket) => {
        try {
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';

            const mailOptions = {
                from: `"${siteName} Notification" <${process.env.EMAIL_USER}>`,
                to: receiver.email,
                subject: `[${siteName}] Bạn vừa nhận được một vé sự kiện mới!`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0c; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a1c;">
                        <img src="${ticket.event.image_url}" style="width: 100%; height: 200px; object-cover: cover;" />
                        <div style="padding: 30px;">
                            <h1 style="color: #52c41d; margin: 0 0 15px 0; font-size: 24px; text-transform: uppercase;">Bạn Đã Nhận Được Vé!</h1>
                            <p style="color: #ccc; font-size: 15px;">Chào <b>${receiver.full_name || 'bạn'}</b>,</p>
                            <p style="color: #888; font-size: 14px; line-height: 1.6;">Người dùng <b>${sender.full_name || sender.email}</b> vừa chuyển nhượng một vé NFT sự kiện <b>${ticket.event.title}</b> cho bạn.</p>

                            <div style="text-align: center; margin: 35px 0;">
                                <a href="http://localhost:5173/my-tickets" style="background-color: #52c41d; color: #000; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">TRUY CẬP KHO VÉ</a>
                            </div>

                            <p style="color: #666; font-size: 11px; text-align: center; margin-top: 20px;">Vé đã có sẵn trong tài khoản của bạn. Bạn có thể sử dụng mã QR để check-in tại sự kiện.</p>
                        </div>
                    </div>
                `
            };
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[Email Error] Ticket received mail failed:', error);
        }
    },
    
    /**
     * Gửi email thông báo rút tiền thành công
     */
    sendWithdrawalSuccessEmail: async (user, request, txHash) => {
        try {
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';
            const supportEmail = config.support_email || 'support@basticket.com';

            const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.net_amount);
            const formattedFee = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(request.fee_amount);
            const formattedDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi });

            const mailOptions = {
                from: `"${siteName} Finance" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `[${siteName}] Thông báo thanh toán thành công - #${request.id.split('-')[0].toUpperCase()}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; color: #333; border-radius: 20px; overflow: hidden; border: 1px solid #e0e0e0;">
                        <div style="background-color: #000; padding: 40px 20px; text-align: center; border-bottom: 4px solid #52c41d;">
                            <h1 style="color: #52c41d; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">Thanh Toán Thành Công</h1>
                            <p style="color: #888; margin-top: 10px; font-size: 14px;">Yêu cầu rút tiền của bạn đã được xử lý hoàn tất</p>
                        </div>
                        
                        <div style="padding: 30px; background-color: #ffffff;">
                            <p style="font-size: 16px;">Chào <b>${user.full_name || user.email}</b>,</p>
                            <p style="font-size: 14px; line-height: 1.6; color: #666;">Chúng tôi vui mừng thông báo rằng yêu cầu rút tiền của bạn đã được phê duyệt và thực hiện chuyển khoản thành công vào tài khoản ngân hàng của bạn.</p>

                            <div style="background: #f4fdf0; border-radius: 15px; padding: 25px; margin: 25px 0; border: 1px solid #dff4d5;">
                                <h2 style="color: #237804; font-size: 16px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase;">Chi tiết giao dịch</h2>
                                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #777;">Mã yêu cầu:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold;">#${request.id.split('-')[0].toUpperCase()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #777;">Số tiền rút:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #52c41d; font-size: 18px;">${formattedAmount}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #777;">Phí hệ thống (2%):</td>
                                        <td style="padding: 10px 0; text-align: right; color: #ff4d4f;">-${formattedFee}</td>
                                    </tr>
                                    <tr style="border-top: 1px dashed #dff4d5;">
                                        <td style="padding: 15px 0 10px 0; color: #777;">Ngân hàng:</td>
                                        <td style="padding: 15px 0 10px 0; text-align: right; font-weight: bold;">${request.bank_name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #777;">Số tài khoản:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold;">${request.account_number}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #777;">Thời gian:</td>
                                        <td style="padding: 10px 0; text-align: right;">${formattedDate}</td>
                                    </tr>
                                </table>
                            </div>

                            ${txHash ? `
                            <div style="text-align: center; margin-top: 20px;">
                                <p style="font-size: 12px; color: #999; margin-bottom: 10px;">Bằng chứng giao dịch trên Blockchain:</p>
                                <a href="https://amoy.polygonscan.com/tx/${txHash}" style="color: #1890ff; text-decoration: none; font-size: 13px; font-family: monospace; word-break: break-all;">${txHash}</a>
                            </div>
                            ` : ''}

                            <div style="margin-top: 35px; padding: 20px; border-radius: 12px; background-color: #fffbe6; border: 1px solid #ffe58f;">
                                <p style="font-size: 12px; color: #856404; margin: 0; line-height: 1.5;">
                                    <b>Lưu ý:</b> Thời gian tiền nổi trong tài khoản có thể phụ thuộc vào ngân hàng thụ hưởng. Nếu bạn chưa nhận được tiền sau 24h, vui lòng liên hệ bộ phận hỗ trợ của ${siteName}.
                                </p>
                            </div>
                        </div>

                        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #999; font-size: 11px;">
                            &copy; 2026 ${siteName} Financial System. Đây là email tự động, vui lòng không phản hồi.
                        </div>
                    </div>
                `
            };
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[Email Error] Withdrawal success mail failed:', error);
        }
    },

    /**
     * Gửi email thông báo hủy sự kiện khẩn cấp
     */
    sendEventCancellationEmail: async (user, event, reason, role = 'customer') => {
        try {
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';
            const supportEmail = config.support_email || 'support@basticket.com';

            const formattedDate = format(new Date(event.event_date), 'eeee, dd/MM/yyyy', { locale: vi });
            
            const subject = role === 'organizer' 
                ? `[${siteName}] THÔNG BÁO QUAN TRỌNG: Sự kiện "${event.title}" đã bị hủy bởi Quản trị viên`
                : `[${siteName}] THÔNG BÁO HỦY SỰ KIỆN: ${event.title}`;

            const title = role === 'organizer' ? 'Sự Kiện Đã Bị Hủy' : 'Thông Báo Hủy Sự Kiện & Hoàn Tiền';
            const intro = role === 'organizer'
                ? `Sự kiện <b>${event.title}</b> của bạn đã bị Quản trị viên hệ thống hủy bỏ do vi phạm các quy định hoặc sự cố nghiêm trọng.`
                : `Chúng tôi rất tiếc phải thông báo rằng sự kiện <b>${event.title}</b> mà bạn đã mua vé đã bị hủy bỏ bởi Quản trị viên hệ thống.`;

            const mailOptions = {
                from: `"${siteName} Support" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: subject,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #333; border-radius: 20px; overflow: hidden; border: 1px solid #ff4d4f;">
                        <div style="background-color: #ff4d4f; padding: 40px 20px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${title}</h1>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p>Chào <b>${user.full_name || user.email}</b>,</p>
                            <p style="line-height: 1.6;">${intro}</p>

                            <div style="background: #fff1f0; border: 1px solid #ffa39e; border-radius: 12px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #cf1322; margin-top: 0; font-size: 16px;">Lý do hủy từ Admin:</h3>
                                <p style="font-style: italic; color: #333; margin-bottom: 0;">"${reason}"</p>
                            </div>

                            <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                                <h3 style="margin-top: 0; font-size: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Thông tin sự kiện:</h3>
                                <table style="width: 100%; font-size: 14px;">
                                    <tr>
                                        <td style="color: #888; padding: 5px 0;">Sự kiện:</td>
                                        <td style="text-align: right; font-weight: bold;">${event.title}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #888; padding: 5px 0;">Thời gian:</td>
                                        <td style="text-align: right;">${formattedDate}</td>
                                    </tr>
                                </table>
                            </div>

                            ${role === 'customer' ? `
                            <div style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 12px; padding: 20px;">
                                <h3 style="color: #0050b3; margin-top: 0; font-size: 16px;">Quy trình Hoàn tiền:</h3>
                                <ul style="padding-left: 20px; color: #333; font-size: 14px; line-height: 1.6;">
                                    <li>Hệ thống đã tự động chuyển đơn hàng của bạn sang trạng thái <b>Chờ hoàn tiền</b>.</li>
                                    <li>Số tiền thanh toán sẽ được hoàn trả về phương thức thanh toán ban đầu của bạn.</li>
                                    <li>Thời gian nhận được tiền dự kiến từ 3-7 ngày làm việc tùy theo ngân hàng/ví điện tử.</li>
                                </ul>
                            </div>
                            ` : `
                            <div style="background: #fff7e6; border: 1px solid #ffe58f; border-radius: 12px; padding: 20px;">
                                <h3 style="color: #d46b08; margin-top: 0; font-size: 16px;">Lưu ý cho Ban tổ chức:</h3>
                                <p style="font-size: 14px; line-height: 1.6;">Smart Contract của sự kiện đã bị vô hiệu hóa. Toàn bộ doanh thu chưa thanh toán sẽ được hệ thống ưu tiên sử dụng để hoàn tiền cho khách hàng.</p>
                            </div>
                            `}

                            <p style="margin-top: 30px; font-size: 13px; color: #888;">Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ của ${siteName} qua email ${supportEmail}.</p>
                        </div>

                        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; color: #999; font-size: 11px;">
                            &copy; 2026 ${siteName} Support Team. Hệ thống thông báo tự động.
                        </div>
                    </div>
                `
            };
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[Email Error] Cancellation mail failed:', error);
        }
    },
    
    /**
     * Gửi OTP xác nhận thay đổi cấu hình hệ thống
     */
    sendOTPConfigEmail: async (adminEmail, otp) => {
        try {
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';

            const mailOptions = {
                from: `"${siteName} Security" <${process.env.EMAIL_USER}>`,
                to: adminEmail,
                subject: `[${siteName}] Mã xác thực thay đổi cấu hình hệ thống`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; color: #333; border-radius: 20px; overflow: hidden; border: 1px solid #e0e0e0;">
                        <div style="background-color: #000; padding: 30px; text-align: center; border-bottom: 4px solid #52c41d;">
                            <h1 style="color: #52c41d; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Xác Thực Bảo Mật</h1>
                        </div>
                        
                        <div style="padding: 40px 30px; text-align: center;">
                            <p style="font-size: 15px; color: #666; margin-bottom: 25px;">Bạn đang thực hiện thay đổi các cấu hình quan trọng của hệ thống <b>${siteName}</b>. Vui lòng sử dụng mã OTP dưới đây để xác nhận:</p>
                            
                            <div style="background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 15px; padding: 20px; display: inline-block;">
                                <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #52c41d; font-family: monospace;">${otp}</span>
                            </div>
                            
                            <p style="font-size: 12px; color: #999; margin-top: 30px;">Mã này sẽ hết hạn sau <b>5 phút</b>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu tài khoản ngay lập tức.</p>
                        </div>

                        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #bbb; font-size: 11px;">
                            &copy; 2026 ${siteName} Security System.
                        </div>
                    </div>
                `
            };
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[Email Error] OTP config mail failed:', error);
        }
    },

    /**
     * Gửi email thông báo kết quả xét duyệt hoàn tiền
     */
    sendRefundNotificationEmail: async (user, refundRequest, action, adminNotes) => {
        try {
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';
            const supportEmail = config.support_email || 'support@basticket.com';

            const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refundRequest.refund_amount);
            const formattedDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi });
            const isApproved = action === 'approve';

            const subject = isApproved 
                ? `[${siteName}] HOÀN TIỀN THÀNH CÔNG: Vé #${refundRequest.ticket?.ticket_number || refundRequest.ticket_id.slice(0,8).toUpperCase()}`
                : `[${siteName}] KẾT QUẢ XÉT DUYỆT HOÀN TIỀN: Vé #${refundRequest.ticket?.ticket_number || refundRequest.ticket_id.slice(0,8).toUpperCase()}`;

            const statusHeader = isApproved ? 'HOÀN TIỀN THÀNH CÔNG' : 'TỪ CHỐI HOÀN TIỀN';
            const statusColor = isApproved ? '#52c41d' : '#ff4d4f';
            const statusBg = isApproved ? '#f6ffed' : '#fff1f0';
            const statusBorder = isApproved ? '#b7eb8f' : '#ffa39e';

            const introMessage = isApproved
                ? `Yêu cầu hoàn tiền cho vé của bạn đã được Admin phê duyệt thành công. Số tiền đã được cộng trực tiếp vào số dư ví BASTICKET của bạn.`
                : `Yêu cầu hoàn tiền cho vé của bạn đã không được phê duyệt sau khi rà soát các điều khoản chính sách của sự kiện.`;

            const mailOptions = {
                from: `"${siteName} Finance" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: subject,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0c; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a1c;">
                        <div style="background-color: #000000; padding: 40px 20px; text-align: center; border-bottom: 3px solid ${statusColor};">
                            <h1 style="color: ${statusColor}; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">${statusHeader}</h1>
                            <p style="color: #888; margin-top: 10px; font-size: 14px;">Mã yêu cầu: #${refundRequest.id.slice(0,8).toUpperCase()}</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p style="font-size: 16px;">Chào <b>${user.full_name || user.email}</b>,</p>
                            <p style="font-size: 14px; line-height: 1.6; color: #ccc;">${introMessage}</p>

                            <div style="background: rgba(255,255,255,0.05); border-radius: 15px; padding: 25px; margin: 25px 0; border: 1px solid rgba(255,255,255,0.1);">
                                <h2 style="color: ${statusColor}; font-size: 16px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase;">Thông tin xét duyệt</h2>
                                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ccc;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #888;">Mã vé:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">#${refundRequest.ticket?.ticket_number || refundRequest.ticket_id.slice(0,8).toUpperCase()}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #888;">Sự kiện:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${refundRequest.ticket?.event?.title || 'Sự kiện BASTICKET'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #888;">Số tiền hoàn:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: ${statusColor}; font-size: 18px;">${formattedAmount}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #888;">Phương thức:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${isApproved ? 'Cộng vào Số dư Ví BASTICKET' : 'Không hoàn tiền'}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
                                        <td style="padding: 15px 0 10px 0; color: #888;">Thời gian xử lý:</td>
                                        <td style="padding: 15px 0 10px 0; text-align: right; color: #fff;">${formattedDate}</td>
                                    </tr>
                                </table>
                            </div>

                            ${adminNotes ? `
                            <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                                <h3 style="color: ${statusColor}; margin-top: 0; font-size: 15px;">Phản hồi từ Ban quản trị:</h3>
                                <p style="font-style: italic; color: #333; margin-bottom: 0; font-size: 14px;">"${adminNotes}"</p>
                            </div>
                            ` : ''}

                            ${isApproved ? `
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:5173/wallet" style="background-color: #52c41d; color: #000; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">KIỂM TRA SỐ DƯ VÍ</a>
                            </div>
                            ` : `
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:5173/my-tickets" style="background-color: #333; color: #fff; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">TRUY CẬP VÉ CỦA TÔI</a>
                            </div>
                            `}

                            <p style="margin-top: 35px; font-size: 13px; color: #888; text-align: center;">Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ ${supportEmail}.</p>
                        </div>

                        <div style="background-color: #000000; padding: 20px; text-align: center; color: #555; font-size: 11px; border-top: 1px solid #1a1a1c;">
                            &copy; 2026 ${siteName} Financial System. Hệ thống thông báo tự động.
                        </div>
                    </div>
                `
            };
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[Email Error] Refund notification mail failed:', error);
        }
    },

    /**
     * Gửi email thông báo dời lịch trình diễn sự kiện cho người dùng mua vé
     */
    sendEventRescheduleEmail: async (user, event, oldDate, newDate, newTime) => {
        try {
            const config = await SystemConfigService.getConfig();
            const siteName = config.site_name || 'BASTICKET';
            const supportEmail = config.support_email || 'support@basticket.com';

            const formattedOldDate = format(new Date(oldDate), 'eeee, dd/MM/yyyy', { locale: vi });
            const formattedNewDate = format(new Date(newDate), 'eeee, dd/MM/yyyy', { locale: vi });

            const mailOptions = {
                from: `"${siteName} Support" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: `[${siteName}] THÔNG BÁO DỜI LỊCH TRÌNH DIỄN: "${event.title}"`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0c; color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1a1a1c;">
                        <div style="background-color: #fa8c16; padding: 40px 20px; text-align: center; color: white;">
                            <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">Thông Báo Dời Lịch Trình Diễn</h1>
                            <p style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Lịch trình diễn mới đã được cập nhật thành công</p>
                        </div>
                        
                        <div style="padding: 30px;">
                            <p style="font-size: 16px;">Chào <b>${user.full_name || user.email}</b>,</p>
                            <p style="font-size: 14px; line-height: 1.6; color: #ccc;">Ban tổ chức sự kiện <b>${event.title}</b> đã thông báo dời lịch trình diễn và được Quản trị viên hệ thống phê duyệt thành công. Chúng tôi xin gửi đến bạn thông tin chi tiết lịch mới như sau:</p>

                            <div style="background: rgba(255,255,255,0.05); border-radius: 15px; padding: 25px; margin: 25px 0; border: 1px solid rgba(250, 140, 22, 0.3);">
                                <h2 style="color: #fa8c16; font-size: 16px; margin-top: 0; margin-bottom: 15px; text-transform: uppercase;">Chi tiết thay đổi</h2>
                                <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ccc;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #888; text-decoration: line-through;">Lịch trình diễn cũ:</td>
                                        <td style="padding: 10px 0; text-align: right; text-decoration: line-through; color: #888;">${formattedOldDate}</td>
                                    </tr>
                                    <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
                                        <td style="padding: 15px 0 10px 0; color: #fa8c16; font-weight: bold;">LỊCH TRÌNH DIỄN MỚI:</td>
                                        <td style="padding: 15px 0 10px 0; text-align: right; font-weight: bold; color: #52c41d; font-size: 16px;">${formattedNewDate} | ${newTime || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #888;">Địa điểm:</td>
                                        <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #fff;">${event.location_address || 'Địa điểm tổ chức'}</td>
                                    </tr>
                                </table>
                            </div>

                            <div style="background: rgba(250, 140, 22, 0.1); border: 1px solid rgba(250, 140, 22, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                                <h3 style="color: #fa8c16; margin-top: 0; font-size: 15px;">Quyền lợi Yêu cầu Hoàn tiền:</h3>
                                <p style="font-size: 14px; line-height: 1.6; color: #ccc; margin-bottom: 0;">Nếu thời gian trình diễn mới không phù hợp với lịch trình cá nhân của bạn, bạn hoàn toàn có quyền yêu cầu hoàn lại tiền vé. Vui lòng truy cập trang <b>Vé của tôi</b> -> chọn tab <b>Dời lịch</b> và bấm nút <b>Yêu cầu hoàn tiền</b>.</p>
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:5173/my-tickets" style="background-color: #fa8c16; color: #000; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">QUẢN LÝ VÉ CỦA TÔI</a>
                            </div>

                            <p style="margin-top: 35px; font-size: 13px; color: #888; text-align: center;">Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ ${supportEmail}.</p>
                        </div>

                        <div style="background-color: #000000; padding: 20px; text-align: center; color: #555; font-size: 11px; border-top: 1px solid #1a1a1c;">
                            &copy; 2026 ${siteName} Support Team. Hệ thống thông báo tự động.
                        </div>
                    </div>
                `
            };
            return await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('[Email Error] Reschedule notification mail failed:', error);
        }
    }
};

module.exports = EmailService;
