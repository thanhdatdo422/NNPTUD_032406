// utils/helper.js
const nodemailer = require('nodemailer');

// Hàm tạo password ngẫu nhiên 16 ký tự
const generateRandomPassword = (length = 16) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return retVal;
};

// Cấu hình Mailtrap
const sendEmail = async (toEmail, password) => {
    let transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "YOUR_MAILTRAP_USER", // Thay bằng User của bạn
            pass: "YOUR_MAILTRAP_PASS"  // Thay bằng Pass của bạn
        }
    });

    await transporter.sendMail({
        from: '"Hệ thống quản lý" <admin@example.com>',
        to: toEmail,
        subject: "Thông tin tài khoản mới",
        text: `Chào bạn, tài khoản của bạn đã được khởi tạo. Mật khẩu đăng nhập là: ${password}`,
        html: `<b>Chào bạn,</b><p>Tài khoản của bạn đã được khởi tạo.</p><p>Mật khẩu đăng nhập là: <code>${password}</code></p>`
    });
};

module.exports = { generateRandomPassword, sendEmail };