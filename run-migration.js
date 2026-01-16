const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system',
  });

  try {
    console.log('Connected to database');

    const sql = 'ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE AFTER status;';
    
    console.log('Running migration...');
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