import { pool } from '../config/database';

export interface KpiScore {
  id?: number;
  kpi_assignment_id: number;
  calculated_value: number;
  achievement_percentage: number;
  weighted_score: number;
  calculated_at: Date;
  manually_overridden?: boolean;
  override_value?: number;
  override_reason?: string;
  override_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export const KpiScoreModel = {
  tableName: 'kpi_scores',

  async findAll(): Promise<KpiScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} ORDER BY calculated_at DESC`
    );
    connection.release();
    return rows as KpiScore[];
  },

  async findById(id: number): Promise<KpiScore | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return (rows as KpiScore[])[0] || null;
  },

  async findByAssignmentId(assignmentId: number): Promise<KpiScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE kpi_assignment_id = ? ORDER BY calculated_at DESC`,
      [assignmentId]
    );
    connection.release();
    return rows as KpiScore[];
  },

  // Method to find scores by user ID (through assignment)
  async findByUserId(userId: number): Promise<KpiScore[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT ks.*
      FROM ${this.tableName} ks
      JOIN kpi_assignments ka ON ks.kpi_assignment_id = ka.id
      WHERE ka.user_id = ?
      ORDER BY ks.calculated_at DESC
    `, [userId]);
    connection.release();
    return rows as KpiScore[];
  },

  async create(score: Omit<KpiScore, 'id' | 'calculated_at' | 'created_at' | 'updated_at'>): Promise<KpiScore> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (kpi_assignment_id, calculated_value, achievement_percentage, weighted_score, calculated_at, manually_overridden, override_value, override_reason, override_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, NOW(), NOW())`,
      [
        score.kpi_assignment_id,
        score.calculated_value,
        score.achievement_percentage,
        score.weighted_score,
        score.manually_overridden || false,
        score.override_value || null,
        score.override_reason || null,
        score.override_by || null
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

  async update(id: number, score: Partial<Omit<KpiScore, 'id' | 'calculated_at' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (score.kpi_assignment_id !== undefined) {
      fields.push('kpi_assignment_id = ?');
      values.push(score.kpi_assignment_id);
    }
    if (score.calculated_value !== undefined) {
      fields.push('calculated_value = ?');
      values.push(score.calculated_value);
    }
    if (score.achievement_percentage !== undefined) {
      fields.push('achievement_percentage = ?');
      values.push(score.achievement_percentage);
    }
    if (score.weighted_score !== undefined) {
      fields.push('weighted_score = ?');
      values.push(score.weighted_score);
    }
    if (score.manually_overridden !== undefined) {
      fields.push('manually_overridden = ?');
      values.push(score.manually_overridden);
    }
    if (score.override_value !== undefined) {
      fields.push('override_value = ?');
      values.push(score.override_value);
    }
    if (score.override_reason !== undefined) {
      fields.push('override_reason = ?');
      values.push(score.override_reason);
    }
    if (score.override_by !== undefined) {
      fields.push('override_by = ?');
      values.push(score.override_by);
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