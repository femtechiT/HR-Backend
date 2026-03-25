"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class StaffDynamicFieldModel {
    static tableName = 'staff_dynamic_fields';
    static valueTableName = 'staff_dynamic_field_values';
    static async findAll(limit = 20, offset = 0, isActive = true) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        if (isActive !== undefined) {
            query += ' WHERE is_active = ?';
            params.push(isActive ? 1 : 0);
        }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const countParams = [];
        if (isActive !== undefined) {
            countQuery += ' WHERE is_active = ?';
            countParams.push(isActive ? 1 : 0);
        }
        const [countResult] = await database_1.pool.execute(countQuery, countParams);
        const totalCount = countResult[0].count;
        return {
            fields: rows,
            totalCount
        };
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByName(fieldName) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE field_name = ?`, [fieldName]);
        return rows[0] || null;
    }
    static async create(fieldData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (field_name, field_label, field_type, field_options, required, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            fieldData.field_name,
            fieldData.field_label,
            fieldData.field_type,
            fieldData.field_options ? JSON.stringify(fieldData.field_options) : null,
            fieldData.required || false,
            fieldData.created_by || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create dynamic field');
        }
        return createdItem;
    }
    static async update(id, fieldData) {
        const updates = [];
        const values = [];
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
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = 0 WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async getValue(staffId, fieldId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.valueTableName} WHERE staff_id = ? AND field_id = ?`, [staffId, fieldId]);
        return rows[0] || null;
    }
    static async getAllValuesForStaff(staffId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.valueTableName} WHERE staff_id = ?`, [staffId]);
        return rows;
    }
    static async getAllValuesForField(fieldId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.valueTableName} WHERE field_id = ?`, [fieldId]);
        return rows;
    }
    static async setValue(valueData) {
        const existingValue = await this.getValue(valueData.staff_id, valueData.field_id);
        if (existingValue) {
            const [result] = await database_1.pool.execute(`UPDATE ${this.valueTableName} SET field_value = ? WHERE staff_id = ? AND field_id = ?`, [valueData.field_value, valueData.staff_id, valueData.field_id]);
            return await this.getValue(valueData.staff_id, valueData.field_id);
        }
        else {
            const [result] = await database_1.pool.execute(`INSERT INTO ${this.valueTableName} (staff_id, field_id, field_value)
         VALUES (?, ?, ?)`, [valueData.staff_id, valueData.field_id, valueData.field_value]);
            const insertedId = result.insertId;
            const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.valueTableName} WHERE id = ?`, [insertedId]);
            return rows[0];
        }
    }
    static async setValuesForStaff(staffId, values) {
        const results = [];
        for (const value of values) {
            const valueData = {
                staff_id: staffId,
                field_id: value.fieldId,
                field_value: value.fieldValue
            };
            const result = await this.setValue(valueData);
            results.push(result);
        }
        return results;
    }
    static async deleteValue(staffId, fieldId) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.valueTableName} WHERE staff_id = ? AND field_id = ?`, [staffId, fieldId]);
        return result.affectedRows > 0;
    }
}
exports.default = StaffDynamicFieldModel;
//# sourceMappingURL=staff-dynamic-field.model.js.map