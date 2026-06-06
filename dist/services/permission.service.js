"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const cache_service_1 = require("./cache.service");
class PermissionService {
    static async hasPermission(userId, permission) {
        const [rows] = await database_1.pool.execute(`SELECT
        up.allow_deny AS user_perm_allow_deny,
        rp.allow_deny AS role_perm_allow_deny,
        r.permissions AS role_wildcard
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_permissions up ON up.user_id = u.id AND up.permission = ?
      LEFT JOIN roles_permissions rp ON rp.role_id = u.role_id AND rp.permission = ?
      WHERE u.id = ?`, [permission, permission, userId]);
        const row = rows[0];
        if (!row) {
            return { hasPermission: false, source: 'none', allowDeny: null };
        }
        if (row.user_perm_allow_deny) {
            return {
                hasPermission: row.user_perm_allow_deny === 'allow',
                source: 'user',
                allowDeny: row.user_perm_allow_deny
            };
        }
        if (row.role_wildcard && row.role_wildcard.includes('*')) {
            return { hasPermission: true, source: 'role', allowDeny: 'allow' };
        }
        if (row.role_perm_allow_deny) {
            return {
                hasPermission: row.role_perm_allow_deny === 'allow',
                source: 'role',
                allowDeny: row.role_perm_allow_deny
            };
        }
        return { hasPermission: false, source: 'none', allowDeny: null };
    }
    static async hasPermissionAny(userId, permissions) {
        const placeholders = permissions.map(() => '?').join(',');
        const [rows] = await database_1.pool.execute(`SELECT
        up.permission AS user_perm,
        up.allow_deny AS user_perm_allow_deny,
        rp.permission AS role_perm,
        rp.allow_deny AS role_perm_allow_deny,
        r.permissions AS role_wildcard
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_permissions up ON up.user_id = u.id AND up.permission IN (${placeholders})
      LEFT JOIN roles_permissions rp ON rp.role_id = u.role_id AND rp.permission IN (${placeholders})
      WHERE u.id = ?`, [...permissions, ...permissions, userId]);
        const results = rows;
        if (results.length === 0) {
            return { hasPermission: false, source: 'none', allowDeny: null };
        }
        const firstRow = results[0];
        if (firstRow.role_wildcard && firstRow.role_wildcard.includes('*')) {
            return { hasPermission: true, source: 'role', allowDeny: 'allow' };
        }
        for (const row of results) {
            if (row.user_perm_allow_deny) {
                return {
                    hasPermission: row.user_perm_allow_deny === 'allow',
                    source: 'user',
                    allowDeny: row.user_perm_allow_deny
                };
            }
        }
        for (const row of results) {
            if (row.role_perm_allow_deny) {
                return {
                    hasPermission: row.role_perm_allow_deny === 'allow',
                    source: 'role',
                    allowDeny: row.role_perm_allow_deny
                };
            }
        }
        return { hasPermission: false, source: 'none', allowDeny: null };
    }
    static async getAllUserPermissions(userId) {
        const [rows] = await database_1.pool.execute(`SELECT r.permissions AS role_wildcard FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`, [userId]);
        const userRow = rows[0];
        if (!userRow) {
            return [];
        }
        if (userRow.role_wildcard && userRow.role_wildcard.includes('*')) {
            return [{
                    permission: '*',
                    source: 'role',
                    allowDeny: 'allow'
                }];
        }
        const [userPermissions] = await database_1.pool.execute(`SELECT permission, allow_deny FROM user_permissions WHERE user_id = ?`, [userId]);
        const [rolePermissions] = await database_1.pool.execute(`SELECT rp.permission, rp.allow_deny FROM roles_permissions rp
       INNER JOIN users u ON u.role_id = rp.role_id
       WHERE u.id = ?`, [userId]);
        const userPermList = userPermissions.map(perm => ({
            permission: perm.permission,
            source: 'user',
            allowDeny: perm.allow_deny
        }));
        const rolePermList = rolePermissions
            .filter((rp) => !userPermList.some(up => up.permission === rp.permission))
            .map((perm) => ({
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
        const [rows] = await database_1.pool.execute(`SELECT r.permissions AS role_wildcard FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`, [userId]);
        const userRow = rows[0];
        if (!userRow) {
            return {};
        }
        if (userRow.role_wildcard && userRow.role_wildcard.includes('*')) {
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