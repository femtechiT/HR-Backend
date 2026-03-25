"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class LeaveHistoryModel {
    static tableName = 'leave_history';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY start_date DESC`, [userId]);
        return rows;
    }
    static async findByUserIdAndDateRange(userId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} 
       WHERE user_id = ? AND start_date <= ? AND end_date >= ? 
       ORDER BY start_date DESC`, [userId, endDate, startDate]);
        return rows;
    }
    static async findByLeaveType(leaveTypeId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE leave_type_id = ? ORDER BY start_date DESC`, [leaveTypeId]);
        return rows;
    }
    static async create(historyData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (user_id, leave_type_id, start_date, end_date, days_taken, reason, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            historyData.user_id,
            historyData.leave_type_id,
            historyData.start_date,
            historyData.end_date,
            historyData.days_taken,
            historyData.reason || null,
            historyData.approved_at || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create leave history');
        }
        return createdItem;
    }
    static async update(id, historyData) {
        const updates = [];
        const values = [];
        if (historyData.approved_at !== undefined) {
            updates.push('approved_at = ?');
            values.push(historyData.approved_at);
        }
        if (historyData.reason !== undefined) {
            updates.push('reason = ?');
            values.push(historyData.reason);
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
    static async getTotalDaysTaken(userId, leaveTypeId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT SUM(days_taken) as total_days FROM ${this.tableName}
       WHERE user_id = ? AND leave_type_id = ? AND start_date >= ? AND end_date <= ?`, [userId, leaveTypeId, startDate, endDate]);
        const result = rows[0];
        return result?.total_days || 0;
    }
    static async hasOverlappingLeave(userId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT id FROM ${this.tableName}
       WHERE user_id = ? AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))`, [userId, endDate, startDate, startDate, endDate]);
        return rows.length > 0;
    }
}
exports.default = LeaveHistoryModel;
//# sourceMappingURL=leave-history.model.js.map