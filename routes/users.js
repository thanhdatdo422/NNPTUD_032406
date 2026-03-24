var express = require("express");
var router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Lưu tạm file vào thư mục uploads
let userController = require('../controllers/users');
let { validatedResult, CreateAnUserValidator, ModifyAnUserValidator } = require('../utils/validator');
let { CheckLogin, checkRole } = require('../utils/authHandler');

// --- ROUTE MỚI: Import User ---
// Postman: POST /api/v1/users/import | Body: form-data | Key: "file" (type File)
router.post("/import", upload.single('file'), async function (req, res) {
    try {
        if (!req.file) return res.status(400).send({ message: "Vui lòng chọn file Excel" });
        
        let count = await userController.ImportUser(req.file.path);
        res.send({ message: `Đã import thành công ${count} users!` });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// Các route cũ của bạn giữ nguyên
router.get("/", CheckLogin, checkRole("ADMIN","MODERATOR"), async function (req, res) {
    let users = await userController.GetAllUser();
    res.send(users);
});

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res) {
    try {
        let user = await userController.CreateAnUser(
            req.body.username, req.body.password, req.body.email, req.body.role
        );
        res.send(user);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

// ... (các route GET/:id, PUT, DELETE giữ nguyên bên dưới)
module.exports = router;