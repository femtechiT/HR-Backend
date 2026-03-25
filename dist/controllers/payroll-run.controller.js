"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayrollRun = exports.executePayrollRun = exports.updatePayrollRun = exports.createPayrollRun = exports.getPayrollRunById = exports.getAllPayrollRuns = void 0;
const payroll_run_model_1 = __importDefault(require("../models/payroll-run.model"));
const payroll_record_model_1 = __importDefault(require("../models/payroll-record.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const payroll_calculator_util_1 = __importDefault(require("../utils/payroll-calculator.util"));
const audit_log_model_1 = __importDefault(require("../models/audit-log.model"));
const getAllPayrollRuns = async (req, res) => {
    try {
        const { month, year, branchId, status } = req.query;
        const monthNum = month ? parseInt(month) : undefined;
        const yearNum = year ? parseInt(year) : undefined;
        const branchIdNum = branchId ? parseInt(branchId) : undefined;
        const statusStr = status ? status : undefined;
        const payrollRuns = await payroll_run_model_1.default.findAll(monthNum, yearNum, branchIdNum, statusStr);
        res.json({
            success: true,
            message: 'Payroll runs retrieved successfully',
            data: { payrollRuns }
        });
    }
    catch (error) {
        console.error('Get all payroll runs error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllPayrollRuns = getAllPayrollRuns;
const getPayrollRunById = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRunId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(payrollRunId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payroll run ID'
            });
        }
        const payrollRun = await payroll_run_model_1.default.findById(payrollRunId);
        if (!payrollRun) {
            return res.status(404).json({
                success: false,
                message: 'Payroll run not found'
            });
        }
        const payrollRecords = await payroll_record_model_1.default.findByPayrollRunId(payrollRunId);
        return res.json({
            success: true,
            message: 'Payroll run retrieved successfully',
            data: { payrollRun, payrollRecords }
        });
    }
    catch (error) {
        console.error('Get payroll run by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPayrollRunById = getPayrollRunById;
const createPayrollRun = async (req, res) => {
    try {
        const { month, year, branch_id, notes } = req.body;
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: 'Month must be between 1 and 12'
            });
        }
        if (year < 1900 || year > 2100) {
            return res.status(400).json({
                success: false,
                message: 'Year must be between 1900 and 2100'
            });
        }
        const existingRun = await payroll_run_model_1.default.findByMonthYear(month, year, branch_id || null);
        if (existingRun) {
            return res.status(409).json({
                success: false,
                message: 'A payroll run already exists for this month/year and branch'
            });
        }
        const payrollRunData = {
            month,
            year,
            branch_id: branch_id || null,
            status: 'draft',
            processed_by: req.currentUser.id,
            notes: notes || null
        };
        const newPayrollRun = await payroll_run_model_1.default.create({
            month,
            year,
            branch_id: branch_id || null,
            status: 'draft',
            processed_by: req.currentUser.id,
            notes: notes || null
        });
        await audit_log_model_1.default.create({
            user_id: req.currentUser.id,
            action: 'payroll_run.created',
            entity_type: 'payroll_run',
            entity_id: newPayrollRun.id,
            before_data: null,
            after_data: newPayrollRun,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        return res.status(201).json({
            success: true,
            message: 'Payroll run created successfully',
            data: { payrollRun: newPayrollRun }
        });
    }
    catch (error) {
        console.error('Create payroll run error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createPayrollRun = createPayrollRun;
const updatePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRunId = parseInt(Array.isArray(id) ? id[0] : id);
        const { status, notes } = req.body;
        if (isNaN(payrollRunId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payroll run ID'
            });
        }
        const existingPayrollRun = await payroll_run_model_1.default.findById(payrollRunId);
        if (!existingPayrollRun) {
            return res.status(404).json({
                success: false,
                message: 'Payroll run not found'
            });
        }
        const updateData = {};
        if (status !== undefined)
            updateData.status = status;
        if (notes !== undefined)
            updateData.notes = notes;
        const updatedPayrollRun = await payroll_run_model_1.default.update(payrollRunId, updateData);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payroll_run.updated',
                entity_type: 'payroll_run',
                entity_id: payrollRunId,
                before_data: existingPayrollRun,
                after_data: updatedPayrollRun,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payroll run updated successfully',
            data: { payrollRun: updatedPayrollRun }
        });
    }
    catch (error) {
        console.error('Update payroll run error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updatePayrollRun = updatePayrollRun;
const executePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRunId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(payrollRunId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payroll run ID'
            });
        }
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const payrollRun = await payroll_run_model_1.default.findById(payrollRunId);
        if (!payrollRun) {
            return res.status(404).json({
                success: false,
                message: 'Payroll run not found'
            });
        }
        if (payrollRun.status !== 'draft' && payrollRun.status !== 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Payroll run must be in draft status to execute'
            });
        }
        await payroll_run_model_1.default.updateStatus(payrollRunId, 'processing');
        try {
            let staffMembers;
            if (payrollRun.branch_id) {
                staffMembers = await staff_model_1.default.findByBranch(payrollRun.branch_id);
            }
            else {
                const allStaffResult = await staff_model_1.default.findAll();
                staffMembers = allStaffResult.staff;
            }
            const activeStaff = staffMembers.filter(staff => staff.status === 'active');
            const payrollCalculations = await payroll_calculator_util_1.default.calculatePayrollForStaff(activeStaff.map(staff => staff.id), payrollRun.month, payrollRun.year);
            for (const calculation of payrollCalculations) {
                await payroll_record_model_1.default.create({
                    payroll_run_id: payrollRunId,
                    staff_id: calculation.staff_id,
                    earnings: calculation.earnings,
                    deductions: calculation.deductions,
                    gross_pay: calculation.gross_pay,
                    total_deductions: calculation.total_deductions,
                    net_pay: calculation.net_pay
                });
            }
            const totalAmount = await payroll_record_model_1.default.calculateTotalAmountForRun(payrollRunId);
            await payroll_run_model_1.default.update(payrollRunId, {
                status: 'completed',
                total_amount: totalAmount,
                processed_by: req.currentUser.id
            });
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payroll_run.executed',
                entity_type: 'payroll_run',
                entity_id: payrollRunId,
                before_data: { ...payrollRun, status: 'processing' },
                after_data: { ...payrollRun, status: 'completed', total_amount: totalAmount },
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
            return res.json({
                success: true,
                message: 'Payroll run executed successfully',
                data: {
                    payrollRun: { ...payrollRun, status: 'completed', total_amount: totalAmount },
                    processedRecordsCount: payrollCalculations.length
                }
            });
        }
        catch (executionError) {
            console.error('Payroll run execution error:', executionError);
            await payroll_run_model_1.default.updateStatus(payrollRunId, 'draft');
            return res.status(500).json({
                success: false,
                message: 'Error executing payroll run, status reset to draft',
                error: executionError instanceof Error ? executionError.message : 'Unknown error'
            });
        }
    }
    catch (error) {
        console.error('Execute payroll run error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.executePayrollRun = executePayrollRun;
const deletePayrollRun = async (req, res) => {
    try {
        const { id } = req.params;
        const payrollRunId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(payrollRunId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payroll run ID'
            });
        }
        const existingPayrollRun = await payroll_run_model_1.default.findById(payrollRunId);
        if (!existingPayrollRun) {
            return res.status(404).json({
                success: false,
                message: 'Payroll run not found'
            });
        }
        if (existingPayrollRun.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete payroll runs in draft status'
            });
        }
        const deleted = await payroll_run_model_1.default.delete(payrollRunId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Payroll run not found'
            });
        }
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payroll_run.deleted',
                entity_type: 'payroll_run',
                entity_id: payrollRunId,
                before_data: existingPayrollRun,
                after_data: null,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payroll run deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete payroll run error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deletePayrollRun = deletePayrollRun;
//# sourceMappingURL=payroll-run.controller.js.map