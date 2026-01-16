import { Request, Response } from 'express';
import PayslipGenerator from '../utils/payslip-generator.util';
import PayrollRecordModel from '../models/payroll-record.model';
import PayrollRunModel from '../models/payroll-run.model';
import StaffModel from '../models/staff.model';
import UserModel from '../models/user.model';
import EmailService from '../services/email.service';

export const sendPayslipByEmail = async (req: Request, res: Response) => {
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

    // Check if current user is authorized to send this payslip
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

    // Check if current user is authorized to send this payslip
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

    // Only admins and managers can send payslips to others
    if (currentUserId !== staffUserId && ![1, 3].includes(currentUserRole)) { // Assuming admin/HR roles
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send this payslip'
      });
    }

    // Get user details to get email
    const user = await UserModel.findById(staffUserId);
    if (!user || !user.email) {
      return res.status(400).json({
        success: false,
        message: 'User email not found'
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

    // Send the payslip notification via email
    // Note: For now, we'll send a notification that the payslip is ready
    // In a real system, we would generate a PDF attachment
    try {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const monthName = monthNames[payrollRun.month - 1];

      const result = await EmailService.sendPayrollReady(user.email, monthName, payrollRun.year);

      if (result.success) {
        return res.json({
          success: true,
          message: 'Payslip notification sent successfully via email'
        });
      } else {
        console.error('Error sending payslip notification:', result.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send payslip notification via email',
          error: result.error
        });
      }
    } catch (emailError) {
      console.error('Error sending payslip notification:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send payslip notification via email',
        error: emailError instanceof Error ? emailError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Send payslip by email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};