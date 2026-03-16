/**
 * Quick migration runner for adding recurrence_days column
 */

import { pool } from '../src/config/database.js';

async function runMigration() {
  try {
    console.log('🔧 Running migration: Add recurrence_days to employee_shift_assignments...');

    // Add recurrence_days column
    await pool.execute(`
      ALTER TABLE employee_shift_assignments 
      ADD COLUMN recurrence_days JSON AFTER recurrence_pattern
    `);
    console.log('   ✓ Added recurrence_days column');

    // Update existing weekly assignments
    await pool.execute(`
      UPDATE employee_shift_assignments
      SET recurrence_days = JSON_ARRAY(recurrence_day_of_week)
      WHERE recurrence_pattern = 'weekly' AND recurrence_day_of_week IS NOT NULL
    `);
    console.log('   ✓ Updated existing weekly assignments');

    console.log('✅ Migration completed successfully!\n');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('   ℹ️  Column recurrence_days already exists, skipping...\n');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

runMigration();
