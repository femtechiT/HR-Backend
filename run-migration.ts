import { createConnection } from 'mysql2/promise';
import * as fs from 'fs/promises';
import * as path from 'path';

async function runMigration() {
  // Load environment variables
  require('dotenv').config();

  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system',
  });

  try {
    console.log('Connected to database');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations/029_add_must_change_password_to_users.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');

    console.log('Running migration:', migrationPath);
    await connection.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

runMigration().catch(console.error);