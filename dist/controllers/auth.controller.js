"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissions = exports.refreshToken = exports.logout = exports.login = void 0;
const jwt_util_1 = __importDefault(require("../utils/jwt.util"));
const user_model_1 = __importDefault(require("../models/user.model"));
const permission_service_1 = __importDefault(require("../services/permission.service"));
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
        if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
            return res.status(403).json({
                success: false,
                message: `Only ${allowedDomain} email addresses are allowed`
            });
        }
        const user = await user_model_1.default.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }
        const isValidPassword = await user_model_1.default.comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role_id
        };
        const { rememberMe } = req.body;
        const usePersistentLogin = rememberMe === true || rememberMe === 'true';
        const accessToken = jwt_util_1.default.generateAccessToken(payload);
        const refreshToken = jwt_util_1.default.generateRefreshToken(payload);
        const cookieMaxAge = usePersistentLogin
            ? 90 * 24 * 60 * 60 * 1000
            : 7 * 24 * 60 * 60 * 1000;
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: cookieMaxAge,
            path: '/'
        });
        const permissions = await permission_service_1.default.generatePermissionManifest(user.id);
        const needsPasswordChange = !!user.must_change_password;
        const needsProfileCompletion = !(user.phone && user.date_of_birth);
        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    roleId: user.role_id,
                    branchId: user.branch_id,
                    status: user.status,
                    profile_picture: user.profile_picture,
                    needs_password_change: needsPasswordChange,
                    needs_profile_completion: needsProfileCompletion
                },
                permissions,
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
                }
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.logout = logout;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }
        try {
            const decoded = jwt_util_1.default.verifyRefreshToken(refreshToken);
            const user = await user_model_1.default.findById(decoded.userId);
            if (!user || user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or inactive user'
                });
            }
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role_id
            };
            const newAccessToken = jwt_util_1.default.generateAccessToken(payload);
            const newRefreshToken = jwt_util_1.default.generateRefreshToken(payload);
            return res.json({
                success: true,
                message: 'Tokens refreshed successfully',
                data: {
                    tokens: {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: process.env.JWT_EXPIRES_IN || '2h'
                    }
                }
            });
        }
        catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }
    }
    catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.refreshToken = refreshToken;
const getPermissions = async (req, res) => {
    try {
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const permissions = await permission_service_1.default.generatePermissionManifest(req.currentUser.id);
        return res.json({
            success: true,
            message: 'Permissions retrieved successfully',
            data: {
                permissions
            }
        });
    }
    catch (error) {
        console.error('Get permissions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPermissions = getPermissions;
//# sourceMappingURL=auth.controller.js.map