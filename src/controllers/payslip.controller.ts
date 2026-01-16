import { Request, Response } from 'express';
import PayslipGenerator from '../utils/payslip-generator.util';
import PayrollRecordModel from '../models/payroll-record.model';
import PayrollRunModel from '../models/payroll-run.model';
import StaffModel from '../models/staff.model';

// Controller for payslip generation
export const generatePayslip = async (req: Request, res: Response) => {
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

    // Check if current user is authorized to view this payslip
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if the payroll record exists
    const payrollRecord = await PayrollRecordModel.findByStaffIdAndPayrollRun(parsedStaffId, parsedPayrollRunId);
    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found for this staff and payroll run'
      });
    }

    // Check if the payroll run exists and is completed
    const payrollRun = await PayrollRunModel.findById(parsedPayrollRunId);
    if (!payrollRun || payrollRun.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payroll run not found or not completed'
      });
    }

    // Check if current user is authorized to view this payslip
    const currentUserId = req.currentUser.id;
    const currentUserRole = req.currentUser.role_id;
    const staff = await StaffModel.findById(parsedStaffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const staffUserId = staff.user_id;

    // Regular users can only view their own payslip
    // Admins and managers can view others' payslips
    if (currentUserId !== staffUserId && ![1, 3].includes(currentUserRole)) { // Assuming admin/HR roles
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payslip'
      });
    }

    // Generate the payslip HTML
    const payslipHtml = await PayslipGenerator.generatePayslipHTMLString(parsedStaffId, parsedPayrollRunId);
    if (!payslipHtml) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate payslip'
      });
    }

    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    res.send(payslipHtml);
  } catch (error) {
    console.error('Generate payslip error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const downloadPayslip = async (req: Request, res: Response) => {
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

    // Check if current user is authorized to download this payslip
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if the payroll record exists
    const payrollRecord = await PayrollRecordModel.findByStaffIdAndPayrollRun(parsedStaffId, parsedPayrollRunId);
    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found for this staff and payroll run'
      });
    }

    // Check if the payroll run exists and is completed
    const payrollRun = await PayrollRunModel.findById(parsedPayrollRunId);
    if (!payrollRun || payrollRun.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payroll run not found or not completed'
      });
    }

    // Check if current user is authorized to download this payslip
    const currentUserId = req.currentUser.id;
    const currentUserRole = req.currentUser.role_id;
    const staff = await StaffModel.findById(parsedStaffId);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const staffUserId = staff.user_id;

    // Regular users can only download their own payslip
    // Admins and managers can download others' payslips
    if (currentUserId !== staffUserId && ![1, 3].includes(currentUserRole)) { // Assuming admin/HR roles
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this payslip'
      });
    }

    // Generate the payslip HTML
    const payslipHtml = await PayslipGenerator.generatePayslipHTMLString(parsedStaffId, parsedPayrollRunId);
    if (!payslipHtml) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate payslip'
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${parsedStaffId}-${parsedPayrollRunId}.pdf`);

    // For now, we'll send the HTML as a response since we don't have PDF generation implemented
    // In a real system, we would convert the HTML to PDF here
    res.send(payslipHtml);
  } catch (error) {
    console.error('Download payslip error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};