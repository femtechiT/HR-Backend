import { pool } from '../config/database';

export interface StaffPaymentStructure {
  id: number;
  staff_id: number;
  payment_type_id: number;
  value: number;
  effective_from: Date;
  effective_to: Date | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface StaffPaymentStructureInput {
  staff_id: number;
  payment_type_id: number;
  value: number;
  effective_from: Date;
  effective_to?: Date | null;
  created_by?: number | null;
}

export interface StaffPaymentStructureUpdate {
  value?: number;
  effective_from?: Date;
  effective_to?: Date | null;
}

class StaffPaymentStructureModel {
  static tableName = 'staff_payment_structure';

  static async findAll(staffId?: number, paymentTypeId?: number): Promise<StaffPaymentStructure[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    const conditions = [];
    if (staffId) {
      conditions.push('staff_id = ?');
      params.push(staffId);
    }
    if (paymentTypeId) {
      conditions.push('payment_type_id = ?');
      params.push(paymentTypeId);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY effective_from DESC';

    const [rows] = await pool.execute(query, params);
    return rows as StaffPaymentStructure[];
  }

  static async findById(id: number): Promise<StaffPaymentStructure | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as StaffPaymentStructure[])[0] || null;
  }

  static async findByStaffId(staffId: number): Promise<StaffPaymentStructure[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE staff_id = ? ORDER BY effective_from DESC`,
      [staffId]
    );
    return rows as StaffPaymentStructure[];
  }

  static async findByPaymentTypeId(paymentTypeId: number): Promise<StaffPaymentStructure[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE payment_type_id = ? ORDER BY staff_id`,
      [paymentTypeId]
    );
    return rows as StaffPaymentStructure[];
  }

  static async findByStaffAndPaymentType(staffId: number, paymentTypeId: number): Promise<StaffPaymentStructure[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE staff_id = ? AND payment_type_id = ? ORDER BY effective_from DESC`,
      [staffId, paymentTypeId]
    );
    return rows as StaffPaymentStructure[];
  }

  static async findActiveForStaff(staffId: number, date: Date = new Date()): Promise<StaffPaymentStructure[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} 
       WHERE staff_id = ? 
       AND effective_from <= ? 
       AND (effective_to IS NULL OR effective_to >= ?)
       ORDER BY effective_from DESC`,
      [staffId, date, date]
    );
    return rows as StaffPaymentStructure[];
  }

  static async create(paymentStructureData: StaffPaymentStructureInput): Promise<StaffPaymentStructure> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (staff_id, payment_type_id, value, effective_from, effective_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        paymentStructureData.staff_id,
        paymentStructureData.payment_type_id,
        paymentStructureData.value,
        paymentStructureData.effective_from,
        paymentStructureData.effective_to || null,
        paymentStructureData.created_by || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create staff payment structure');
    }

    return createdItem;
  }

  static async update(id: number, paymentStructureData: StaffPaymentStructureUpdate): Promise<StaffPaymentStructure | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (paymentStructureData.value !== undefined) {
      updates.push('value = ?');
      values.push(paymentStructureData.value);
    }

    if (paymentStructureData.effective_from !== undefined) {
      updates.push('effective_from = ?');
      values.push(paymentStructureData.effective_from);
    }

    if (paymentStructureData.effective_to !== undefined) {
      updates.push('effective_to = ?');
      values.push(paymentStructureData.effective_to);
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

  // Method to deactivate a payment structure by setting effective_to date
  static async deactivate(id: number, endDate: Date): Promise<boolean> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET effective_to = ? WHERE id = ?`,
      [endDate, id]
    );

    return result.affectedRows > 0;
  }
}

export default StaffPaymentStructureModel;