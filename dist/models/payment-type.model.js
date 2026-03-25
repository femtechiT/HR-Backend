"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class PaymentTypeModel {
    static tableName = 'payment_types';
    static async findAll() {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByName(name) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE name = ?`, [name]);
        return rows[0] || null;
    }
    static async findByCategory(category) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE payment_category = ? ORDER BY name`, [category]);
        return rows;
    }
    static async create(paymentTypeData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (name, payment_category, calculation_type, formula, applies_to_all, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`, [
            paymentTypeData.name,
            paymentTypeData.payment_category,
            paymentTypeData.calculation_type,
            paymentTypeData.formula || null,
            paymentTypeData.applies_to_all ?? false,
            paymentTypeData.created_by || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create payment type');
        }
        return createdItem;
    }
    static async update(id, paymentTypeData) {
        const updates = [];
        const values = [];
        if (paymentTypeData.name !== undefined) {
            updates.push('name = ?');
            values.push(paymentTypeData.name);
        }
        if (paymentTypeData.payment_category !== undefined) {
            updates.push('payment_category = ?');
            values.push(paymentTypeData.payment_category);
        }
        if (paymentTypeData.calculation_type !== undefined) {
            updates.push('calculation_type = ?');
            values.push(paymentTypeData.calculation_type);
        }
        if (paymentTypeData.formula !== undefined) {
            updates.push('formula = ?');
            values.push(paymentTypeData.formula);
        }
        if (paymentTypeData.applies_to_all !== undefined) {
            updates.push('applies_to_all = ?');
            values.push(paymentTypeData.applies_to_all);
        }
        if (paymentTypeData.is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(paymentTypeData.is_active);
        }
        if (updates.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        await database_1.pool.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = FALSE WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async activate(id) {
        const result = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_active = TRUE WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
}
exports.default = PaymentTypeModel;
//# sourceMappingURL=payment-type.model.js.map