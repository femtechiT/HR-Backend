import { pool } from '../config/database';

export interface MetricsLibrary {
  id?: number;
  name: string;
  description: string;
  data_type: 'numeric' | 'percentage' | 'boolean' | 'rating';
  formula: string;
  data_source: string;
  categories: string[]; // JSON array of categories ["Teacher", "Sales", "Inventory", "Technician"]
  is_active: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export const MetricsLibraryModel = {
  tableName: 'metrics_library',

  async findAll(): Promise<MetricsLibrary[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE is_active = ? ORDER BY created_at DESC`,
      [true]
    );
    connection.release();
    return rows as MetricsLibrary[];
  },

  async findById(id: number): Promise<MetricsLibrary | null> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND is_active = ?`,
      [id, true]
    );
    connection.release();
    return (rows as MetricsLibrary[])[0] || null;
  },

  async findByCategory(category: string): Promise<MetricsLibrary[]> {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE JSON_CONTAINS(categories, ?) AND is_active = ? ORDER BY created_at DESC`,
      [`"${category}"`, true]
    );
    connection.release();
    return rows as MetricsLibrary[];
  },

  async create(metric: Omit<MetricsLibrary, 'id' | 'created_at' | 'updated_at'>): Promise<MetricsLibrary> {
    const connection = await pool.getConnection();
    const [result]: any = await connection.execute(
      `INSERT INTO ${this.tableName}
       (name, description, data_type, formula, data_source, categories, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        metric.name,
        metric.description,
        metric.data_type,
        metric.formula,
        metric.data_source,
        JSON.stringify(metric.categories),
        metric.is_active,
        metric.created_by
      ]
    );
    connection.release();

    return {
      id: result.insertId,
      ...metric,
      created_at: new Date(),
      updated_at: new Date()
    };
  },

  async update(id: number, metric: Partial<Omit<MetricsLibrary, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
    const connection = await pool.getConnection();

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (metric.name !== undefined) {
      fields.push('name = ?');
      values.push(metric.name);
    }
    if (metric.description !== undefined) {
      fields.push('description = ?');
      values.push(metric.description);
    }
    if (metric.data_type !== undefined) {
      fields.push('data_type = ?');
      values.push(metric.data_type);
    }
    if (metric.formula !== undefined) {
      fields.push('formula = ?');
      values.push(metric.formula);
    }
    if (metric.data_source !== undefined) {
      fields.push('data_source = ?');
      values.push(metric.data_source);
    }
    if (metric.categories !== undefined) {
      fields.push('categories = ?');
      values.push(JSON.stringify(metric.categories));
    }
    if (metric.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(metric.is_active);
    }
    if (metric.created_by !== undefined) {
      fields.push('created_by = ?');
      values.push(metric.created_by);
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