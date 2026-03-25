"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class PayrollRecordModel {
    static tableName = 'payroll_records';
    static async findAll(payrollRunId, staffId) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        const conditions = [];
        if (payrollRunId) {
            conditions.push('payroll_run_id = ?');
            params.push(payrollRunId);
        }
        if (staffId) {
            conditions.push('staff_id = ?');
            params.push(staffId);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY processed_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByPayrollRunId(payrollRunId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE payroll_run_id = ? ORDER BY staff_id`, [payrollRunId]);
        return rows;
    }
    static async findByStaffId(staffId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? ORDER BY processed_at DESC`, [staffId]);
        return rows;
    }
    static async findByStaffIdAndPayrollRun(staffId, payrollRunId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? AND payroll_run_id = ?`, [staffId, payrollRunId]);
        return rows[0] || null;
    }
    static async create(payrollRecordData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (payroll_run_id, staff_id, earnings, deductions, gross_pay, total_deductions, net_pay)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            payrollRecordData.payroll_run_id,
            payrollRecordData.staff_id,
            JSON.stringify(payrollRecordData.earnings),
            JSON.stringify(payrollRecordData.deductions),
            payrollRecordData.gross_pay,
            payrollRecordData.total_deductions,
            payrollRecordData.net_pay
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create payroll record');
        }
        return createdItem;
    }
    static async update(id, payrollRecordData) {
        const updates = [];
        const values = [];
        if (payrollRecordData.earnings !== undefined) {
            updates.push('earnings = ?');
            values.push(JSON.stringify(payrollRecordData.earnings));
        }
        if (payrollRecordData.deductions !== undefined) {
            updates.push('deductions = ?');
            values.push(JSON.stringify(payrollRecordData.deductions));
        }
        if (payrollRecordData.gross_pay !== undefined) {
            updates.push('gross_pay = ?');
            values.push(payrollRecordData.gross_pay);
        }
        if (payrollRecordData.total_deductions !== undefined) {
            updates.push('total_deductions = ?');
            values.push(payrollRecordData.total_deductions);
        }
        if (payrollRecordData.net_pay !== undefined) {
            updates.push('net_pay = ?');
            values.push(payrollRecordData.net_pay);
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
    static async calculateTotalAmountForRun(payrollRunId) {
        const [rows] = await database_1.pool.execute(`SELECT SUM(net_pay) as total_amount FROM ${this.tableName} WHERE payroll_run_id = ?`, [payrollRunId]);
        const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : { total_amount: 0 };
        return parseFloat(result.total_amount) || 0;
    }
}
exports.default = PayrollRecordModel;
//# sourceMappingURL=payroll-record.model.js.map