import { pool } from '../config/database';

export interface StaffDynamicField {
  id: number;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'email' | 'phone';
  field_options?: any; // JSON field for select/multiselect/radio options
  required: boolean;
  is_active: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface StaffDynamicFieldInput {
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'email' | 'phone';
  field_options?: any; // JSON field for select/multiselect/radio options
  required?: boolean;
  created_by?: number;
}

export interface StaffDynamicFieldUpdate {
  field_label?: string;
  field_type?: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'email' | 'phone';
  field_options?: any; // JSON field for select/multiselect/radio options
  required?: boolean;
  is_active?: boolean;
  updated_by?: number;
}

export interface StaffDynamicFieldValue {
  id: number;
  staff_id: number;
  field_id: number;
  field_value: string;
  created_at: Date;
  updated_at: Date;
}

export interface StaffDynamicFieldValueInput {
  staff_id: number;
  field_id: number;
  field_value: string;
}

export interface StaffDynamicFieldValueUpdate {
  field_value: string;
}

class StaffDynamicFieldModel {
  static tableName = 'staff_dynamic_fields';
  static valueTableName = 'staff_dynamic_field_values';

  static async findAll(limit: number = 20, offset: number = 0, isActive: boolean = true): Promise<{fields: StaffDynamicField[], totalCount: number}> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (isActive !== undefined) {
      query += ' WHERE is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const countParams: any[] = [];

    if (isActive !== undefined) {
      countQuery += ' WHERE is_active = ?';
      countParams.push(isActive ? 1 : 0);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = (countResult as any)[0].count;

    return {
      fields: rows as StaffDynamicField[],
      totalCount
    };
  }

  static async findById(id: number): Promise<StaffDynamicField | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as StaffDynamicField[])[0] || null;
  }

  static async findByName(fieldName: string): Promise<StaffDynamicField | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE field_name = ?`,
      [fieldName]
    );
    return (rows as StaffDynamicField[])[0] || null;
  }

  static async create(fieldData: StaffDynamicFieldInput): Promise<StaffDynamicField> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (field_name, field_label, field_type, field_options, required, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fieldData.field_name,
        fieldData.field_label,
        fieldData.field_type,
        fieldData.field_options ? JSON.stringify(fieldData.field_options) : null,
        fieldData.required || false,
        fieldData.created_by || null
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create dynamic field');
    }

    return createdItem;
  }

  static async update(id: number, fieldData: StaffDynamicFieldUpdate): Promise<StaffDynamicField | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (fieldData.field_label !== undefined) {
      updates.push('field_label = ?');
      values.push(fieldData.field_label);
    }

    if (fieldData.field_type !== undefined) {
      updates.push('field_type = ?');
      values.push(fieldData.field_type);
    }

    if (fieldData.field_options !== undefined) {
      updates.push('field_options = ?');
      values.push(fieldData.field_options ? JSON.stringify(fieldData.field_options) : null);
    }

    if (fieldData.required !== undefined) {
      updates.push('required = ?');
      values.push(fieldData.required);
    }

    if (fieldData.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(fieldData.is_active);
    }

    if (fieldData.updated_by !== undefined) {
      updates.push('updated_by = ?');
      values.push(fieldData.updated_by);
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
      `UPDATE ${this.tableName} SET is_active = 0 WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Methods for dynamic field values
  static async getValue(staffId: number, fieldId: number): Promise<StaffDynamicFieldValue | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.valueTableName} WHERE staff_id = ? AND field_id = ?`,
      [staffId, fieldId]
    );
    return (rows as StaffDynamicFieldValue[])[0] || null;
  }

  static async getAllValuesForStaff(staffId: number): Promise<StaffDynamicFieldValue[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.valueTableName} WHERE staff_id = ?`,
      [staffId]
    );
    return rows as StaffDynamicFieldValue[];
  }

  static async getAllValuesForField(fieldId: number): Promise<StaffDynamicFieldValue[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.valueTableName} WHERE field_id = ?`,
      [fieldId]
    );
    return rows as StaffDynamicFieldValue[];
  }

  static async setValue(valueData: StaffDynamicFieldValueInput): Promise<StaffDynamicFieldValue> {
    const existingValue = await this.getValue(valueData.staff_id, valueData.field_id);
    
    if (existingValue) {
      // Update existing value
      const [result]: any = await pool.execute(
        `UPDATE ${this.valueTableName} SET field_value = ? WHERE staff_id = ? AND field_id = ?`,
        [valueData.field_value, valueData.staff_id, valueData.field_id]
      );
      
      // Return the updated value
      return await this.getValue(valueData.staff_id, valueData.field_id) as StaffDynamicFieldValue;
    } else {
      // Insert new value
      const [result]: any = await pool.execute(
        `INSERT INTO ${this.valueTableName} (staff_id, field_id, field_value)
         VALUES (?, ?, ?)`,
        [valueData.staff_id, valueData.field_id, valueData.field_value]
      );
      
      const insertedId = result.insertId;
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.valueTableName} WHERE id = ?`,
        [insertedId]
      );
      return (rows as StaffDynamicFieldValue[])[0];
    }
  }

  static async setValuesForStaff(staffId: number, values: {fieldId: number, fieldValue: string}[]): Promise<StaffDynamicFieldValue[]> {
    const results: StaffDynamicFieldValue[] = [];
    
    for (const value of values) {
      const valueData: StaffDynamicFieldValueInput = {
        staff_id: staffId,
        field_id: value.fieldId,
        field_value: value.fieldValue
      };
      
      const result = await this.setValue(valueData);
      results.push(result);
    }
    
    return results;
  }

  static async deleteValue(staffId: number, fieldId: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.valueTableName} WHERE staff_id = ? AND field_id = ?`,
      [staffId, fieldId]
    );

    return result.affectedRows > 0;
  }
}

export default StaffDynamicFieldModel;