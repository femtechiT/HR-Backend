"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
class GuarantorModel {
    static tableName = 'guarantors';
    static async findAll(staffId, isActiveOnly = false) {
        let query = `SELECT * FROM ${this.tableName}`;
        const params = [];
        const conditions = [];
        if (staffId) {
            conditions.push('staff_id = ?');
            params.push(staffId);
        }
        if (isActiveOnly) {
            conditions.push('is_active = TRUE');
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
    static async findById(id) {
        const [rows] = await database_1.pool.execute(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
        return rows[0] || null;
    }
    static async findByStaffId(staffId, isActiveOnly = false) {
        return await this.findAll(staffId, isActiveOnly);
    }
    static async create(guarantorData) {
        const [result] = await database_1.pool.execute(`INSERT INTO ${this.tableName} (
        staff_id, first_name, middle_name, last_name, date_of_birth, gender,
        phone_number, alternate_phone, email,
        address_line_1, address_line_2, city, state, postal_code, country,
        id_type, id_number, id_issuing_authority, id_issue_date, id_expiry_date,
        relationship, occupation, employer_name, employer_address, employer_phone,
        guarantee_type, guarantee_amount, guarantee_start_date, guarantee_end_date, guarantee_terms,
        guarantor_form_path, id_document_path,
        is_verified, verified_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            guarantorData.staff_id,
            guarantorData.first_name,
            guarantorData.middle_name,
            guarantorData.last_name,
            guarantorData.date_of_birth,
            guarantorData.gender,
            guarantorData.phone_number,
            guarantorData.alternate_phone,
            guarantorData.email,
            guarantorData.address_line_1,
            guarantorData.address_line_2,
            guarantorData.city,
            guarantorData.state,
            guarantorData.postal_code,
            guarantorData.country || 'Nigeria',
            guarantorData.id_type,
            guarantorData.id_number,
            guarantorData.id_issuing_authority,
            guarantorData.id_issue_date,
            guarantorData.id_expiry_date,
            guarantorData.relationship,
            guarantorData.occupation,
            guarantorData.employer_name,
            guarantorData.employer_address,
            guarantorData.employer_phone,
            guarantorData.guarantee_type,
            guarantorData.guarantee_amount,
            guarantorData.guarantee_start_date,
            guarantorData.guarantee_end_date,
            guarantorData.guarantee_terms,
            guarantorData.guarantor_form_path,
            guarantorData.id_document_path,
            guarantorData.is_verified || false,
            guarantorData.verified_by,
            guarantorData.is_active !== undefined ? guarantorData.is_active : true
        ]);
        const insertedId = result.insertId;
        const createdItem = await this.findById(insertedId);
        if (!createdItem) {
            throw new Error('Failed to create guarantor');
        }
        return createdItem;
    }
    static async update(id, guarantorData) {
        const updates = [];
        const values = [];
        const fields = [
            'first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
            'phone_number', 'alternate_phone', 'email',
            'address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country',
            'id_type', 'id_number', 'id_issuing_authority', 'id_issue_date', 'id_expiry_date',
            'relationship', 'occupation', 'employer_name', 'employer_address', 'employer_phone',
            'guarantee_type', 'guarantee_amount', 'guarantee_start_date', 'guarantee_end_date', 'guarantee_terms',
            'guarantor_form_path', 'id_document_path',
            'is_verified', 'verified_by', 'verification_notes', 'is_active'
        ];
        for (const field of fields) {
            if (guarantorData[field] !== undefined) {
                updates.push(`${field} = ?`);
                values.push(guarantorData[field]);
            }
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
    static async verify(id, verifiedBy, notes) {
        const [result] = await database_1.pool.execute(`UPDATE ${this.tableName} 
       SET is_verified = TRUE, verified_by = ?, verified_at = NOW(), verification_notes = ? 
       WHERE id = ?`, [verifiedBy, notes, id]);
        if (result.affectedRows > 0) {
            return await this.findById(id);
        }
        return null;
    }
    static async countByStaffId(staffId) {
        const [rows] = await database_1.pool.execute(`SELECT COUNT(*) as total FROM ${this.tableName} WHERE staff_id = ?`, [staffId]);
        return rows[0]?.total || 0;
    }
    static async getUnverified(staffId) {
        let query = `SELECT * FROM ${this.tableName} WHERE is_verified = FALSE AND is_active = TRUE`;
        const params = [];
        if (staffId) {
            query += ' AND staff_id = ?';
            params.push(staffId);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await database_1.pool.execute(query, params);
        return rows;
    }
}
exports.default = GuarantorModel;
//# sourceMappingURL=guarantor.model.js.map