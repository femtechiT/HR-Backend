"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class UserPermissionModel {
    static tableName = 'user_permissions';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ?`, [userId]);
        return rows;
    }
    static async findByUserAndPermission(userId, permission) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? AND permission = ?`, [userId, permission]);
        return rows[0] || null;
    }
    static async create(permissionData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (user_id, permission, allow_deny)
       VALUES (?, ?, ?)`, [
            permissionData.user_id,
            permissionData.permission,
            permissionData.allow_deny || 'allow'
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create user permission');
        }
        return createdItem;
    }
    static async update(id, permissionData) {
        const updates = [];
        const values = [];
        if (permissionData.allow_deny !== undefined) {
            updates.push('allow_deny = ?');
            values.push(permissionData.allow_deny);
        }
        if (updates.length === 0) {
            return this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async deleteUserPermission(userId, permission) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE user_id = ? AND permission = ?`, [userId, permission]);
        return result.affectedRows > 0;
    }
    static async getUserPermissions(userId) {
        return await this.findByUserId(userId);
    }
    static async hasPermission(userId, permission) {
        const userPerm = await this.findByUserAndPermission(userId, permission);
        if (userPerm) {
            return userPerm.allow_deny === 'allow';
        }
        return false;
    }
}
exports.default = UserPermissionModel;
//# sourceMappingURL=user-permission.model.js.map