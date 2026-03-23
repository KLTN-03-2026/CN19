const nodemailer = require('nodemailer');

// Tạo transporter với tài khoản Gmail
// LƯU Ý: Phải dùng Google App Password nếu dùng Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'youremail@gmail.com',
    pass: process.env.EMAIL_PASS || 'your_app_password_here'
  }
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"BASTICKET System" <${process.env.EMAIL_USER || 'no-reply@basticket.com'}>`,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    return false;
  }
};

module.exports = sendEmail;
