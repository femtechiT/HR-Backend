import bcrypt from 'bcryptjs';
import { pool } from './config/database';

async function seedAdminUser() {
  console.log('Seeding admin user...');

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
    
    const [roleResult]: any = await pool.execute(adminRoleQuery, [
      'Admin',
      'Administrator with full access',
      JSON.stringify(['*']) // '*' means all permissions
    ]);
    
    const roleId = roleResult.insertId || 1; // Use existing role ID if it exists

    // Also add specific permissions to the roles_permissions table for completeness
    const permissionsToAdd = [
      'staff:create', 'staff:read', 'staff:update', 'staff:delete',
      'users:create', 'users:read', 'users:update', 'users:delete',
      'roles:create', 'roles:read', 'roles:update', 'roles:delete',
      'permissions:manage',
      'forms:create', 'forms:read', 'forms:update', 'forms:delete',
      'reports:view', 'reports:generate',
      'attendance:manage',
      'leave:request', 'leave:view', 'leave:approve',
      'leave_type:read',
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
    const [users]: any = await pool.execute(
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

      console.log('Admin user created successfully!');
      console.log('Email: admin@company.com');
      console.log('Password: admin123'); // Change this in production!
    } else {
      console.log('Admin user already exists');
    }

  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
}

// Run the seeding function
seedAdminUser()
  .then(() => {
    console.log('Admin seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Admin seeding failed:', error);
    process.exit(1);
  });