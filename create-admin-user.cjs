// Create admin user for testing
// Usage: node create-admin-user.cjs
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('🔧 Creating admin user...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hr_management_system'
  });
  
  try {
    const adminEmail = 'hr@femtechaccess.com.ng';
    const adminPassword = 'Admin123!';

    // Check if admin user already exists
    const [existing] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [adminEmail]
    );
    
    if (existing.length > 0) {
      console.log('ℹ️  Admin user already exists:');
      console.log(`   Email: ${existing[0].email}`);
      console.log(`   ID: ${existing[0].id}\n`);
      console.log('📝 Use these credentials to login:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}\n`);
      await connection.end();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Get admin role ID first
    const [roles] = await connection.execute(
      "SELECT id FROM roles WHERE name LIKE '%Admin%' ORDER BY id ASC LIMIT 1"
    );

    const roleId = roles.length > 0 ? roles[0].id : 1;
    
    await connection.execute(`
      INSERT INTO users (email, password_hash, full_name, status, role_id, must_change_password)
      VALUES (?, ?, 'System Administrator', 'active', ?, FALSE)
    `, [adminEmail, hashedPassword, roleId]);
    
    console.log('\n✅ Admin user created successfully!\n');
    console.log('📝 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);
    console.log('⚠️  Please change the password after first login!\n');
    
  } catch (error) {
    console.error('❌ Error creating admin user:');
    console.error(error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createAdminUser();
