"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class PayrollRunModel {
    static tableName = 'payroll_runs';
    static async findAll(month, year, branchId, status) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        const conditions = [];
        if (month) {
            conditions.push('month = ?');
            params.push(month);
        }
        if (year) {
            conditions.push('year = ?');
            params.push(year);
        }
        if (branchId !== undefined) {
            conditions.push('branch_id = ?');
            params.push(branchId);
        }
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY year DESC, month DESC, created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByMonthYear(month, year, branchId) {
        let query = `SELECT * FROM ${this.tableName} WHERE month = ? AND year = ?`;
        const params = [month, year];
        if (branchId !== undefined) {
            query += ' AND branch_id = ?';
            params.push(branchId);
        }
        const [rows] = await database_1.pool.execute(query, params);
        return rows[0] || null;
    }
    static async create(payrollRunData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (month, year, branch_id, status, processed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            payrollRunData.month,
            payrollRunData.year,
            payrollRunData.branch_id || null,
            payrollRunData.status || 'draft',
            payrollRunData.processed_by || null,
            payrollRunData.notes || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create payroll run');
        }
        return createdItem;
    }
    static async update(id, payrollRunData) {
        const updates = [];
        const values = [];
        if (payrollRunData.status !== undefined) {
            updates.push('status = ?');
            values.push(payrollRunData.status);
        }
        if (payrollRunData.total_amount !== undefined) {
            updates.push('total_amount = ?');
            values.push(payrollRunData.total_amount);
        }
        if (payrollRunData.processed_by !== undefined) {
            updates.push('processed_by = ?');
            values.push(payrollRunData.processed_by);
        }
        if (payrollRunData.notes !== undefined) {
            updates.push('notes = ?');
            values.push(payrollRunData.notes);
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
    static async updateStatus(id, status) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
        if (result.affectedRows > 0) {
            return await this.findById(id);
        }
        return null;
    }
}
exports.default = PayrollRunModel;
//# sourceMappingURL=payroll-run.model.js.map