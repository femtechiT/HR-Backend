import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixBranchId() {
  console.log('🔧 Fixing branch_id on shift_templates...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system',
    ssl: process.env.NODE_ENV === 'production' && process.env.DB_HOST?.includes('tidbcloud')
      ? { rejectUnauthorized: true }
      : false
  });

  try {
    // Check if branch_id exists
    const [cols]: any = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'shift_templates' AND COLUMN_NAME = 'branch_id'`,
      [process.env.DB_NAME || 'hr_management_system']
    );

    if (cols.length > 0) {
      console.log('⏭️  branch_id column already exists');
    } else {
      await connection.execute(`
        ALTER TABLE shift_templates
        ADD COLUMN branch_id INT NULL AFTER created_by
      `);
      console.log('✅ Added branch_id column');
    }

    // Check FK
    const [fks]: any = await connection.execute(
      `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'shift_templates' AND CONSTRAINT_NAME = 'fk_shift_template_branch'`,
      [process.env.DB_NAME || 'hr_management_system']
    );
    if (fks.length === 0) {
      await connection.execute(`
        ALTER TABLE shift_templates
        ADD CONSTRAINT fk_shift_template_branch
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
      `);
      console.log('✅ Added foreign key');
    } else {
      console.log('⏭️  Foreign key already exists');
    }

    // Check indexes
    await connection.execute(`ALTER TABLE shift_templates ADD INDEX idx_branch (branch_id)`).catch(() => {});
    await connection.execute(`ALTER TABLE shift_templates ADD INDEX idx_branch_active (branch_id, is_active)`).catch(() => {});
    console.log('✅ Indexes verified');

    console.log('\n✅ Done! shift_templates now has branch_id.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixBranchId();
