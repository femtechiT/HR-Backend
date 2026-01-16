import { pool } from '../config/database';

export interface KpiDefinition {
  id?: number;
  name: string;
  description: string;
  formula: string;
  weight: number;
  metric_ids: number[]; // JSON array of metric IDs
  categories: string[]; // JSON array of categories ["Teacher", "Sales", "Inventory", "Technician"]
  is_active: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export const KpiDefinitionModel = {
  tableName: 'kpi_definitions',

  async findAll(): Promise<KpiDefinition[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE is_active = ? ORDER BY created_at DESC`,
      [true]
    );
    connection.release();
    return rows as KpiDefinition[];
  },

  async findById(id: number): Promise<KpiDefinition | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND is_active = ?`,
      [id, true]
    );
    connection.release();
    return (rows as KpiDefinition[])[0] || null;
  },

  async findByCategory(category: string): Promise<KpiDefinition[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE JSON_CONTAINS(categories, ?) AND is_active = ? ORDER BY created_at DESC`,
      [`"${category}"`, true]
    );
    connection.release();
    return rows as KpiDefinition[];
  },

  async create(kpi: Omit<KpiDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<KpiDefinition> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (name, description, formula, weight, metric_ids, categories, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        kpi.name,
        kpi.description,
        kpi.formula,
        kpi.weight,
        JSON.stringify(kpi.metric_ids),
        JSON.stringify(kpi.categories),
        kpi.is_active,
        kpi.created_by
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...kpi,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, kpi: Partial<Omit<KpiDefinition, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (kpi.name !== undefined) {
      fields.push('name = ?');
      values.push(kpi.name);
    }
    if (kpi.description !== undefined) {
      fields.push('description = ?');
      values.push(kpi.description);
    }
    if (kpi.formula !== undefined) {
      fields.push('formula = ?');
      values.push(kpi.formula);
    }
    if (kpi.weight !== undefined) {
      fields.push('weight = ?');
      values.push(kpi.weight);
    }
    if (kpi.metric_ids !== undefined) {
      fields.push('metric_ids = ?');
      values.push(JSON.stringify(kpi.metric_ids));
    }
    if (kpi.categories !== undefined) {
      fields.push('categories = ?');
      values.push(JSON.stringify(kpi.categories));
    }
    if (kpi.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(kpi.is_active);
    }
    if (kpi.created_by !== undefined) {
      fields.push('created_by = ?');
      values.push(kpi.created_by);
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
      `UPDATE ${this.tableName} SET is_active = ? WHERE id = ?`,
      [false, id]
    );
    connection.release();
    return result.affectedRows > 0;
  }
};