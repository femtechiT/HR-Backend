"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class StaffDocumentModel {
    static tableName = 'staff_documents';
    static async findAll(staffId) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        if (staffId) {
            query += ' WHERE staff_id = ?';
            params.push(staffId);
        }
        query += ' ORDER BY uploaded_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByStaffId(staffId) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? ORDER BY uploaded_at DESC`, [staffId]);
        return rows;
    }
    static async findByType(staffId, documentType) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE staff_id = ? AND document_type = ? ORDER BY uploaded_at DESC`, [staffId, documentType]);
        return rows;
    }
    static async create(documentData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (staff_id, document_type, document_name, file_path, file_size, mime_type, uploaded_by, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            documentData.staff_id,
            documentData.document_type,
            documentData.document_name,
            documentData.file_path,
            documentData.file_size,
            documentData.mime_type,
            documentData.uploaded_by,
            documentData.expiry_date
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create staff document');
        }
        return createdItem;
    }
    static async update(id, documentData) {
        const updates = [];
        const values = [];
        if (documentData.document_name !== undefined) {
            updates.push('document_name = ?');
            values.push(documentData.document_name);
        }
        if (documentData.expiry_date !== undefined) {
            updates.push('expiry_date = ?');
            values.push(documentData.expiry_date);
        }
        if (documentData.is_verified !== undefined) {
            updates.push('is_verified = ?');
            values.push(documentData.is_verified);
        }
        if (documentData.verified_by !== undefined) {
            updates.push('verified_by = ?');
            values.push(documentData.verified_by);
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
    static async verifyDocument(id, verifiedBy) {
        const [result] = await database_1.pool.execute(`UPDATE ${this.tableName} SET is_verified = TRUE, verified_by = ?, verified_at = NOW() WHERE id = ?`, [verifiedBy, id]);
        if (result.affectedRows > 0) {
            return await this.findById(id);
        }
        return null;
    }
    static async getExpiringDocuments(days = 30) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} 
       WHERE expiry_date IS NOT NULL 
       AND expiry_date <= DATE_ADD(NOW(), INTERVAL ? DAY)
       AND expiry_date >= NOW()
       AND is_verified = TRUE
       ORDER BY expiry_date ASC`, [days]);
        return rows;
    }
}
exports.default = StaffDocumentModel;
//# sourceMappingURL=staff-document.model.js.map