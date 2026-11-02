"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const password_change_controller_1 = require("../controllers/password-change.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const staff_photo_controller_1 = require("../controllers/staff-photo.controller");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('users:read'), user_controller_1.getAllUsers);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('users:read'), user_controller_1.getUserById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.create'), user_controller_1.createUser);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.update'), user_controller_1.updateUser);
router.post('/:id/reset-password', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.update'), user_controller_1.resetUserPassword);
router.put('/:id/role', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.update'), user_controller_1.updateUserRole);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.delete'), user_controller_1.deleteUser);
router.patch('/:id/terminate', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.terminate'), user_controller_1.terminateUser);
router.patch('/:id/delete', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.permanent_delete'), user_controller_1.softDeleteUser);
router.patch('/:id/restore', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.restore'), user_controller_1.restoreUser);
router.post('/me/upload-photo', auth_middleware_1.authenticateJWT, (req, res, next) => {
    if (!req.currentUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    req.params.id = String(req.currentUser.id);
    req.resolvedUserId = req.currentUser.id;
    return next();
}, staff_photo_controller_1.upload.single('profile_picture'), staff_photo_controller_1.uploadProfilePhoto);
router.post('/:id/upload-photo', auth_middleware_1.authenticateJWT, async (req, res, next) => {
    const id = parseInt(String(req.params.id ?? ''), 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    if (!req.currentUser) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.currentUser.id === id) {
        req.resolvedUserId = id;
        return next();
    }
    return (0, auth_middleware_1.checkPermission)('user.update')(req, res, () => {
        req.resolvedUserId = id;
        next();
    });
}, staff_photo_controller_1.upload.single('profile_picture'), staff_photo_controller_1.uploadProfilePhoto);
router.put('/:id/password-change', auth_middleware_1.authenticateJWT, password_change_controller_1.changePasswordAfterFirstLogin);
router.get('/:id/permissions', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.permissions.view'), user_controller_1.getUserPermissions);
router.post('/:id/permissions', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.permissions.manage'), user_controller_1.addUserPermission);
router.delete('/:id/permissions/:permission', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('user.permissions.manage'), user_controller_1.removeUserPermission);
exports.default = router;
//# sourceMappingURL=user.route.js.map