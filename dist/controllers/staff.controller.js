"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setStaffDynamicValues = exports.getStaffDynamicValues = exports.deleteDynamicField = exports.updateDynamicField = exports.createDynamicField = exports.getDynamicFields = exports.getCurrentUserStaffDetails = exports.getStaffByDepartment = exports.terminateStaff = exports.deleteStaff = exports.updateStaff = exports.createStaff = exports.getStaffById = exports.getAllStaff = void 0;
const type_utils_1 = require("../utils/type-utils");
const staff_model_1 = __importDefault(require("../models/staff.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const audit_log_model_1 = __importDefault(require("../models/audit-log.model"));
const cpanel_email_service_1 = __importDefault(require("../services/cpanel-email.service"));
const staff_dynamic_field_model_1 = __importDefault(require("../models/staff-dynamic-field.model"));
const getAllStaff = async (req, res) => {
    try {
        const page = (0, type_utils_1.getNumberQueryParam)(req, 'page', 1) || 1;
        const limit = (0, type_utils_1.getNumberQueryParam)(req, 'limit', 20) || 20;
        const branchId = req.query.branchId ? (0, type_utils_1.getNumberQueryParam)(req, 'branchId') : undefined;
        const status = req.query.status;
        const department = req.query.department;
        const search = req.query.search;
        const offset = (page - 1) * limit;
        const { staff, totalCount } = await staff_model_1.default.findAll(limit, offset, branchId, status, department, search);
        return res.json({
            success: true,
            message: 'Staff retrieved successfully',
            data: {
                staff,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            }
        });
    }
    catch (error) {
        console.error('Get all staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllStaff = getAllStaff;
const getStaffById = async (req, res) => {
    try {
        let staffId;
        if (req.numericId !== undefined) {
            staffId = req.numericId;
        }
        else {
            const { id } = req.params;
            const staffIdStr = Array.isArray(id) ? id[0] : id;
            staffId = parseInt(staffIdStr);
            if (isNaN(staffId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid staff ID'
                });
            }
        }
        console.log('[Backend] getStaffById called with ID:', staffId);
        console.log('[Backend] Current user ID:', req.currentUser?.id);
        let staff = await staff_model_1.default.findById(staffId);
        if (!staff && req.currentUser?.id === staffId) {
            console.log('[Backend] Staff not found by ID, trying to find by user_id:', staffId);
            staff = await staff_model_1.default.findByUserId(staffId);
        }
        if (!staff) {
            console.log('[Backend] Staff not found');
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }
        console.log('[Backend] Found staff:', staff.id, 'for user:', staff.user_id);
        const user = await user_model_1.default.findById(staff.user_id);
        const { pool } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const [addresses] = await pool.execute('SELECT address_type, street_address FROM staff_addresses WHERE staff_id = ?', [staff.id]);
        const currentAddr = addresses.find((a) => a.address_type === 'current');
        const permAddr = addresses.find((a) => a.address_type === 'permanent');
        const staffWithProfile = {
            ...staff,
            profile_picture: user?.profile_picture || null,
            current_address: currentAddr?.street_address || '',
            permanent_address: permAddr?.street_address || ''
        };
        return res.json({
            success: true,
            message: 'Staff retrieved successfully',
            data: { staff: staffWithProfile }
        });
    }
    catch (error) {
        console.error('Get staff by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStaffById = getStaffById;
const createStaff = async (req, res) => {
    try {
        const { user_id, employee_id, designation, department, branch_id, joining_date, employment_type, reporting_manager_id, work_mode, bank_name, bank_account_number, bank_ifsc_code, tax_identification_number, base_salary, pay_grade, pension_insurance_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, date_of_birth, gender, current_address, permanent_address, company_assets, primary_skills, education_certifications, employee_photo, probation_end_date, contract_end_date, weekly_working_hours, overtime_eligibility, medical_insurance_id, provident_fund_id, gratuity_applicable, notice_period_days, work_email, personal_email, phone_number, alternate_phone_number, marital_status, blood_group, allergies, special_medical_notes, highest_qualification, university_school, year_of_graduation, professional_certifications, certifications_json, languages_known, notice_period_start_date, notice_period_end_date, relieving_date, experience_years, previous_company, resignation_date, last_working_date, reason_for_leaving, reference_check_status, background_verification_status } = req.body;
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        const user = await user_model_1.default.findById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const existingStaff = await staff_model_1.default.findByUserId(user_id);
        if (existingStaff) {
            return res.status(409).json({
                success: false,
                message: 'Staff record already exists for this user'
            });
        }
        const { pool } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const [lastEmployee] = await pool.execute('SELECT employee_id FROM staff WHERE employee_id LIKE ? ORDER BY id DESC LIMIT 1', ['EMP%']);
        let nextEmployeeNumber = 1;
        if (lastEmployee.length > 0 && lastEmployee[0].employee_id) {
            const lastNumber = parseInt(lastEmployee[0].employee_id.replace('EMP', ''));
            if (!isNaN(lastNumber)) {
                nextEmployeeNumber = lastNumber + 1;
            }
        }
        const autoGeneratedEmployeeId = `EMP${String(nextEmployeeNumber).padStart(4, '0')}`;
        console.log('[Backend] Auto-generated employee_id:', autoGeneratedEmployeeId);
        const staffData = {
            user_id,
            employee_id: autoGeneratedEmployeeId,
            designation,
            department,
            branch_id,
            joining_date: joining_date ? new Date(joining_date) : undefined,
            employment_type: employment_type || 'full_time',
            reporting_manager_id,
            work_mode,
            bank_name,
            bank_account_number,
            bank_ifsc_code,
            tax_identification_number,
            base_salary,
            pay_grade,
            pension_insurance_id,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
            gender,
            current_address_id,
            permanent_address_id,
            company_assets,
            primary_skills,
            education_certifications,
            employee_photo,
            probation_end_date: probation_end_date ? new Date(probation_end_date) : undefined,
            contract_end_date: contract_end_date ? new Date(contract_end_date) : undefined,
            weekly_working_hours,
            overtime_eligibility,
            medical_insurance_id,
            provident_fund_id,
            gratuity_applicable,
            notice_period_days,
            work_email,
            personal_email,
            phone_number,
            alternate_phone_number,
            marital_status,
            blood_group,
            allergies,
            special_medical_notes,
            highest_qualification,
            university_school,
            year_of_graduation,
            professional_certifications,
            certifications_json,
            languages_known,
            notice_period_start_date: notice_period_start_date ? new Date(notice_period_start_date) : undefined,
            notice_period_end_date: notice_period_end_date ? new Date(notice_period_end_date) : undefined,
            relieving_date: relieving_date ? new Date(relieving_date) : undefined,
            experience_years,
            previous_company,
            resignation_date: resignation_date ? new Date(resignation_date) : undefined,
            last_working_date: last_working_date ? new Date(last_working_date) : undefined,
            reason_for_leaving,
            reference_check_status,
            background_verification_status
        };
        const newStaff = await staff_model_1.default.create(staffData);
        if (req.currentUser) {
            await audit_log_model_1.default.logStaffOperation(req.currentUser.id, 'staff.created', newStaff.id, null, newStaff, req.ip, req.get('User-Agent') || undefined);
        }
        return res.status(201).json({
            success: true,
            message: 'Staff created successfully',
            data: { staff: newStaff }
        });
    }
    catch (error) {
        console.error('Create staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createStaff = createStaff;
const updateStaff = async (req, res) => {
    try {
        console.log('========================================');
        console.log('[Backend] Update staff request received');
        console.log('========================================');
        console.log('[Backend] Staff ID param:', req.params.id);
        console.log('[Backend] Current user ID:', req.currentUser?.id);
        console.log('[Backend] Request body keys:', Object.keys(req.body));
        console.log('[Backend] Request body:', JSON.stringify(req.body, null, 2));
        const userId = req.currentUser?.id;
        if (!userId) {
            console.log('[Backend] ❌ User not authenticated');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        console.log('[Backend] ✅ User authenticated, userId:', userId);
        console.log('[Backend] Finding staff record by user_id:', userId);
        const existingStaff = await staff_model_1.default.findByUserId(userId);
        if (!existingStaff) {
            console.log('[Backend] ❌ Staff record not found for user_id:', userId);
            return res.status(404).json({
                success: false,
                message: 'Staff record not found. Please contact HR to complete your profile setup.'
            });
        }
        console.log('[Backend] ✅ Found staff record:', existingStaff.id, 'for user:', userId);
        console.log('[Backend] Existing staff data:', JSON.stringify(existingStaff, null, 2));
        const { employee_id, designation, department, branch_id, joining_date, employment_type, status, reporting_manager_id, work_mode, bank_name, bank_account_number, bank_ifsc_code, tax_identification_number, base_salary, pay_grade, pension_insurance_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, date_of_birth, gender, current_address, permanent_address, company_assets, primary_skills, education_certifications, employee_photo, probation_end_date, contract_end_date, weekly_working_hours, overtime_eligibility, medical_insurance_id, provident_fund_id, gratuity_applicable, notice_period_days, work_email, personal_email, phone_number, alternate_phone_number, marital_status, blood_group, allergies, special_medical_notes, highest_qualification, university_school, year_of_graduation, professional_certifications, certifications_json, languages_known, notice_period_start_date, notice_period_end_date, relieving_date, experience_years, previous_company, resignation_date, last_working_date, reason_for_leaving, reference_check_status, background_verification_status, state_of_origin, lga, course_of_study, first_name, last_name, middle_name } = req.body;
        if (employee_id !== undefined) {
            console.log('[Backend] ⚠️ employee_id field ignored - employee_id is auto-generated and cannot be changed');
        }
        const updateData = {};
        if (designation !== undefined)
            updateData.designation = designation;
        if (department !== undefined)
            updateData.department = department;
        if (branch_id !== undefined)
            updateData.branch_id = branch_id;
        if (joining_date !== undefined) {
            const joinDate = new Date(joining_date);
            if (!isNaN(joinDate.getTime())) {
                updateData.joining_date = joinDate;
            }
            else {
                console.error('[Backend] Invalid joining_date:', joining_date);
            }
        }
        if (employment_type !== undefined)
            updateData.employment_type = employment_type;
        if (status !== undefined)
            updateData.status = status;
        if (reporting_manager_id !== undefined)
            updateData.reporting_manager_id = reporting_manager_id;
        if (work_mode !== undefined)
            updateData.work_mode = work_mode;
        if (bank_name !== undefined)
            updateData.bank_name = bank_name;
        if (bank_account_number !== undefined)
            updateData.bank_account_number = bank_account_number;
        if (bank_ifsc_code !== undefined)
            updateData.bank_ifsc_code = bank_ifsc_code;
        if (tax_identification_number !== undefined)
            updateData.tax_identification_number = tax_identification_number;
        if (base_salary !== undefined)
            updateData.base_salary = base_salary;
        if (pay_grade !== undefined)
            updateData.pay_grade = pay_grade;
        if (pension_insurance_id !== undefined)
            updateData.pension_insurance_id = pension_insurance_id;
        if (emergency_contact_name !== undefined)
            updateData.emergency_contact_name = emergency_contact_name;
        if (emergency_contact_phone !== undefined)
            updateData.emergency_contact_phone = emergency_contact_phone;
        if (emergency_contact_relationship !== undefined)
            updateData.emergency_contact_relationship = emergency_contact_relationship;
        if (date_of_birth !== undefined) {
            const dobDate = new Date(date_of_birth);
            if (!isNaN(dobDate.getTime())) {
                updateData.date_of_birth = dobDate;
            }
            else {
                console.error('[Backend] Invalid date_of_birth:', date_of_birth);
            }
        }
        if (gender !== undefined)
            updateData.gender = gender;
        if (company_assets !== undefined)
            updateData.company_assets = company_assets;
        if (primary_skills !== undefined)
            updateData.primary_skills = primary_skills;
        if (education_certifications !== undefined)
            updateData.education_certifications = education_certifications;
        if (employee_photo !== undefined)
            updateData.employee_photo = employee_photo;
        if (probation_end_date !== undefined) {
            const probDate = new Date(probation_end_date);
            if (!isNaN(probDate.getTime()))
                updateData.probation_end_date = probDate;
        }
        if (contract_end_date !== undefined) {
            const contractDate = new Date(contract_end_date);
            if (!isNaN(contractDate.getTime()))
                updateData.contract_end_date = contractDate;
        }
        if (weekly_working_hours !== undefined)
            updateData.weekly_working_hours = weekly_working_hours;
        if (overtime_eligibility !== undefined)
            updateData.overtime_eligibility = overtime_eligibility ? 1 : 0;
        if (medical_insurance_id !== undefined)
            updateData.medical_insurance_id = medical_insurance_id;
        if (provident_fund_id !== undefined)
            updateData.provident_fund_id = provident_fund_id;
        if (gratuity_applicable !== undefined)
            updateData.gratuity_applicable = gratuity_applicable ? 1 : 0;
        if (notice_period_days !== undefined)
            updateData.notice_period_days = notice_period_days;
        if (work_email !== undefined)
            updateData.work_email = work_email;
        if (personal_email !== undefined)
            updateData.personal_email = personal_email;
        if (phone_number !== undefined)
            updateData.phone_number = phone_number;
        if (alternate_phone_number !== undefined)
            updateData.alternate_phone_number = alternate_phone_number;
        if (marital_status !== undefined)
            updateData.marital_status = marital_status;
        if (blood_group !== undefined)
            updateData.blood_group = blood_group;
        if (allergies !== undefined)
            updateData.allergies = allergies;
        if (special_medical_notes !== undefined)
            updateData.special_medical_notes = special_medical_notes;
        if (highest_qualification !== undefined)
            updateData.highest_qualification = highest_qualification;
        if (university_school !== undefined)
            updateData.university_school = university_school;
        if (year_of_graduation !== undefined)
            updateData.year_of_graduation = year_of_graduation;
        if (course_of_study !== undefined && course_of_study !== '')
            updateData.course_of_study = course_of_study;
        if (professional_certifications !== undefined)
            updateData.professional_certifications = professional_certifications;
        if (certifications_json !== undefined)
            updateData.certifications_json = certifications_json;
        if (languages_known !== undefined)
            updateData.languages_known = languages_known;
        if (state_of_origin !== undefined)
            updateData.state_of_origin = state_of_origin;
        if (lga !== undefined)
            updateData.lga = lga;
        if (notice_period_start_date !== undefined)
            updateData.notice_period_start_date = new Date(notice_period_start_date);
        if (notice_period_end_date !== undefined)
            updateData.notice_period_end_date = new Date(notice_period_end_date);
        if (relieving_date !== undefined)
            updateData.relieving_date = new Date(relieving_date);
        if (experience_years !== undefined && experience_years !== '')
            updateData.experience_years = experience_years;
        if (previous_company !== undefined)
            updateData.previous_company = previous_company;
        if (resignation_date !== undefined)
            updateData.resignation_date = new Date(resignation_date);
        if (last_working_date !== undefined)
            updateData.last_working_date = new Date(last_working_date);
        if (reason_for_leaving !== undefined)
            updateData.reason_for_leaving = reason_for_leaving;
        if (reference_check_status !== undefined)
            updateData.reference_check_status = reference_check_status;
        if (background_verification_status !== undefined)
            updateData.background_verification_status = background_verification_status;
        console.log('[Backend] Prepared update data:', JSON.stringify(updateData, null, 2));
        console.log('[Backend] Update data keys:', Object.keys(updateData));
        const beforeUpdate = { ...existingStaff };
        console.log('[Backend] Calling StaffModel.update() with staffId:', existingStaff.id);
        console.log('[Backend] Update data:', JSON.stringify(updateData, null, 2));
        const updatedStaff = await staff_model_1.default.update(existingStaff.id, updateData);
        console.log('[Backend] ✅ StaffModel.update() succeeded');
        console.log('[Backend] Updated staff:', JSON.stringify(updatedStaff, null, 2));
        const { pool } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        if (first_name !== undefined || last_name !== undefined || middle_name !== undefined) {
            const [userRows] = await pool.execute('SELECT full_name FROM users WHERE id = ?', [userId]);
            const currentUser = userRows[0];
            if (currentUser) {
                const currentName = currentUser.full_name || '';
                const nameParts = currentName.split(' ');
                const newFirstName = first_name !== undefined ? first_name : (nameParts[0] || '');
                const newMiddleName = middle_name !== undefined ? middle_name : (nameParts.slice(1, -1).join(' ') || '');
                const newLastName = last_name !== undefined ? last_name : (nameParts[nameParts.length - 1] || '');
                const newFullName = [newFirstName, newMiddleName, newLastName].filter(Boolean).join(' ').trim();
                if (newFullName) {
                    await pool.execute('UPDATE users SET full_name = ? WHERE id = ?', [newFullName, userId]);
                    console.log('[Backend] ✅ Updated user full_name to:', newFullName);
                }
            }
        }
        if (personal_email !== undefined && personal_email) {
            await pool.execute('UPDATE users SET email = ? WHERE id = ?', [personal_email, userId]);
            console.log('[Backend] ✅ Updated user email to:', personal_email);
        }
        if (phone_number !== undefined && phone_number) {
            await pool.execute('UPDATE users SET phone = ? WHERE id = ?', [phone_number, userId]);
            console.log('[Backend] ✅ Updated user phone to:', phone_number);
        }
        if (current_address && current_address.trim() !== '') {
            try {
                const [currentAddresses] = await pool.execute('SELECT id FROM staff_addresses WHERE staff_id = ? AND address_type = "current"', [existingStaff.id]);
                if (currentAddresses.length > 0) {
                    await pool.execute('UPDATE staff_addresses SET street_address = ?, is_primary = FALSE WHERE id = ?', [current_address, currentAddresses[0].id]);
                    console.log('[Backend] ✅ Updated current address');
                }
                else {
                    await pool.execute('INSERT INTO staff_addresses (staff_id, address_type, street_address, is_primary) VALUES (?, "current", ?, FALSE)', [existingStaff.id, current_address]);
                    console.log('[Backend] ✅ Created current address');
                }
            }
            catch (addrError) {
                console.error('[Backend] Error handling current address:', addrError);
            }
        }
        if (permanent_address && permanent_address.trim() !== '') {
            try {
                const [permAddresses] = await pool.execute('SELECT id FROM staff_addresses WHERE staff_id = ? AND address_type = "permanent"', [existingStaff.id]);
                if (permAddresses.length > 0) {
                    await pool.execute('UPDATE staff_addresses SET street_address = ?, is_primary = TRUE WHERE id = ?', [permanent_address, permAddresses[0].id]);
                    console.log('[Backend] ✅ Updated permanent address');
                }
                else {
                    await pool.execute('INSERT INTO staff_addresses (staff_id, address_type, street_address, is_primary) VALUES (?, "permanent", ?, TRUE)', [existingStaff.id, permanent_address]);
                    console.log('[Backend] ✅ Created permanent address');
                }
            }
            catch (addrError) {
                console.error('[Backend] Error handling permanent address:', addrError);
            }
        }
        if (req.currentUser) {
            await audit_log_model_1.default.logStaffOperation(req.currentUser.id, 'staff.updated', existingStaff.id, beforeUpdate, updatedStaff, req.ip, req.get('User-Agent') || undefined);
        }
        const [completeUpdatedStaff] = await pool.execute(`
      SELECT 
        s.id,
        s.user_id,
        s.employee_id,
        s.designation,
        s.department,
        s.branch_id,
        s.joining_date,
        s.employment_type,
        s.status as staff_status,
        s.created_at,
        s.updated_at,
        u.full_name,
        u.email,
        u.phone,
        b.name as branch_name,
        r.name as role_name
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE s.user_id = ?
    `, [userId]);
        console.log('[Backend] ✅ Staff update completed successfully');
        console.log('[Backend] ✅ Complete updated staff:', completeUpdatedStaff[0]);
        return res.json({
            success: true,
            message: 'Staff updated successfully',
            data: {
                staff: completeUpdatedStaff[0] || updatedStaff
            }
        });
    }
    catch (error) {
        console.error('========================================');
        console.error('[Backend] ❌ Update staff error:', error);
        console.error('[Backend] Error message:', error.message);
        console.error('[Backend] Error stack:', error.stack);
        console.error('[Backend] Error code:', error.code);
        console.error('[Backend] Error errno:', error.errno);
        console.error('[Backend] Error SQL:', error.sql);
        console.error('========================================');
        return res.status(500).json({
            success: false,
            message: 'Internal server error: ' + error.message
        });
    }
};
exports.updateStaff = updateStaff;
const deleteStaff = async (req, res) => {
    try {
        let staffId;
        if (req.numericId !== undefined) {
            staffId = req.numericId;
        }
        else {
            const idParam = req.params.id;
            const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
            staffId = parseInt(typeof idStr === 'string' ? idStr : '');
            if (isNaN(staffId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid staff ID'
                });
            }
        }
        const existingStaff = await staff_model_1.default.findById(staffId);
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }
        const user = await user_model_1.default.findById(existingStaff.user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Associated user not found'
            });
        }
        const deactivated = await staff_model_1.default.deactivate(staffId);
        if (!deactivated) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }
        const updatedStaff = await staff_model_1.default.findById(staffId);
        if (req.currentUser) {
            await audit_log_model_1.default.logStaffOperation(req.currentUser.id, 'staff.deactivated', staffId, existingStaff, updatedStaff, req.ip, req.get('User-Agent') || undefined);
        }
        const emailParts = user.email.split('@');
        if (emailParts.length === 2) {
            const domain = emailParts[1];
            const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
            if (domain === companyDomain) {
                try {
                    const emailPrefix = emailParts[0];
                    const cpanelService = new cpanel_email_service_1.default();
                    const deletionResult = await cpanelService.deleteEmailAccount(emailPrefix);
                    if (deletionResult.success) {
                        console.log(`Email account ${user.email} removed from cPanel successfully`);
                    }
                    else {
                        console.error(`Failed to remove email account ${user.email} from cPanel:`, deletionResult.error);
                    }
                }
                catch (emailError) {
                    console.error('Error removing email account from cPanel:', emailError);
                }
            }
        }
        return res.json({
            success: true,
            message: 'Staff deactivated successfully and email account removed from cPanel if applicable'
        });
    }
    catch (error) {
        console.error('Deactivate staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteStaff = deleteStaff;
const terminateStaff = async (req, res) => {
    try {
        let staffId;
        if (req.numericId !== undefined) {
            staffId = req.numericId;
        }
        else {
            const idParam = req.params.id;
            const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
            staffId = parseInt(typeof idStr === 'string' ? idStr : '');
            if (isNaN(staffId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid staff ID'
                });
            }
        }
        const existingStaff = await staff_model_1.default.findById(staffId);
        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }
        const user = await user_model_1.default.findById(existingStaff.user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Associated user not found'
            });
        }
        const updatedStaff = await staff_model_1.default.update(staffId, { status: 'terminated' });
        if (!updatedStaff) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }
        if (req.currentUser) {
            await audit_log_model_1.default.logStaffOperation(req.currentUser.id, 'staff.terminated', staffId, existingStaff, updatedStaff, req.ip, req.get('User-Agent') || undefined);
        }
        const emailParts = user.email.split('@');
        if (emailParts.length === 2) {
            const domain = emailParts[1];
            const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
            if (domain === companyDomain) {
                try {
                    const emailPrefix = emailParts[0];
                    const cpanelService = new cpanel_email_service_1.default();
                    const deletionResult = await cpanelService.deleteEmailAccount(emailPrefix);
                    if (deletionResult.success) {
                        console.log(`Email account ${user.email} removed from cPanel successfully`);
                    }
                    else {
                        console.error(`Failed to remove email account ${user.email} from cPanel:`, deletionResult.error);
                    }
                }
                catch (emailError) {
                    console.error('Error removing email account from cPanel:', emailError);
                }
            }
        }
        return res.json({
            success: true,
            message: 'Staff terminated successfully and email account removed from cPanel if applicable'
        });
    }
    catch (error) {
        console.error('Terminate staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.terminateStaff = terminateStaff;
const getStaffByDepartment = async (req, res) => {
    try {
        const departmentParam = req.params.department;
        const department = Array.isArray(departmentParam) ? departmentParam[0] : departmentParam;
        const branchId = req.query.branchId ? (0, type_utils_1.getNumberQueryParam)(req, 'branchId') : undefined;
        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department is required'
            });
        }
        const staff = await staff_model_1.default.findByDepartment(department, branchId);
        return res.json({
            success: true,
            message: 'Staff retrieved successfully',
            data: { staff, department, branchId }
        });
    }
    catch (error) {
        console.error('Get staff by department error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStaffByDepartment = getStaffByDepartment;
const getCurrentUserStaffDetails = async (req, res) => {
    try {
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const userId = req.currentUser.id;
        const staff = await staff_model_1.default.findByUserId(userId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff details not found for current user'
            });
        }
        return res.json({
            success: true,
            message: 'Current user staff details retrieved successfully',
            data: { staff }
        });
    }
    catch (error) {
        console.error('Get current user staff details error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getCurrentUserStaffDetails = getCurrentUserStaffDetails;
const getDynamicFields = async (req, res) => {
    try {
        const page = (0, type_utils_1.getNumberQueryParam)(req, 'page', 1) || 1;
        const limit = (0, type_utils_1.getNumberQueryParam)(req, 'limit', 20) || 20;
        const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : true;
        const offset = (page - 1) * limit;
        const { fields, totalCount } = await staff_dynamic_field_model_1.default.findAll(limit, offset, isActive);
        return res.json({
            success: true,
            message: 'Dynamic fields retrieved successfully',
            data: {
                fields,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / limit),
                    totalItems: totalCount,
                    itemsPerPage: limit
                }
            }
        });
    }
    catch (error) {
        console.error('Get dynamic fields error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getDynamicFields = getDynamicFields;
const createDynamicField = async (req, res) => {
    try {
        const { field_name, field_label, field_type, field_options, required } = req.body;
        if (!field_name || !field_label || !field_type) {
            return res.status(400).json({
                success: false,
                message: 'Field name, label, and type are required'
            });
        }
        const existingField = await staff_dynamic_field_model_1.default.findByName(field_name);
        if (existingField) {
            return res.status(409).json({
                success: false,
                message: 'Dynamic field with this name already exists'
            });
        }
        const fieldData = {
            field_name,
            field_label,
            field_type,
            field_options,
            required: required || false,
            created_by: req.currentUser?.id
        };
        const newField = await staff_dynamic_field_model_1.default.create(fieldData);
        return res.status(201).json({
            success: true,
            message: 'Dynamic field created successfully',
            data: { field: newField }
        });
    }
    catch (error) {
        console.error('Create dynamic field error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createDynamicField = createDynamicField;
const updateDynamicField = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idString = Array.isArray(idParam) ? idParam[0] : idParam;
        const fieldId = parseInt(idString);
        if (isNaN(fieldId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid field ID'
            });
        }
        const { field_label, field_type, field_options, required, is_active } = req.body;
        const existingField = await staff_dynamic_field_model_1.default.findById(fieldId);
        if (!existingField) {
            return res.status(404).json({
                success: false,
                message: 'Dynamic field not found'
            });
        }
        const updateData = {
            field_label,
            field_type,
            field_options,
            required,
            is_active,
            updated_by: req.currentUser?.id
        };
        const updatedField = await staff_dynamic_field_model_1.default.update(fieldId, updateData);
        return res.json({
            success: true,
            message: 'Dynamic field updated successfully',
            data: { field: updatedField }
        });
    }
    catch (error) {
        console.error('Update dynamic field error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateDynamicField = updateDynamicField;
const deleteDynamicField = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idString = Array.isArray(idParam) ? idParam[0] : idParam;
        const fieldId = parseInt(idString);
        if (isNaN(fieldId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid field ID'
            });
        }
        const result = await staff_dynamic_field_model_1.default.delete(fieldId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Dynamic field not found'
            });
        }
        return res.json({
            success: true,
            message: 'Dynamic field deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete dynamic field error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteDynamicField = deleteDynamicField;
const getStaffDynamicValues = async (req, res) => {
    try {
        const staffIdParam = req.params.staffId;
        const staffIdString = Array.isArray(staffIdParam) ? staffIdParam[0] : staffIdParam;
        const staffId = parseInt(staffIdString);
        if (isNaN(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff ID'
            });
        }
        const values = await staff_dynamic_field_model_1.default.getAllValuesForStaff(staffId);
        return res.json({
            success: true,
            message: 'Staff dynamic values retrieved successfully',
            data: { values }
        });
    }
    catch (error) {
        console.error('Get staff dynamic values error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStaffDynamicValues = getStaffDynamicValues;
const setStaffDynamicValues = async (req, res) => {
    try {
        const staffIdParam = req.params.staffId;
        const staffIdString = Array.isArray(staffIdParam) ? staffIdParam[0] : staffIdParam;
        const staffId = parseInt(staffIdString);
        if (isNaN(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff ID'
            });
        }
        const { values } = req.body;
        if (!values || !Array.isArray(values)) {
            return res.status(400).json({
                success: false,
                message: 'Values array is required'
            });
        }
        const results = await staff_dynamic_field_model_1.default.setValuesForStaff(staffId, values);
        return res.json({
            success: true,
            message: 'Staff dynamic values updated successfully',
            data: { values: results }
        });
    }
    catch (error) {
        console.error('Set staff dynamic values error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.setStaffDynamicValues = setStaffDynamicValues;
//# sourceMappingURL=staff.controller.js.map