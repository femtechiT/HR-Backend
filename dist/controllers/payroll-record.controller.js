"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayrollRecord = exports.updatePayrollRecord = exports.getStaffPayrollHistory = exports.getPayrollRecordById = exports.getAllPayrollRecords = void 0;
const payroll_record_model_1 = __importDefault(require("../models/payroll-record.model"));
const payroll_run_model_1 = __importDefault(require("../models/payroll-run.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const audit_log_model_1 = __importDefault(require("../models/audit-log.model"));
const getAllPayrollRecords = async (req, res) => {
    try {
        const { payrollRunId, staffId } = req.query;
        const payrollRunIdNum = payrollRunId ? parseInt(payrollRunId) : undefined;
        const staffIdNum = staffId ? parseInt(staffId) : undefined;
        const payrollRecords = await payroll_record_model_1.default.findAll(payrollRunIdNum, staffIdNum);
        res.json({
            success: true,
            message: 'Payroll records retrieved successfully',
            data: { payrollRecords }
        });
    }
    catch (error) {
        console.error('Get all payroll records error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllPayrollRecords = getAllPayrollRecords;
const getPayrollRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRecordId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(payrollRecordId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payroll record ID'
            });
        }
        const payrollRecord = await payroll_record_model_1.default.findById(payrollRecordId);
        if (!payrollRecord) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }
        const staff = await staff_model_1.default.findById(payrollRecord.staff_id);
        let user = null;
        if (staff) {
            user = await user_model_1.default.findById(staff.user_id);
        }
        const payrollRun = await payroll_run_model_1.default.findById(payrollRecord.payroll_run_id);
        return res.json({
            success: true,
            message: 'Payroll record retrieved successfully',
            data: {
                payrollRecord,
                staff: { id: staff?.id, full_name: user?.full_name, email: user?.email },
                payrollRun: { id: payrollRun?.id, month: payrollRun?.month, year: payrollRun?.year }
            }
        });
    }
    catch (error) {
        console.error('Get payroll record by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPayrollRecordById = getPayrollRecordById;
const getStaffPayrollHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const staffId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff ID'
            });
        }
        const staff = await staff_model_1.default.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const currentUserId = req.currentUser.id;
        const currentUserRole = req.currentUser.role_id;
        const staffUserId = staff.user_id;
        if (currentUserId !== staffUserId && ![1, 3].includes(currentUserRole)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this staff member\'s payroll history'
            });
        }
        const payrollRecords = await payroll_record_model_1.default.findByStaffId(staffId);
        const detailedRecords = await Promise.all(payrollRecords.map(async (record) => {
            const payrollRun = await payroll_run_model_1.default.findById(record.payroll_run_id);
            return {
                ...record,
                payroll_run_info: {
                    id: payrollRun?.id,
                    month: payrollRun?.month,
                    year: payrollRun?.year,
                    status: payrollRun?.status
                }
            };
        }));
        return res.json({
            success: true,
            message: 'Staff payroll history retrieved successfully',
            data: { payrollRecords: detailedRecords }
        });
    }
    catch (error) {
        console.error('Get staff payroll history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStaffPayrollHistory = getStaffPayrollHistory;
const updatePayrollRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRecordId = parseInt(Array.isArray(id) ? id[0] : id);
        const { earnings, deductions, gross_pay, total_deductions, net_pay } = req.body;
        if (isNaN(payrollRecordId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payroll record ID'
            });
        }
        const existingPayrollRecord = await payroll_record_model_1.default.findById(payrollRecordId);
        if (!existingPayrollRecord) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }
        const updateData = {};
        if (earnings !== undefined)
            updateData.earnings = earnings;
        if (deductions !== undefined)
            updateData.deductions = deductions;
        if (gross_pay !== undefined)
            updateData.gross_pay = gross_pay;
        if (total_deductions !== undefined)
            updateData.total_deductions = total_deductions;
        if (net_pay !== undefined)
            updateData.net_pay = net_pay;
        const updatedPayrollRecord = await payroll_record_model_1.default.update(payrollRecordId, updateData);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payroll_record.updated',
                entity_type: 'payroll_record',
                entity_id: payrollRecordId,
                before_data: existingPayrollRecord,
                after_data: updatedPayrollRecord,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payroll record updated successfully',
            data: { payrollRecord: updatedPayrollRecord }
        });
    }
    catch (error) {
        console.error('Update payroll record error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updatePayrollRecord = updatePayrollRecord;
const deletePayrollRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRecordId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(payrollRecordId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payroll record ID'
            });
        }
        const existingPayrollRecord = await payroll_record_model_1.default.findById(payrollRecordId);
        if (!existingPayrollRecord) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }
        const deleted = await payroll_record_model_1.default.delete(payrollRecordId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Payroll record not found'
            });
        }
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payroll_record.deleted',
                entity_type: 'payroll_record',
                entity_id: payrollRecordId,
                before_data: existingPayrollRecord,
                after_data: null,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payroll record deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete payroll record error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deletePayrollRecord = deletePayrollRecord;
//# sourceMappingURL=payroll-record.controller.js.map