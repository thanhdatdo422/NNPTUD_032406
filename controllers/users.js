const userModel = require("../schemas/users");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');

module.exports = {
    // Hàm cũ của bạn
    CreateAnUser: async function (username, password, email, role, session, fullName, avatarUrl, status, loginCount) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save({ session });
        return newItem;
    },

    // --- HÀM MỚI: Import User từ file Excel ---
    ImportUser: async function (filePath) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        // Tìm ID của role "USER"
        const roleModel = mongoose.model('role');
        let userRole = await roleModel.findOne({ name: /USER/i });
        if (!userRole) {
            userRole = await roleModel.create({ name: 'USER', description: 'Role mặc định cho user' });
            console.log("Role USER được tạo tự động", userRole._id);
        }

        let successCount = 0;

        // Lặp từ dòng 2 (bỏ qua header)
        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            const username = row.getCell(1).value;
            // Xử lý email nếu nó là object (thường gặp trong ExcelJS)
            let email = row.getCell(2).value;
            email = email?.text || email;

            if (username && email) {
                // 1. Tạo password ngẫu nhiên 16 ký tự
                const rawPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                
                // 2. Lưu vào DB (Password sẽ tự hash nhờ middleware pre-save)
                const newUser = new userModel({
                    username,
                    email,
                    password: rawPassword,
                    role: userRole._id,
                    status: true
                });
                await newUser.save();

                // 3. Gửi mail password cho user
                await this.SendPasswordEmail(email, rawPassword);
                successCount++;
            }
        }
        return successCount;
    },

    // --- HÀM MỚI: Gửi mail qua Mailtrap ---
    SendPasswordEmail: async function (email, password) {
        let transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io",
            port: process.env.MAILTRAP_PORT ? parseInt(process.env.MAILTRAP_PORT) : 2525,
            auth: {
                user: process.env.MAILTRAP_USER || "YOUR_MAILTRAP_USER",
                pass: process.env.MAILTRAP_PASS || "YOUR_MAILTRAP_PASS"
            }
        });

        await transporter.sendMail({
            from: '"Hệ thống HUTECH" <admin@hutech.edu.vn>',
            to: email,
            subject: "Thông tin tài khoản mới",
            html: `<p>Chào bạn, tài khoản của bạn đã được khởi tạo thành công.</p>
                   <p>Mật khẩu đăng nhập của bạn là: <b>${password}</b></p>`
        });
    },

    GetAllUser: async function () {
        return await userModel.find({ isDeleted: false });
    },
    GetUserById: async function (id) {
        try {
            return await userModel.findOne({ isDeleted: false, _id: id }).populate('role');
        } catch (error) { return false; }
    },
    // ... các hàm khác (GetUserByEmail, QueryLogin, v.v. giữ nguyên như code cũ của bạn)
    GetUserByEmail: async function (email) {
        try { return await userModel.findOne({ isDeleted: false, email: email }) } catch (error) { return false; }
    },
    QueryLogin: async function (username, password) {
        if (!username || !password) return false;
        let user = await userModel.findOne({ username: username, isDeleted: false });
        if (user) {
            if (user.lockTime && user.lockTime > Date.now()) return false;
            if (bcrypt.compareSync(password, user.password)) {
                user.loginCount = 0;
                await user.save();
                return jwt.sign({ id: user.id }, 'secret', { expiresIn: '1d' });
            } else {
                user.loginCount++;
                if (user.loginCount == 3) {
                    user.loginCount = 0;
                    user.lockTime = Date.now() + 3600000;
                }
                await user.save();
                return false;
            }
        }
        return false;
    }
};