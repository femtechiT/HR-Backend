import PayrollCalculator from './utils/payroll-calculator.util';

// Simple test for payroll calculation
console.log('Testing Payroll Calculator...');

const testInput = {
  staff_id: 1,
  paymentStructures: [
    {
      id: 1,
      value: 50000,
      payment_type_details: {
        id: 1,
        name: 'Basic Salary',
        payment_category: 'earning',
        calculation_type: 'fixed'
      }
    },
    {
      id: 2,
      value: 15000,
      payment_type_details: {
        id: 2,
        name: 'HRA',
        payment_category: 'earning',
        calculation_type: 'fixed'
      }
    },
    {
      id: 3,
      value: 6000,
      payment_type_details: {
        id: 3,
        name: 'Provident Fund',
        payment_category: 'deduction',
        calculation_type: 'fixed'
      }
    }
  ],
  month: 1,
  year: 2026
};

PayrollCalculator.calculateStaffPayroll(testInput)
  .then(result => {
    console.log('Payroll calculation result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error in payroll calculation:', error);
  });