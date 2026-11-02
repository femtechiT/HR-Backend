import { pool } from '../config/database';

export interface Staff {
  id: number;
  user_id: number;
  full_name: string;  // Added from joined user table
  email: string;      // Added from joined user table
  phone?: string;     // Added from joined user table
  must_change_password?: boolean | number; // Added from joined user table
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
  nationality?: string;
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
  religion?: string;
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
  // Location assignment fields (Migration 084)
  assigned_location_id?: number;
  location_assignments?: any; // JSON: {primary_location: number, secondary_locations: number[]}
  location_notes?: string;
  // Soft delete (Migration 126) — orthogonal to `status`
  deleted_at?: Date | null;
  deleted_by?: number | null;
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
  nationality?: string;
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
  religion?: string;
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
  // Location assignment fields (Migration 084)
  assigned_location_id?: number;
  location_assignments?: any; // JSON: {primary_location: number, secondary_locations: number[]}
  location_notes?: string;
  state_of_origin?: string;
  lga?: string;
  course_of_study?: string;
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
  nationality?: string;
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
  religion?: string;
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
  // Location assignment fields (Migration 084)
  assigned_location_id?: number;
  location_assignments?: any;
  location_notes?: string;
  // Branch name from join (not stored in staff table)
  branch_name?: string;
  // Additional fields
  state_of_origin?: string;
  lga?: string;
  course_of_study?: string;
}

class StaffModel {
  static tableName = 'staff';

  static async findAll(limit: number = 20, offset: number = 0, branchId?: number, status?: string, department?: string, search?: string): Promise<{staff: Staff[], totalCount: number}> {
    // Delegate to findAllWithFilters for consistency
    return this.findAllWithFilters(limit, offset, branchId, department, status, search);
  }

  // Enhanced method with additional filtering
  static async findAllWithFilters(
    limit: number = 20,
    offset: number = 0,
    branchId?: number,
    department?: string,
    status?: string,
    search?: string
  ): Promise<{staff: Staff[], totalCount: number}> {
    let query = `SELECT s.*, u.full_name, u.email, u.phone, u.must_change_password, b.name as branch_name
                 FROM ${this.tableName} s
                 LEFT JOIN users u ON s.user_id = u.id
                 LEFT JOIN branches b ON s.branch_id = b.id`;
    const params: any[] = [];
    // Soft-deleted staff never appear through this method, regardless of the
    // `status` filter — this model is never used by the User Management
    // screen (that goes through UserModel, the one place deleted rows can
    // surface), so every other staff list/picker in the system is covered
    // by excluding them here, once, at the source.
    const conditions: string[] = ['s.deleted_at IS NULL'];

    if (branchId) {
      conditions.push('s.branch_id = ?');
      params.push(branchId);
    }

    if (department) {
      conditions.push('s.department = ?');
      params.push(department);
    }

    if (status && status !== 'all') {
      conditions.push('s.status = ?');
      params.push(status);
    } else if (!status) {
      // No explicit status requested — deactivated/terminated staff shouldn't
      // appear in ordinary staff lists and pickers by default (attendance
      // filters, assignment dropdowns, etc). Pass status: 'all' explicitly
      // to opt into seeing everyone, e.g. the admin staff directory's "All" tab.
      conditions.push("s.status NOT IN ('inactive', 'terminated')");
    }

    if (search) {
      conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR s.employee_id LIKE ? OR s.designation LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    // Get total count with same filters (without limit/offset)
    let countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} s LEFT JOIN users u ON s.user_id = u.id`;
    const countParams: any[] = [];

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      // Add only the condition params (not limit/offset)
      if (branchId) countParams.push(branchId);
      if (department) countParams.push(department);
      if (status && status !== 'all') countParams.push(status);
      if (search) {
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalCount = (countResult as any)[0].count;

    return {
      staff: rows as Staff[],
      totalCount
    };
  }

  static async findById(id: number): Promise<Staff | null> {
    const [rows] = await pool.execute(
      `SELECT s.*, u.full_name, u.email, u.phone, u.must_change_password, b.name as branch_name
       FROM ${this.tableName} s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE s.id = ?`,
      [id]
    );
    return (rows as any)[0] || null;
  }

  static async findByUserId(userId: number): Promise<Staff | null> {
    const [rows] = await pool.execute(
      `SELECT s.*, u.full_name, u.email, u.phone, u.must_change_password, b.name as branch_name
       FROM ${this.tableName} s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE s.user_id = ?
       ORDER BY s.updated_at DESC, s.created_at DESC, s.id DESC
       LIMIT 1`,
      [userId]
    );
    return (rows as any)[0] || null;
  }

  static async findByEmployeeId(employeeId: string): Promise<Staff | null> {
    const [rows] = await pool.execute(
      `SELECT s.*, u.full_name, u.email, u.phone, u.must_change_password
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
        date_of_birth, nationality, gender, current_address_id, permanent_address_id, company_assets,
        primary_skills, education_certifications, employee_photo, probation_end_date,
        contract_end_date, weekly_working_hours, overtime_eligibility, medical_insurance_id,
        provident_fund_id, gratuity_applicable, notice_period_days, work_email, personal_email,
        phone_number, alternate_phone_number, marital_status, blood_group, religion, allergies,
        special_medical_notes, highest_qualification, university_school, year_of_graduation,
        professional_certifications, certifications_json, languages_known, notice_period_start_date,
        notice_period_end_date, relieving_date, experience_years, previous_company,
        resignation_date, last_working_date, reason_for_leaving, reference_check_status,
        background_verification_status, state_of_origin, lga, course_of_study
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        staffData.nationality,
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
        staffData.religion,
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
        staffData.background_verification_status,
        staffData.state_of_origin,
        staffData.lga,
        staffData.course_of_study
      ]
    );

    const insertedId = result.insertId;
    const createdItem = await this.findById(insertedId);

    if (!createdItem) {
      throw new Error('Failed to create staff');
    }

    return createdItem;
  }

  static async update(id: number, staffData: StaffUpdate, connection?: any): Promise<Staff | null> {
    const db = connection || pool;
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

      // Deactivating/terminating a staff member IS how they're recorded as
      // resigned — the admin doesn't fill out a separate resignation form,
      // the deactivation date becomes the resignation date automatically.
      if ((staffData.status === 'inactive' || staffData.status === 'terminated') && staffData.resignation_date === undefined) {
        const today = new Date().toISOString().split('T')[0];
        updates.push('resignation_date = ?', 'last_working_date = ?');
        values.push(today, today);
      }
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

    if (staffData.nationality !== undefined) {
      updates.push('nationality = ?');
      values.push(staffData.nationality);
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

    if (staffData.religion !== undefined) {
      updates.push('religion = ?');
      values.push(staffData.religion);
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

    if (staffData.state_of_origin !== undefined) {
      updates.push('state_of_origin = ?');
      values.push(staffData.state_of_origin);
    }

    if (staffData.lga !== undefined) {
      updates.push('lga = ?');
      values.push(staffData.lga);
    }

    if (staffData.course_of_study !== undefined) {
      updates.push('course_of_study = ?');
      values.push(staffData.course_of_study);
    }

    console.log('[StaffModel] Update called for ID:', id);
    console.log('[StaffModel] Number of fields to update:', updates.length);
    console.log('[StaffModel] Updates:', updates.join(', '));
    console.log('[StaffModel] Values:', values);

    if (updates.length === 0) {
      console.log('[StaffModel] No fields to update, returning current data');
      return await this.findById(id);
    }

    values.push(id);

    const sql = `UPDATE ${this.tableName} SET ${updates.join(', ')} WHERE id = ?`;
    console.log('[StaffModel] Executing SQL:', sql);
    
    await db.execute(sql, values);

    console.log('[StaffModel] Update completed, fetching updated record...');
    return await this.findById(id);
  }

  static async delete(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    // Termination IS the resignation record — today becomes the resignation
    // and last working date, no separate form to fill out.
    const today = new Date().toISOString().split('T')[0];
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET status = 'terminated', resignation_date = ?, last_working_date = ? WHERE id = ?`,
      [today, today, id]
    );

    return result.affectedRows > 0;
  }

  // Soft delete - deactivate staff
  static async deactivate(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    // Deactivation IS the resignation record — today becomes the resignation
    // and last working date, no separate form to fill out.
    const today = new Date().toISOString().split('T')[0];
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET status = 'inactive', resignation_date = ?, last_working_date = ? WHERE id = ?`,
      [today, today, id]
    );

    return result.affectedRows > 0;
  }

  // Reactivate a deactivated/terminated staff member — clears the
  // resignation record that was auto-stamped on deactivation, since they're
  // no longer resigned.
  static async reactivate(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET status = 'active', resignation_date = NULL, last_working_date = NULL WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Real soft-delete (Migration 126) — distinct from deactivate()/delete()
  // above, which only flip `status`. This hides the record from every staff
  // list/picker in the system (findAllWithFilters excludes deleted_at IS NOT
  // NULL unconditionally) while leaving the row and its history intact.
  // Forcing status to 'inactive' here means the existing login gate
  // (`status !== 'active'`) also blocks a deleted account automatically.
  static async markAsDeleted(id: number, deletedBy: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    const result: any = await db.execute(
      `UPDATE ${this.tableName}
       SET deleted_at = NOW(), deleted_by = ?, status = IF(status = 'active', 'inactive', status)
       WHERE id = ?`,
      [deletedBy, id]
    );

    return result.affectedRows > 0;
  }

  // Undo markAsDeleted. Leaves `status` as whatever it was left at (inactive,
  // terminated, etc) — restoring visibility isn't the same as reactivating
  // employment, those are separate admin actions.
  static async restore(id: number, connection?: any): Promise<boolean> {
    const db = connection || pool;
    const result: any = await db.execute(
      `UPDATE ${this.tableName} SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }

  // Get staff by department
  static async findByDepartment(department: string, branchId?: number): Promise<Staff[]> {
    let query = `SELECT s.*, u.full_name, u.email
                 FROM ${this.tableName} s
                 LEFT JOIN users u ON s.user_id = u.id
                 WHERE s.department = ? AND s.deleted_at IS NULL AND s.status NOT IN ('inactive', 'terminated')`;
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
       WHERE s.branch_id = ? AND s.deleted_at IS NULL AND s.status NOT IN ('inactive', 'terminated')`,
      [branchId.toString()]
    );
    return rows as Staff[];
  }
}

export default StaffModel;
