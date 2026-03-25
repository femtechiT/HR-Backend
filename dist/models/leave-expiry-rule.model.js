"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class LeaveExpiryRuleModel {
    static tableName = 'leave_expiry_rules';
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
    static async create(expiryRuleData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (name, expire_after_days, trigger_notification_days, auto_expire_action)
       VALUES (?, ?, ?, ?)`, [
            expiryRuleData.name,
            expiryRuleData.expire_after_days,
            expiryRuleData.trigger_notification_days || null,
            expiryRuleData.auto_expire_action || 'forfeit'
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create leave expiry rule');
        }
        return createdItem;
    }
    static async update(id, expiryRuleData) {
        const updates = [];
        const values = [];
        if (expiryRuleData.name !== undefined) {
            updates.push('name = ?');
            values.push(expiryRuleData.name);
        }
        if (expiryRuleData.expire_after_days !== undefined) {
            updates.push('expire_after_days = ?');
            values.push(expiryRuleData.expire_after_days);
        }
        if (expiryRuleData.trigger_notification_days !== undefined) {
            updates.push('trigger_notification_days = ?');
            values.push(expiryRuleData.trigger_notification_days);
        }
        if (expiryRuleData.auto_expire_action !== undefined) {
            updates.push('auto_expire_action = ?');
            values.push(expiryRuleData.auto_expire_action);
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
}
exports.default = LeaveExpiryRuleModel;
//# sourceMappingURL=leave-expiry-rule.model.js.map