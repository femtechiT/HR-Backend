"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class FormFieldModel {
    static tableName = 'form_fields';
    static async findAll(formId) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        if (formId !== undefined) {
            query += ' WHERE form_id = ?';
            params.push(formId);
        }
        query += ' ORDER BY field_order ASC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByFormId(formId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE form_id = ? ORDER BY field_order ASC`, [formId]);
        return rows;
    }
    static async findByFormAndName(formId, fieldName) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE form_id = ? AND field_name = ?`, [formId, fieldName]);
        return rows[0] || null;
    }
    static async create(fieldData) {
        console.log('DEBUG: Received fieldData:', JSON.stringify(fieldData, null, 2));
        const form_id = fieldData.form_id;
        const field_name = fieldData.field_name;
        const field_label = fieldData.field_label;
        const field_type = fieldData.field_type;
        const is_required = fieldData.is_required ?? false;
        const placeholder = fieldData.placeholder;
        const help_text = fieldData.help_text;
        const validation_rule = fieldData.validation_rule;
        const options = fieldData.options;
        const field_order = Number.isFinite(Number(fieldData.field_order))
            ? Number(fieldData.field_order)
            : 0;
        console.log('DEBUG: Individual values after processing:');
        console.log({ form_id, field_name, field_label, field_type, is_required, placeholder, help_text, validation_rule, options, field_order });
        const params = [
            form_id ?? null,
            field_name ?? null,
            field_label ?? null,
            field_type ?? null,
            is_required,
            placeholder ?? null,
            help_text ?? null,
            validation_rule ?? null,
            (options === undefined || options === null)
                ? null
                : typeof options === 'string'
                    ? options
                    : JSON.stringify(options),
            field_order
        ];
        console.log('DEBUG: Params array before safe conversion:', params);
        const safeParams = params.map((v, i) => {
            if (v === undefined) {
                console.error(`❌ PARAM ${i} IS UNDEFINED`, v);
                throw new Error(`Undefined param at index ${i}`);
            }
            if (typeof v === 'number' && Number.isNaN(v)) {
                console.error(`❌ PARAM ${i} IS NaN`, v);
                throw new Error(`NaN param at index ${i}`);
            }
            return v;
        });
        console.log('✅ FINAL SAFE PARAMS:', safeParams);
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (form_id, field_name, field_label, field_type, is_required, placeholder, help_text, validation_rule, options, field_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, safeParams);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create form field');
        }
        return createdItem;
    }
    static async update(id, fieldData) {
        const updates = [];
        const values = [];
        if (fieldData.field_name !== undefined) {
            updates.push('field_name = ?');
            values.push(fieldData.field_name);
        }
        if (fieldData.field_label !== undefined) {
            updates.push('field_label = ?');
            values.push(fieldData.field_label);
        }
        if (fieldData.field_type !== undefined) {
            updates.push('field_type = ?');
            values.push(fieldData.field_type);
        }
        if (fieldData.is_required !== undefined) {
            updates.push('is_required = ?');
            values.push(fieldData.is_required);
        }
        if (fieldData.placeholder !== undefined) {
            updates.push('placeholder = ?');
            values.push(fieldData.placeholder);
        }
        if (fieldData.help_text !== undefined) {
            updates.push('help_text = ?');
            values.push(fieldData.help_text);
        }
        if (fieldData.validation_rule !== undefined) {
            updates.push('validation_rule = ?');
            values.push(fieldData.validation_rule);
        }
        if (fieldData.options !== undefined) {
            updates.push('options = ?');
            values.push(fieldData.options ? JSON.stringify(fieldData.options) : null);
        }
        if (fieldData.field_order !== undefined) {
            updates.push('field_order = ?');
            values.push(fieldData.field_order);
        }
        if (updates.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async deleteByFormId(formId) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE form_id = ?`, [formId]);
        return result.affectedRows > 0;
    }
}
exports.default = FormFieldModel;
//# sourceMappingURL=form-field.model.js.map