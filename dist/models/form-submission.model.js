"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class FormSubmissionModel {
    static tableName = 'form_submissions';
    static async findAll(formId, userId, status) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        const conditions = [];
        if (formId) {
            conditions.push('form_id = ?');
            params.push(formId);
        }
        if (userId) {
            conditions.push('user_id = ?');
            params.push(userId);
        }
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY submitted_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByFormId(formId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE form_id = ? ORDER BY submitted_at DESC`, [formId]);
        return rows;
    }
    static async findByUserId(userId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY submitted_at DESC`, [userId]);
        return rows;
    }
    static async findByStatus(status) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE status = ? ORDER BY submitted_at DESC`, [status]);
        return rows;
    }
    static async create(submissionData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (form_id, user_id, submission_data, status, notes) 
       VALUES (?, ?, ?, ?, ?)`, [
            submissionData.form_id,
            submissionData.user_id,
            JSON.stringify(submissionData.submission_data),
            submissionData.status || 'submitted',
            submissionData.notes
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create form submission');
        }
        return createdItem;
    }
    static async update(id, submissionData) {
        const updates = [];
        const values = [];
        if (submissionData.status !== undefined) {
            updates.push('status = ?');
            values.push(submissionData.status);
        }
        if (submissionData.reviewed_by !== undefined) {
            updates.push('reviewed_by = ?');
            values.push(submissionData.reviewed_by);
        }
        if (submissionData.reviewed_at !== undefined) {
            updates.push('reviewed_at = ?');
            values.push(submissionData.reviewed_at);
        }
        if (submissionData.notes !== undefined) {
            updates.push('notes = ?');
            values.push(submissionData.notes);
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
exports.default = FormSubmissionModel;
//# sourceMappingURL=form-submission.model.js.map