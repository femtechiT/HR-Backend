import { pool } from '../config/database';

export interface ShiftException {
  id: number;
  user_id: number;
  shift_assignment_id: number | null;
  exception_date: Date;
  exception_type: 'early_release' | 'late_start' | 'day_off' | 'special_schedule' | 'holiday_work';
  original_start_time: string | null;
  original_end_time: string | null;
  new_start_time: string | null;
  new_end_time: string | null;
  new_break_duration_minutes: number;
  reason: string | null;
  approved_by: number | null;
  approved_at: Date | null;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShiftExceptionInput {
  user_id: number;
  shift_assignment_id?: number | null;
  exception_date: Date;
  exception_type: 'early_release' | 'late_start' | 'day_off' | 'special_schedule' | 'holiday_work';
  original_start_time?: string | null;
  original_end_time?: string | null;
  new_start_time?: string | null;
  new_end_time?: string | null;
  new_break_duration_minutes?: number;
  reason?: string | null;
  approved_by?: number | null;
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  created_by: number;
}

export interface ShiftExceptionUpdate {
  shift_assignment_id?: number | null;
  exception_date?: Date;
  exception_type?: 'early_release' | 'late_start' | 'day_off' | 'special_schedule' | 'holiday_work';
  original_start_time?: string | null;
  original_end_time?: string | null;
  new_start_time?: string | null;
  new_end_time?: string | null;
  new_break_duration_minutes?: number;
  reason?: string | null;
  approved_by?: number | null;
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
}

class ShiftExceptionModel {
  static tableName = 'shift_exceptions';

  static async findAll(): Promise<ShiftException[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as ShiftException[];
  }

  static async findById(id: number): Promise<ShiftException | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as ShiftException[])[0] || null;
  }

  static async findByUserId(userId: number): Promise<ShiftException[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY exception_date DESC`,
      [userId]
    );
    return rows as ShiftException[];
  }

  static async findByDate(userId: number, date: Date): Promise<ShiftException | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? AND exception_date = ? AND status = 'active'`,
      [userId, date]
    );
    return (rows as ShiftException[])[0] || null;
  }

  static async findByDateRange(userId: number, startDate: Date, endDate: Date): Promise<ShiftException[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName}
       WHERE user_id = ? AND exception_date BETWEEN ? AND ? AND status = 'active'
       ORDER BY exception_date DESC`,
      [userId, startDate, endDate]
    );
    return rows as ShiftException[];
  }

  static async create(exceptionData: ShiftExceptionInput): Promise<ShiftException> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (
        user_id, shift_assignment_id, exception_date, exception_type,
        original_start_time, original_end_time, new_start_time, new_end_time,
        new_break_duration_minutes, reason, approved_by, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create shift exception');
    }

    return createdItem;
  }

  static async update(id: number, exceptionData: ShiftExceptionUpdate): Promise<ShiftException | null> {
    const updates: string[] = [];
    const values: any[] = [];

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

  static async approve(id: number, approvedBy: number): Promise<ShiftException | null> {
    const updates: any = {
      status: 'active',
      approved_by: approvedBy
    };
    
    // Set approved_at directly via SQL since it's not in the update interface
    await pool.execute(
      `UPDATE ${this.tableName} SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?`,
      ['active', approvedBy, id]
    );
    
    return await this.findById(id);
  }

  static async reject(id: number): Promise<ShiftException | null> {
    return await this.update(id, {
      status: 'rejected'
    });
  }
}

export default ShiftExceptionModel;
