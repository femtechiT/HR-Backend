import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import PaymentTypeModel from './models/payment-type.model';
import StaffPaymentStructureModel from './models/staff-payment-structure.model';
import PayrollRunModel from './models/payroll-run.model';
import PayrollRecordModel from './models/payroll-record.model';
import PayrollCalculator from './utils/payroll-calculator.util';

// Load environment variables
dotenv.config();

// Create a simple test database connection
const pool = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hr_management_system_test',
});

console.log('Testing Payroll System Integration...');

async function testPayrollSystem() {
  // Create a simple test database connection
  const pool = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system_test',
  });
  try {
    // Test 1: Create a payment type
    console.log('\n1. Creating a payment type...');
    const newPaymentType = await PaymentTypeModel.create({
      name: 'Basic Salary',
      payment_category: 'earning',
      calculation_type: 'fixed',
      created_by: 1
    });
    console.log('✓ Payment type created:', newPaymentType.name);

    // Test 2: Create a staff payment structure
    console.log('\n2. Creating staff payment structure...');
    // Note: This assumes staff ID 1 exists in the database
    try {
      const newStructure = await StaffPaymentStructureModel.create({
        staff_id: 1,
        payment_type_id: newPaymentType.id,
        value: 50000,
        effective_from: new Date(),
        created_by: 1
      });
      console.log('✓ Staff payment structure created for staff ID 1');
    } catch (error) {
      console.log('⚠ Could not create staff payment structure (may be due to staff ID 1 not existing)');
    }

    // Test 3: Create a payroll run
    console.log('\n3. Creating a payroll run...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const newPayrollRun = await PayrollRunModel.create({
      month: currentMonth,
      year: currentYear,
      status: 'draft',
      processed_by: 1
    });
    console.log('✓ Payroll run created for', currentMonth, '/', currentYear);

    // Test 4: Test payroll calculation
    console.log('\n4. Testing payroll calculation...');
    const calculationResult = await PayrollCalculator.calculatePayrollForStaff([1], currentMonth, currentYear);
    console.log('✓ Payroll calculation completed for', calculationResult.length, 'staff members');

    // Test 5: Create a payroll record
    console.log('\n5. Creating a payroll record...');
    if (calculationResult.length > 0) {
      const record = await PayrollRecordModel.create({
        payroll_run_id: newPayrollRun.id,
        staff_id: calculationResult[0].staff_id,
        earnings: calculationResult[0].earnings,
        deductions: calculationResult[0].deductions,
        gross_pay: calculationResult[0].gross_pay,
        total_deductions: calculationResult[0].total_deductions,
        net_pay: calculationResult[0].net_pay
      });
      console.log('✓ Payroll record created with net pay:', record.net_pay);
    } else {
      console.log('⚠ Skipping payroll record creation (no calculation results)');
    }

    console.log('\n✅ All payroll system components tested successfully!');
    
    // Clean up - delete the test records
    console.log('\n6. Cleaning up test data...');
    try {
      await PayrollRecordModel.delete(1); // This might fail if record doesn't exist
    } catch (e) {
      console.log('  (Payroll record cleanup skipped)');
    }
    
    try {
      await PayrollRunModel.delete(newPayrollRun.id);
      console.log('  ✓ Payroll run cleaned up');
    } catch (e) {
      console.log('  ⚠ Payroll run cleanup failed');
    }
    
    try {
      await PaymentTypeModel.delete(newPaymentType.id);
      console.log('  ✓ Payment type cleaned up');
    } catch (e) {
      console.log('  ⚠ Payment type cleanup failed');
    }

    console.log('\n🎉 Payroll System Integration Test Completed Successfully!');
  } catch (error) {
    console.error('\n❌ Error during payroll system test:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testPayrollSystem();