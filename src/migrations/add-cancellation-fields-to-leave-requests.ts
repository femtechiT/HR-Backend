import { pool } from '../config/database';

/**
 * Migration: Add cancellation tracking fields to leave_requests table
 * 
 * This migration adds fields to track:
 * - Who cancelled the leave request (cancelled_by)
 * - When it was cancelled (cancelled_at)
 * - Why it was cancelled (cancellation_reason)
 * 
 * Run: npx ts-node src/migrations/add-cancellation-fields-to-leave-requests.ts
 */

async function migrate() {
  console.log('Starting migration: Add cancellation fields to leave_requests...');

  try {
    // Check if columns already exist
    const [columns]: any = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'leave_requests' 
        AND COLUMN_NAME IN ('cancelled_by', 'cancelled_at', 'cancellation_reason')
    `);

    if (columns.length > 0) {
      console.log('Migration already applied. Skipping...');
      return;
    }

    // Add cancelled_by column (references users table)
    await pool.execute(`
      ALTER TABLE leave_requests 
      ADD COLUMN cancelled_by INT NULL AFTER reviewed_by,
      ADD CONSTRAINT fk_leave_requests_cancelled_by 
        FOREIGN KEY (cancelled_by) REFERENCES users(id)
        ON DELETE SET NULL
    `);
    console.log('✓ Added cancelled_by column');

    // Add cancelled_at column
    await pool.execute(`
      ALTER TABLE leave_requests 
      ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by
    `);
    console.log('✓ Added cancelled_at column');

    // Add cancellation_reason column
    await pool.execute(`
      ALTER TABLE leave_requests 
      ADD COLUMN cancellation_reason TEXT NULL AFTER cancelled_at
    `);
    console.log('✓ Added cancellation_reason column');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function rollback() {
  console.log('Rolling back migration...');

  try {
    // Drop foreign key first
    await pool.execute(`
      ALTER TABLE leave_requests 
      DROP FOREIGN KEY fk_leave_requests_cancelled_by
    `);
    console.log('✓ Dropped foreign key');

    // Drop columns
    await pool.execute(`
      ALTER TABLE leave_requests 
      DROP COLUMN cancelled_by,
      DROP COLUMN cancelled_at,
      DROP COLUMN cancellation_reason
    `);
    console.log('✓ Dropped columns');

    console.log('✅ Rollback completed successfully!');
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'rollback') {
    rollback()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    migrate()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export { migrate, rollback };
