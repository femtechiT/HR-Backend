import { pool } from '../config/database';
import { buildPointsCaseSql } from '../config/attendance-scoring.config';

export interface Attendance {
  id: number;
  user_id: number;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'holiday-working' | 'weekend' | 'early_departure';
  check_in_time: Date | null;
  check_out_time: Date | null;
  location_coordinates: string | null; // POINT data stored as string
  location_verified: boolean;
  location_address: string | null;
  notes: string | null;
  is_locked: boolean;
  locked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AttendanceInput {
  user_id: number;
  date: Date;
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'holiday-working' | 'weekend' | 'early_departure';
  check_in_time?: Date | null;
  check_out_time?: Date | null;
  location_coordinates?: string | null; // WKT format: "POINT(longitude latitude)"
  location_verified?: boolean;
  location_address?: string | null;
  notes?: string | null;
  is_locked?: boolean;
  locked_at?: Date | null;
}

// Helper function to convert lat/lng object to WKT format
export function locationToWKT(location: { longitude: number; latitude: number } | string | null): string | null {
  if (!location) return null;
  if (typeof location === 'string') return location; // Already in WKT or other string format
  if (typeof location === 'object' && location.longitude !== undefined && location.latitude !== undefined) {
    return `POINT(${location.longitude} ${location.latitude})`;
  }
  return null;
}

export interface AttendanceUpdate {
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'weekend' | 'early_departure';
  check_in_time?: Date | null;
  check_out_time?: Date | null;
  location_coordinates?: string | null;
  location_verified?: boolean;
  location_address?: string | null;
  notes?: string | null;
  is_locked?: boolean;
  locked_at?: Date | null;
}

export interface StaffAttendanceSummaryRow {
  user_id: number;
  full_name: string;
  employee_id: string | null;
  branch_id: number | null;
  branch_name: string | null;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  half_day_days: number;
  leave_days: number;
  early_departure_days: number;
  points: number;
  /** Average clock-in time across days with a recorded check-in, e.g. "08:52 AM" — null if never clocked in. */
  avg_check_in_time: string | null;
  /** Same average, in raw seconds-since-midnight — use this (not the formatted string) for sorting. */
  avg_check_in_seconds: number | null;
}

class AttendanceModel {
  static tableName = 'attendance';

  // Format a Date to 'YYYY-MM-DD' using local time parts to avoid timezone shift from .toISOString().
  private static fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  static async findAll(): Promise<Attendance[]> {
    const [rows] = await pool.execute(`SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} ORDER BY date DESC, created_at DESC`);
    return rows as Attendance[];
  }

  static async findById(id: number): Promise<Attendance | null> {
    const [rows] = await pool.execute(
      `SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as Attendance[])[0] || null;
  }

  static async findByUserId(userId: number): Promise<Attendance[]> {
    const [rows] = await pool.execute(
      `SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? ORDER BY date DESC`,
      [userId]
    );
    return rows as Attendance[];
  }

  static async findByUserIdAndDate(userId: number, date: Date): Promise<Attendance | null> {
    const [rows] = await pool.execute(
      `SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND date = ?`,
      [userId, AttendanceModel.fmtDate(date)]
    );
    return (rows as Attendance[])[0] || null;
  }

  static async findByDate(date: Date): Promise<Attendance[]> {
    const [rows] = await pool.execute(
      `SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE date = ? ORDER BY user_id`,
      [AttendanceModel.fmtDate(date)]
    );
    return rows as Attendance[];
  }

  static async create(attendanceData: AttendanceInput): Promise<Attendance> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (user_id, date, status, check_in_time, check_out_time, location_coordinates, location_verified, location_address, notes, is_locked, locked_at)
       VALUES (?, ?, ?, ?, ?, ST_GeomFromText(?), ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create attendance record');
    }

    return createdItem;
  }

  static async update(id: number, attendanceData: AttendanceUpdate): Promise<Attendance | null> {
    const updates: string[] = [];
    const values: any[] = [];

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
      } else {
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

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Method to check if user has already marked attendance for a specific date
  static async hasMarkedAttendance(userId: number, date: Date): Promise<boolean> {
    const [rows] = await pool.execute(
      `SELECT id FROM ${this.tableName} WHERE user_id = ? AND date = ?`,
      [userId, date]
    );
    return (rows as any[]).length > 0;
  }

  // Method to find attendance records by date range
  static async findByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const [rows] = await pool.execute(
      `SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date`,
      [userId, AttendanceModel.fmtDate(startDate), AttendanceModel.fmtDate(endDate)]
    );
    return rows as Attendance[];
  }


  // Method to find attendance records updated after a given timestamp (for sync)
  static async findByUpdatedSince(userId: number, since: Date): Promise<Attendance[]> {
    const [rows] = await pool.execute(
      `SELECT id, user_id, date, status, check_in_time, check_out_time, ST_AsText(location_coordinates) AS location_coordinates, location_verified, location_address, notes, is_locked, locked_at, created_at, updated_at FROM ${this.tableName} WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`,
      [userId, since]
    );
    return rows as Attendance[];
  }

  // Method to calculate attendance percentage for a user in a specific period
  static async getAttendancePercentage(userId: number, startDate: Date, endDate: Date): Promise<number> {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status IN ('present', 'late', 'half_day', 'early_departure') THEN 1 ELSE 0 END) as working_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [userId, AttendanceModel.fmtDate(startDate), AttendanceModel.fmtDate(endDate)]
    ) as [any[], any];

    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] as { total_days: number; working_days: number } : { total_days: 0, working_days: 0 };
    if (!result || result.total_days === 0) return 0;

    return ((result.working_days || 0) / result.total_days) * 100;
  }

  // Method to get attendance summary for a user in a specific period
  static async getAttendanceSummary(userId: number, startDate: Date, endDate: Date): Promise<{
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    half_day_days: number;
    early_departure_days: number;
  }> {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day_days,
        SUM(CASE WHEN status = 'early_departure' THEN 1 ELSE 0 END) as early_departure_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [userId, AttendanceModel.fmtDate(startDate), AttendanceModel.fmtDate(endDate)]
    ) as [any[], any];

    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] as any : {};
    return {
      total_days: result.total_days || 0,
      present_days: result.present_days || 0,
      absent_days: result.absent_days || 0,
      late_days: result.late_days || 0,
      half_day_days: result.half_day_days || 0,
      early_departure_days: result.early_departure_days || 0
    };
  }

  /**
   * One row per staff member for a date range — the shared aggregation
   * behind both the attendance leaderboard and the HR export. A single
   * query (no N+1 per-staff calls to getAttendanceSummary), LEFT JOINed so
   * a staff member with zero attendance rows in range still appears
   * (scored 0) instead of silently vanishing from the ranking.
   *
   * `activeOnly` defaults true (leaderboard use: don't rank people who've
   * left). The export passes `false` since HR may need a departed staff
   * member's history for a period predating their exit.
   */
  static async getAttendanceSummaryForAllStaff(
    startDate: string,
    endDate: string,
    branchId?: number,
    activeOnly: boolean = true
  ): Promise<StaffAttendanceSummaryRow[]> {
    const pointsCase = buildPointsCaseSql('a.status');
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
    const params: any[] = [startDate, endDate];

    if (activeOnly) {
      query += ' AND s.status = \'active\' AND u.status = \'active\' AND s.deleted_at IS NULL AND u.deleted_at IS NULL';
    }
    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    // Points decide rank first; average check-in time only breaks ties within
    // the same point total — e.g. two people who were "present" every day
    // otherwise tie, but one consistently clocked in earlier. Staff with no
    // recorded check-in (avg is NULL, e.g. all-absent) must sort after
    // everyone who has one, not before — MySQL sorts NULL first in ASC order
    // by default, which would wrongly rank them ahead on ties.
    //
    // Final `u.id ASC` is load-bearing, not cosmetic: early in a period (or
    // with a large branch), it's common for dozens of staff to tie on every
    // criterion above (same points, no check-ins recorded yet, same present
    // days). SQL does NOT guarantee a stable sort among fully-tied rows —
    // without a deterministic last key, MySQL can (and does) return that
    // tied group in a different physical order on every single call, which
    // showed up as the leaderboard's top 10 reshuffling to different people
    // on every refresh even though nothing about their attendance changed.
    // MySQL rejects re-referencing a SELECT-list alias that is itself an
    // aggregate (avg_check_in_seconds) inside another ORDER BY expression
    // ("Reference not supported (reference to group function)", error 1247)
    // — a bare `ORDER BY avg_check_in_seconds` is fine, but wrapping it in
    // `(... IS NULL)` is not. Repeating the raw AVG(...) expression instead
    // of the alias for just the null-check sidesteps the restriction.
    query += `
      GROUP BY u.id, u.full_name, s.employee_id, s.branch_id, b.name
      ORDER BY points DESC, (AVG(TIME_TO_SEC(a.check_in_time)) IS NULL) ASC, avg_check_in_seconds ASC, present_days DESC, u.id ASC
    `;

    const [rows] = await pool.execute(query, params) as [any[], any];
    return (rows as any[]).map((r) => ({
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

/** e.g. 31920 -> "08:52 AM". Returns null for a null/NaN input (no recorded check-in). */
function formatSecondsAsClockTime(totalSeconds: number | string | null): string | null {
  const seconds = Number(totalSeconds);
  if (totalSeconds === null || Number.isNaN(seconds)) return null;
  const totalMinutes = Math.round(seconds / 60) % (24 * 60);
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default AttendanceModel;