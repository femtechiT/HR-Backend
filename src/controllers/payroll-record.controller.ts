import { Request, Response } from 'express';
import PayrollRecordModel from '../models/payroll-record.model';
import PayrollRunModel from '../models/payroll-run.model';
import StaffModel from '../models/staff.model';
import AuditLogModel from '../models/audit-log.model';

// Controller for payroll record management
export const getAllPayrollRecords = async (req: Request, res: Response) => {
  try {
    const { payrollRunId, staffId } = req.query;

    const payrollRunIdNum = payrollRunId ? parseInt(payrollRunId as string) : undefined;
    const staffIdNum = staffId ? parseInt(staffId as string) : undefined;

    const payrollRecords = await PayrollRecordModel.findAll(payrollRunIdNum, staffIdNum);

    res.json({
      success: true,
      message: 'Payroll records retrieved successfully',
      data: { payrollRecords }
    });
  } catch (error) {
    console.error('Get all payroll records error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPayrollRecordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payrollRecordId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(payrollRecordId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payroll record ID'
      });
    }

    const payrollRecord = await PayrollRecordModel.findById(payrollRecordId);
    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Get associated staff information
    const staff = await StaffModel.findById(payrollRecord.staff_id);

    // Get associated payroll run information
    const payrollRun = await PayrollRunModel.findById(payrollRecord.payroll_run_id);

    return res.json({
      success: true,
      message: 'Payroll record retrieved successfully',
      data: { 
        payrollRecord, 
        staff: { id: staff?.id, full_name: staff?.full_name, email: staff?.email },
        payrollRun: { id: payrollRun?.id, month: payrollRun?.month, year: payrollRun?.year }
      }
    });
  } catch (error) {
    console.error('Get payroll record by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStaffPayrollHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // staff id
    const staffId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    // Check if staff exists
    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if current user is authorized to view this staff's payroll history
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Regular users can only view their own payroll history
    // Admins and managers can view others' payroll history
    const currentUserId = req.currentUser.id;
    const currentUserRole = req.currentUser.role_id;
    const staffUserId = staff.user_id;

    if (currentUserId !== staffUserId && ![1, 3].includes(currentUserRole)) { // Assuming admin/HR roles
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this staff member\'s payroll history'
      });
    }

    const payrollRecords = await PayrollRecordModel.findByStaffId(staffId);

    // Get associated payroll run information for each record
    const detailedRecords = await Promise.all(
      payrollRecords.map(async (record) => {
        const payrollRun = await PayrollRunModel.findById(record.payroll_run_id);
        return {
          ...record,
          payroll_run_info: {
            id: payrollRun?.id,
            month: payrollRun?.month,
            year: payrollRun?.year,
            status: payrollRun?.status
          }
        };
      })
    );

    return res.json({
      success: true,
      message: 'Staff payroll history retrieved successfully',
      data: { payrollRecords: detailedRecords }
    });
  } catch (error) {
    console.error('Get staff payroll history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePayrollRecord = async (req: Request, res: Response) => {
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

    // Check if payroll record exists
    const existingPayrollRecord = await PayrollRecordModel.findById(payrollRecordId);
    if (!existingPayrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (earnings !== undefined) updateData.earnings = earnings;
    if (deductions !== undefined) updateData.deductions = deductions;
    if (gross_pay !== undefined) updateData.gross_pay = gross_pay;
    if (total_deductions !== undefined) updateData.total_deductions = total_deductions;
    if (net_pay !== undefined) updateData.net_pay = net_pay;

    const updatedPayrollRecord = await PayrollRecordModel.update(payrollRecordId, updateData);

    // Log the payroll record update
    if (req.currentUser) {
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'payroll_record.updated',
        entity_type: 'payroll_record',
        entity_id: payrollRecordId,
        before_data: existingPayrollRecord,
        after_data: updatedPayrollRecord,
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || null
      });
    }

    return res.json({
      success: true,
      message: 'Payroll record updated successfully',
      data: { payrollRecord: updatedPayrollRecord }
    });
  } catch (error) {
    console.error('Update payroll record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePayrollRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payrollRecordId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(payrollRecordId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payroll record ID'
      });
    }

    const existingPayrollRecord = await PayrollRecordModel.findById(payrollRecordId);
    if (!existingPayrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    const deleted = await PayrollRecordModel.delete(payrollRecordId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    // Log the payroll record deletion
    if (req.currentUser) {
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'payroll_record.deleted',
        entity_type: 'payroll_record',
        entity_id: payrollRecordId,
        before_data: existingPayrollRecord,
        after_data: null,
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || null
      });
    }

    return res.json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  } catch (error) {
    console.error('Delete payroll record error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};