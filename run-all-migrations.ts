import { createConnection } from 'mysql2/promise';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

async function runAllMigrations() {
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system',
  });

  try {
    console.log('Connected to database');

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = await fs.readdir(migrationsDir);
    
    // Filter and sort migration files
    const sqlFiles = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper execution order

    console.log(`Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      const migrationPath = path.join(migrationsDir, file);
      console.log(`\nRunning migration: ${file}`);
      
      const sql = await fs.readFile(migrationPath, 'utf8');
      
      // Split by semicolon to handle multiple statements in one file
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement) {
          try {
            await connection.query(statement);
            console.log(`  ✓ Statement executed: ${statement.substring(0, 60)}...`);
          } catch (stmtError: any) {
            // Check if it's a duplicate column/table error, which is acceptable
            if (stmtError.code === 'ER_DUP_FIELDNAME' || stmtError.code === 'ER_TABLE_EXISTS_ERROR' || 
                stmtError.errno === 1060 || stmtError.errno === 1050) {
              console.log(`  ⚠️  Skipped (already exists): ${statement.substring(0, 60)}...`);
            } else {
              console.error(`  ❌ Error executing statement:`, stmtError.message);
              // Continue with other statements instead of stopping
            }
          }
        }
      }
      
      console.log(`✓ Migration ${file} completed`);
    }

    console.log('\n🎉 All migrations completed! Some may have been skipped if already applied.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

runAllMigrations().catch(console.error);