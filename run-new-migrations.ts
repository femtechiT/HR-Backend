import { createConnection } from 'mysql2/promise';
import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

async function runNewMigrations() {
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system',
  });

  try {
    console.log('Connected to database');

    // Define the new notification-related migration files
    const newMigrations = [
      '043_create_notification_templates_table.sql',
      '044_create_user_notification_preferences_table.sql',
      '045_create_notification_queue_table.sql',
      '046_create_device_registrations_table.sql',
      '047_insert_notification_templates.sql'
    ];

    console.log(`Running ${newMigrations.length} new notification-related migrations`);

    for (const file of newMigrations) {
      const migrationPath = path.join(process.cwd(), 'migrations', file);
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

    console.log('\n🎉 All new notification system migrations completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

runNewMigrations().catch(console.error);