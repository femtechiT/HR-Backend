"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class HolidayDutyRosterModel {
    static tableName = 'holiday_duty_roster';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByHolidayId(holidayId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE holiday_id = ? ORDER BY shift_start_time`, [holidayId]);
        return rows;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows;
    }
    static async findByHolidayAndUser(holidayId, userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE holiday_id = ? AND user_id = ?`, [holidayId, userId]);
        return rows[0] || null;
    }
    static async create(rosterData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (holiday_id, user_id, shift_start_time, shift_end_time, notes)
       VALUES (?, ?, ?, ?, ?)`, [
            rosterData.holiday_id,
            rosterData.user_id,
            rosterData.shift_start_time,
            rosterData.shift_end_time,
            rosterData.notes || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create holiday duty roster record');
        }
        return createdItem;
    }
    static async bulkCreate(rosterDataArray) {
        const createdRecords = [];
        for (const rosterData of rosterDataArray) {
            const record = await this.create(rosterData);
            createdRecords.push(record);
        }
        return createdRecords;
    }
    static async update(id, rosterData) {
        const updates = [];
        const values = [];
        if (rosterData.shift_start_time !== undefined) {
            updates.push('shift_start_time = ?');
            values.push(rosterData.shift_start_time);
        }
        if (rosterData.shift_end_time !== undefined) {
            updates.push('shift_end_time = ?');
            values.push(rosterData.shift_end_time);
        }
        if (rosterData.notes !== undefined) {
            updates.push('notes = ?');
            values.push(rosterData.notes);
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
    static async deleteByHolidayId(holidayId) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE holiday_id = ?`, [holidayId]);
        return result.affectedRows;
    }
}
exports.default = HolidayDutyRosterModel;
//# sourceMappingURL=holiday-duty-roster.model.js.map