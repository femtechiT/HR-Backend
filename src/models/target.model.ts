import { pool } from '../config/database';
import { Staff } from './staff.model';

export interface Target {
  id?: number;
  kpi_id: number;
  employee_id: number;
  department_id?: number;
  template_id?: number;
  target_type: 'minimum' | 'standard' | 'stretch';
  target_value: number;
  period_start: Date;
  period_end: Date;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export const TargetModel = {
  tableName: 'targets',

  async findAll(): Promise<Target[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    connection.release();
    return rows as Target[];
  },

  async findById(id: number): Promise<Target | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return (rows as Target[])[0] || null;
  },

  async findByEmployeeId(employeeId: number): Promise<Target[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE employee_id = ? ORDER BY created_at DESC`,
      [employeeId]
    );
    connection.release();
    return rows as Target[];
  },

  async findByKpiId(kpiId: number): Promise<Target[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE kpi_id = ? ORDER BY created_at DESC`,
      [kpiId]
    );
    connection.release();
    return rows as Target[];
  },

  async findByTemplateId(templateId: number): Promise<Target[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE template_id = ? ORDER BY created_at DESC`,
      [templateId]
    );
    connection.release();
    return rows as Target[];
  },

  async findByCategory(category: string): Promise<Target[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT t.* FROM ${this.tableName} t
       JOIN kpi_definitions kd ON t.kpi_id = kd.id
       WHERE JSON_CONTAINS(kd.categories, ?) ORDER BY t.created_at DESC`,
      [`"${category}"`]
    );
    connection.release();
    return rows as Target[];
  },

  async create(target: Omit<Target, 'id' | 'created_at' | 'updated_at'>): Promise<Target> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (kpi_id, employee_id, department_id, template_id, target_type, target_value, period_start, period_end, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        target.kpi_id,
        target.employee_id,
        target.department_id || null,
        target.template_id || null,
        target.target_type,
        target.target_value,
        target.period_start,
        target.period_end,
        target.created_by
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...target,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, target: Partial<Omit<Target, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (target.kpi_id !== undefined) {
      fields.push('kpi_id = ?');
      values.push(target.kpi_id);
    }
    if (target.employee_id !== undefined) {
      fields.push('employee_id = ?');
      values.push(target.employee_id);
    }
    if (target.department_id !== undefined) {
      fields.push('department_id = ?');
      values.push(target.department_id);
    }
    if (target.template_id !== undefined) {
      fields.push('template_id = ?');
      values.push(target.template_id);
    }
    if (target.target_type !== undefined) {
      fields.push('target_type = ?');
      values.push(target.target_type);
    }
    if (target.target_value !== undefined) {
      fields.push('target_value = ?');
      values.push(target.target_value);
    }
    if (target.period_start !== undefined) {
      fields.push('period_start = ?');
      values.push(target.period_start);
    }
    if (target.period_end !== undefined) {
      fields.push('period_end = ?');
      values.push(target.period_end);
    }
    if (target.created_by !== undefined) {
      fields.push('created_by = ?');
      values.push(target.created_by);
    }

    fields.push('updated_at = NOW()');

    if (fields.length === 0) {
      return false;
    }

    values.push(id);

    const [result]: any = await connection.execute(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    connection.release();

    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return result.affectedRows > 0;
  }
};