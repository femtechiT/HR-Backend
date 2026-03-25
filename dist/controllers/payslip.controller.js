"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadPayslip = exports.generatePayslip = void 0;
const payslip_generator_util_1 = __importDefault(require("../utils/payslip-generator.util"));
const payroll_record_model_1 = __importDefault(require("../models/payroll-record.model"));
const payroll_run_model_1 = __importDefault(require("../models/payroll-run.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const generatePayslip = async (req, res) => {
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
                message: 'Not authorized to view this payslip'
            });
        }
        const payslipHtml = await payslip_generator_util_1.default.generatePayslipHTMLString(parsedStaffId, parsedPayrollRunId);
        if (!payslipHtml) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate payslip'
            });
        }
        res.setHeader('Content-Type', 'text/html');
        res.send(payslipHtml);
        return;
    }
    catch (error) {
        console.error('Generate payslip error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.generatePayslip = generatePayslip;
const downloadPayslip = async (req, res) => {
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
                message: 'Not authorized to download this payslip'
            });
        }
        const payslipHtml = await payslip_generator_util_1.default.generatePayslipHTMLString(parsedStaffId, parsedPayrollRunId);
        if (!payslipHtml) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate payslip'
            });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=payslip-${parsedStaffId}-${parsedPayrollRunId}.pdf`);
        res.send(payslipHtml);
        return;
    }
    catch (error) {
        console.error('Download payslip error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.downloadPayslip = downloadPayslip;
//# sourceMappingURL=payslip.controller.js.map