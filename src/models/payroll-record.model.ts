import { pool } from '../config/database';

export interface PayrollRecord {
  id: number;
  payroll_run_id: number;
  staff_id: number;
  earnings: any; // JSON object containing earning components
  deductions: any; // JSON object containing deduction components
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  processed_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PayrollRecordInput {
  payroll_run_id: number;
  staff_id: number;
  earnings: any; // JSON object containing earning components
  deductions: any; // JSON object containing deduction components
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
}

export interface PayrollRecordUpdate {
  earnings?: any;
  deductions?: any;
  gross_pay?: number;
  total_deductions?: number;
  net_pay?: number;
}

class PayrollRecordModel {
  static tableName = 'payroll_records';

  static async findAll(payrollRunId?: number, staffId?: number): Promise<PayrollRecord[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    const conditions = [];
    if (payrollRunId) {
      conditions.push('payroll_run_id = ?');
      params.push(payrollRunId);
    }
    if (staffId) {
      conditions.push('staff_id = ?');
      params.push(staffId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY processed_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows as PayrollRecord[];
  }

  static async findById(id: number): Promise<PayrollRecord | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as PayrollRecord[])[0] || null;
  }

  static async findByPayrollRunId(payrollRunId: number): Promise<PayrollRecord[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE payroll_run_id = ? ORDER BY staff_id`,
      [payrollRunId]
    );
    return rows as PayrollRecord[];
  }

  static async findByStaffId(staffId: number): Promise<PayrollRecord[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE staff_id = ? ORDER BY processed_at DESC`,
      [staffId]
    );
    return rows as PayrollRecord[];
  }

  static async findByStaffIdAndPayrollRun(staffId: number, payrollRunId: number): Promise<PayrollRecord | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE staff_id = ? AND payroll_run_id = ?`,
      [staffId, payrollRunId]
    );
    return (rows as PayrollRecord[])[0] || null;
  }

  static async create(payrollRecordData: PayrollRecordInput): Promise<PayrollRecord> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (payroll_run_id, staff_id, earnings, deductions, gross_pay, total_deductions, net_pay)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payrollRecordData.payroll_run_id,
        payrollRecordData.staff_id,
        JSON.stringify(payrollRecordData.earnings),
        JSON.stringify(payrollRecordData.deductions),
        payrollRecordData.gross_pay,
        payrollRecordData.total_deductions,
        payrollRecordData.net_pay
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create payroll record');
    }

    return createdItem;
  }

  static async update(id: number, payrollRecordData: PayrollRecordUpdate): Promise<PayrollRecord | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (payrollRecordData.earnings !== undefined) {
      updates.push('earnings = ?');
      values.push(JSON.stringify(payrollRecordData.earnings));
    }

    if (payrollRecordData.deductions !== undefined) {
      updates.push('deductions = ?');
      values.push(JSON.stringify(payrollRecordData.deductions));
    }

    if (payrollRecordData.gross_pay !== undefined) {
      updates.push('gross_pay = ?');
      values.push(payrollRecordData.gross_pay);
    }

    if (payrollRecordData.total_deductions !== undefined) {
      updates.push('total_deductions = ?');
      values.push(payrollRecordData.total_deductions);
    }

    if (payrollRecordData.net_pay !== undefined) {
      updates.push('net_pay = ?');
      values.push(payrollRecordData.net_pay);
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

  // Method to calculate total payroll amount for a specific run
  static async calculateTotalAmountForRun(payrollRunId: number): Promise<number> {
    const [rows] = await pool.execute(
      `SELECT SUM(net_pay) as total_amount FROM ${this.tableName} WHERE payroll_run_id = ?`,
      [payrollRunId]
    ) as [any[], any];

    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : { total_amount: 0 };
    return parseFloat(result.total_amount) || 0;
  }
}

export default PayrollRecordModel;