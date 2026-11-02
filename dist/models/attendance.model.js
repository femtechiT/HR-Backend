"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationToWKT = locationToWKT;
const database_1 = require("../config/database");
const attendance_scoring_config_1 = require("../config/attendance-scoring.config");
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
    static fmtDate(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} ORDER BY date DESC, created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? ORDER BY date DESC`, [userId]);
        return rows;
    }
    static async findByUserIdAndDate(userId, date) {
        const [rows] = await database_1.pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND date = ?`, [userId, AttendanceModel.fmtDate(date)]);
        return rows[0] || null;
    }
    static async findByDate(date) {
        const [rows] = await database_1.pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE date = ? ORDER BY user_id`, [AttendanceModel.fmtDate(date)]);
        return rows;
    }
    static async create(attendanceData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (user_id, date, status, check_in_time, check_out_time, location_coordinates, location_verified, location_address, notes, is_locked, locked_at)
       VALUES (?, ?, ?, ?, ?, ST_GeomFromText(?), ?, ?, ?, ?, ?)`, [
            attendanceData.user_id,
            attendanceData.date,
            attendanceData.status || 'absent',
            attendanceData.check_in_time || null,
            attendanceData.check_out_time || null,
            attendanceData.location_coordinates || null,
            attendanceData.location_verified || false,
            attendanceData.location_address || null,
            attendanceData.notes || null,
            attendanceData.is_locked || false,
            attendanceData.locked_at || null
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
            if (attendanceData.location_coordinates) {
                updates.push('location_coordinates = ST_GeomFromText(?)');
                values.push(attendanceData.location_coordinates);
            }
            else {
                updates.push('location_coordinates = NULL');
            }
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
        if (attendanceData.is_locked !== undefined) {
            updates.push('is_locked = ?');
            values.push(attendanceData.is_locked);
        }
        if (attendanceData.locked_at !== undefined) {
            updates.push('locked_at = ?');
            values.push(attendanceData.locked_at);
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
        const [rows] = await database_1.pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date`, [userId, AttendanceModel.fmtDate(startDate), AttendanceModel.fmtDate(endDate)]);
        return rows;
    }
    static async findByUpdatedSince(userId, since) {
        const [rows] = await database_1.pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`, [userId, since]);
        return rows;
    }
    static async getAttendancePercentage(userId, startDate, endDate) {
        const [rows] = await database_1.pool.execute(`SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status IN ('present', 'late', 'half_day', 'early_departure') THEN 1 ELSE 0 END) as working_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`, [userId, AttendanceModel.fmtDate(startDate), AttendanceModel.fmtDate(endDate)]);
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
        SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day_days,
        SUM(CASE WHEN status = 'early_departure' THEN 1 ELSE 0 END) as early_departure_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`, [userId, AttendanceModel.fmtDate(startDate), AttendanceModel.fmtDate(endDate)]);
        const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
        return {
            total_days: result.total_days || 0,
            present_days: result.present_days || 0,
            absent_days: result.absent_days || 0,
            late_days: result.late_days || 0,
            half_day_days: result.half_day_days || 0,
            early_departure_days: result.early_departure_days || 0
        };
    }
    static async getAttendanceSummaryForAllStaff(startDate, endDate, branchId, activeOnly = true) {
        const pointsCase = (0, attendance_scoring_config_1.buildPointsCaseSql)('a.status');
        let query = `
      SELECT
        u.id AS user_id,
        u.full_name,
        s.employee_id,
        s.branch_id,
        b.name AS branch_name,
        COUNT(a.id) AS total_days,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_days,
        SUM(CASE WHEN a.status = 'half_day' THEN 1 ELSE 0 END) AS half_day_days,
        SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END) AS leave_days,
        SUM(CASE WHEN a.status = 'early_departure' THEN 1 ELSE 0 END) AS early_departure_days,
        COALESCE(SUM(${pointsCase}), 0) AS points,
        AVG(TIME_TO_SEC(a.check_in_time)) AS avg_check_in_seconds
      FROM staff s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN branches b ON b.id = s.branch_id
      LEFT JOIN attendance a ON a.user_id = u.id AND a.date BETWEEN ? AND ?
      WHERE 1 = 1
    `;
        const params = [startDate, endDate];
        if (activeOnly) {
            query += ' AND s.status = \'active\' AND u.status = \'active\' AND s.deleted_at IS NULL AND u.deleted_at IS NULL';
        }
        if (branchId) {
            query += ' AND s.branch_id = ?';
            params.push(branchId);
        }
        query += `
      GROUP BY u.id, u.full_name, s.employee_id, s.branch_id, b.name
      ORDER BY points DESC, (AVG(TIME_TO_SEC(a.check_in_time)) IS NULL) ASC, avg_check_in_seconds ASC, present_days DESC, u.id ASC
    `;
        const [rows] = await database_1.pool.execute(query, params);
        return rows.map((r) => ({
            user_id: r.user_id,
            full_name: r.full_name,
            employee_id: r.employee_id,
            branch_id: r.branch_id,
            branch_name: r.branch_name,
            total_days: Number(r.total_days) || 0,
            present_days: Number(r.present_days) || 0,
            absent_days: Number(r.absent_days) || 0,
            late_days: Number(r.late_days) || 0,
            half_day_days: Number(r.half_day_days) || 0,
            leave_days: Number(r.leave_days) || 0,
            early_departure_days: Number(r.early_departure_days) || 0,
            points: Number(r.points) || 0,
            avg_check_in_time: formatSecondsAsClockTime(r.avg_check_in_seconds),
            avg_check_in_seconds: r.avg_check_in_seconds === null || Number.isNaN(Number(r.avg_check_in_seconds))
                ? null
                : Number(r.avg_check_in_seconds),
        }));
    }
}
function formatSecondsAsClockTime(totalSeconds) {
    const seconds = Number(totalSeconds);
    if (totalSeconds === null || Number.isNaN(seconds))
        return null;
    const totalMinutes = Math.round(seconds / 60) % (24 * 60);
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}
exports.default = AttendanceModel;
//# sourceMappingURL=attendance.model.js.map