"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiScoreModel = void 0;
const database_1 = require("../config/database");
exports.KpiScoreModel = {
    tableName: 'kpi_scores',
    async findAll() {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} ORDER BY calculated_at DESC`);
        connection.release();
        return rows;
    },
    async findById(id) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        connection.release();
        return rows[0] || null;
    },
    async findByAssignmentId(assignmentId) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE kpi_assignment_id = ? ORDER BY calculated_at DESC`, [assignmentId]);
        connection.release();
        return rows;
    },
    async findByUserId(userId) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`
      SELECT ks.*
      FROM ${this.tableName} ks
      JOIN kpi_assignments ka ON ks.kpi_assignment_id = ka.id
      WHERE ka.user_id = ?
      ORDER BY ks.calculated_at DESC
    `, [userId]);
        connection.release();
        return rows;
    },
    async create(score) {
        const connection = await database_1.pool.getConnection();
        const [result] = await connection.execute(`INSERT INTO ${this.tableName}
       (kpi_assignment_id, calculated_value, achievement_percentage, weighted_score, calculated_at, manually_overridden, override_value, override_reason, override_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, NOW(), NOW())`, [
            score.kpi_assignment_id,
            score.calculated_value,
            score.achievement_percentage,
            score.weighted_score,
            score.manually_overridden || false,
            score.override_value || null,
            score.override_reason || null,
            score.override_by || null
        ]);
        connection.release();
        return {
            id: result.insertId,
            ...score,
            calculated_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
        };
    },
    async update(id, score) {
        const connection = await database_1.pool.getConnection();
        const fields = [];
        const values = [];
        if (score.kpi_assignment_id !== undefined) {
            fields.push('kpi_assignment_id = ?');
            values.push(score.kpi_assignment_id);
        }
        if (score.calculated_value !== undefined) {
            fields.push('calculated_value = ?');
            values.push(score.calculated_value);
        }
        if (score.achievement_percentage !== undefined) {
            fields.push('achievement_percentage = ?');
            values.push(score.achievement_percentage);
        }
        if (score.weighted_score !== undefined) {
            fields.push('weighted_score = ?');
            values.push(score.weighted_score);
        }
        if (score.manually_overridden !== undefined) {
            fields.push('manually_overridden = ?');
            values.push(score.manually_overridden);
        }
        if (score.override_value !== undefined) {
            fields.push('override_value = ?');
            values.push(score.override_value);
        }
        if (score.override_reason !== undefined) {
            fields.push('override_reason = ?');
            values.push(score.override_reason);
        }
        if (score.override_by !== undefined) {
            fields.push('override_by = ?');
            values.push(score.override_by);
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
//# sourceMappingURL=kpi-score.model.js.map