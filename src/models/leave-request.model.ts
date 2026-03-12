import { Pool } from 'mysql2/promise';
import { pool } from '../config/database';

export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type_id: number;
  start_date: Date;
  end_date: Date;
  days_requested: number;
  reason: string;
  attachments?: any; // JSON field
  status: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: number;
  reviewed_at?: Date;
  notes?: string;
  cancelled_by?: number | null;
  cancelled_at?: Date | null;
  cancellation_reason?: string | null;
  user_name?: string;
  leave_type_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface LeaveRequestInput {
  user_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  attachments?: any;
  status?: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
}

export interface LeaveRequestUpdate {
  status?: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by?: number;
  reviewed_at?: Date;
  notes?: string;
  cancelled_by?: number;
  cancelled_at?: Date;
  cancellation_reason?: string;
}

class LeaveRequestModel {
  static tableName = 'leave_requests';

  static async findAll(
    userId?: number,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: LeaveRequest[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    let query = `SELECT lr.*, u.full_name as user_name, lt.name as leave_type_name
                 FROM ${this.tableName} lr
                 JOIN users u ON lr.user_id = u.id
                 JOIN leave_types lt ON lr.leave_type_id = lt.id`;

    const conditions: string[] = [];
    const params: any[] = [];

    if (userId) {
      conditions.push('lr.user_id = ?');
      params.push(userId);
    }
    if (status) {
      conditions.push('lr.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY lr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} lr`;
    const countParams: any[] = [...params.slice(0, params.length - 2)]; // Exclude LIMIT and OFFSET

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countResult]: any = await pool.execute(countQuery, countParams);

    return {
      data: rows as LeaveRequest[],
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  }

  static async findById(id: number, connection?: any): Promise<LeaveRequest | null> {
    const db = connection || pool;
    const [rows] = await db.execute(
      `SELECT lr.*, u.full_name as user_name, lt.name as leave_type_name
       FROM ${this.tableName} lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = ?`,
      [id]
    );
    return (rows as LeaveRequest[])[0] || null;
  }

  static async findByUserId(userId: number): Promise<LeaveRequest[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows as LeaveRequest[];
  }

  static async create(leaveData: LeaveRequestInput, connection?: any): Promise<LeaveRequest> {
    const db = connection || pool;
    const [result]: any = await db.execute(
      `INSERT INTO ${this.tableName}
       (user_id, leave_type_id, start_date, end_date, days_requested, reason, attachments, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        leaveData.user_id,
        leaveData.leave_type_id,
        leaveData.start_date,
        leaveData.end_date,
        leaveData.days_requested,
        leaveData.reason,
        leaveData.attachments ? JSON.stringify(leaveData.attachments) : null,
        leaveData.status || 'submitted',
        leaveData.notes || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId, connection);

    if (!createdItem) {
      throw new Error('Failed to create leave request');
    }

    return createdItem;
  }

  static async update(id: number, leaveData: LeaveRequestUpdate, connection?: any): Promise<LeaveRequest | null> {
    const db = connection || pool;
    const updates: string[] = [];
    const values: any[] = [];

    if (leaveData.status !== undefined) {
      updates.push('status = ?');
      values.push(leaveData.status);
    }

    if (leaveData.reviewed_by !== undefined) {
      updates.push('reviewed_by = ?');
      values.push(leaveData.reviewed_by);
    }

    if (leaveData.reviewed_at !== undefined) {
      updates.push('reviewed_at = ?');
      values.push(leaveData.reviewed_at);
    }

    if (leaveData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(leaveData.notes);
    }

    if (leaveData.cancelled_by !== undefined) {
      updates.push('cancelled_by = ?');
      values.push(leaveData.cancelled_by);
    }

    if (leaveData.cancelled_at !== undefined) {
      updates.push('cancelled_at = ?');
      values.push(leaveData.cancelled_at);
    }

    if (leaveData.cancellation_reason !== undefined) {
      updates.push('cancellation_reason = ?');
      values.push(leaveData.cancellation_reason);
    }

    if (updates.length === 0) {
      return await this.findById(id, connection);
    }

    values.push(id);

    await db.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id, connection);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }
}

export default LeaveRequestModel;
