"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppraisalCycleModel = void 0;
const database_1 = require("../config/database");
exports.AppraisalCycleModel = {
    tableName: 'appraisal_cycles',
    async findAll() {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        connection.release();
        return rows;
    },
    async findById(id) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        connection.release();
        return rows[0] || null;
    },
    async findByStatus(status) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY created_at DESC`, [status]);
        connection.release();
        return rows;
    },
    async findByTemplateId(templateId) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE template_id = ? ORDER BY created_at DESC`, [templateId]);
        connection.release();
        return rows;
    },
    async findByDateRange(startDate, endDate) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE start_date >= ? AND end_date <= ? ORDER BY created_at DESC`, [startDate, endDate]);
        connection.release();
        return rows;
    },
    async create(cycle) {
        const connection = await database_1.pool.getConnection();
        const [result] = await connection.execute(`INSERT INTO ${this.tableName}
       (name, description, template_id, start_date, end_date, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`, [
            cycle.name,
            cycle.description,
            cycle.template_id,
            cycle.start_date,
            cycle.end_date,
            cycle.status,
            cycle.created_by
        ]);
        connection.release();
        return {
            id: result.insertId,
            ...cycle,
            created_at: new Date(),
            updated_at: new Date()
        };
    },
    async update(id, cycle) {
        const connection = await database_1.pool.getConnection();
        const fields = [];
        const values = [];
        if (cycle.name !== undefined) {
            fields.push('name = ?');
            values.push(cycle.name);
        }
        if (cycle.description !== undefined) {
            fields.push('description = ?');
            values.push(cycle.description);
        }
        if (cycle.template_id !== undefined) {
            fields.push('template_id = ?');
            values.push(cycle.template_id);
        }
        if (cycle.start_date !== undefined) {
            fields.push('start_date = ?');
            values.push(cycle.start_date);
        }
        if (cycle.end_date !== undefined) {
            fields.push('end_date = ?');
            values.push(cycle.end_date);
        }
        if (cycle.status !== undefined) {
            fields.push('status = ?');
            values.push(cycle.status);
        }
        if (cycle.created_by !== undefined) {
            fields.push('created_by = ?');
            values.push(cycle.created_by);
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
        const [result] = await connection.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        connection.release();
        return result.affectedRows > 0;
    }
};
//# sourceMappingURL=appraisal-cycle.model.js.map