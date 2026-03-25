"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class ShiftExceptionModel {
    static tableName = 'shift_exceptions';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY exception_date DESC`, [userId]);
        return rows;
    }
    static async findByDate(userId, date) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? AND exception_date = ? AND status = 'active'`, [userId, date]);
        return rows[0] || null;
    }
    static async findByDateRange(userId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName}
       WHERE user_id = ? AND exception_date BETWEEN ? AND ? AND status = 'active'
       ORDER BY exception_date DESC`, [userId, startDate, endDate]);
        return rows;
    }
    static async create(exceptionData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (
        user_id, shift_assignment_id, exception_date, exception_type,
        original_start_time, original_end_time, new_start_time, new_end_time,
        new_break_duration_minutes, reason, approved_by, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            exceptionData.user_id,
            exceptionData.shift_assignment_id || null,
            exceptionData.exception_date,
            exceptionData.exception_type,
            exceptionData.original_start_time || null,
            exceptionData.original_end_time || null,
            exceptionData.new_start_time || null,
            exceptionData.new_end_time || null,
            exceptionData.new_break_duration_minutes || 0,
            exceptionData.reason || null,
            exceptionData.approved_by || null,
            exceptionData.status || 'pending',
            exceptionData.created_by
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create shift exception');
        }
        return createdItem;
    }
    static async update(id, exceptionData) {
        const updates = [];
        const values = [];
        if (exceptionData.shift_assignment_id !== undefined) {
            updates.push('shift_assignment_id = ?');
            values.push(exceptionData.shift_assignment_id);
        }
        if (exceptionData.exception_date !== undefined) {
            updates.push('exception_date = ?');
            values.push(exceptionData.exception_date);
        }
        if (exceptionData.exception_type !== undefined) {
            updates.push('exception_type = ?');
            values.push(exceptionData.exception_type);
        }
        if (exceptionData.original_start_time !== undefined) {
            updates.push('original_start_time = ?');
            values.push(exceptionData.original_start_time);
        }
        if (exceptionData.original_end_time !== undefined) {
            updates.push('original_end_time = ?');
            values.push(exceptionData.original_end_time);
        }
        if (exceptionData.new_start_time !== undefined) {
            updates.push('new_start_time = ?');
            values.push(exceptionData.new_start_time);
        }
        if (exceptionData.new_end_time !== undefined) {
            updates.push('new_end_time = ?');
            values.push(exceptionData.new_end_time);
        }
        if (exceptionData.new_break_duration_minutes !== undefined) {
            updates.push('new_break_duration_minutes = ?');
            values.push(exceptionData.new_break_duration_minutes);
        }
        if (exceptionData.reason !== undefined) {
            updates.push('reason = ?');
            values.push(exceptionData.reason);
        }
        if (exceptionData.approved_by !== undefined) {
            updates.push('approved_by = ?');
            values.push(exceptionData.approved_by);
        }
        if (exceptionData.status !== undefined) {
            updates.push('status = ?');
            values.push(exceptionData.status);
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
    static async approve(id, approvedBy) {
        const updates = {
            status: 'active',
            approved_by: approvedBy
        };
        await database_1.pool.execute(`UPDATE ${this.tableName} SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`, ['active', approvedBy, id]);
        return await this.findById(id);
    }
    static async reject(id) {
        return await this.update(id, {
            status: 'rejected'
        });
    }
}
exports.default = ShiftExceptionModel;
//# sourceMappingURL=shift-exception.model.js.map