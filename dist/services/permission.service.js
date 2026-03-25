"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../models/user.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const user_permission_model_1 = __importDefault(require("../models/user-permission.model"));
const role_permission_model_1 = __importDefault(require("../models/role-permission.model"));
const cache_service_1 = require("./cache.service");
class PermissionService {
    static async hasPermission(userId, permission) {
        const userPermission = await user_permission_model_1.default.findByUserAndPermission(userId, permission);
        if (userPermission) {
            return {
                hasPermission: userPermission.allow_deny === 'allow',
                source: 'user',
                allowDeny: userPermission.allow_deny
            };
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return {
                hasPermission: false,
                source: 'none',
                allowDeny: null
            };
        }
        const role = await role_model_1.default.findById(user.role_id);
        if (role && role.permissions && role.permissions.includes('*')) {
            return {
                hasPermission: true,
                source: 'role',
                allowDeny: 'allow'
            };
        }
        const rolePermission = await role_permission_model_1.default.findByRoleAndPermission(user.role_id, permission);
        if (rolePermission) {
            return {
                hasPermission: rolePermission.allow_deny === 'allow',
                source: 'role',
                allowDeny: rolePermission.allow_deny
            };
        }
        return {
            hasPermission: false,
            source: 'none',
            allowDeny: null
        };
    }
    static async getAllUserPermissions(userId) {
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return [];
        }
        const role = await role_model_1.default.findById(user.role_id);
        if (role && role.permissions && role.permissions.includes('*')) {
            return [{
                    permission: '*',
                    source: 'role',
                    allowDeny: 'allow'
                }];
        }
        const userPermissions = await user_permission_model_1.default.getUserPermissions(userId);
        const userPermList = userPermissions.map(perm => ({
            permission: perm.permission,
            source: 'user',
            allowDeny: perm.allow_deny
        }));
        const rolePermissions = await role_permission_model_1.default.getRolePermissions(user.role_id);
        const rolePermList = rolePermissions
            .filter(rp => !userPermList.some(up => up.permission === rp.permission))
            .map(perm => ({
            permission: perm.permission,
            source: 'role',
            allowDeny: perm.allow_deny
        }));
        return [...userPermList, ...rolePermList];
    }
    static async generatePermissionManifest(userId) {
        const cacheKey = `user:permissions:${userId}`;
        const cachedManifest = await cache_service_1.CacheService.get(cacheKey);
        if (cachedManifest) {
            return cachedManifest;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return {};
        }
        const role = await role_model_1.default.findById(user.role_id);
        if (role && role.permissions && role.permissions.includes('*')) {
            const manifest = { '*': true };
            await cache_service_1.CacheService.set(cacheKey, manifest, 3600);
            return manifest;
        }
        const allPermissions = await this.getAllUserPermissions(userId);
        const manifest = {};
        allPermissions.forEach(perm => {
            manifest[perm.permission] = perm.allowDeny === 'allow';
        });
        await cache_service_1.CacheService.set(cacheKey, manifest, 3600);
        return manifest;
    }
    static async invalidateUserPermissionCache(userId) {
        const cacheKey = `user:permissions:${userId}`;
        await cache_service_1.CacheService.del(cacheKey);
    }
    static async invalidateAllUserPermissionCaches() {
        await cache_service_1.CacheService.invalidatePattern('user:permissions:*');
    }
}
exports.default = PermissionService;
//# sourceMappingURL=permission.service.js.map