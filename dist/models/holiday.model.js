"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class HolidayModel {
    static tableName = 'holidays';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY date DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByDate(date) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE date = ? ORDER BY holiday_name`, [date]);
        return rows;
    }
    static async findByBranch(branchId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE branch_id = ? OR branch_id IS NULL ORDER BY date DESC`, [branchId]);
        return rows;
    }
    static async isHoliday(date, branchId) {
        let query = '';
        const params = [date];
        if (branchId !== undefined && branchId !== null) {
            query = `SELECT id FROM ${this.tableName} WHERE date = ? AND (branch_id = ? OR branch_id IS NULL) LIMIT 1`;
            params.push(branchId);
        }
        else {
            query = `SELECT id FROM ${this.tableName} WHERE date = ? LIMIT 1`;
        }
        const [rows] = await database_1.pool.execute(query, params);
        return rows.length > 0;
    }
    static async getHolidaysInRange(startDate, endDate, branchId) {
        let query = '';
        const params = [startDate, endDate];
        if (branchId !== undefined && branchId !== null) {
            query = `SELECT * FROM ${this.tableName} WHERE date BETWEEN ? AND ? AND (branch_id = ? OR branch_id IS NULL) ORDER BY date`;
            params.push(branchId);
        }
        else {
            query = `SELECT * FROM ${this.tableName} WHERE date BETWEEN ? AND ? ORDER BY date`;
        }
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async create(holidayData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (holiday_name, date, branch_id, is_mandatory, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            holidayData.holiday_name,
            holidayData.date,
            holidayData.branch_id || null,
            holidayData.is_mandatory ?? true,
            holidayData.description || null,
            holidayData.created_by || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create holiday');
        }
        return createdItem;
    }
    static async update(id, holidayData) {
        const updates = [];
        const values = [];
        if (holidayData.holiday_name !== undefined) {
            updates.push('holiday_name = ?');
            values.push(holidayData.holiday_name);
        }
        if (holidayData.date !== undefined) {
            updates.push('date = ?');
            values.push(holidayData.date);
        }
        if (holidayData.branch_id !== undefined) {
            updates.push('branch_id = ?');
            values.push(holidayData.branch_id);
        }
        if (holidayData.is_mandatory !== undefined) {
            updates.push('is_mandatory = ?');
            values.push(holidayData.is_mandatory);
        }
        if (holidayData.description !== undefined) {
            updates.push('description = ?');
            values.push(holidayData.description);
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
}
exports.default = HolidayModel;
//# sourceMappingURL=holiday.model.js.map