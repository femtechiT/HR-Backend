import { Request, Response } from 'express';
import PayrollRunModel from '../models/payroll-run.model';
import PayrollRecordModel from '../models/payroll-record.model';
import StaffModel from '../models/staff.model';
import PayrollCalculator from '../utils/payroll-calculator.util';
import AuditLogModel from '../models/audit-log.model';

// Controller for payroll run management
export const getAllPayrollRuns = async (req: Request, res: Response) => {
  try {
    const { month, year, branchId, status } = req.query;

    const monthNum = month ? parseInt(month as string) : undefined;
    const yearNum = year ? parseInt(year as string) : undefined;
    const branchIdNum = branchId ? parseInt(branchId as string) : undefined;
    const statusStr = status ? status as string : undefined;

    const payrollRuns = await PayrollRunModel.findAll(monthNum, yearNum, branchIdNum, statusStr);

    res.json({
      success: true,
      message: 'Payroll runs retrieved successfully',
      data: { payrollRuns }
    });
  } catch (error) {
    console.error('Get all payroll runs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPayrollRunById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payrollRunId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(payrollRunId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payroll run ID'
      });
    }

    const payrollRun = await PayrollRunModel.findById(payrollRunId);
    if (!payrollRun) {
      return res.status(404).json({
        success: false,
        message: 'Payroll run not found'
      });
    }

    // Get associated payroll records
    const payrollRecords = await PayrollRecordModel.findByPayrollRunId(payrollRunId);

    return res.json({
      success: true,
      message: 'Payroll run retrieved successfully',
      data: { payrollRun, payrollRecords }
    });
  } catch (error) {
    console.error('Get payroll run by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createPayrollRun = async (req: Request, res: Response) => {
  try {
    const { month, year, branch_id, notes } = req.body;

    // Validate required fields
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

    // Validate month and year
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

    // Check if a payroll run already exists for this month/year and branch
    const existingRun = await PayrollRunModel.findByMonthYear(month, year, branch_id || null);
    if (existingRun) {
      return res.status(409).json({
        success: false,
        message: 'A payroll run already exists for this month/year and branch'
      });
    }

    // Create the payroll run
    const payrollRunData = {
      month,
      year,
      branch_id: branch_id || null,
      status: 'draft', // Start as draft
      processed_by: req.currentUser.id,
      notes: notes || null
    };

    const newPayrollRun = await PayrollRunModel.create({
      month,
      year,
      branch_id: branch_id || null,
      status: 'draft', // Start as draft
      processed_by: req.currentUser.id,
      notes: notes || null
    });

    // Log the payroll run creation
    await AuditLogModel.create({
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
  } catch (error) {
    console.error('Create payroll run error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePayrollRun = async (req: Request, res: Response) => {
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

    // Check if payroll run exists
    const existingPayrollRun = await PayrollRunModel.findById(payrollRunId);
    if (!existingPayrollRun) {
      return res.status(404).json({
        success: false,
        message: 'Payroll run not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedPayrollRun = await PayrollRunModel.update(payrollRunId, updateData);

    // Log the payroll run update
    if (req.currentUser) {
      await AuditLogModel.create({
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
  } catch (error) {
    console.error('Update payroll run error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const executePayrollRun = async (req: Request, res: Response) => {
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

    // Check if payroll run exists
    const payrollRun = await PayrollRunModel.findById(payrollRunId);
    if (!payrollRun) {
      return res.status(404).json({
        success: false,
        message: 'Payroll run not found'
      });
    }

    // Check if payroll run is already processed
    if (payrollRun.status !== 'draft' && payrollRun.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Payroll run must be in draft status to execute'
      });
    }

    // Update status to processing
    await PayrollRunModel.updateStatus(payrollRunId, 'processing');

    try {
      // Get all staff members eligible for this payroll run
      // If branch_id is specified, get staff from that branch only
      let staffMembers;
      if (payrollRun.branch_id) {
        staffMembers = await StaffModel.findByBranch(payrollRun.branch_id);
      } else {
        const allStaffResult = await StaffModel.findAll();
        staffMembers = allStaffResult.staff;
      }

      // Filter to active staff only
      const activeStaff = staffMembers.filter(staff => staff.status === 'active');

      // Calculate payroll for each staff member
      const payrollCalculations = await PayrollCalculator.calculatePayrollForStaff(
        activeStaff.map(staff => staff.id),
        payrollRun.month,
        payrollRun.year
      );

      // Save each payroll record to the database
      for (const calculation of payrollCalculations) {
        await PayrollRecordModel.create({
          payroll_run_id: payrollRunId,
          staff_id: calculation.staff_id,
          earnings: calculation.earnings,
          deductions: calculation.deductions,
          gross_pay: calculation.gross_pay,
          total_deductions: calculation.total_deductions,
          net_pay: calculation.net_pay
        });
      }

      // Calculate total amount for this payroll run
      const totalAmount = await PayrollRecordModel.calculateTotalAmountForRun(payrollRunId);

      // Update the payroll run with total amount and completed status
      await PayrollRunModel.update(payrollRunId, {
        status: 'completed',
        total_amount: totalAmount,
        processed_by: req.currentUser.id
      });

      // Log the payroll run execution
      await AuditLogModel.create({
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
    } catch (executionError) {
      console.error('Payroll run execution error:', executionError);

      // Rollback: set status back to draft if there was an error
      await PayrollRunModel.updateStatus(payrollRunId, 'draft');

      return res.status(500).json({
        success: false,
        message: 'Error executing payroll run, status reset to draft',
        error: executionError instanceof Error ? executionError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Execute payroll run error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePayrollRun = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payrollRunId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(payrollRunId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payroll run ID'
      });
    }

    const existingPayrollRun = await PayrollRunModel.findById(payrollRunId);
    if (!existingPayrollRun) {
      return res.status(404).json({
        success: false,
        message: 'Payroll run not found'
      });
    }

    // Don't allow deletion of completed or processing runs
    if (existingPayrollRun.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete payroll runs in draft status'
      });
    }

    const deleted = await PayrollRunModel.delete(payrollRunId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Payroll run not found'
      });
    }

    // Log the payroll run deletion
    if (req.currentUser) {
      await AuditLogModel.create({
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
  } catch (error) {
    console.error('Delete payroll run error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};