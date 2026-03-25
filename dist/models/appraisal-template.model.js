"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppraisalTemplateModel = void 0;
const database_1 = require("../config/database");
exports.AppraisalTemplateModel = {
    tableName: 'appraisal_templates',
    async findAll() {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE is_active = ? ORDER BY created_at DESC`, [true]);
        connection.release();
        return rows;
    },
    async findById(id) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE id = ? AND is_active = ?`, [id, true]);
        connection.release();
        return rows[0] || null;
    },
    async findByCategory(category) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE category = ? AND is_active = ? ORDER BY created_at DESC`, [category, true]);
        connection.release();
        return rows;
    },
    async create(template) {
        const connection = await database_1.pool.getConnection();
        const [result] = await connection.execute(`INSERT INTO ${this.tableName}
       (name, description, category, kpi_ids, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`, [
            template.name,
            template.description,
            template.category,
            JSON.stringify(template.kpi_ids),
            template.is_active,
            template.created_by
        ]);
        connection.release();
        return {
            id: result.insertId,
            ...template,
            created_at: new Date(),
            updated_at: new Date()
        };
    },
    async update(id, template) {
        const connection = await database_1.pool.getConnection();
        const fields = [];
        const values = [];
        if (template.name !== undefined) {
            fields.push('name = ?');
            values.push(template.name);
        }
        if (template.description !== undefined) {
            fields.push('description = ?');
            values.push(template.description);
        }
        if (template.category !== undefined) {
            fields.push('category = ?');
            values.push(template.category);
        }
        if (template.kpi_ids !== undefined) {
            fields.push('kpi_ids = ?');
            values.push(JSON.stringify(template.kpi_ids));
        }
        if (template.is_active !== undefined) {
            fields.push('is_active = ?');
            values.push(template.is_active);
        }
        if (template.created_by !== undefined) {
            fields.push('created_by = ?');
            values.push(template.created_by);
        }
        fields.push('updated_at = NOW()');
        if (fields.length === 0) {
            return false;
        }
        values.push(id);
        const [result] = await connection.execute(`UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`, values);
        connection.release();
        return result.affectedRows > 0;
    },
    async delete(id) {
        const connection = await database_1.pool.getConnection();
        const [result] = await connection.execute(`UPDATE ${this.tableName} SET is_active = ? WHERE id = ?`, [false, id]);
        connection.release();
        return result.affectedRows > 0;
    }
};
//# sourceMappingURL=appraisal-template.model.js.map