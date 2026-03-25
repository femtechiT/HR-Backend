"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class AuditLogModel {
    static tableName = 'audit_logs';
    static async findAll(limit = 20, offset = 0) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByEntity(entityType, entityId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC`, [entityType, entityId]);
        return rows;
    }
    static async findByUser(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows;
    }
    static async findByAction(action) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE action = ? ORDER BY created_at DESC`, [action]);
        return rows;
    }
    static async create(logData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (user_id, action, entity_type, entity_id, before_data, after_data, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            logData.user_id ?? null,
            logData.action,
            logData.entity_type,
            logData.entity_id,
            logData.before_data ? JSON.stringify(logData.before_data) : null,
            logData.after_data ? JSON.stringify(logData.after_data) : null,
            logData.ip_address ?? null,
            logData.user_agent ?? null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create audit log');
        }
        return createdItem;
    }
    static async logStaffOperation(userId, action, staffId, beforeData, afterData, ipAddress, userAgent) {
        const logData = {
            user_id: userId,
            action,
            entity_type: 'staff',
            entity_id: staffId,
            before_data: beforeData,
            after_data: afterData,
            ip_address: ipAddress,
            user_agent: userAgent
        };
        const result = await this.create(logData);
        if (!result) {
            throw new Error('Failed to create audit log');
        }
        return result;
    }
}
exports.default = AuditLogModel;
//# sourceMappingURL=audit-log.model.js.map