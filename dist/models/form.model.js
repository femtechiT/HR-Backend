"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class FormModel {
    static tableName = 'forms';
    static async findAll(branchId) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        if (branchId) {
            query += ' WHERE branch_id = ?';
            params.push(branchId);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByType(formType, branchId) {
        let query = `SELECT * FROM ${this.tableName} WHERE form_type = ?`;
        const params = [formType];
        if (branchId) {
            query += ' AND branch_id = ?';
            params.push(branchId.toString());
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async create(formData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (name, description, form_type, branch_id, created_by)
       VALUES (?, ?, ?, ?, ?)`, [
            formData.name,
            formData.description ?? null,
            formData.form_type,
            formData.branch_id ?? null,
            formData.created_by ?? null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create form');
        }
        return createdItem;
    }
    static async update(id, formData) {
        const updates = [];
        const values = [];
        if (formData.name !== undefined) {
            updates.push('name = ?');
            values.push(formData.name);
        }
        if (formData.description !== undefined) {
            updates.push('description = ?');
            values.push(formData.description);
        }
        if (formData.form_type !== undefined) {
            updates.push('form_type = ?');
            values.push(formData.form_type);
        }
        if (formData.branch_id !== undefined) {
            updates.push('branch_id = ?');
            values.push(formData.branch_id);
        }
        if (formData.is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(formData.is_active);
        }
        if (updates.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = FALSE WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
}
exports.default = FormModel;
//# sourceMappingURL=form.model.js.map