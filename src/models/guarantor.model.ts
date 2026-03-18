import { pool } from '../config/database';

export interface Guarantor {
  id: number;
  staff_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  id_type?: 'national_id' | 'passport' | 'drivers_license' | 'voters_card' | 'other';
  id_number?: string;
  id_issuing_authority?: string;
  id_issue_date?: Date;
  id_expiry_date?: Date;
  relationship?: string;
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  employer_phone?: string;
  guarantee_type?: 'personal' | 'financial' | 'both';
  guarantee_amount?: number;
  guarantee_start_date?: Date;
  guarantee_end_date?: Date;
  guarantee_terms?: string;
  guarantor_form_path?: string;
  id_document_path?: string;
  is_verified: boolean;
  verified_by?: number;
  verified_at?: Date;
  verification_notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GuarantorInput {
  staff_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  id_type?: 'national_id' | 'passport' | 'drivers_license' | 'voters_card' | 'other';
  id_number?: string;
  id_issuing_authority?: string;
  id_issue_date?: Date;
  id_expiry_date?: Date;
  relationship?: string;
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  employer_phone?: string;
  guarantee_type?: 'personal' | 'financial' | 'both';
  guarantee_amount?: number;
  guarantee_start_date?: Date;
  guarantee_end_date?: Date;
  guarantee_terms?: string;
  guarantor_form_path?: string;
  id_document_path?: string;
  is_verified?: boolean;
  verified_by?: number;
  is_active?: boolean;
}

export interface GuarantorUpdate {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  phone_number?: string;
  alternate_phone?: string;
  email?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  id_type?: 'national_id' | 'passport' | 'drivers_license' | 'voters_card' | 'other';
  id_number?: string;
  id_issuing_authority?: string;
  id_issue_date?: Date;
  id_expiry_date?: Date;
  relationship?: string;
  occupation?: string;
  employer_name?: string;
  employer_address?: string;
  employer_phone?: string;
  guarantee_type?: 'personal' | 'financial' | 'both';
  guarantee_amount?: number;
  guarantee_start_date?: Date;
  guarantee_end_date?: Date;
  guarantee_terms?: string;
  guarantor_form_path?: string;
  id_document_path?: string;
  is_verified?: boolean;
  verified_by?: number;
  verification_notes?: string;
  is_active?: boolean;
}

class GuarantorModel {
  static tableName = 'guarantors';

  static async findAll(staffId?: number, isActiveOnly: boolean = false): Promise<Guarantor[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    const conditions: string[] = [];
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

    const [rows] = await pool.execute(query, params);
    return rows as Guarantor[];
  }

  static async findById(id: number): Promise<Guarantor | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return (rows as Guarantor[])[0] || null;
  }

  static async findByStaffId(staffId: number, isActiveOnly: boolean = false): Promise<Guarantor[]> {
    return await this.findAll(staffId, isActiveOnly);
  }

  static async create(guarantorData: GuarantorInput): Promise<Guarantor> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (
        staff_id, first_name, middle_name, last_name, date_of_birth, gender,
        phone_number, alternate_phone, email,
        address_line_1, address_line_2, city, state, postal_code, country,
        id_type, id_number, id_issuing_authority, id_issue_date, id_expiry_date,
        relationship, occupation, employer_name, employer_address, employer_phone,
        guarantee_type, guarantee_amount, guarantee_start_date, guarantee_end_date, guarantee_terms,
        guarantor_form_path, id_document_path,
        is_verified, verified_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create guarantor');
    }

    return createdItem;
  }

  static async update(id: number, guarantorData: GuarantorUpdate): Promise<Guarantor | null> {
    const updates: string[] = [];
    const values: any[] = [];

    const fields: (keyof GuarantorUpdate)[] = [
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

    await pool.execute(
      `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Mark guarantor as verified
  static async verify(id: number, verifiedBy: number, notes?: string): Promise<Guarantor | null> {
    const [result]: any = await pool.execute(
      `UPDATE ${this.tableName} 
       SET is_verified = TRUE, verified_by = ?, verified_at = NOW(), verification_notes = ? 
       WHERE id = ?`,
      [verifiedBy, notes, id]
    );

    if (result.affectedRows > 0) {
      return await this.findById(id);
    }
    return null;
  }

  // Get count of guarantors for a staff member
  static async countByStaffId(staffId: number): Promise<number> {
    const [rows]: any = await pool.execute(
      `SELECT COUNT(*) as total FROM ${this.tableName} WHERE staff_id = ?`,
      [staffId]
    );
    return rows[0]?.total || 0;
  }

  // Get unverified guarantors
  static async getUnverified(staffId?: number): Promise<Guarantor[]> {
    let query = `SELECT * FROM ${this.tableName} WHERE is_verified = FALSE AND is_active = TRUE`;
    const params: any[] = [];

    if (staffId) {
      query += ' AND staff_id = ?';
      params.push(staffId);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    return rows as Guarantor[];
  }
}

export default GuarantorModel;
