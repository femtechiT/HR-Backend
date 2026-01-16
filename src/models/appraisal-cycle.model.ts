import { pool } from '../config/database';

export interface AppraisalCycle {
  id?: number;
  name: string;
  description: string;
  template_id: number;
  start_date: Date;
  end_date: Date;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export const AppraisalCycleModel = {
  tableName: 'appraisal_cycles',

  async findAll(): Promise<AppraisalCycle[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`
    );
    connection.release();
    return rows as AppraisalCycle[];
  },

  async findById(id: number): Promise<AppraisalCycle | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return (rows as AppraisalCycle[])[0] || null;
  },

  async findByStatus(status: string): Promise<AppraisalCycle[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY created_at DESC`,
      [status]
    );
    connection.release();
    return rows as AppraisalCycle[];
  },

  async findByTemplateId(templateId: number): Promise<AppraisalCycle[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE template_id = ? ORDER BY created_at DESC`,
      [templateId]
    );
    connection.release();
    return rows as AppraisalCycle[];
  },

  async findByDateRange(startDate: Date, endDate: Date): Promise<AppraisalCycle[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE start_date >= ? AND end_date <= ? ORDER BY created_at DESC`,
      [startDate, endDate]
    );
    connection.release();
    return rows as AppraisalCycle[];
  },

  async create(cycle: Omit<AppraisalCycle, 'id' | 'created_at' | 'updated_at'>): Promise<AppraisalCycle> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (name, description, template_id, start_date, end_date, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        cycle.name,
        cycle.description,
        cycle.template_id,
        cycle.start_date,
        cycle.end_date,
        cycle.status,
        cycle.created_by
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...cycle,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, cycle: Partial<Omit<AppraisalCycle, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (cycle.name !== undefined) {
      fields.push('name = ?');
      values.push(cycle.name);
    }
    if (cycle.description !== undefined) {
      fields.push('description = ?');
      values.push(cycle.description);
    }
    if (cycle.template_id !== undefined) {
      fields.push('template_id = ?');
      values.push(cycle.template_id);
    }
    if (cycle.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(cycle.start_date);
    }
    if (cycle.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(cycle.end_date);
    }
    if (cycle.status !== undefined) {
      fields.push('status = ?');
      values.push(cycle.status);
    }
    if (cycle.created_by !== undefined) {
      fields.push('created_by = ?');
      values.push(cycle.created_by);
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