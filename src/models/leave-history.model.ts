import { pool } from '../config/database';

export interface LeaveHistory {
  id: number;
  user_id: number;
  leave_type_id: number;
  start_date: Date;
  end_date: Date;
  days_taken: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_at: Date | null;
  created_at: Date;
}

export interface LeaveHistoryInput {
  user_id: number;
  leave_type_id: number;
  start_date: Date;
  end_date: Date;
  days_taken: number;
  reason?: string | null;
  approved_at?: Date | null;
}

export interface LeaveHistoryUpdate {
  approved_at?: Date | null;
  reason?: string | null;
}

class LeaveHistoryModel {
  static tableName = 'leave_history';

  static async findAll(): Promise<LeaveHistory[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as LeaveHistory[];
  }

  static async findById(id: number): Promise<LeaveHistory | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as LeaveHistory[])[0] || null;
  }

  static async findByUserId(userId: number): Promise<LeaveHistory[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY start_date DESC`,
      [userId]
    );
    return rows as LeaveHistory[];
  }

  static async findByUserIdAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<LeaveHistory[]> {
    // Fixed: Find leaves that overlap with the date range
    // A leave overlaps if: leave.start <= range.end AND leave.end >= range.start
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} 
       WHERE user_id = ? AND start_date <= ? AND end_date >= ? 
       ORDER BY start_date DESC`,
      [userId, endDate, startDate]
    );
    return rows as LeaveHistory[];
  }

  static async findByLeaveType(leaveTypeId: number): Promise<LeaveHistory[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE leave_type_id = ? ORDER BY start_date DESC`,
      [leaveTypeId]
    );
    return rows as LeaveHistory[];
  }

  static async create(historyData: LeaveHistoryInput): Promise<LeaveHistory> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (user_id, leave_type_id, start_date, end_date, days_taken, reason, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        historyData.user_id,
        historyData.leave_type_id,
        historyData.start_date,
        historyData.end_date,
        historyData.days_taken,
        historyData.reason || null,
        historyData.approved_at || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create leave history');
    }

    return createdItem;
  }

  static async update(id: number, historyData: LeaveHistoryUpdate): Promise<LeaveHistory | null> {
    const updates: string[] = [];
    const values: any[] = [];

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

  // Method to get total leave days taken by user for a specific leave type in a period
  static async getTotalDaysTaken(userId: number, leaveTypeId: number, startDate: Date, endDate: Date): Promise<number> {
    const [rows] = await pool.execute(
      `SELECT SUM(days_taken) as total_days FROM ${this.tableName}
       WHERE user_id = ? AND leave_type_id = ? AND start_date >= ? AND end_date <= ?`,
      [userId, leaveTypeId, startDate, endDate]
    ) as [{ total_days: number | null }[], any];

    const result = rows[0];
    return result?.total_days || 0;
  }

  // Method to check if user has overlapping leave dates
  static async hasOverlappingLeave(userId: number, startDate: Date, endDate: Date): Promise<boolean> {
    const [rows] = await pool.execute(
      `SELECT id FROM ${this.tableName}
       WHERE user_id = ? AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))`,
      [userId, endDate, startDate, startDate, endDate]
    ) as [any[], any];

    return rows.length > 0;
  }
}

export default LeaveHistoryModel;