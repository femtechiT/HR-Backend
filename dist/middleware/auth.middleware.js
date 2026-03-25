"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachPermissions = exports.checkPermission = exports.authenticateJWT = void 0;
const jwt_util_1 = __importDefault(require("../utils/jwt.util"));
const user_model_1 = __importDefault(require("../models/user.model"));
const permission_service_1 = __importDefault(require("../services/permission.service"));
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Access token is required'
                });
            }
            let decoded;
            try {
                decoded = jwt_util_1.default.verifyAccessToken(token);
            }
            catch (verifyError) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }
            const user = await user_model_1.default.findById(decoded.userId);
            if (!user || user.status !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or inactive user'
                });
            }
            req.currentUser = {
                id: user.id,
                email: user.email,
                role_id: user.role_id,
                branch_id: user.branch_id
            };
            return next();
        }
        else {
            console.log('Invalid authentication header format');
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication header format. Use "Bearer <token>" for JWT authentication.'
            });
        }
    }
    catch (error) {
        console.error('Authentication error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticateJWT = authenticateJWT;
const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            if (req.currentUser) {
                const permissionResult = await permission_service_1.default.hasPermission(req.currentUser.id, permission);
                if (!permissionResult.hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: `Insufficient permissions. Required: ${permission}`,
                        requiredPermission: permission,
                        permissionSource: permissionResult.source
                    });
                }
                return next();
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
        }
        catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during permission check'
            });
        }
    };
};
exports.checkPermission = checkPermission;
const attachPermissions = async (req, res, next) => {
    try {
        if (req.currentUser) {
            const permissions = await permission_service_1.default.generatePermissionManifest(req.currentUser.id);
            req.currentUser.permissions = permissions;
        }
        return next();
    }
    catch (error) {
        console.error('Error attaching permissions:', error);
        return next();
    }
};
exports.attachPermissions = attachPermissions;
//# sourceMappingURL=auth.middleware.js.map