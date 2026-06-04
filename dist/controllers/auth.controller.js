"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissions = exports.refreshToken = exports.logout = exports.login = void 0;
const jwt_util_1 = __importDefault(require("../utils/jwt.util"));
const user_model_1 = __importDefault(require("../models/user.model"));
const permission_service_1 = __importDefault(require("../services/permission.service"));
const database_1 = require("../config/database");
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
        await permission_service_1.default.invalidateUserPermissionCache(user.id);
        const permissions = await permission_service_1.default.generatePermissionManifest(user.id);
        const needsPasswordChange = !!user.must_change_password;
        const needsProfileCompletion = !user.phone;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        try {
            const [pendingRows] = await database_1.pool.execute(`SELECT id FROM staff_invitations 
         WHERE user_id = ? AND status = 'pending'
         LIMIT 1`, [user.id]);
            if (pendingRows.length > 0) {
                await database_1.pool.execute(`UPDATE staff_invitations SET 
             status = 'accepted',
             accepted_at = NOW(),
             first_login_at = NOW(),
             first_login_ip = ?,
             profile_completed = ?
           WHERE id = ?`, [ip, !!user.phone ? 1 : 0, pendingRows[0].id]);
                console.log(`[Invite Tracking] Auto-accepted invitation for user ${user.id} (${user.email}) on first login`);
            }
            else {
                const [acceptedRows] = await database_1.pool.execute(`SELECT id FROM staff_invitations 
           WHERE user_id = ? AND status = 'accepted' AND first_login_at IS NULL
           LIMIT 1`, [user.id]);
                if (acceptedRows.length > 0) {
                    await database_1.pool.execute(`UPDATE staff_invitations SET 
               first_login_at = NOW(),
               first_login_ip = ?,
               profile_completed = ?
             WHERE id = ?`, [ip, !!user.phone ? 1 : 0, acceptedRows[0].id]);
                    console.log(`[Invite Tracking] Recorded first login for user ${user.id} (${user.email})`);
                }
                if (!needsPasswordChange) {
                    await database_1.pool.execute(`UPDATE staff_invitations SET last_activity_at = NOW()
             WHERE user_id = ? AND status = 'accepted'`, [user.id]);
                }
            }
        }
        catch (trackingError) {
            console.error('Invitation tracking error (non-critical):', trackingError);
        }
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