import { pool } from '../config/database';

export interface PaymentType {
  id: number;
  name: string;
  payment_category: 'earning' | 'deduction' | 'tax' | 'benefit';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  formula: string | null;
  applies_to_all: boolean;
  created_by: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentTypeInput {
  name: string;
  payment_category: 'earning' | 'deduction' | 'tax' | 'benefit';
  calculation_type: 'fixed' | 'percentage' | 'formula';
  formula?: string | null;
  applies_to_all?: boolean;
  created_by?: number | null;
}

export interface PaymentTypeUpdate {
  name?: string;
  payment_category?: 'earning' | 'deduction' | 'tax' | 'benefit';
  calculation_type?: 'fixed' | 'percentage' | 'formula';
  formula?: string | null;
  applies_to_all?: boolean;
  is_active?: boolean;
}

class PaymentTypeModel {
  static tableName = 'payment_types';

  static async findAll(): Promise<PaymentType[]> {
    const [rows] = await pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    return rows as PaymentType[];
  }

  static async findById(id: number): Promise<PaymentType | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as PaymentType[])[0] || null;
  }

  static async findByName(name: string): Promise<PaymentType | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE name = ?`,
      [name]
    );
    return (rows as PaymentType[])[0] || null;
  }

  static async findByCategory(category: 'earning' | 'deduction' | 'tax' | 'benefit'): Promise<PaymentType[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE payment_category = ? ORDER BY name`,
      [category]
    );
    return rows as PaymentType[];
  }

  static async create(paymentTypeData: PaymentTypeInput): Promise<PaymentType> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (name, payment_category, calculation_type, formula, applies_to_all, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        paymentTypeData.name,
        paymentTypeData.payment_category,
        paymentTypeData.calculation_type,
        paymentTypeData.formula || null,
        paymentTypeData.applies_to_all ?? false,
        paymentTypeData.created_by || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create payment type');
    }

    return createdItem;
  }

  static async update(id: number, paymentTypeData: PaymentTypeUpdate): Promise<PaymentType | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (paymentTypeData.name !== undefined) {
      updates.push('name = ?');
      values.push(paymentTypeData.name);
    }

    if (paymentTypeData.payment_category !== undefined) {
      updates.push('payment_category = ?');
      values.push(paymentTypeData.payment_category);
    }

    if (paymentTypeData.calculation_type !== undefined) {
      updates.push('calculation_type = ?');
      values.push(paymentTypeData.calculation_type);
    }

    if (paymentTypeData.formula !== undefined) {
      updates.push('formula = ?');
      values.push(paymentTypeData.formula);
    }

    if (paymentTypeData.applies_to_all !== undefined) {
      updates.push('applies_to_all = ?');
      values.push(paymentTypeData.applies_to_all);
    }

    if (paymentTypeData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(paymentTypeData.is_active);
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
      `UPDATE ${this.tableName} SET is_active = FALSE WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  static async activate(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET is_active = TRUE WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }
}

export default PaymentTypeModel;