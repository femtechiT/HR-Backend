import { pool } from '../config/database';

export interface PerformanceScore {
  id?: number;
  employee_id: number;
  kpi_id: number;
  template_id: number;
  score: number;
  achieved_value: number;
  period_start: Date;
  period_end: Date;
  calculated_at: Date;
  calculated_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export const PerformanceScoreModel = {
  tableName: 'performance_scores',

  async findAll(): Promise<PerformanceScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} ORDER BY calculated_at DESC`
    );
    connection.release();
    return rows as PerformanceScore[];
  },

  async findById(id: number): Promise<PerformanceScore | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return (rows as PerformanceScore[])[0] || null;
  },

  async findByEmployeeId(employeeId: number): Promise<PerformanceScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE employee_id = ? ORDER BY calculated_at DESC`,
      [employeeId]
    );
    connection.release();
    return rows as PerformanceScore[];
  },

  async findByKpiId(kpiId: number): Promise<PerformanceScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE kpi_id = ? ORDER BY calculated_at DESC`,
      [kpiId]
    );
    connection.release();
    return rows as PerformanceScore[];
  },

  async findByTemplateId(templateId: number): Promise<PerformanceScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE template_id = ? ORDER BY calculated_at DESC`,
      [templateId]
    );
    connection.release();
    return rows as PerformanceScore[];
  },

  async findByPeriod(startDate: Date, endDate: Date): Promise<PerformanceScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE period_start >= ? AND period_end <= ? ORDER BY calculated_at DESC`,
      [startDate, endDate]
    );
    connection.release();
    return rows as PerformanceScore[];
  },

  async findByCategory(category: string): Promise<PerformanceScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT ps.* FROM ${this.tableName} ps
       JOIN appraisal_templates at ON ps.template_id = at.id
       WHERE at.category = ? ORDER BY ps.calculated_at DESC`,
      [category]
    );
    connection.release();
    return rows as PerformanceScore[];
  },

  async create(score: Omit<PerformanceScore, 'id' | 'calculated_at' | 'created_at' | 'updated_at'>): Promise<PerformanceScore> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (employee_id, kpi_id, template_id, score, achieved_value, period_start, period_end, calculated_at, calculated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())`,
      [
        score.employee_id,
        score.kpi_id,
        score.template_id,
        score.score,
        score.achieved_value,
        score.period_start,
        score.period_end,
        score.calculated_by
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...score,
      calculated_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, score: Partial<Omit<PerformanceScore, 'id' | 'calculated_at' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (score.employee_id !== undefined) {
      fields.push('employee_id = ?');
      values.push(score.employee_id);
    }
    if (score.kpi_id !== undefined) {
      fields.push('kpi_id = ?');
      values.push(score.kpi_id);
    }
    if (score.template_id !== undefined) {
      fields.push('template_id = ?');
      values.push(score.template_id);
    }
    if (score.score !== undefined) {
      fields.push('score = ?');
      values.push(score.score);
    }
    if (score.achieved_value !== undefined) {
      fields.push('achieved_value = ?');
      values.push(score.achieved_value);
    }
    if (score.period_start !== undefined) {
      fields.push('period_start = ?');
      values.push(score.period_start);
    }
    if (score.period_end !== undefined) {
      fields.push('period_end = ?');
      values.push(score.period_end);
    }
    if (score.calculated_by !== undefined) {
      fields.push('calculated_by = ?');
      values.push(score.calculated_by);
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