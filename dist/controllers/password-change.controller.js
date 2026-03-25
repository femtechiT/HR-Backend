"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forcePasswordChange = exports.changePasswordAfterFirstLogin = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const changePasswordAfterFirstLogin = async (req, res) => {
    try {
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        const user = await user_model_1.default.findById(req.currentUser.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const isValidPassword = await user_model_1.default.comparePassword(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 10);
        const [result] = await require('../config/database').pool.execute(`UPDATE ${user_model_1.default.tableName} SET password_hash = ? WHERE id = ?`, [hashedNewPassword, req.currentUser.id]);
        await user_model_1.default.setPasswordChangeRequirement(req.currentUser.id, false);
        return res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        console.error('Change password after first login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.changePasswordAfterFirstLogin = changePasswordAfterFirstLogin;
const forcePasswordChange = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const userId = parseInt(typeof idStr === 'string' ? idStr : '');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const updatedUser = await user_model_1.default.setPasswordChangeRequirement(userId, true);
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        return res.json({
            success: true,
            message: 'Password change requirement set successfully',
            data: { user: { id: updatedUser.id, email: updatedUser.email } }
        });
    }
    catch (error) {
        console.error('Force password change error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.forcePasswordChange = forcePasswordChange;
//# sourceMappingURL=password-change.controller.js.map