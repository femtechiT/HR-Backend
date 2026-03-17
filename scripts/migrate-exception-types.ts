/**
 * Migration runner for exception types table
 */

import { pool } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔧 Running migration: Create shift_exception_types table...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/080_create_shift_exception_types_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('   - Created shift_exception_types table');
    console.log('   - Inserted 8 default exception types');
    console.log('   - Updated shift_exceptions table with foreign key');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('   ℹ️  Column already exists, skipping...');
    } else if (error.code === 'ER_DUP_ENTRY') {
      console.log('   ℹ️  Default types already exist, skipping inserts...');
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

runMigration();
