"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class LeaveRequestModel {
    static tableName = 'leave_requests';
    static async findAll(userId, status, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        let query = `SELECT lr.*, u.full_name as user_name, lt.name as leave_type_name
                 FROM ${this.tableName} lr
                 JOIN users u ON lr.user_id = u.id
                 JOIN leave_types lt ON lr.leave_type_id = lt.id`;
        const conditions = [];
        const params = [];
        if (userId) {
            conditions.push('lr.user_id = ?');
            params.push(userId);
        }
        if (status) {
            conditions.push('lr.status = ?');
            params.push(status);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY lr.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        const [rows] = await database_1.pool.execute(query, params);
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} lr`;
        const countParams = [...params.slice(0, params.length - 2)];
        if (conditions.length > 0) {
            countQuery += ' WHERE ' + conditions.join(' AND ');
        }
        const [countResult] = await database_1.pool.execute(countQuery, countParams);
        return {
            data: rows,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }
    static async findById(id, connection) {
        const db = connection || database_1.pool;
        const [rows] = await db.execute(`SELECT lr.*, u.full_name as user_name, lt.name as leave_type_name
       FROM ${this.tableName} lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
        return rows;
    }
    static async create(leaveData, connection) {
        const db = connection || database_1.pool;
        const [result] = await db.execute(`INSERT INTO ${this.tableName}
       (user_id, leave_type_id, start_date, end_date, days_requested, reason, attachments, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            leaveData.user_id,
            leaveData.leave_type_id,
            leaveData.start_date,
            leaveData.end_date,
            leaveData.days_requested,
            leaveData.reason,
            leaveData.attachments ? JSON.stringify(leaveData.attachments) : null,
            leaveData.status || 'submitted',
            leaveData.notes || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId, connection);
        if (!createdItem) {
            throw new Error('Failed to create leave request');
        }
        return createdItem;
    }
    static async update(id, leaveData, connection) {
        const db = connection || database_1.pool;
        const updates = [];
        const values = [];
        if (leaveData.status !== undefined) {
            updates.push('status = ?');
            values.push(leaveData.status);
        }
        if (leaveData.reviewed_by !== undefined) {
            updates.push('reviewed_by = ?');
            values.push(leaveData.reviewed_by);
        }
        if (leaveData.reviewed_at !== undefined) {
            updates.push('reviewed_at = ?');
            values.push(leaveData.reviewed_at);
        }
        if (leaveData.notes !== undefined) {
            updates.push('notes = ?');
            values.push(leaveData.notes);
        }
        if (leaveData.cancelled_by !== undefined) {
            updates.push('cancelled_by = ?');
            values.push(leaveData.cancelled_by);
        }
        if (leaveData.cancelled_at !== undefined) {
            updates.push('cancelled_at = ?');
            values.push(leaveData.cancelled_at);
        }
        if (leaveData.cancellation_reason !== undefined) {
            updates.push('cancellation_reason = ?');
            values.push(leaveData.cancellation_reason);
        }
        if (updates.length === 0) {
            return await this.findById(id, connection);
        }
        values.push(id);
        await db.execute(`UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`, values);
        return await this.findById(id, connection);
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
}
exports.default = LeaveRequestModel;
//# sourceMappingURL=leave-request.model.js.map