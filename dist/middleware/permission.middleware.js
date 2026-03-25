"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachPermissions = exports.checkPermission = void 0;
const permission_service_1 = __importDefault(require("../services/permission.service"));
const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            if (!req.currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
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
//# sourceMappingURL=permission.middleware.js.map