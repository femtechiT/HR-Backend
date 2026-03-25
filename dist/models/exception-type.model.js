"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class ExceptionTypeModel {
    static tableName = 'shift_exception_types';
    static async findAll(activeOnly = false) {
        let query = `SELECT * FROM ${this.tableName}`;
        if (activeOnly) {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY sort_order, name';
        const [rows] = await database_1.pool.execute(query);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByCode(code) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE code = ?`, [code]);
        return rows[0] || null;
    }
    static async create(typeData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} 
       (name, code, description, icon, color, default_start_time, default_end_time, 
        default_break_duration, is_active, is_system, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            typeData.name,
            typeData.code,
            typeData.description || null,
            typeData.icon || 'AlertCircle',
            typeData.color || 'bg-gray-100 text-gray-700',
            typeData.default_start_time || null,
            typeData.default_end_time || null,
            typeData.default_break_duration || 60,
            typeData.is_active !== undefined ? typeData.is_active : true,
            typeData.is_system !== undefined ? typeData.is_system : false,
            typeData.sort_order || 0
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create exception type');
        }
        return createdItem;
    }
    static async update(id, typeData) {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }
        if (existing.is_system && (typeData.code !== undefined || typeData.is_active !== undefined)) {
            throw new Error('Cannot modify system exception types');
        }
        const updates = [];
        const values = [];
        if (typeData.name !== undefined) {
            updates.push('name = ?');
            values.push(typeData.name);
        }
        if (typeData.description !== undefined) {
            updates.push('description = ?');
            values.push(typeData.description);
        }
        if (typeData.icon !== undefined) {
            updates.push('icon = ?');
            values.push(typeData.icon);
        }
        if (typeData.color !== undefined) {
            updates.push('color = ?');
            values.push(typeData.color);
        }
        if (typeData.default_start_time !== undefined) {
            updates.push('default_start_time = ?');
            values.push(typeData.default_start_time);
        }
        if (typeData.default_end_time !== undefined) {
            updates.push('default_end_time = ?');
            values.push(typeData.default_end_time);
        }
        if (typeData.default_break_duration !== undefined) {
            updates.push('default_break_duration = ?');
            values.push(typeData.default_break_duration);
        }
        if (typeData.is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(typeData.is_active);
        }
        if (typeData.sort_order !== undefined) {
            updates.push('sort_order = ?');
            values.push(typeData.sort_order);
        }
        if (updates.length === 0) {
            return existing;
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const existing = await this.findById(id);
        if (!existing) {
            return false;
        }
        if (existing.is_system) {
            throw new Error('Cannot delete system exception types');
        }
        const [usage] = await database_1.pool.execute(`SELECT COUNT(*) as count FROM shift_exceptions WHERE exception_type_id = ?`, [id]);
        if (usage[0].count > 0) {
            throw new Error('Cannot delete exception type that is in use');
        }
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async toggleActive(id) {
        const existing = await this.findById(id);
        if (!existing) {
            return null;
        }
        if (existing.is_system) {
            throw new Error('Cannot deactivate system exception types');
        }
        await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = NOT is_active WHERE id = ?`, [id]);
        return await this.findById(id);
    }
}
exports.default = ExceptionTypeModel;
//# sourceMappingURL=exception-type.model.js.map