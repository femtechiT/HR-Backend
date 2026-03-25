"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppraisalAssignmentModel = void 0;
const database_1 = require("../config/database");
exports.AppraisalAssignmentModel = {
    tableName: 'appraisal_assignments',
    async findAll() {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} ORDER BY assigned_at DESC`);
        connection.release();
        return rows;
    },
    async findById(id) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        connection.release();
        return rows[0] || null;
    },
    async findByEmployeeId(employeeId) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE employee_id = ? ORDER BY assigned_at DESC`, [employeeId]);
        connection.release();
        return rows;
    },
    async findByAppraisalCycleId(cycleId) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE appraisal_cycle_id = ? ORDER BY assigned_at DESC`, [cycleId]);
        connection.release();
        return rows;
    },
    async findByStatus(status) {
        const connection = await database_1.pool.getConnection();
        const [rows] = await connection.execute(`SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY assigned_at DESC`, [status]);
        connection.release();
        return rows;
    },
    async create(assignment) {
        const connection = await database_1.pool.getConnection();
        const [result] = await connection.execute(`INSERT INTO ${this.tableName}
       (employee_id, appraisal_cycle_id, status, assigned_by, assigned_at, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), ?, NOW(), NOW())`, [
            assignment.employee_id,
            assignment.appraisal_cycle_id,
            assignment.status,
            assignment.assigned_by,
            assignment.completed_at || null
        ]);
        connection.release();
        return {
            id: result.insertId,
            ...assignment,
            assigned_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
        };
    },
    async update(id, assignment) {
        const connection = await database_1.pool.getConnection();
        const fields = [];
        const values = [];
        if (assignment.employee_id !== undefined) {
            fields.push('employee_id = ?');
            values.push(assignment.employee_id);
        }
        if (assignment.appraisal_cycle_id !== undefined) {
            fields.push('appraisal_cycle_id = ?');
            values.push(assignment.appraisal_cycle_id);
        }
        if (assignment.status !== undefined) {
            fields.push('status = ?');
            values.push(assignment.status);
        }
        if (assignment.assigned_by !== undefined) {
            fields.push('assigned_by = ?');
            values.push(assignment.assigned_by);
        }
        if (assignment.completed_at !== undefined) {
            fields.push('completed_at = ?');
            values.push(assignment.completed_at);
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
//# sourceMappingURL=appraisal-assignment.model.js.map