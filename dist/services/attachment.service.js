"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class AttachmentService {
    static tableName = 'form_attachments';
    static async saveAttachments(files, entity, fieldId) {
        if (!files || files.length === 0) {
            return [];
        }
        const attachments = [];
        for (const file of files) {
            const attachmentInput = {
                file_name: file.originalname,
                file_path: `/uploads/attachments/${path_1.default.basename(file.filename)}`,
                file_size: file.size,
                mime_type: file.mimetype
            };
            if (entity.entityType === 'leave_request') {
                attachmentInput.leave_request_id = entity.entityId;
            }
            else if (entity.entityType === 'form_submission') {
                attachmentInput.form_submission_id = entity.entityId;
                if (fieldId) {
                    attachmentInput.field_id = fieldId;
                }
            }
            const attachment = await this.create(attachmentInput);
            attachments.push(attachment);
        }
        return attachments;
    }
    static async getAttachments(entity) {
        let query = `SELECT * FROM ${this.tableName} WHERE `;
        const params = [];
        if (entity.entityType === 'leave_request') {
            query += 'leave_request_id = ?';
            params.push(entity.entityId);
        }
        else if (entity.entityType === 'form_submission') {
            query += 'form_submission_id = ?';
            params.push(entity.entityId);
        }
        query += ' ORDER BY uploaded_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async deleteAttachment(attachmentId) {
        const attachment = await this.findById(attachmentId);
        if (!attachment) {
            return false;
        }
        const filePath = path_1.default.join(process.cwd(), attachment.file_path);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        const result = await database_1.pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [attachmentId]);
        return result.affectedRows > 0;
    }
    static async deleteByEntity(entity) {
        let query = `DELETE FROM ${this.tableName} WHERE `;
        const params = [];
        if (entity.entityType === 'leave_request') {
            query += 'leave_request_id = ?';
            params.push(entity.entityId);
        }
        else if (entity.entityType === 'form_submission') {
            query += 'form_submission_id = ?';
            params.push(entity.entityId);
        }
        const result = await database_1.pool.execute(query, params);
        return result.affectedRows > 0;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async create(attachmentData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName}
       (form_submission_id, leave_request_id, field_id, file_name, file_path, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            attachmentData.form_submission_id || null,
            attachmentData.leave_request_id || null,
            attachmentData.field_id || null,
            attachmentData.file_name,
            attachmentData.file_path,
            attachmentData.file_size || null,
            attachmentData.mime_type || null
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create attachment');
        }
        return createdItem;
    }
}
exports.default = AttachmentService;
//# sourceMappingURL=attachment.service.js.map