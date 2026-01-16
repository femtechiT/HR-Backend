import { pool } from '../config/database';

export interface KpiAssignment {
  id?: number;
  user_id: number;
  kpi_definition_id: number;
  cycle_start_date: Date;
  cycle_end_date: Date;
  assigned_by: number;
  custom_target_value?: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const KpiAssignmentModel = {
  tableName: 'kpi_assignments',

  async findAll(): Promise<KpiAssignment[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    connection.release();
    return rows as KpiAssignment[];
  },

  async findById(id: number): Promise<KpiAssignment | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return (rows as KpiAssignment[])[0] || null;
  },

  async findByUserId(userId: number): Promise<KpiAssignment[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    connection.release();
    return rows as KpiAssignment[];
  },

  async findByKpiDefinitionId(kpiDefinitionId: number): Promise<KpiAssignment[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE kpi_definition_id = ? ORDER BY created_at DESC`,
      [kpiDefinitionId]
    );
    connection.release();
    return rows as KpiAssignment[];
  },

  async create(assignment: Omit<KpiAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<KpiAssignment> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (user_id, kpi_definition_id, cycle_start_date, cycle_end_date, assigned_by, custom_target_value, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        assignment.user_id,
        assignment.kpi_definition_id,
        assignment.cycle_start_date,
        assignment.cycle_end_date,
        assignment.assigned_by,
        assignment.custom_target_value || null,
        assignment.notes || null
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...assignment,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, assignment: Partial<Omit<KpiAssignment, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (assignment.user_id !== undefined) {
      fields.push('user_id = ?');
      values.push(assignment.user_id);
    }
    if (assignment.kpi_definition_id !== undefined) {
      fields.push('kpi_definition_id = ?');
      values.push(assignment.kpi_definition_id);
    }
    if (assignment.cycle_start_date !== undefined) {
      fields.push('cycle_start_date = ?');
      values.push(assignment.cycle_start_date);
    }
    if (assignment.cycle_end_date !== undefined) {
      fields.push('cycle_end_date = ?');
      values.push(assignment.cycle_end_date);
    }
    if (assignment.assigned_by !== undefined) {
      fields.push('assigned_by = ?');
      values.push(assignment.assigned_by);
    }
    if (assignment.custom_target_value !== undefined) {
      fields.push('custom_target_value = ?');
      values.push(assignment.custom_target_value);
    }
    if (assignment.notes !== undefined) {
      fields.push('notes = ?');
      values.push(assignment.notes);
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