"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiDefinitionModel = void 0;
const database_1 = require("../config/database");
exports.KpiDefinitionModel = {
    tableName: 'kpi_definitions',
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
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE JSON_CONTAINS(categories, ?) AND is_active = ? ORDER BY created_at DESC`, [`"${category}"`, true]);
        connection.release();
        return rows;
    },
    async create(kpi) {
        const connection = await database_1.pool.getConnection();
        const [result] = await connection.execute(`INSERT INTO ${this.tableName}
       (name, description, formula, weight, metric_ids, categories, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [
            kpi.name,
            kpi.description,
            kpi.formula,
            kpi.weight,
            JSON.stringify(kpi.metric_ids),
            JSON.stringify(kpi.categories),
            kpi.is_active,
            kpi.created_by
        ]);
        connection.release();
        return {
            id: result.insertId,
            ...kpi,
            created_at: new Date(),
            updated_at: new Date()
        };
    },
    async update(id, kpi) {
        const connection = await database_1.pool.getConnection();
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
//# sourceMappingURL=kpi-definition.model.js.map