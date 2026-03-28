"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePhoto = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), 'uploads', 'profile-photos');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const userId = req.params.id;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `user-${userId}-${Date.now()}${ext}`);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
const uploadProfilePhoto = async (req, res) => {
    try {
        console.log('========================================');
        console.log('[Backend] Upload profile photo request received');
        console.log('========================================');
        console.log('[Backend] User ID param:', req.params.id);
        console.log('[Backend] Current user ID:', req.currentUser?.id);
        console.log('[Backend] File:', req.file);
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            console.log('[Backend] ❌ Invalid user ID');
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        if (!req.file) {
            console.log('[Backend] ❌ No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const photoUrl = `/uploads/profile-photos/${req.file.filename}`;
        console.log('[Backend] Updating user', userId, 'with photo URL:', photoUrl);
        await user_model_1.default.update(userId, { profile_picture: photoUrl });
        console.log('[Backend] ✅ Profile photo uploaded successfully');
        return res.json({
            success: true,
            message: 'Profile photo uploaded successfully',
            data: {
                profile_picture_url: photoUrl
            }
        });
    }
    catch (error) {
        console.error('[Backend] Upload photo error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload profile photo'
        });
    }
};
exports.uploadProfilePhoto = uploadProfilePhoto;
//# sourceMappingURL=staff-photo.controller.js.map