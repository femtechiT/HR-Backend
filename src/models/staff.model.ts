import { pool } from '../config/database';

export interface Staff {
  id: number;
  user_id: number;
  full_name: string;  // Added from joined user table
  email: string;      // Added from joined user table
  employee_id?: string;
  designation?: string;
  department?: string;
  branch_id?: number;
  joining_date?: Date;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary';
  status: 'active' | 'inactive' | 'terminated' | 'on_leave';
  reporting_manager_id?: number;
  work_mode?: 'onsite' | 'remote' | 'hybrid';
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  tax_identification_number?: string;
  base_salary?: number;
  pay_grade?: string;
  pension_insurance_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  current_address_id?: number;
  permanent_address_id?: number;
  company_assets?: any; // JSON field
  primary_skills?: string;
  education_certifications?: any; // JSON field
  employee_photo?: string;
  probation_end_date?: Date;
  contract_end_date?: Date;
  weekly_working_hours?: number;
  overtime_eligibility?: boolean;
  medical_insurance_id?: string;
  provident_fund_id?: string;
  gratuity_applicable?: boolean;
  notice_period_days?: number;
  work_email?: string;
  personal_email?: string;
  phone_number?: string;
  alternate_phone_number?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  blood_group?: string;
  allergies?: string;
  special_medical_notes?: string;
  highest_qualification?: string;
  university_school?: string;
  year_of_graduation?: number;
  professional_certifications?: string;
  certifications_json?: any; // JSON field
  languages_known?: any; // JSON field
  notice_period_start_date?: Date;
  notice_period_end_date?: Date;
  relieving_date?: Date;
  experience_years?: number;
  previous_company?: string;
  resignation_date?: Date;
  last_working_date?: Date;
  reason_for_leaving?: string;
  reference_check_status?: 'pending' | 'cleared' | 'failed';
  background_verification_status?: 'pending' | 'cleared' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface StaffInput {
  user_id: number;
  employee_id?: string;
  designation?: string;
  department?: string;
  branch_id?: number;
  joining_date?: Date;
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'temporary';
  reporting_manager_id?: number;
  work_mode?: 'onsite' | 'remote' | 'hybrid';
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  tax_identification_number?: string;
  base_salary?: number;
  pay_grade?: string;
  pension_insurance_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  current_address_id?: number;
  permanent_address_id?: number;
  company_assets?: any; // JSON field
  primary_skills?: string;
  education_certifications?: any; // JSON field
  employee_photo?: string;
  probation_end_date?: Date;
  contract_end_date?: Date;
  weekly_working_hours?: number;
  overtime_eligibility?: boolean;
  medical_insurance_id?: string;
  provident_fund_id?: string;
  gratuity_applicable?: boolean;
  notice_period_days?: number;
  work_email?: string;
  personal_email?: string;
  phone_number?: string;
  alternate_phone_number?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  blood_group?: string;
  allergies?: string;
  special_medical_notes?: string;
  highest_qualification?: string;
  university_school?: string;
  year_of_graduation?: number;
  professional_certifications?: string;
  certifications_json?: any; // JSON field
  languages_known?: any; // JSON field
  notice_period_start_date?: Date;
  notice_period_end_date?: Date;
  relieving_date?: Date;
  experience_years?: number;
  previous_company?: string;
  resignation_date?: Date;
  last_working_date?: Date;
  reason_for_leaving?: string;
  reference_check_status?: 'pending' | 'cleared' | 'failed';
  background_verification_status?: 'pending' | 'cleared' | 'failed';
}

export interface StaffUpdate {
  employee_id?: string;
  designation?: string;
  department?: string;
  branch_id?: number;
  joining_date?: Date;
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'temporary';
  status?: 'active' | 'inactive' | 'terminated' | 'on_leave';
  reporting_manager_id?: number;
  work_mode?: 'onsite' | 'remote' | 'hybrid';
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  tax_identification_number?: string;
  base_salary?: number;
  pay_grade?: string;
  pension_insurance_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  current_address_id?: number;
  permanent_address_id?: number;
  company_assets?: any; // JSON field
  primary_skills?: string;
  education_certifications?: any; // JSON field
  employee_photo?: string;
  probation_end_date?: Date;
  contract_end_date?: Date;
  weekly_working_hours?: number;
  overtime_eligibility?: boolean;
  medical_insurance_id?: string;
  provident_fund_id?: string;
  gratuity_applicable?: boolean;
  notice_period_days?: number;
  work_email?: string;
  personal_email?: string;
  phone_number?: string;
  alternate_phone_number?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  blood_group?: string;
  allergies?: string;
  special_medical_notes?: string;
  highest_qualification?: string;
  university_school?: string;
  year_of_graduation?: number;
  professional_certifications?: string;
  certifications_json?: any; // JSON field
  languages_known?: any; // JSON field
  notice_period_start_date?: Date;
  notice_period_end_date?: Date;
  relieving_date?: Date;
  experience_years?: number;
  previous_company?: string;
  resignation_date?: Date;
  last_working_date?: Date;
  reason_for_leaving?: string;
  reference_check_status?: 'pending' | 'cleared' | 'failed';
  background_verification_status?: 'pending' | 'cleared' | 'failed';
}

class StaffModel {
  static tableName = 'staff';

  static async findAll(limit: number = 20, offset: number = 0, branchId?: number): Promise<{staff: Staff[], totalCount: number}> {
    let query = `SELECT s.*, u.full_name, u.email
                 FROM ${this.tableName} s
                 LEFT JOIN users u ON s.user_id = u.id`;
    const params: any[] = [];

    if (branchId) {
      query += ' WHERE s.branch_id = ?';
      params.push(branchId);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} s`;
    const countParams: any[] = [];

    if (branchId) {
      countQuery += ' WHERE s.branch_id = ?';
      countParams.push(branchId);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = (countResult as any)[0].count;

    return {
      staff: rows as Staff[],
      totalCount
    };
  }

  // Enhanced method with additional filtering
  static async findAllWithFilters(
    limit: number = 20,
    offset: number = 0,
    branchId?: number,
    department?: string,
    status?: string
  ): Promise<{staff: Staff[], totalCount: number}> {
    let query = `SELECT s.*, u.full_name, u.email
                 FROM ${this.tableName} s
                 LEFT JOIN users u ON s.user_id = u.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (branchId) {
      conditions.push('s.branch_id = ?');
      params.push(branchId);
    }

    if (department) {
      conditions.push('s.department = ?');
      params.push(department);
    }

    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count with same filters
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} s`;

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const [countResult] = await pool.execute(countQuery, params.slice(0, conditions.length));
    const totalCount = (countResult as any)[0].count;

    return {
      staff: rows as Staff[],
      totalCount
    };
  }

  static async findById(id: number): Promise<Staff | null> {
    const [rows] = await pool.execute(
      `SELECT s.*, u.full_name, u.email
       FROM ${this.tableName} s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );
    return (rows as Staff[])[0] || null;
  }

  static async findByUserId(userId: number): Promise<Staff | null> {
    const [rows] = await pool.execute(
      `SELECT s.*, u.full_name, u.email
       FROM ${this.tableName} s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ?`,
      [userId]
    );
    return (rows as Staff[])[0] || null;
  }

  static async findByEmployeeId(employeeId: string): Promise<Staff | null> {
    const [rows] = await pool.execute(
      `SELECT s.*, u.full_name, u.email
       FROM ${this.tableName} s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.employee_id = ?`,
      [employeeId]
    );
    return (rows as Staff[])[0] || null;
  }

  static async create(staffData: StaffInput): Promise<Staff> {
    const [result]: any = await pool.execute(
      `INSERT INTO ${this.tableName} (
        user_id, employee_id, designation, department, branch_id, joining_date, employment_type,
        reporting_manager_id, work_mode, bank_name, bank_account_number, bank_ifsc_code,
        tax_identification_number, base_salary, pay_grade, pension_insurance_id,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        date_of_birth, gender, current_address_id, permanent_address_id, company_assets,
        primary_skills, education_certifications, employee_photo, probation_end_date,
        contract_end_date, weekly_working_hours, overtime_eligibility, medical_insurance_id,
        provident_fund_id, gratuity_applicable, notice_period_days, work_email, personal_email,
        phone_number, alternate_phone_number, marital_status, blood_group, allergies,
        special_medical_notes, highest_qualification, university_school, year_of_graduation,
        professional_certifications, certifications_json, languages_known, notice_period_start_date,
        notice_period_end_date, relieving_date, experience_years, previous_company,
        resignation_date, last_working_date, reason_for_leaving, reference_check_status,
        background_verification_status
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffData.user_id,
        staffData.employee_id,
        staffData.designation,
        staffData.department,
        staffData.branch_id,
        staffData.joining_date,
        staffData.employment_type || 'full_time',
        staffData.reporting_manager_id,
        staffData.work_mode,
        staffData.bank_name,
        staffData.bank_account_number,
        staffData.bank_ifsc_code,
        staffData.tax_identification_number,
        staffData.base_salary,
        staffData.pay_grade,
        staffData.pension_insurance_id,
        staffData.emergency_contact_name,
        staffData.emergency_contact_phone,
        staffData.emergency_contact_relationship,
        staffData.date_of_birth,
        staffData.gender,
        staffData.current_address_id,
        staffData.permanent_address_id,
        staffData.company_assets ? JSON.stringify(staffData.company_assets) : null,
        staffData.primary_skills,
        staffData.education_certifications ? JSON.stringify(staffData.education_certifications) : null,
        staffData.employee_photo,
        staffData.probation_end_date,
        staffData.contract_end_date,
        staffData.weekly_working_hours,
        staffData.overtime_eligibility,
        staffData.medical_insurance_id,
        staffData.provident_fund_id,
        staffData.gratuity_applicable,
        staffData.notice_period_days,
        staffData.work_email,
        staffData.personal_email,
        staffData.phone_number,
        staffData.alternate_phone_number,
        staffData.marital_status,
        staffData.blood_group,
        staffData.allergies,
        staffData.special_medical_notes,
        staffData.highest_qualification,
        staffData.university_school,
        staffData.year_of_graduation,
        staffData.professional_certifications,
        staffData.certifications_json ? JSON.stringify(staffData.certifications_json) : null,
        staffData.languages_known ? JSON.stringify(staffData.languages_known) : null,
        staffData.notice_period_start_date,
        staffData.notice_period_end_date,
        staffData.relieving_date,
        staffData.experience_years,
        staffData.previous_company,
        staffData.resignation_date,
        staffData.last_working_date,
        staffData.reason_for_leaving,
        staffData.reference_check_status,
        staffData.background_verification_status
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create staff');
    }

    return createdItem;
  }

  static async update(id: number, staffData: StaffUpdate): Promise<Staff | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (staffData.employee_id !== undefined) {
      updates.push('employee_id = ?');
      values.push(staffData.employee_id);
    }

    if (staffData.designation !== undefined) {
      updates.push('designation = ?');
      values.push(staffData.designation);
    }

    if (staffData.department !== undefined) {
      updates.push('department = ?');
      values.push(staffData.department);
    }

    if (staffData.branch_id !== undefined) {
      updates.push('branch_id = ?');
      values.push(staffData.branch_id);
    }

    if (staffData.joining_date !== undefined) {
      updates.push('joining_date = ?');
      values.push(staffData.joining_date);
    }

    if (staffData.employment_type !== undefined) {
      updates.push('employment_type = ?');
      values.push(staffData.employment_type);
    }

    if (staffData.status !== undefined) {
      updates.push('status = ?');
      values.push(staffData.status);
    }

    if (staffData.reporting_manager_id !== undefined) {
      updates.push('reporting_manager_id = ?');
      values.push(staffData.reporting_manager_id);
    }

    if (staffData.work_mode !== undefined) {
      updates.push('work_mode = ?');
      values.push(staffData.work_mode);
    }

    if (staffData.bank_name !== undefined) {
      updates.push('bank_name = ?');
      values.push(staffData.bank_name);
    }

    if (staffData.bank_account_number !== undefined) {
      updates.push('bank_account_number = ?');
      values.push(staffData.bank_account_number);
    }

    if (staffData.bank_ifsc_code !== undefined) {
      updates.push('bank_ifsc_code = ?');
      values.push(staffData.bank_ifsc_code);
    }

    if (staffData.tax_identification_number !== undefined) {
      updates.push('tax_identification_number = ?');
      values.push(staffData.tax_identification_number);
    }

    if (staffData.base_salary !== undefined) {
      updates.push('base_salary = ?');
      values.push(staffData.base_salary);
    }

    if (staffData.pay_grade !== undefined) {
      updates.push('pay_grade = ?');
      values.push(staffData.pay_grade);
    }

    if (staffData.pension_insurance_id !== undefined) {
      updates.push('pension_insurance_id = ?');
      values.push(staffData.pension_insurance_id);
    }

    if (staffData.emergency_contact_name !== undefined) {
      updates.push('emergency_contact_name = ?');
      values.push(staffData.emergency_contact_name);
    }

    if (staffData.emergency_contact_phone !== undefined) {
      updates.push('emergency_contact_phone = ?');
      values.push(staffData.emergency_contact_phone);
    }

    if (staffData.emergency_contact_relationship !== undefined) {
      updates.push('emergency_contact_relationship = ?');
      values.push(staffData.emergency_contact_relationship);
    }

    if (staffData.date_of_birth !== undefined) {
      updates.push('date_of_birth = ?');
      values.push(staffData.date_of_birth);
    }

    if (staffData.gender !== undefined) {
      updates.push('gender = ?');
      values.push(staffData.gender);
    }

    if (staffData.current_address_id !== undefined) {
      updates.push('current_address_id = ?');
      values.push(staffData.current_address_id);
    }

    if (staffData.permanent_address_id !== undefined) {
      updates.push('permanent_address_id = ?');
      values.push(staffData.permanent_address_id);
    }

    if (staffData.company_assets !== undefined) {
      updates.push('company_assets = ?');
      values.push(staffData.company_assets ? JSON.stringify(staffData.company_assets) : null);
    }

    if (staffData.primary_skills !== undefined) {
      updates.push('primary_skills = ?');
      values.push(staffData.primary_skills);
    }

    if (staffData.education_certifications !== undefined) {
      updates.push('education_certifications = ?');
      values.push(staffData.education_certifications ? JSON.stringify(staffData.education_certifications) : null);
    }

    if (staffData.employee_photo !== undefined) {
      updates.push('employee_photo = ?');
      values.push(staffData.employee_photo);
    }

    if (staffData.probation_end_date !== undefined) {
      updates.push('probation_end_date = ?');
      values.push(staffData.probation_end_date);
    }

    if (staffData.contract_end_date !== undefined) {
      updates.push('contract_end_date = ?');
      values.push(staffData.contract_end_date);
    }

    if (staffData.weekly_working_hours !== undefined) {
      updates.push('weekly_working_hours = ?');
      values.push(staffData.weekly_working_hours);
    }

    if (staffData.overtime_eligibility !== undefined) {
      updates.push('overtime_eligibility = ?');
      values.push(staffData.overtime_eligibility);
    }

    if (staffData.medical_insurance_id !== undefined) {
      updates.push('medical_insurance_id = ?');
      values.push(staffData.medical_insurance_id);
    }

    if (staffData.provident_fund_id !== undefined) {
      updates.push('provident_fund_id = ?');
      values.push(staffData.provident_fund_id);
    }

    if (staffData.gratuity_applicable !== undefined) {
      updates.push('gratuity_applicable = ?');
      values.push(staffData.gratuity_applicable);
    }

    if (staffData.notice_period_days !== undefined) {
      updates.push('notice_period_days = ?');
      values.push(staffData.notice_period_days);
    }

    if (staffData.work_email !== undefined) {
      updates.push('work_email = ?');
      values.push(staffData.work_email);
    }

    if (staffData.personal_email !== undefined) {
      updates.push('personal_email = ?');
      values.push(staffData.personal_email);
    }

    if (staffData.phone_number !== undefined) {
      updates.push('phone_number = ?');
      values.push(staffData.phone_number);
    }

    if (staffData.alternate_phone_number !== undefined) {
      updates.push('alternate_phone_number = ?');
      values.push(staffData.alternate_phone_number);
    }

    if (staffData.marital_status !== undefined) {
      updates.push('marital_status = ?');
      values.push(staffData.marital_status);
    }

    if (staffData.blood_group !== undefined) {
      updates.push('blood_group = ?');
      values.push(staffData.blood_group);
    }

    if (staffData.allergies !== undefined) {
      updates.push('allergies = ?');
      values.push(staffData.allergies);
    }

    if (staffData.special_medical_notes !== undefined) {
      updates.push('special_medical_notes = ?');
      values.push(staffData.special_medical_notes);
    }

    if (staffData.highest_qualification !== undefined) {
      updates.push('highest_qualification = ?');
      values.push(staffData.highest_qualification);
    }

    if (staffData.university_school !== undefined) {
      updates.push('university_school = ?');
      values.push(staffData.university_school);
    }

    if (staffData.year_of_graduation !== undefined) {
      updates.push('year_of_graduation = ?');
      values.push(staffData.year_of_graduation);
    }

    if (staffData.professional_certifications !== undefined) {
      updates.push('professional_certifications = ?');
      values.push(staffData.professional_certifications);
    }

    if (staffData.certifications_json !== undefined) {
      updates.push('certifications_json = ?');
      values.push(staffData.certifications_json ? JSON.stringify(staffData.certifications_json) : null);
    }

    if (staffData.languages_known !== undefined) {
      updates.push('languages_known = ?');
      values.push(staffData.languages_known ? JSON.stringify(staffData.languages_known) : null);
    }

    if (staffData.notice_period_start_date !== undefined) {
      updates.push('notice_period_start_date = ?');
      values.push(staffData.notice_period_start_date);
    }

    if (staffData.notice_period_end_date !== undefined) {
      updates.push('notice_period_end_date = ?');
      values.push(staffData.notice_period_end_date);
    }

    if (staffData.relieving_date !== undefined) {
      updates.push('relieving_date = ?');
      values.push(staffData.relieving_date);
    }

    if (staffData.experience_years !== undefined) {
      updates.push('experience_years = ?');
      values.push(staffData.experience_years);
    }

    if (staffData.previous_company !== undefined) {
      updates.push('previous_company = ?');
      values.push(staffData.previous_company);
    }

    if (staffData.resignation_date !== undefined) {
      updates.push('resignation_date = ?');
      values.push(staffData.resignation_date);
    }

    if (staffData.last_working_date !== undefined) {
      updates.push('last_working_date = ?');
      values.push(staffData.last_working_date);
    }

    if (staffData.reason_for_leaving !== undefined) {
      updates.push('reason_for_leaving = ?');
      values.push(staffData.reason_for_leaving);
    }

    if (staffData.reference_check_status !== undefined) {
      updates.push('reference_check_status = ?');
      values.push(staffData.reference_check_status);
    }

    if (staffData.background_verification_status !== undefined) {
      updates.push('background_verification_status = ?');
      values.push(staffData.background_verification_status);
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
      `UPDATE ${this.tableName} SET status = 'terminated' WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Soft delete - deactivate staff
  static async deactivate(id: number): Promise<boolean> {
    const result: any = await pool.execute(
      `UPDATE ${this.tableName} SET status = 'inactive' WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Get staff by department
  static async findByDepartment(department: string, branchId?: number): Promise<Staff[]> {
    let query = `SELECT s.*, u.full_name, u.email
                 FROM ${this.tableName} s
                 LEFT JOIN users u ON s.user_id = u.id
                 WHERE s.department = ?`;
    const params = [department];

    if (branchId) {
      query += ' AND s.branch_id = ?';
      params.push(branchId.toString());
    }

    const [rows] = await pool.execute(query, params);
    return rows as Staff[];
  }

  // Get staff by branch
  static async findByBranch(branchId: number): Promise<Staff[]> {
    const [rows] = await pool.execute(
      `SELECT s.*, u.full_name, u.email
       FROM ${this.tableName} s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.branch_id = ?`,
      [branchId.toString()]
    );
    return rows as Staff[];
  }
}

export default StaffModel;