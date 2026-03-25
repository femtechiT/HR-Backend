"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class LeaveTypeModel {
    static tableName = 'leave_types';
    static async findAll() {
        try {
            console.log(`Executing query: SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
            const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
            const rowCount = Array.isArray(rows) ? rows.length : 0;
            console.log(`Query successful, found ${rowCount} leave types`);
            return rows;
        }
        catch (error) {
            console.error(`Error executing query on ${this.tableName}:`, error);
            throw error;
        }
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByName(name) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE name = ?`, [name]);
        return rows[0] || null;
    }
    static async create(leaveTypeData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (name, days_per_year, is_paid, allow_carryover, carryover_limit, expiry_rule_id, created_by, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            leaveTypeData.name,
            leaveTypeData.days_per_year,
            leaveTypeData.is_paid,
            leaveTypeData.allow_carryover,
            leaveTypeData.carryover_limit,
            leaveTypeData.expiry_rule_id || null,
            leaveTypeData.created_by || null,
            leaveTypeData.is_active ?? true
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create leave type');
        }
        return createdItem;
    }
    static async update(id, leaveTypeData) {
        const updates = [];
        const values = [];
        if (leaveTypeData.name !== undefined) {
            updates.push('name = ?');
            values.push(leaveTypeData.name);
        }
        if (leaveTypeData.days_per_year !== undefined) {
            updates.push('days_per_year = ?');
            values.push(leaveTypeData.days_per_year);
        }
        if (leaveTypeData.is_paid !== undefined) {
            updates.push('is_paid = ?');
            values.push(leaveTypeData.is_paid);
        }
        if (leaveTypeData.allow_carryover !== undefined) {
            updates.push('allow_carryover = ?');
            values.push(leaveTypeData.allow_carryover);
        }
        if (leaveTypeData.carryover_limit !== undefined) {
            updates.push('carryover_limit = ?');
            values.push(leaveTypeData.carryover_limit);
        }
        if (leaveTypeData.expiry_rule_id !== undefined) {
            updates.push('expiry_rule_id = ?');
            values.push(leaveTypeData.expiry_rule_id);
        }
        if (leaveTypeData.is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(leaveTypeData.is_active);
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
    static async activate(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = TRUE WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async deactivate(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = FALSE WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
}
exports.default = LeaveTypeModel;
//# sourceMappingURL=leave-type.model.js.map