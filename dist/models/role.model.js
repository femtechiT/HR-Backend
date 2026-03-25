"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class RoleModel {
    static tableName = 'roles';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByName(name) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE name = ?`, [name]);
        return rows[0] || null;
    }
    static async create(roleData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (name, description, permissions)
       VALUES (?, ?, ?)`, [
            roleData.name,
            roleData.description,
            JSON.stringify(roleData.permissions)
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create role');
        }
        return createdItem;
    }
    static async update(id, roleData) {
        const updates = [];
        const values = [];
        if (roleData.name !== undefined) {
            updates.push('name = ?');
            values.push(roleData.name);
        }
        if (roleData.description !== undefined) {
            updates.push('description = ?');
            values.push(roleData.description);
        }
        if (roleData.permissions !== undefined) {
            updates.push('permissions = ?');
            values.push(JSON.stringify(roleData.permissions));
        }
        if (updates.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async getRolePermissions(roleId) {
        const role = await this.findById(roleId);
        return role ? role.permissions : [];
    }
    static async findAllWithFilters(limit, offset, name) {
        let query = `SELECT * FROM ${this.tableName}`;
        let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const params = [];
        const countParams = [];
        if (name) {
            query += ` WHERE name LIKE ?`;
            countQuery += ` WHERE name LIKE ?`;
            params.push(`%${name}%`);
            countParams.push(`%${name}%`);
        }
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const [rows, countResult] = await Promise.all([
            database_1.pool.execute(query, params),
            database_1.pool.execute(countQuery, countParams)
        ]);
        const roles = rows[0];
        const totalCount = countResult[0][0].count;
        return { roles, totalCount };
    }
}
exports.default = RoleModel;
//# sourceMappingURL=role.model.js.map