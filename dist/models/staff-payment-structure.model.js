"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class StaffPaymentStructureModel {
    static tableName = 'staff_payment_structure';
    static async findAll(staffId, paymentTypeId) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        const conditions = [];
        if (staffId) {
            conditions.push('staff_id = ?');
            params.push(staffId);
        }
        if (paymentTypeId) {
            conditions.push('payment_type_id = ?');
            params.push(paymentTypeId);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY effective_from DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByStaffId(staffId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? ORDER BY effective_from DESC`, [staffId]);
        return rows;
    }
    static async findByPaymentTypeId(paymentTypeId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE payment_type_id = ? ORDER BY staff_id`, [paymentTypeId]);
        return rows;
    }
    static async findByStaffAndPaymentType(staffId, paymentTypeId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? AND payment_type_id = ? ORDER BY effective_from DESC`, [staffId, paymentTypeId]);
        return rows;
    }
    static async findActiveForStaff(staffId, date = new Date()) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} 
       WHERE staff_id = ? 
       AND effective_from <= ? 
       AND (effective_to IS NULL OR effective_to >= ?)
       ORDER BY effective_from DESC`, [staffId, date, date]);
        return rows;
    }
    static async create(paymentStructureData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (staff_id, payment_type_id, value, effective_from, effective_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            paymentStructureData.staff_id,
            paymentStructureData.payment_type_id,
            paymentStructureData.value,
            paymentStructureData.effective_from,
            paymentStructureData.effective_to || null,
            paymentStructureData.created_by || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create staff payment structure');
        }
        return createdItem;
    }
    static async update(id, paymentStructureData) {
        const updates = [];
        const values = [];
        if (paymentStructureData.value !== undefined) {
            updates.push('value = ?');
            values.push(paymentStructureData.value);
        }
        if (paymentStructureData.effective_from !== undefined) {
            updates.push('effective_from = ?');
            values.push(paymentStructureData.effective_from);
        }
        if (paymentStructureData.effective_to !== undefined) {
            updates.push('effective_to = ?');
            values.push(paymentStructureData.effective_to);
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
    static async deactivate(id, endDate) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET effective_to = ? WHERE id = ?`, [endDate, id]);
        return result.affectedRows > 0;
    }
}
exports.default = StaffPaymentStructureModel;
//# sourceMappingURL=staff-payment-structure.model.js.map