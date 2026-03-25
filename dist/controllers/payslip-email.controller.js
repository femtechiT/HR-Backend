"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPayslipByEmail = void 0;
const payslip_generator_util_1 = __importDefault(require("../utils/payslip-generator.util"));
const payroll_record_model_1 = __importDefault(require("../models/payroll-record.model"));
const payroll_run_model_1 = __importDefault(require("../models/payroll-run.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const email_service_1 = require("../services/email.service");
const sendPayslipByEmail = async (req, res) => {
    try {
        const { staffId, payrollRunId } = req.params;
        const parsedStaffId = parseInt(Array.isArray(staffId) ? staffId[0] : staffId);
        const parsedPayrollRunId = parseInt(Array.isArray(payrollRunId) ? payrollRunId[0] : payrollRunId);
        if (isNaN(parsedStaffId) || isNaN(parsedPayrollRunId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff ID or payroll run ID'
            });
        }
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const payrollRecord = await payroll_record_model_1.default.findByStaffIdAndPayrollRun(parsedStaffId, parsedPayrollRunId);
        if (!payrollRecord) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found for this staff and payroll run'
            });
        }
        const payrollRun = await payroll_run_model_1.default.findById(parsedPayrollRunId);
        if (!payrollRun || payrollRun.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payroll run not found or not completed'
            });
        }
        const currentUserId = req.currentUser.id;
        const currentUserRole = req.currentUser.role_id;
        const staff = await staff_model_1.default.findById(parsedStaffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        const staffUserId = staff.user_id;
        if (currentUserId !== staffUserId && ![1, 3].includes(currentUserRole)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send this payslip'
            });
        }
        const user = await user_model_1.default.findById(staffUserId);
        if (!user || !user.email) {
            return res.status(400).json({
                success: false,
                message: 'User email not found'
            });
        }
        const payslipHtml = await payslip_generator_util_1.default.generatePayslipHTMLString(parsedStaffId, parsedPayrollRunId);
        if (!payslipHtml) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate payslip'
            });
        }
        try {
            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const monthName = monthNames[payrollRun.month - 1];
            const result = await (0, email_service_1.sendPayrollReady)({ to: user.email, month: monthName, year: payrollRun.year });
            if (result.success) {
                return res.json({
                    success: true,
                    message: 'Payslip notification sent successfully via email'
                });
            }
            else {
                console.error('Error sending payslip notification:', result.error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send payslip notification via email',
                    error: result.error
                });
            }
        }
        catch (emailError) {
            console.error('Error sending payslip notification:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send payslip notification via email',
                error: emailError instanceof Error ? emailError.message : 'Unknown error'
            });
        }
    }
    catch (error) {
        console.error('Send payslip by email error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.sendPayslipByEmail = sendPayslipByEmail;
//# sourceMappingURL=payslip-email.controller.js.map