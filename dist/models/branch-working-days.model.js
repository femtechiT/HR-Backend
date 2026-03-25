"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class BranchWorkingDaysModel {
    static tableName = 'branch_working_days';
    static async findByBranchId(branchId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE branch_id = ? ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')`, [branchId]);
        return rows;
    }
    static async findByBranchIdAndDay(branchId, dayOfWeek) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE branch_id = ? AND day_of_week = ?`, [branchId, dayOfWeek]);
        return rows[0] || null;
    }
    static async isWorkingDay(branchId, dayOfWeek) {
        const workingDay = await this.findByBranchIdAndDay(branchId, dayOfWeek);
        return workingDay?.is_working_day === true;
    }
    static async getWorkingHours(branchId, dayOfWeek) {
        const workingDay = await this.findByBranchIdAndDay(branchId, dayOfWeek);
        if (!workingDay)
            return null;
        return {
            is_working_day: workingDay.is_working_day,
            start_time: workingDay.start_time,
            end_time: workingDay.end_time,
            break_duration_minutes: workingDay.break_duration_minutes
        };
    }
    static async upsert(workingDay) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} 
       (branch_id, day_of_week, is_working_day, start_time, end_time, break_duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       is_working_day = VALUES(is_working_day),
       start_time = VALUES(start_time),
       end_time = VALUES(end_time),
       break_duration_minutes = VALUES(break_duration_minutes)`, [
            workingDay.branch_id,
            workingDay.day_of_week,
            workingDay.is_working_day !== undefined ? workingDay.is_working_day : true,
            workingDay.start_time || null,
            workingDay.end_time || null,
            workingDay.break_duration_minutes || 30
        ]);
        const id = result.insertId || (await this.findByBranchIdAndDay(workingDay.branch_id, workingDay.day_of_week))?.id;
        if (!id) {
            throw new Error('Failed to create/update working day');
        }
        return (await this.findById(id));
    }
    static async bulkUpdate(branchId, workingDays) {
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const day of workingDays) {
                await connection.execute(`INSERT INTO ${this.tableName} 
           (branch_id, day_of_week, is_working_day, start_time, end_time, break_duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           is_working_day = VALUES(is_working_day),
           start_time = VALUES(start_time),
           end_time = VALUES(end_time),
           break_duration_minutes = VALUES(break_duration_minutes)`, [
                    branchId,
                    day.day_of_week,
                    day.is_working_day,
                    day.start_time || null,
                    day.end_time || null,
                    day.break_duration_minutes || 30
                ]);
            }
            await connection.commit();
            return await this.findByBranchId(branchId);
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    static async findByBranchIds(branchIds) {
        if (branchIds.length === 0)
            return [];
        const placeholders = branchIds.map(() => '?').join(',');
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE branch_id IN (${placeholders}) ORDER BY branch_id, FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')`, branchIds);
        return rows;
    }
    static async deleteByBranchId(branchId) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE branch_id = ?`, [branchId]);
        return result.affectedRows > 0;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
}
exports.default = BranchWorkingDaysModel;
//# sourceMappingURL=branch-working-days.model.js.map