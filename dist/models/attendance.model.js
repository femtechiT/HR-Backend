"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationToWKT = locationToWKT;
const database_1 = require("../config/database");
function locationToWKT(location) {
    if (!location)
        return null;
    if (typeof location === 'string')
        return location;
    if (typeof location === 'object' && location.longitude !== undefined && location.latitude !== undefined) {
        return `POINT(${location.longitude} ${location.latitude})`;
    }
    return null;
}
class AttendanceModel {
    static tableName = 'attendance';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY date DESC, created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY date DESC`, [userId]);
        return rows;
    }
    static async findByUserIdAndDate(userId, date) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? AND date = ?`, [userId, date]);
        return rows[0] || null;
    }
    static async findByDate(date) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE date = ? ORDER BY user_id`, [date]);
        return rows;
    }
    static async create(attendanceData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (user_id, date, status, check_in_time, check_out_time, location_coordinates, location_verified, location_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            attendanceData.user_id,
            attendanceData.date,
            attendanceData.status || 'absent',
            attendanceData.check_in_time || null,
            attendanceData.check_out_time || null,
            attendanceData.location_coordinates || null,
            attendanceData.location_verified || false,
            attendanceData.location_address || null,
            attendanceData.notes || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create attendance record');
        }
        return createdItem;
    }
    static async update(id, attendanceData) {
        const updates = [];
        const values = [];
        if (attendanceData.status !== undefined) {
            updates.push('status = ?');
            values.push(attendanceData.status);
        }
        if (attendanceData.check_in_time !== undefined) {
            updates.push('check_in_time = ?');
            values.push(attendanceData.check_in_time);
        }
        if (attendanceData.check_out_time !== undefined) {
            updates.push('check_out_time = ?');
            values.push(attendanceData.check_out_time);
        }
        if (attendanceData.location_coordinates !== undefined) {
            updates.push('location_coordinates = ?');
            values.push(attendanceData.location_coordinates);
        }
        if (attendanceData.location_verified !== undefined) {
            updates.push('location_verified = ?');
            values.push(attendanceData.location_verified);
        }
        if (attendanceData.location_address !== undefined) {
            updates.push('location_address = ?');
            values.push(attendanceData.location_address);
        }
        if (attendanceData.notes !== undefined) {
            updates.push('notes = ?');
            values.push(attendanceData.notes);
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
    static async hasMarkedAttendance(userId, date) {
        const [rows] = await database_1.pool.execute(`SELECT id FROM ${this.tableName} WHERE user_id = ? AND date = ?`, [userId, date]);
        return rows.length > 0;
    }
    static async findByDateRange(userId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date`, [userId, startDate, endDate]);
        return rows;
    }
    static async getAttendancePercentage(userId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status IN ('present', 'late', 'half_day') THEN 1 ELSE 0 END) as working_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`, [userId, startDate, endDate]);
        const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : { total_days: 0, working_days: 0 };
        if (!result || result.total_days === 0)
            return 0;
        return ((result.working_days || 0) / result.total_days) * 100;
    }
    static async getAttendanceSummary(userId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`, [userId, startDate, endDate]);
        const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
        return {
            total_days: result.total_days || 0,
            present_days: result.present_days || 0,
            absent_days: result.absent_days || 0,
            late_days: result.late_days || 0,
            half_day_days: result.half_day_days || 0
        };
    }
}
exports.default = AttendanceModel;
//# sourceMappingURL=attendance.model.js.map