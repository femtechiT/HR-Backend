/**
 * Payroll Calculation Engine
 * Handles the complex logic of calculating employee salaries based on their payment structures
 */

import StaffPaymentStructureModel from '../models/staff-payment-structure.model';
import PaymentTypeModel from '../models/payment-type.model';
import StaffModel from '../models/staff.model';

interface EarningComponent {
  id: number;
  name: string;
  value: number;
  calculation_type: string;
}

interface DeductionComponent {
  id: number;
  name: string;
  value: number;
  calculation_type: string;
}

interface PayrollCalculationResult {
  staff_id: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
}

export interface PayrollCalculationInput {
  staff_id: number;
  paymentStructures: any[];
  month: number;
  year: number;
}

class PayrollCalculator {
  /**
   * Calculate payroll for a single staff member
   */
  static async calculateStaffPayroll(input: PayrollCalculationInput): Promise<PayrollCalculationResult> {
    const { staff_id, paymentStructures, month, year } = input;
    
    // Initialize result object
    const result: PayrollCalculationResult = {
      staff_id,
      earnings: {},
      deductions: {},
      gross_pay: 0,
      total_deductions: 0,
      net_pay: 0
    };

    // Process each payment structure
    for (const structure of paymentStructures) {
      const { payment_type_details, value } = structure;
      
      if (!payment_type_details) continue;

      const { name, payment_category, calculation_type } = payment_type_details;
      let calculatedValue = 0;

      // Calculate value based on calculation type
      switch (calculation_type) {
        case 'fixed':
          calculatedValue = value;
          break;
          
        case 'percentage':
          // For percentage-based calculations, we might need a base amount
          // For now, we'll calculate percentage of a base salary if available
          // In a real system, this would be more complex
          if (name.toLowerCase().includes('bonus') || name.toLowerCase().includes('allowance')) {
            // Example: Calculate percentage of basic salary
            const basicSalary = result.earnings['basic_salary'] || 0;
            calculatedValue = (basicSalary * value) / 100;
          } else {
            // Default to percentage of a standard base (would be configurable in real system)
            calculatedValue = (value * 10000) / 100; // Using 10000 as example base
          }
          break;
          
        case 'formula':
          // Evaluate formula if provided
          if (payment_type_details.formula) {
            calculatedValue = this.evaluateFormula(payment_type_details.formula, result, value);
          } else {
            calculatedValue = value;
          }
          break;
          
        default:
          calculatedValue = value;
      }

      // Add to appropriate category
      if (payment_category === 'earning') {
        result.earnings[name] = calculatedValue;
        result.gross_pay += calculatedValue;
      } else if (['deduction', 'tax'].includes(payment_category)) {
        result.deductions[name] = calculatedValue;
        result.total_deductions += calculatedValue;
      }
    }

    // Calculate net pay
    result.net_pay = result.gross_pay - result.total_deductions;

    return result;
  }

  /**
   * Calculate payroll for multiple staff members
   */
  static async calculatePayrollForStaff(
    staffIds: number[],
    month: number,
    year: number
  ): Promise<PayrollCalculationResult[]> {
    const results: PayrollCalculationResult[] = [];

    for (const staffId of staffIds) {
      // Get active payment structures for the staff member for the given period
      const paymentStructures = await StaffPaymentStructureModel.findActiveForStaff(
        staffId,
        new Date(year, month - 1, 1) // First day of the month
      );

      // Get detailed payment type information for each structure
      const detailedStructures = await Promise.all(
        paymentStructures.map(async (structure) => {
          const paymentType = await PaymentTypeModel.findById(structure.payment_type_id);
          return {
            ...structure,
            payment_type_details: paymentType
          };
        })
      );

      // Calculate payroll for this staff member
      const calculationInput: PayrollCalculationInput = {
        staff_id: staffId,
        paymentStructures: detailedStructures,
        month,
        year
      };

      const result = await this.calculateStaffPayroll(calculationInput);
      results.push(result);
    }

    return results;
  }

  /**
   * Evaluate a formula string using available data
   */
  private static evaluateFormula(
    formula: string,
    currentResults: PayrollCalculationResult,
    baseValue: number
  ): number {
    // This is a simplified formula evaluator
    // In a production system, you'd want to use a more secure and robust expression evaluator
    
    try {
      // Replace variables in the formula with actual values
      let processedFormula = formula
        .replace(/\bgross_pay\b/g, currentResults.gross_pay.toString())
        .replace(/\btotal_deductions\b/g, currentResults.total_deductions.toString())
        .replace(/\bbase_value\b/g, baseValue.toString());
      
      // Simple calculation - in real system use a proper expression evaluator
      // For security, never use eval() in production - use math-expression-evaluator or similar
      // This is just a placeholder implementation
      if (formula.includes('*') || formula.includes('/') || formula.includes('+') || formula.includes('-')) {
        // A very basic calculator - only for demonstration purposes
        // In production, use a proper expression evaluator library
        const safeFormula = processedFormula.replace(/[^\d+\-*/().]/g, '');
        // Note: This is still not safe for production use
        // Use a proper expression evaluator library like 'expr-eval' or 'mathjs'
        return eval(safeFormula);
      }
      
      return baseValue; // Default to base value if no calculation needed
    } catch (error) {
      console.error('Error evaluating formula:', formula, error);
      return baseValue; // Return base value if formula evaluation fails
    }
  }

  /**
   * Validate payment structures before payroll calculation
   */
  static validatePaymentStructures(paymentStructures: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const structure of paymentStructures) {
      if (structure.value < 0) {
        errors.push(`Payment structure ${structure.id} has negative value`);
      }
      
      if (!structure.payment_type_details) {
        errors.push(`Payment structure ${structure.id} missing payment type details`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default PayrollCalculator;