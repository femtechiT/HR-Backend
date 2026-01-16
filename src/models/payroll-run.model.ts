import { pool } from '../config/database';

export interface PayrollRun {
  id: number;
  month: number; // 1-12
  year: number; // 4-digit year
  branch_id: number | null;
  status: 'draft' | 'processing' | 'completed' | 'cancelled';
  run_date: Date;
  total_amount: number | null;
  processed_by: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PayrollRunInput {
  month: number; // 1-12
  year: number; // 4-digit year
  branch_id?: number | null;
  status?: 'draft' | 'processing' | 'completed' | 'cancelled';
  processed_by?: number | null;
  notes?: string | null;
}

export interface PayrollRunUpdate {
  status?: 'draft' | 'processing' | 'completed' | 'cancelled';
  total_amount?: number | null;
  processed_by?: number | null;
  notes?: string | null;
}

class PayrollRunModel {
  static tableName = 'payroll_runs';

  static async findAll(month?: number, year?: number, branchId?: number, status?: string): Promise<PayrollRun[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    const conditions = [];
    if (month) {
      conditions.push('month = ?');
      params.push(month);
    }
    if (year) {
      conditions.push('year = ?');
      params.push(year);
    }
    if (branchId !== undefined) {
      conditions.push('branch_id = ?');
      params.push(branchId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY year DESC, month DESC, created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows as PayrollRun[];
  }

  static async findById(id: number): Promise<PayrollRun | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as PayrollRun[])[0] || null;
  }

  static async findByMonthYear(month: number, year: number, branchId?: number | null): Promise<PayrollRun | null> {
    let query = `SELECT * FROM ${this.tableName} WHERE month = ? AND year = ?`;
    const params: (number | null | string)[] = [month, year];

    if (branchId !== undefined) {
      query += ' AND branch_id = ?';
      params.push(branchId); // branchId can be number or null, which is acceptable for MySQL
    }

    const [rows] = await pool.execute(query, params);
    return (rows as PayrollRun[])[0] || null;
  }

  static async create(payrollRunData: PayrollRunInput): Promise<PayrollRun> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (month, year, branch_id, status, processed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payrollRunData.month,
        payrollRunData.year,
        payrollRunData.branch_id || null,
        payrollRunData.status || 'draft',
        payrollRunData.processed_by || null,
        payrollRunData.notes || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create payroll run');
    }

    return createdItem;
  }

  static async update(id: number, payrollRunData: PayrollRunUpdate): Promise<PayrollRun | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (payrollRunData.status !== undefined) {
      updates.push('status = ?');
      values.push(payrollRunData.status);
    }

    if (payrollRunData.total_amount !== undefined) {
      updates.push('total_amount = ?');
      values.push(payrollRunData.total_amount);
    }

    if (payrollRunData.processed_by !== undefined) {
      updates.push('processed_by = ?');
      values.push(payrollRunData.processed_by);
    }

    if (payrollRunData.notes !== undefined) {
      updates.push('notes = ?');
      values.push(payrollRunData.notes);
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

  // Method to update status of a payroll run
  static async updateStatus(id: number, status: 'draft' | 'processing' | 'completed' | 'cancelled'): Promise<PayrollRun | null> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows > 0) {
      return await this.findById(id);
    }

    return null;
  }
}

export default PayrollRunModel;