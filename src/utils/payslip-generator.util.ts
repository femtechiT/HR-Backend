import { Request, Response } from 'express';
import PayrollRecordModel from '../models/payroll-record.model';
import PayrollRunModel from '../models/payroll-run.model';
import StaffModel from '../models/staff.model';
import UserModel from '../models/user.model';
import BranchModel from '../models/branch.model';

interface PayslipData {
  staff: any;
  user: any;
  branch: any;
  payrollRecord: any;
  payrollRun: any;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  month: number;
  year: number;
}

class PayslipGenerator {
  /**
   * Generate payslip data for a specific staff member and payroll run
   */
  static async generatePayslipData(staffId: number, payrollRunId: number): Promise<PayslipData | null> {
    // Get payroll record
    const payrollRecord = await PayrollRecordModel.findByStaffIdAndPayrollRun(staffId, payrollRunId);
    if (!payrollRecord) {
      return null;
    }

    // Get payroll run details
    const payrollRun = await PayrollRunModel.findById(payrollRunId);
    if (!payrollRun) {
      return null;
    }

    // Get staff details
    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return null;
    }

    // Get user details
    const user = await UserModel.findById(staff.user_id);
    if (!user) {
      return null;
    }

    // Get branch details
    let branch = null;
    if (staff.branch_id) {
      branch = await BranchModel.findById(staff.branch_id);
    }

    // Parse earnings and deductions
    const earnings = typeof payrollRecord.earnings === 'string' 
      ? JSON.parse(payrollRecord.earnings) 
      : payrollRecord.earnings;
    
    const deductions = typeof payrollRecord.deductions === 'string' 
      ? JSON.parse(payrollRecord.deductions) 
      : payrollRecord.deductions;

    return {
      staff,
      user,
      branch,
      payrollRecord,
      payrollRun,
      earnings,
      deductions,
      grossPay: payrollRecord.gross_pay,
      totalDeductions: payrollRecord.total_deductions,
      netPay: payrollRecord.net_pay,
      month: payrollRun.month,
      year: payrollRun.year
    };
  }

  /**
   * Generate payslip HTML template
   */
  static generatePayslipHTML(data: PayslipData): string {
    const { staff, user, branch, earnings, deductions, grossPay, totalDeductions, netPay, month, year } = data;
    
    // Month names for display
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const monthName = monthNames[month - 1];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${user.full_name} - ${monthName} ${year}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .payslip-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .company-info h1 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }
    .company-info p {
      margin: 5px 0;
      color: #666;
    }
    .payslip-title {
      text-align: center;
      margin: 20px 0;
    }
    .payslip-title h2 {
      margin: 0;
      color: #333;
    }
    .employee-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .info-section {
      width: 48%;
    }
    .info-section h3 {
      margin-top: 0;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    .info-item {
      display: flex;
      margin-bottom: 5px;
    }
    .info-label {
      font-weight: bold;
      width: 120px;
      flex-shrink: 0;
    }
    .info-value {
      flex-grow: 1;
    }
    .salary-breakdown {
      margin: 20px 0;
    }
    .breakdown-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .breakdown-table th, .breakdown-table td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    .breakdown-table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .earnings-row {
      background-color: #f9f9f9;
    }
    .deductions-row {
      background-color: #fff5f5;
    }
    .summary {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-left: 4px solid #007bff;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .summary-label {
      font-weight: bold;
    }
    .net-pay {
      font-size: 18px;
      font-weight: bold;
      color: #28a745;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <div class="header">
      <div class="company-info">
        <h1>${branch?.name || 'Company Name'}</h1>
        <p>${branch?.address || 'Company Address'}, ${branch?.city || ''}, ${branch?.state || ''}</p>
        <p>Phone: ${branch?.phone || 'N/A'} | Email: ${branch?.email || 'N/A'}</p>
      </div>
    </div>

    <div class="payslip-title">
      <h2>Salary Slip</h2>
      <p>${monthName} ${year}</p>
    </div>

    <div class="employee-info">
      <div class="info-section">
        <h3>Employee Information</h3>
        <div class="info-item">
          <span class="info-label">Name:</span>
          <span class="info-value">${user.full_name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Employee ID:</span>
          <span class="info-value">${staff.employee_id || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Designation:</span>
          <span class="info-value">${staff.designation || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Department:</span>
          <span class="info-value">${staff.department || 'N/A'}</span>
        </div>
      </div>
      
      <div class="info-section">
        <h3>Pay Period</h3>
        <div class="info-item">
          <span class="info-label">Month:</span>
          <span class="info-value">${monthName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Year:</span>
          <span class="info-value">${year}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Joining Date:</span>
          <span class="info-value">${staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </div>

    <div class="salary-breakdown">
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Earnings</th>
            <th>Deductions</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(earnings).map(([key, value]) => `
            <tr class="earnings-row">
              <td>${key}</td>
              <td>₹${Number(value).toFixed(2)}</td>
              <td>-</td>
            </tr>
          `).join('')}
          
          ${Object.entries(deductions).map(([key, value]) => `
            <tr class="deductions-row">
              <td>${key}</td>
              <td>-</td>
              <td>₹${Number(value).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="summary-item">
        <span class="summary-label">Gross Pay:</span>
        <span>₹${grossPay.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Deductions:</span>
        <span>₹${totalDeductions.toFixed(2)}</span>
      </div>
      <div class="summary-item net-pay">
        <span class="summary-label">Net Pay:</span>
        <span>₹${netPay.toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <p>This is a computer-generated payslip and does not require a signature.</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate payslip as HTML string
   */
  static async generatePayslipHTMLString(staffId: number, payrollRunId: number): Promise<string | null> {
    try {
      const payslipData = await this.generatePayslipData(staffId, payrollRunId);
      if (!payslipData) {
        return null;
      }

      return this.generatePayslipHTML(payslipData);
    } catch (error) {
      console.error('Error generating payslip HTML:', error);
      return null;
    }
  }
}

export default PayslipGenerator;