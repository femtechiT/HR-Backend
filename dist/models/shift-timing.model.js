"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class ShiftTimingModel {
    static tableName = 'shift_timings';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY effective_from DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY effective_from DESC`, [userId]);
        return rows;
    }
    static async findCurrentShiftForUser(userId, date = new Date()) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} 
       WHERE (user_id = ? OR user_id IS NULL) 
       AND effective_from <= ? 
       AND (effective_to IS NULL OR effective_to >= ?)
       ORDER BY user_id DESC, effective_from DESC LIMIT 1`, [userId, date, date]);
        return rows[0] || null;
    }
    static async findCurrentShiftForBranch(branchId, date = new Date()) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} 
       WHERE override_branch_id = ?
       AND effective_from <= ? 
       AND (effective_to IS NULL OR effective_to >= ?)
       ORDER BY effective_from DESC`, [branchId, date, date]);
        return rows;
    }
    static async create(shiftData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (user_id, shift_name, start_time, end_time, effective_from, effective_to, override_branch_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            shiftData.user_id || null,
            shiftData.shift_name,
            shiftData.start_time,
            shiftData.end_time,
            shiftData.effective_from,
            shiftData.effective_to || null,
            shiftData.override_branch_id || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create shift timing');
        }
        return createdItem;
    }
    static async update(id, shiftData) {
        const updates = [];
        const values = [];
        if (shiftData.shift_name !== undefined) {
            updates.push('shift_name = ?');
            values.push(shiftData.shift_name);
        }
        if (shiftData.start_time !== undefined) {
            updates.push('start_time = ?');
            values.push(shiftData.start_time);
        }
        if (shiftData.end_time !== undefined) {
            updates.push('end_time = ?');
            values.push(shiftData.end_time);
        }
        if (shiftData.effective_from !== undefined) {
            updates.push('effective_from = ?');
            values.push(shiftData.effective_from);
        }
        if (shiftData.effective_to !== undefined) {
            updates.push('effective_to = ?');
            values.push(shiftData.effective_to);
        }
        if (shiftData.override_branch_id !== undefined) {
            updates.push('override_branch_id = ?');
            values.push(shiftData.override_branch_id);
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
    static async isShiftActive(userId, date = new Date()) {
        const shift = await this.findCurrentShiftForUser(userId, date);
        return shift !== null;
    }
    static async getExpectedTimes(userId, date) {
        const shift = await this.findCurrentShiftForUser(userId, date);
        if (!shift) {
            return null;
        }
        return {
            startTime: shift.start_time,
            endTime: shift.end_time
        };
    }
}
exports.default = ShiftTimingModel;
//# sourceMappingURL=shift-timing.model.js.map