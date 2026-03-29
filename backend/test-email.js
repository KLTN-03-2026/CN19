const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'basticket.noreply@gmail.com',
    pass: process.env.EMAIL_PASS || 'uhlf tqjx qcny uoom'
  }
});

const sendTest = async () => {
  try {
    const mailOptions = {
      from: `"BASTICKET TEST" <basticket.noreply@gmail.com>`,
      to: 'mynphuong7304@gmail.com',
      subject: 'Test Email từ Hệ thống BASTICKET',
      text: 'Nếu bạn nhận được email này, cấu hình SMTP của hệ thống đang hoạt động hoàn hảo 100%!',
      html: '<h1>BASTICKET SMTP TEST</h1><p>Nếu bạn nhận được email này, cấu hình SMTP của hệ thống đang hoạt động hoàn hảo 100%!</p>'
    };

    console.log('Đang gửi test email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ THÀNH CÔNG: Email sent -> ', info.response);
  } catch (err) {
    console.error('❌ LỖI: ', err);
  }
};

sendTest();
