#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

async function runSetup() {
  console.log('🚀 Starting HR Management System First-Time Setup...\n');

  try {
    // 1. Create database if it doesn't exist
    console.log('1️⃣  Creating database...');
    await createDatabaseIfNotExists();

    // 2. Run migrations
    console.log('\n2️⃣  Running database migrations...');
    await runMigrations();

    // 3. Seed admin user
    console.log('\n3️⃣  Seeding admin user...');
    await seedAdminUser();

    // 4. Create additional default data
    console.log('\n4️⃣  Creating default system data...');
    await createDefaultData();

    // 5. Seed database with test data
    console.log('\n5️⃣  Seeding database with test data...');
    await runSeedScript();

    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Admin User Credentials:');
    console.log('   Email: admin@company.com');
    console.log('   Password: admin123');
    console.log('   Please change the password after first login!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

async function createDatabaseIfNotExists() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const dbName = process.env.DB_NAME || 'hr_management_system';
  console.log(`   Creating database ${dbName} if it doesn't exist...`);

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  
  await connection.end();
  console.log(`   ✅ Database ${dbName} is ready!`);
}

async function runMigrations() {
  const dbName = process.env.DB_NAME || 'hr_management_system';
  const dbConfigWithDb = {
    ...dbConfig,
    database: dbName,
    multipleStatements: true  // Enable multiple statements
  };
  const pool = mysql.createPool(dbConfigWithDb);

  try {
    // Read all SQL files from the migrations directory
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));

    // Prefer a single consolidated migration file when present.
    // This avoids re-running both `000_all_migrations.sql` and all numbered migrations.
    const consolidated = migrationFiles.includes('000_all_migrations.sql') ? '000_all_migrations.sql' : null;
    const filesToRun = consolidated ? [consolidated] : migrationFiles.filter((f) => f !== '000_all_migrations.sql');

    // Sort files to ensure they run in order
    const sortedMigrationFiles = filesToRun.sort();

    for (const file of sortedMigrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      console.log(`   Running migration: ${file}`);

      try {
        // Execute the entire file as one multi-statement query
        await pool.execute(sqlContent);
      } catch (stmtError) {
        console.error(`   ❌ Error executing migration ${file}:`, stmtError);
        throw stmtError;
      }
    }

    console.log('   ✅ All migrations completed successfully!');
  } finally {
    await pool.end();
  }
}

async function seedAdminUser() {
  const dbName = process.env.DB_NAME || 'hr_management_system';
  const dbConfigWithDb = {
    ...dbConfig,
    database: dbName
  };
  const pool = mysql.createPool(dbConfigWithDb);

  try {
    // Hash the admin password
    const adminPassword = 'admin123'; // You should change this in production
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the admin role first
    const adminRoleQuery = `
      INSERT INTO roles (name, description, permissions) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        description = VALUES(description),
        permissions = VALUES(permissions)
    `;    
    const [roleResult] = await pool.execute(adminRoleQuery, [
      'Admin',
      'Administrator with full access',
      JSON.stringify(['*']) // '*' means all permissions
    ]);

    // Get the actual role ID - if new role was inserted, use insertId; otherwise, get the ID of the existing role
    let roleId;
    if (roleResult.insertId) {
      roleId = roleResult.insertId;
    } else {
      // Role already existed, get its ID
      const [existingRole] = await pool.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['Admin']
      );
      roleId = existingRole[0]?.id || 4; // Default to 4 which is the actual Admin role ID
    }
    
    // Also add specific permissions to the roles_permissions table for completeness
    const permissionsToAdd = [
      'staff:create', 'staff:read', 'staff:update', 'staff:delete',
      'users:create', 'users:read', 'users:update', 'users:delete',
      'roles:create', 'roles:read', 'roles:update', 'roles:delete',
      'permissions:manage',
      'forms:create', 'forms:read', 'forms:update', 'forms:delete',
      'reports:view', 'reports:generate',
      'attendance:manage',
      'leave:approve',
      'payroll:manage',
      'kpi:manage',
      'performance:review',
      'branches:create', 'branches:read', 'branches:update', 'branches:delete',
      'documents:upload', 'documents:download',
      'settings:configure',
      'audit:read'
    ];
    
    for (const permission of permissionsToAdd) {
      const rolePermQuery = `
        INSERT INTO roles_permissions (role_id, permission, allow_deny)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          allow_deny = VALUES(allow_deny)
      `;
      await pool.execute(rolePermQuery, [roleId, permission, 'allow']);
    }

    // Create the admin user
    const adminUserQuery = `
      INSERT INTO users (email, password_hash, full_name, phone, role_id, status) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        full_name = VALUES(full_name),
        role_id = VALUES(role_id),
        status = VALUES(status)
    `;
    
    await pool.execute(adminUserQuery, [
      'admin@company.com',
      hashedPassword,
      'System Administrator',
      '+1234567890',
      roleId,
      'active'
    ]);

    // Get the user ID of the admin user
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?', 
      ['admin@company.com']
    );
    
    const userId = users[0]?.id;

    if (userId) {
      // Create staff record for the admin user
      const adminStaffQuery = `
        INSERT INTO staff (user_id, designation, department, status) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          designation = VALUES(designation),
          department = VALUES(department),
          status = VALUES(status)
      `;
      
      await pool.execute(adminStaffQuery, [
        userId,
        'System Administrator',
        'IT',
        'active'
      ]);

      console.log('   ✅ Admin user created successfully!');
    } else {
      console.log('   ℹ️  Admin user already exists');
    }

  } finally {
    await pool.end();
  }
}

async function createDefaultData() {
  const dbName = process.env.DB_NAME || 'hr_management_system';
  const dbConfigWithDb = {
    ...dbConfig,
    database: dbName
  };
  const pool = mysql.createPool(dbConfigWithDb);

  try {
    // Create default branch
    const defaultBranchQuery = `
      INSERT INTO branches (name, code, address, city, state, country, phone, email, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        address = VALUES(address)
    `;

    await pool.execute(defaultBranchQuery, [
      'Main Office',
      'MAIN',
      'Headquarters Building',
      'City',
      'State',
      'Country',
      '+1234567890',
      'info@company.com',
      'active'
    ]);

    console.log('   ✅ Default branch created');

    // Create default roles if they don't exist
    const defaultRoles = [
      { name: 'HR Manager', description: 'Human Resources Manager', permissions: JSON.stringify(['staff:read', 'staff:update', 'users:read', 'users:update', 'leave:approve']) },
      { name: 'Department Manager', description: 'Department Manager', permissions: JSON.stringify(['staff:read', 'users:read', 'reports:view']) },
      { name: 'Employee', description: 'Regular Employee', permissions: JSON.stringify(['attendance:record', 'leave:request', 'forms:submit']) }
    ];

    for (const role of defaultRoles) {
      const roleQuery = `
        INSERT INTO roles (name, description, permissions)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          description = VALUES(description)
      `;
      await pool.execute(roleQuery, [role.name, role.description, role.permissions]);
    }

    console.log('   ✅ Default roles created');

  } finally {
    await pool.end();
  }
}

async function runSeedScript() {
  return new Promise((resolve, reject) => {
    const seedScriptPath = path.join(process.cwd(), 'scripts', 'seed-database.ts');
    
    console.log('   Running seed script...');
    
    const seedProcess = exec(`tsx ${seedScriptPath}`, {
      env: process.env,
    });

    seedProcess.stdout?.on('data', (data) => {
      console.log(`   ${data}`);
    });

    seedProcess.stderr?.on('data', (data) => {
      console.error(`   ${data}`);
    });

    seedProcess.on('close', (code) => {
      if (code === 0) {
        console.log('   ✅ Database seeded successfully!');
        resolve();
      } else {
        reject(new Error(`Seed script exited with code ${code}`));
      }
    });

    seedProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Run the setup
runSetup();
