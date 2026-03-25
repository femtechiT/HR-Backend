"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class RolePermissionModel {
    static tableName = 'roles_permissions';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByRoleId(roleId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE role_id = ?`, [roleId]);
        return rows;
    }
    static async findByRoleAndPermission(roleId, permission) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE role_id = ? AND permission = ?`, [roleId, permission]);
        return rows[0] || null;
    }
    static async create(permissionData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (role_id, permission, allow_deny)
       VALUES (?, ?, ?)`, [
            permissionData.role_id,
            permissionData.permission,
            permissionData.allow_deny || 'allow'
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create role permission');
        }
        return createdItem;
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async deleteRolePermission(roleId, permission) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE role_id = ? AND permission = ?`, [roleId, permission]);
        return result.affectedRows > 0;
    }
    static async deleteMultipleRolePermissions(roleId, permissions) {
        if (permissions.length === 0) {
            return true;
        }
        const placeholders = permissions.map(() => '?').join(',');
        const query = `DELETE FROM ${this.tableName} WHERE role_id = ? AND permission IN (${placeholders})`;
        const values = [roleId, ...permissions];
        const result = await database_1.pool.execute(query, values);
        return result.affectedRows >= 0;
    }
    static async getRolePermissions(roleId) {
        return await this.findByRoleId(roleId);
    }
    static async hasPermission(roleId, permission) {
        const rolePerm = await this.findByRoleAndPermission(roleId, permission);
        return rolePerm ? rolePerm.allow_deny === 'allow' : false;
    }
}
exports.default = RolePermissionModel;
//# sourceMappingURL=role-permission.model.js.map