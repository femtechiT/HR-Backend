import { pool } from '../config/database';

export interface AppraisalAssignment {
  id?: number;
  employee_id: number;
  appraisal_cycle_id: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'reviewed' | 'completed';
  assigned_by: number;
  assigned_at: Date;
  completed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export const AppraisalAssignmentModel = {
  tableName: 'appraisal_assignments',

  async findAll(): Promise<AppraisalAssignment[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} ORDER BY assigned_at DESC`
    );
    connection.release();
    return rows as AppraisalAssignment[];
  },

  async findById(id: number): Promise<AppraisalAssignment | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    connection.release();
    return (rows as AppraisalAssignment[])[0] || null;
  },

  async findByEmployeeId(employeeId: number): Promise<AppraisalAssignment[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE employee_id = ? ORDER BY assigned_at DESC`,
      [employeeId]
    );
    connection.release();
    return rows as AppraisalAssignment[];
  },

  async findByAppraisalCycleId(cycleId: number): Promise<AppraisalAssignment[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE appraisal_cycle_id = ? ORDER BY assigned_at DESC`,
      [cycleId]
    );
    connection.release();
    return rows as AppraisalAssignment[];
  },

  async findByStatus(status: string): Promise<AppraisalAssignment[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY assigned_at DESC`,
      [status]
    );
    connection.release();
    return rows as AppraisalAssignment[];
  },

  async create(assignment: Omit<AppraisalAssignment, 'id' | 'assigned_at' | 'created_at' | 'updated_at'>): Promise<AppraisalAssignment> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (employee_id, appraisal_cycle_id, status, assigned_by, assigned_at, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), ?, NOW(), NOW())`,
      [
        assignment.employee_id,
        assignment.appraisal_cycle_id,
        assignment.status,
        assignment.assigned_by,
        assignment.completed_at || null
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...assignment,
      assigned_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, assignment: Partial<Omit<AppraisalAssignment, 'id' | 'assigned_at' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (assignment.employee_id !== undefined) {
      fields.push('employee_id = ?');
      values.push(assignment.employee_id);
    }
    if (assignment.appraisal_cycle_id !== undefined) {
      fields.push('appraisal_cycle_id = ?');
      values.push(assignment.appraisal_cycle_id);
    }
    if (assignment.status !== undefined) {
      fields.push('status = ?');
      values.push(assignment.status);
    }
    if (assignment.assigned_by !== undefined) {
      fields.push('assigned_by = ?');
      values.push(assignment.assigned_by);
    }
    if (assignment.completed_at !== undefined) {
      fields.push('completed_at = ?');
      values.push(assignment.completed_at);
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