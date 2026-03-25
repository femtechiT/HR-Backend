"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class FormAttachmentModel {
    static tableName = 'form_attachment';
    static async findAll(submissionId) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        if (submissionId) {
            query += ' WHERE form_submission_id = ?';
            params.push(submissionId);
        }
        query += ' ORDER BY uploaded_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findBySubmissionId(submissionId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE form_submission_id = ? ORDER BY uploaded_at DESC`, [submissionId]);
        return rows;
    }
    static async findByFieldId(fieldId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE field_id = ? ORDER BY uploaded_at DESC`, [fieldId]);
        return rows;
    }
    static async create(attachmentData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (form_submission_id, field_id, file_name, file_path, file_size, mime_type) 
       VALUES (?, ?, ?, ?, ?, ?)`, [
            attachmentData.form_submission_id,
            attachmentData.field_id,
            attachmentData.file_name,
            attachmentData.file_path,
            attachmentData.file_size,
            attachmentData.mime_type
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create form attachment');
        }
        return createdItem;
    }
    static async delete(id) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    static async deleteBySubmissionId(submissionId) {
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE form_submission_id = ?`, [submissionId]);
        return result.affectedRows > 0;
    }
}
exports.default = FormAttachmentModel;
//# sourceMappingURL=form-attachment.model.js.map