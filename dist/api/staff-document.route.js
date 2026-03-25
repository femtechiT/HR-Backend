"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_document_controller_1 = require("../controllers/staff-document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), 'uploads', 'staff-documents');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `staff-doc-${uniqueSuffix}${path_1.default.extname(file.originalname)}`);
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
router.get('/uploads/staff-documents/:filename', staff_document_controller_1.serveStaffDocument);
router.get('/staff/:id/documents', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('documents:read'), staff_document_controller_1.getStaffDocuments);
router.get('/staff/documents/:documentId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('documents:read'), staff_document_controller_1.getStaffDocument);
router.post('/staff/:id/documents', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('documents:upload'), upload.array('documents', 5), staff_document_controller_1.uploadStaffDocument);
router.delete('/staff/documents/:documentId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('documents:delete'), staff_document_controller_1.deleteStaffDocument);
exports.default = router;
//# sourceMappingURL=staff-document.route.js.map