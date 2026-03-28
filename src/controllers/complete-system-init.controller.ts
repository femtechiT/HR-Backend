import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, dbConfig } from '../config/database';
import mysql from 'mysql2/promise';
import { sendWelcomeEmail } from '../services/email.service';

// Check if system is initialized (users table has entries)
export const isSystemInitialized = async (): Promise<boolean> => {
  try {
    const [rows]: any = await pool.execute('SELECT COUNT(*) as count FROM users');
    const userCount = rows[0].count;
    return userCount > 0;
  } catch (error: any) {
    // If the error is due to table not existing, the system is definitely not initialized
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return false;
    }
    console.error('Error checking system initialization:', error);
    return true; // Default to initialized if there's an unexpected error
  }
};

// Check if database tables exist
export const checkDatabaseSchema = async (): Promise<boolean> => {
  try {
    // Check if key tables exist
    const tablesToCheck = ['users', 'roles', 'branches'];
    
    for (const table of tablesToCheck) {
      try {
        await pool.execute(`SELECT 1 FROM ${table} LIMIT 1`);
      } catch (error: any) {
        // If table doesn't exist, this will throw an error
        if (error.code === 'ER_NO_SUCH_TABLE') {
          return false;
        }
        throw error; // Re-throw if it's a different error
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking database schema:', error);
    return false;
  }
};

// Run consolidated migration (single file combining all migrations)
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('========================================');
    console.log('Starting database setup...');
    console.log('========================================');

    // Use the consolidated migration file that combines all migrations
    const migrationFile = '000_all_migrations.sql';
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationPath = path.join(migrationsDir, migrationFile);

    console.log(`Running consolidated migration: ${migrationFile}`);
    console.log('This combines all 100+ migrations into one file for speed...');

    const migrationSql = await fs.readFile(migrationPath, 'utf8');

    // Disable foreign key checks to avoid dependency issues
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Foreign key checks disabled\n');

    // Create a temporary connection without namedPlaceholders to bypass parsing bugs with massive SQL files
    const tempConfig = { ...dbConfig, namedPlaceholders: false, multipleStatements: true };
    const tempConnection = await mysql.createConnection(tempConfig);
    
    try {
      await tempConnection.query(migrationSql);
      console.log('✅ Migration executed successfully');
    } catch (error: any) {
      // If there's an error, it might be because tables already exist
      // That's OK - we'll continue and try to create the Super Admin
      console.warn('Migration warning:', error.message?.substring(0, 200) || error);
    } finally {
      await tempConnection.end();
    }

    // Re-enable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key checks re-enabled');

    // Verify tables were created
    const [tables]: any = await pool.execute('SHOW TABLES');
    console.log(`\n✅ Database setup complete! Tables created: ${tables.length}`);

    console.log('========================================');
  } catch (error: any) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

// Initialize the complete system (run migrations + create Super Admin)
export const initializeCompleteSystem = async (req: Request, res: Response) => {
  try {
    // Check if system is already initialized
    const systemInitialized = await isSystemInitialized();
    if (systemInitialized) {
      return res.status(400).json({
        success: false,
        message: 'System is already initialized. Cannot run complete initialization again.'
      });
    }

    const { email, password, fullName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if database schema exists
    let schemaExists = await checkDatabaseSchema();

    if (!schemaExists) {
      console.log('Database schema not found. Running migrations...');

      // Run all migration files
      await runMigrations();

      console.log('Migrations completed successfully');
    } else {
      console.log('Database schema already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create Super Admin role first
    const [roleResult]: any = await pool.execute(
      'INSERT INTO roles (name, description, permissions, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      ['Super Admin', 'System super administrator with all privileges', JSON.stringify(['*'])]
    );
    
    const superAdminRoleId = roleResult.insertId;

    // Create the Super Admin user (use minimal fields to avoid missing column errors)
    const [userResult]: any = await pool.execute(
      `INSERT INTO users
       (email, password_hash, full_name, phone, role_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [email, passwordHash, fullName, phone || null, superAdminRoleId]
    );

    const userId = userResult.insertId;

    // Now update to set must_change_password if the column exists
    try {
      await pool.execute(
        'UPDATE users SET must_change_password = 1 WHERE id = ?',
        [userId]
      );
    } catch (updateError: any) {
      // Column might not exist yet, that's OK
      console.log('Note: must_change_password column not available yet');
    }

    // Generate JWT token for the new Super Admin
    const tokenPayload = {
      userId: userId,
      email: email,
      role_id: superAdminRoleId
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    // Send welcome email to Super Admin
    try {
      await sendWelcomeEmail({ to: email, fullName });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the registration if email fails, just log it
    }

    return res.status(201).json({
      success: true,
      message: 'System initialized successfully. Database schema created and Super Admin created.',
      data: {
        user: {
          id: userId,
          email,
          fullName,
          roleId: superAdminRoleId
        },
        token
      }
    });
  } catch (error) {
    console.error('Complete system initialization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during complete system initialization'
    });
  }
};

// Check system readiness
export const checkSystemReadiness = async (req: Request, res: Response) => {
  try {
    const schemaExists = await checkDatabaseSchema();
    const systemInitialized = await isSystemInitialized();
    
    return res.json({
      success: true,
      data: {
        schemaExists,
        systemInitialized,
        readyForInitialization: schemaExists && !systemInitialized,
        readyForCompleteSetup: !schemaExists && !systemInitialized
      }
    });
  } catch (error) {
    console.error('Error checking system readiness:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking system readiness'
    });
  }
};