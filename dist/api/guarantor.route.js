"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const guarantor_controller_1 = require("../controllers/guarantor.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), 'uploads', 'guarantors');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const guarantorId = req.params.id;
        const docType = req.params.documentType;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `guarantor-${guarantorId}-${docType}-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
    }
});
router.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path_1.default.join(process.cwd(), 'uploads', 'guarantors', filename);
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: 'File not found'
        });
    }
    res.sendFile(filePath);
});
router.get('/staff/:staffId', auth_middleware_1.authenticateJWT, guarantor_controller_1.getGuarantors);
router.get('/:id', auth_middleware_1.authenticateJWT, guarantor_controller_1.getGuarantor);
router.post('/', auth_middleware_1.authenticateJWT, guarantor_controller_1.createGuarantor);
router.put('/:id', auth_middleware_1.authenticateJWT, guarantor_controller_1.updateGuarantor);
router.delete('/:id', auth_middleware_1.authenticateJWT, guarantor_controller_1.deleteGuarantor);
router.post('/:id/verify', auth_middleware_1.authenticateJWT, guarantor_controller_1.verifyGuarantor);
router.post('/:id/upload/:documentType', auth_middleware_1.authenticateJWT, upload.single('document'), guarantor_controller_1.uploadGuarantorDocument);
exports.default = router;
//# sourceMappingURL=guarantor.route.js.map