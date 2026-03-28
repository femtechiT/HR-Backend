import { pool } from '../config/database';

export interface Attendance {
  id: number;
  user_id: number;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'holiday-working' | 'weekend';
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
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'holiday-working' | 'weekend';
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
  status?: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' | 'weekend';
  check_in_time?: Date | null;
  check_out_time?: Date | null;
  location_coordinates?: string | null;
  location_verified?: boolean;
  location_address?: string | null;
  notes?: string | null;
  is_locked?: boolean;
  locked_at?: Date | null;
}

class AttendanceModel {
  static tableName = 'attendance';

  static async findAll(): Promise<Attendance[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY date DESC, created_at DESC`);
    return rows as Attendance[];
  }

  static async findById(id: number): Promise<Attendance | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as Attendance[])[0] || null;
  }

  static async findByUserId(userId: number): Promise<Attendance[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY date DESC`,
      [userId]
    );
    return rows as Attendance[];
  }

  static async findByUserIdAndDate(userId: number, date: Date): Promise<Attendance | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date = ?`,
      [userId, date]
    );
    return (rows as Attendance[])[0] || null;
  }

  static async findByDate(date: Date): Promise<Attendance[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE date = ? ORDER BY user_id`,
      [date]
    );
    return rows as Attendance[];
  }

  static async create(attendanceData: AttendanceInput): Promise<Attendance> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (user_id, date, status, check_in_time, check_out_time, location_coordinates, location_verified, location_address, notes, is_locked, locked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date`,
      [userId, startDate, endDate]
    );
    return rows as Attendance[];
  }


  // Method to calculate attendance percentage for a user in a specific period
  static async getAttendancePercentage(userId: number, startDate: Date, endDate: Date): Promise<number> {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status IN ('present', 'late', 'half_day') THEN 1 ELSE 0 END) as working_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [userId, startDate, endDate]
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
  }> {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day_days
       FROM ${this.tableName}
       WHERE user_id = ? AND date BETWEEN ? AND ?`,
      [userId, startDate, endDate]
    ) as [any[], any];

    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] as any : {};
    return {
      total_days: result.total_days || 0,
      present_days: result.present_days || 0,
      absent_days: result.absent_days || 0,
      late_days: result.late_days || 0,
      half_day_days: result.half_day_days || 0
    };
  }
}

export default AttendanceModel;