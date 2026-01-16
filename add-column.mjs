import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addColumnIfNotExists() {
  const dbName = process.env.DB_NAME || 'hr_management_system';
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName
  };

  const pool = createPool(dbConfig);

  try {
    console.log('Checking if must_change_password column exists...');

    // Check if the column exists
    const [rows] = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password'
    `, [dbName]);

    if (rows.length > 0) {
      console.log('Column already exists, skipping...');
    } else {
      console.log('Adding must_change_password column to users table...');
      await pool.execute(`
        ALTER TABLE users 
        ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE AFTER status
      `);
      console.log('Column added successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

addColumnIfNotExists();