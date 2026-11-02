"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const generic_email_service_1 = require("../services/generic-email.service");
const router = (0, express_1.Router)();
const PROFILE_FIELDS = [
    'employee_id', 'designation', 'department', 'employment_type', 'work_mode',
    'joining_date', 'phone_number', 'personal_email', 'work_email',
    'alternate_phone_number', 'bank_name', 'bank_account_number', 'bank_ifsc_code',
    'tax_identification_number', 'emergency_contact_name', 'emergency_contact_phone',
    'emergency_contact_relationship', 'date_of_birth', 'nationality', 'gender',
    'marital_status', 'current_address_id', 'permanent_address_id',
    'primary_skills', 'education_certifications', 'base_salary', 'pay_grade',
    'pension_insurance_id', 'medical_insurance_id', 'provident_fund_id',
    'probation_end_date', 'contract_end_date', 'weekly_working_hours',
    'overtime_eligibility', 'notice_period_days', 'employee_photo',
    'reporting_manager_id'
];
function calculateProfileCompletion(staff) {
    const filled = PROFILE_FIELDS.filter(f => {
        const val = staff[f];
        return val !== null && val !== undefined && val !== '';
    }).length;
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
}
router.post('/send', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ success: false, message: 'Subject and message are required' });
        }
        const [rows] = await database_1.pool.execute(`SELECT s.*, u.full_name, u.email, u.must_change_password
       FROM staff s
       JOIN users u ON s.user_id = u.id
       WHERE u.email IS NOT NULL AND u.email != '' AND u.status = 'active'
         AND s.status = 'active' AND s.deleted_at IS NULL AND u.deleted_at IS NULL`);
        const eligibleStaff = [];
        const reasons = [];
        for (const staff of rows) {
            const completion = calculateProfileCompletion(staff);
            const needsPasswordChange = !!staff.must_change_password;
            const profileIncomplete = completion < 50;
            if (needsPasswordChange || profileIncomplete) {
                eligibleStaff.push({
                    id: staff.id,
                    user_id: staff.user_id,
                    full_name: staff.full_name,
                    email: staff.email,
                    profile_completion: completion,
                    reason: needsPasswordChange ? 'Must change password' : `Profile ${completion}% complete`
                });
            }
        }
        if (eligibleStaff.length === 0) {
            return res.json({
                success: true,
                message: 'No eligible staff found for reminder',
                data: { sent: 0, total: 0, staff: [] }
            });
        }
        const sent = [];
        for (const staff of eligibleStaff) {
            try {
                const personalizedHtml = message
                    .replace(/{{name}}/g, staff.full_name)
                    .replace(/{{email}}/g, staff.email)
                    .replace(/{{reason}}/g, staff.reason);
                await (0, generic_email_service_1.sendGenericEmail)({
                    to: staff.email,
                    subject,
                    html: personalizedHtml
                });
                sent.push({ email: staff.email, name: staff.full_name, status: 'sent' });
            }
            catch (error) {
                console.error(`Failed to send reminder to ${staff.email}:`, error);
                sent.push({ email: staff.email, name: staff.full_name, status: 'failed' });
            }
        }
        return res.json({
            success: true,
            message: `Reminder sent to ${sent.filter(s => s.status === 'sent').length} staff member(s)`,
            data: {
                sent: sent.filter(s => s.status === 'sent').length,
                failed: sent.filter(s => s.status === 'failed').length,
                total: eligibleStaff.length,
                staff: eligibleStaff.map(s => ({
                    ...s,
                    email_status: sent.find(se => se.email === s.email)?.status || 'unknown'
                }))
            }
        });
    }
    catch (error) {
        console.error('Profile reminder error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/preview', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute(`SELECT s.*, u.full_name, u.email, u.must_change_password
       FROM staff s
       JOIN users u ON s.user_id = u.id
       WHERE u.email IS NOT NULL AND u.email != '' AND u.status = 'active'
         AND s.status = 'active' AND s.deleted_at IS NULL AND u.deleted_at IS NULL`);
        const eligibleStaff = [];
        let mustChangePasswordCount = 0;
        let incompleteProfileCount = 0;
        for (const staff of rows) {
            const completion = calculateProfileCompletion(staff);
            const needsPasswordChange = !!staff.must_change_password;
            const profileIncomplete = completion < 50;
            if (needsPasswordChange || profileIncomplete) {
                if (needsPasswordChange)
                    mustChangePasswordCount++;
                if (profileIncomplete)
                    incompleteProfileCount++;
                eligibleStaff.push({
                    id: staff.id,
                    user_id: staff.user_id,
                    full_name: staff.full_name,
                    email: staff.email,
                    designation: staff.designation,
                    department: staff.department,
                    profile_completion: completion,
                    must_change_password: needsPasswordChange,
                    reason: needsPasswordChange ? 'Must change password' : `Profile ${completion}% complete`
                });
            }
        }
        return res.json({
            success: true,
            data: {
                total: eligibleStaff.length,
                must_change_password_count: mustChangePasswordCount,
                incomplete_profile_count: incompleteProfileCount,
                staff: eligibleStaff
            }
        });
    }
    catch (error) {
        console.error('Profile reminder preview error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=profile-reminder.route.js.map