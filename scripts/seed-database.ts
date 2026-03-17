/**
 * HR App Database Seeder
 *
 * Populates the database with realistic test data including:
 * - Branches (5 branches across Kenya)
 * - Users & Staff (100+ employees)
 * - Departments
 * - Shift Timings & Recurring Shift Assignments
 * - Holidays (Kenyan public holidays 2025-2026)
 * - Attendance Records (2025-01-01 to current date)
 * - Leave History & Requests
 * - Leave Allocations
 * - Forms & Form Submissions with Attachments
 *
 * Note: Admin user is NOT created by this script. Create admin manually through signup after seeding.
 *
 * Usage: npm run seed
 */

import { pool } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Configuration
const CONFIG = {
  startDate: '2025-01-01', // Start of 2025
  endDate: new Date().toISOString().split('T')[0], // Current date (dynamic)
  numBranches: 5,
  numEmployees: 100,        // 100 employees
  numDepartments: 6,
  sundayWorkers: 30,        // Number of employees who work on Sundays
};

// Kenyan Cities/Regions for branches
const BRANCH_DATA = [
  { name: 'Nairobi HQ', code: 'NAI', city: 'Nairobi', coords: { lng: 36.817223, lat: -1.286389 } },
  { name: 'Mombasa Branch', code: 'MBA', city: 'Mombasa', coords: { lng: 39.6682, lat: -4.0435 } },
  { name: 'Kisumu Branch', code: 'KIS', city: 'Kisumu', coords: { lng: 34.7519, lat: -0.0917 } },
  { name: 'Nakuru Branch', code: 'NAK', city: 'Nakuru', coords: { lng: 36.0667, lat: -0.3031 } },
  { name: 'Eldoret Branch', code: 'ELD', city: 'Eldoret', coords: { lng: 35.2698, lat: 0.5143 } },
];

// Kenyan Public Holidays (2025-2026)
const KENYAN_HOLIDAYS = [
  // 2025
  { date: '2025-01-01', name: 'New Year\'s Day' },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-04-21', name: 'Easter Monday' },
  { date: '2025-05-01', name: 'Labour Day' },
  { date: '2025-06-01', name: 'Madaraka Day' },
  { date: '2025-06-08', name: 'Eid al-Adha' },
  { date: '2025-08-11', name: 'Huduma Day' },
  { date: '2025-10-10', name: 'Mashujaa Day' },
  { date: '2025-12-12', name: 'Jamhuri Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
  { date: '2025-12-26', name: 'Boxing Day' },
  // 2026
  { date: '2026-01-01', name: 'New Year\'s Day' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-06', name: 'Easter Monday' },
  { date: '2026-05-01', name: 'Labour Day' },
  { date: '2026-06-01', name: 'Madaraka Day' },
  { date: '2026-08-11', name: 'Huduma Day' },
  { date: '2026-10-10', name: 'Mashujaa Day' },
  { date: '2026-12-12', name: 'Jamhuri Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-26', name: 'Boxing Day' },
];

// Department names
const DEPARTMENTS = [
  'Human Resources',
  'Finance & Accounting',
  'Information Technology',
  'Operations',
  'Sales & Marketing',
  'Customer Service',
];

// First and last names for generating employees
const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica',
  'Peter', 'Paul', 'Andrew', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony',
  'Margaret', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Helen', 'Sandra',
  'Mark', 'Donald', 'Steven', 'George', 'Kenneth', 'Brian', 'Edward', 'Ronald',
  'Ashley', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Cynthia',
  'Kevin', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric',
  'Katherine', 'Christine', 'Debra', 'Carol', 'Rachel', 'Catherine', 'Amy', 'Angela',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Ochieng', 'Kamau', 'Kimani', 'Wanjiku', 'Mutua', 'Achieng', 'Njeri', 'Kipchoge',
];

// Helper functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmployeeId(index) {
  return `EMP${String(index).padStart(4, '0')}`;
}

function generateEmail(firstName, lastName, index) {
  const domains = ['company.co.ke', 'company.com', 'gmail.com'];
  const domain = index < 45 ? 'company.co.ke' : randomElement(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function ensureLeaveRequestCancellationFields() {
  console.log('🔧 Ensuring leave_requests table has cancellation fields...');

  try {
    // Check if columns exist
    const [columns]: any = await pool.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'leave_requests'
        AND COLUMN_NAME IN ('cancelled_by', 'cancelled_at', 'cancellation_reason')
    `);

    if (columns.length === 3) {
      console.log('   ✓ Cancellation fields already exist\n');
      return;
    }

    console.log('   Adding missing cancellation fields...');

    // Add cancelled_by column if missing
    if (!columns.some((c: any) => c.COLUMN_NAME === 'cancelled_by')) {
      await pool.execute(`
        ALTER TABLE leave_requests
        ADD COLUMN cancelled_by INT NULL AFTER reviewed_by,
        ADD CONSTRAINT fk_leave_requests_cancelled_by
          FOREIGN KEY (cancelled_by) REFERENCES users(id)
          ON DELETE SET NULL
      `);
      console.log('   ✓ Added cancelled_by column');
    }

    // Add cancelled_at column if missing
    if (!columns.some((c: any) => c.COLUMN_NAME === 'cancelled_at')) {
      await pool.execute(`
        ALTER TABLE leave_requests
        ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by
      `);
      console.log('   ✓ Added cancelled_at column');
    }

    // Add cancellation_reason column if missing
    if (!columns.some((c: any) => c.COLUMN_NAME === 'cancellation_reason')) {
      await pool.execute(`
        ALTER TABLE leave_requests
        ADD COLUMN cancellation_reason TEXT NULL AFTER cancelled_at
      `);
      console.log('   ✓ Added cancellation_reason column');
    }

    console.log('✅ Cancellation fields added successfully\n');
  } catch (error: any) {
    console.error('⚠️  Warning: Could not ensure cancellation fields:', error.message);
    console.log('   Continuing with seed process...\n');
  }
}

async function clearExistingData() {
  console.log('🗑️  Clearing existing transactional data (preserving users, staff, roles, branches)...');

  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

  // Clear ALL transactional data tables
  const tablesToClear = [
    'attendance',
    'leave_history',
    'leave_requests',
    'leave_allocations',
    'holidays',
    'holiday_duty_roster',
    'form_submissions',
    'employee_shift_assignments',
    'shift_templates',
    'branch_working_days',
    'notifications',
    'payroll_records',
    'payroll_runs',
    'payslips',
    'appraisals',
    'kpi_scores',
    'kpi_assignments',
    'performance_reviews',
  ];

  for (const table of tablesToClear) {
    try {
      await pool.execute(`DELETE FROM ${table}`);
      console.log(`   ✓ Cleared ${table}`);
    } catch (error) {
      console.log(`   - Skipped ${table} (may not exist)`);
    }
  }

  // Reset auto-increment counters
  for (const table of tablesToClear) {
    try {
      await pool.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    } catch (error) {
      // Ignore errors
    }
  }

  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  console.log('✅ All transactional data cleared (users, staff, roles, branches preserved)\n');
}

async function seedRoles() {
  console.log('🔐 Seeding roles...');

  const roles = [
    { name: 'Admin', description: 'System Administrator' },
    { name: 'Manager', description: 'Department/Branch Manager' },
    { name: 'HR', description: 'Human Resources' },
    { name: 'Employee', description: 'Regular Employee' },
  ];

  const rolePermissions = {
    Admin: ['*'],
    Manager: [
      'staff:read', 'staff:update',
      'users:read', 'users:update',
      'attendance:read', 'attendance:manage',
      'leave:request', 'leave:view', 'leave:approve',
      'leave:read', 'leave:update',
      'leave_allocation:read', 'leave_allocation:create',
      'reports:view', 'reports:generate',
      'branches:read',
      'departments:read', 'departments:update',
      'shifts:read', 'shifts:manage',
      'performance:review'
    ],
    HR: [
      'staff:create', 'staff:read', 'staff:update',
      'users:create', 'users:read', 'users:update',
      'attendance:read', 'attendance:manage',
      'leave:request', 'leave:view', 'leave:approve',
      'leave:read', 'leave:create', 'leave:update', 'leave:delete',
      'leave_type:read',
      'leave_allocation:read', 'leave_allocation:create',
      'leave_allocation:update', 'leave_allocation:delete',
      'reports:view', 'reports:generate',
      'branches:read',
      'departments:read',
      'shifts:read', 'shifts:manage',
      'payroll:read',
      'performance:review',
      'documents:upload', 'documents:download'
    ],
    Employee: [
      'staff:read',
      'users:read',
      'attendance:read',
      'leave:request', 'leave:view',
      'leave_type:read',
      'reports:view',
      'branches:read',
      'departments:read',
      'shifts:read',
      'documents:download'
    ]
  };

  for (const role of roles) {
    // Check if role already exists
    const [existing] = await pool.execute('SELECT id FROM roles WHERE name = ?', [role.name]);
    
    if ((existing as any).length > 0) {
      console.log(`   ✓ Role ${role.name} already exists, skipping...`);
      continue;
    }

    const permissions = rolePermissions[role.name as keyof typeof rolePermissions] || [];

    const [result] = await pool.execute(
      `INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)`,
      [role.name, role.description, JSON.stringify(permissions)]
    );
    console.log(`   ✓ Created ${role.name} with ${permissions.length} permissions`);

    const roleId = (result as any).insertId;

    for (const permission of permissions) {
      await pool.execute(
        `INSERT IGNORE INTO roles_permissions (role_id, permission, allow_deny) VALUES (?, ?, 'allow')`,
        [roleId, permission]
      );
    }
  }

  console.log('✅ Roles seeded\n');
}

async function seedBranches() {
  console.log('🏢 Seeding branches...');

  for (const branch of BRANCH_DATA) {
    // Check if branch already exists
    const [existing] = await pool.execute('SELECT id FROM branches WHERE code = ?', [branch.code]);
    
    if ((existing as any).length > 0) {
      console.log(`   ✓ Branch ${branch.name} already exists, skipping...`);
      continue;
    }

    await pool.execute(
      `INSERT INTO branches (name, code, city, country, phone, email, location_coordinates, location_radius_meters, attendance_mode, status)
       VALUES (?, ?, ?, 'Kenya', ?, ?, ?, ?, 'branch_based', 'active')`,
      [
        branch.name,
        branch.code,
        branch.city,
        `+254-${Math.floor(Math.random() * 900) + 100}`,
        `${branch.code.toLowerCase()}@company.co.ke`,
        `${branch.coords.lat},${branch.coords.lng}`,
        100 + Math.floor(Math.random() * 100),
      ]
    );
    console.log(`   ✓ Created ${branch.name}`);
  }

  console.log('✅ Branches seeded\n');
}

async function seedUsersAndStaff() {
  console.log('👥 Seeding users and staff...');

  const passwordHash = await hashPassword('Password123!');

  // Note: Admin user is NOT created here - create manually through signup after seeding

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < CONFIG.numEmployees; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const email = generateEmail(firstName, lastName, i + 2);
    const branchId = Math.floor(Math.random() * CONFIG.numBranches) + 1;
    const roleId = Math.random() < 0.1 ? 3 : 4;
    const department = randomElement(DEPARTMENTS);
    const joiningDate = randomDate(new Date('2023-01-01'), new Date('2024-12-31'));
    const employmentType = randomElement(['full_time', 'full_time', 'full_time', 'part_time', 'contract']);

    // Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    
    if ((existingUsers as any).length > 0) {
      skippedCount++;
      continue;
    }

    // Check if employee_id already exists
    const employeeId = generateEmployeeId(i + 1);
    const [existingStaff] = await pool.execute('SELECT id FROM staff WHERE employee_id = ?', [employeeId]);
    
    if ((existingStaff as any).length > 0) {
      console.log(`   ⚠️  Employee ${employeeId} already exists, skipping...`);
      skippedCount++;
      continue;
    }

    const [userResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, full_name, role_id, branch_id, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [email, passwordHash, `${firstName} ${lastName}`, roleId, branchId]
    );

    const userId = userResult.insertId;

    const designations = ['Associate', 'Senior Associate', 'Officer', 'Senior Officer', 'Manager'];
    const designation = randomElement(designations);

    await pool.execute(
      `INSERT INTO staff (user_id, employee_id, designation, department, branch_id, joining_date, employment_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [userId, employeeId, designation, department, branchId, joiningDate, employmentType]
    );

    createdCount++;

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Processed ${i + 1} employees...`);
    }
  }

  console.log(`   Created: ${createdCount}, Skipped (already exist): ${skippedCount}`);
  console.log(`✅ Users and staff seeded\n`);
}

async function seedDepartments() {
  console.log('🏛️  Seeding departments...');

  for (const dept of DEPARTMENTS) {
    // Check if department already exists
    const [existing] = await pool.execute('SELECT id FROM departments WHERE name = ?', [dept]);
    
    if ((existing as any).length > 0) {
      console.log(`   ✓ Department ${dept} already exists, skipping...`);
      continue;
    }

    const branchId = Math.floor(Math.random() * CONFIG.numBranches) + 1;
    await pool.execute(
      `INSERT INTO departments (name, description, branch_id)
       VALUES (?, ?, ?)`,
      [dept, `${dept} department`, branchId]
    );
    console.log(`   ✓ Created ${dept}`);
  }

  console.log('✅ Departments seeded\n');
}

async function seedLeaveTypes() {
  console.log('📋 Seeding leave types...');

  const leaveTypes = [
    { name: 'Annual Leave', days: 21, paid: true },
    { name: 'Sick Leave', days: 14, paid: true },
    { name: 'Personal Leave', days: 5, paid: true },
    { name: 'Maternity Leave', days: 90, paid: true },
    { name: 'Paternity Leave', days: 14, paid: true },
    { name: 'Compassionate Leave', days: 5, paid: false },
    { name: 'Study Leave', days: 30, paid: false },
  ];

  for (const lt of leaveTypes) {
    // Check if leave type already exists
    const [existing] = await pool.execute('SELECT id FROM leave_types WHERE name = ?', [lt.name]);
    
    if ((existing as any).length > 0) {
      console.log(`   ✓ Leave type ${lt.name} already exists, skipping...`);
      continue;
    }

    await pool.execute(
      `INSERT INTO leave_types (name, days_per_year, is_paid, is_active)
       VALUES (?, ?, ?, TRUE)`,
      [lt.name, lt.days, lt.paid]
    );
    console.log(`   ✓ Created ${lt.name}`);
  }

  console.log('✅ Leave types seeded\n');
}

async function seedHolidays() {
  console.log('🎉 Seeding holidays...');
  
  for (const holiday of KENYAN_HOLIDAYS) {
    if (holiday.date >= CONFIG.startDate && holiday.date <= CONFIG.endDate) {
      await pool.execute(
        `INSERT INTO holidays (holiday_name, date, branch_id, is_mandatory, description)
         VALUES (?, ?, NULL, TRUE, ?)`,
        [holiday.name, holiday.date, `Public holiday - ${holiday.name}`]
      );
      console.log(`   ✓ Added ${holiday.name} (${holiday.date})`);
    }
  }
  
  console.log('✅ Holidays seeded\n');
}

async function seedBranchWorkingDays() {
  console.log('📅 Seeding branch working days...');

  const [branches] = await pool.execute('SELECT id FROM branches');

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  // Default: Mon-Fri 9am-5pm, Sat-Sun off
  const workingDaysConfig = {
    monday: { is_working: true, start: '09:00:00', end: '17:00:00', break: 30 },
    tuesday: { is_working: true, start: '09:00:00', end: '17:00:00', break: 30 },
    wednesday: { is_working: true, start: '09:00:00', end: '17:00:00', break: 30 },
    thursday: { is_working: true, start: '09:00:00', end: '17:00:00', break: 30 },
    friday: { is_working: true, start: '09:00:00', end: '17:00:00', break: 30 },
    saturday: { is_working: false, start: null, end: null, break: 30 },
    sunday: { is_working: false, start: null, end: null, break: 30 },
  };

  for (const branch of branches) {
    for (const day of daysOfWeek) {
      const config = workingDaysConfig[day];
      await pool.execute(
        `INSERT IGNORE INTO branch_working_days
         (branch_id, day_of_week, is_working_day, start_time, end_time, break_duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [branch.id, day, config.is_working, config.start, config.end, config.break]
      );
    }
  }

  console.log(`✅ Branch working days seeded (${branches.length * 7} records)\n`);
}

async function seedRecurringShiftAssignments() {
  console.log('🔄 Seeding recurring shift assignments...');

  // Create shift templates for different working hour scenarios
  console.log('   Creating shift templates...');

  // Template 1: Standard Working Hours (Monday to Saturday, 8:00 AM - 6:30 PM)
  const [standardTemplateResult]: any = await pool.execute(
    `INSERT INTO shift_templates
     (name, description, start_time, end_time, break_duration_minutes,
      effective_from, recurrence_pattern, recurrence_days, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, 1)`,
    ['Standard Working Hours', 'Monday to Saturday, 8:00 AM - 6:30 PM', '08:00:00', '18:30:00', 60, '2024-01-01', 'weekly', JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])]
  );
  const standardTemplateId = standardTemplateResult.insertId;
  console.log('   ✓ Created "Standard Working Hours" template (Mon-Sat, 8:00 AM - 6:30 PM)');

  // Template 2: Fasting Period Hours (Monday to Saturday, 8:00 AM - 6:00 PM)
  const [fastingTemplateResult]: any = await pool.execute(
    `INSERT INTO shift_templates
     (name, description, start_time, end_time, break_duration_minutes,
      effective_from, effective_to, recurrence_pattern, recurrence_days, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 1)`,
    ['Fasting Period Hours', 'Reduced hours during fasting period, 8:00 AM - 6:00 PM', '08:00:00', '18:00:00', 60, '2024-03-01', '2024-04-30', 'weekly', JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])]
  );
  const fastingTemplateId = fastingTemplateResult.insertId;
  console.log('   ✓ Created "Fasting Period Hours" template (Mon-Sat, 8:00 AM - 6:00 PM, Mar-Apr)');

  // Template 3: Sunday Working Hours (12:00 PM - 8:00 PM)
  const [sundayTemplateResult]: any = await pool.execute(
    `INSERT INTO shift_templates
     (name, description, start_time, end_time, break_duration_minutes,
      effective_from, recurrence_pattern, recurrence_days, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, 1)`,
    ['Sunday Working Hours', 'Sunday shift, 12:00 PM - 8:00 PM', '12:00:00', '20:00:00', 60, '2024-01-01', 'weekly', JSON.stringify(['sunday'])]
  );
  const sundayTemplateId = sundayTemplateResult.insertId;
  console.log('   ✓ Created "Sunday Working Hours" template (Sun, 12:00 PM - 8:00 PM)');

  // Template 4: Weekday Only (Monday to Friday, 9:00 AM - 5:00 PM)
  const [weekdayTemplateResult]: any = await pool.execute(
    `INSERT INTO shift_templates
     (name, description, start_time, end_time, break_duration_minutes,
      effective_from, recurrence_pattern, recurrence_days, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, 1)`,
    ['Weekday Standard', 'Monday to Friday, 9:00 AM - 5:00 PM', '09:00:00', '17:00:00', 60, '2024-01-01', 'weekly', JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])]
  );
  const weekdayTemplateId = weekdayTemplateResult.insertId;
  console.log('   ✓ Created "Weekday Standard" template (Mon-Fri, 9:00 AM - 5:00 PM)');

  // Get all active staff
  const [staff]: any = await pool.execute(
    `SELECT user_id, branch_id, employee_id FROM staff WHERE status = 'active' ORDER BY user_id LIMIT ${CONFIG.numEmployees}`
  );

  console.log(`   Found ${staff.length} active employees`);

  let assignmentCount = 0;
  let sundayWorkerCount = 0;
  let lateMondayCount = 0;
  let earlyFridayCount = 0;

  // Assign shifts to employees
  for (let i = 0; i < staff.length; i++) {
    const employee = staff[i];
    const isSundayWorker = i < CONFIG.sundayWorkers; // First 30 employees work Sundays
    const isLateMondayWorker = i % 5 === 0; // Every 5th employee has late Monday
    const isEarlyFridayWorker = i % 7 === 0; // Every 7th employee has early Friday

    // Assign Standard Working Hours (Monday to Saturday) to ALL employees
    // Using recurrence_days JSON array for efficient single-row assignment
    await pool.execute(
      `INSERT IGNORE INTO employee_shift_assignments
       (user_id, shift_template_id, effective_from, recurrence_pattern,
        recurrence_days, assignment_type, assigned_by, status, notes)
       VALUES (?, ?, '2024-01-01', 'weekly', ?, 'permanent', 1, 'active', ?)`,
      [employee.user_id, standardTemplateId, JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']), 'Standard shift - Monday to Saturday']
    );
    assignmentCount++;

    // Assign Sunday shift ONLY to designated Sunday workers
    if (isSundayWorker) {
      await pool.execute(
        `INSERT IGNORE INTO employee_shift_assignments
         (user_id, shift_template_id, effective_from, recurrence_pattern,
          recurrence_days, assignment_type, assigned_by, status, notes)
         VALUES (?, ?, '2024-01-01', 'weekly', ?, 'permanent', 1, 'active', ?)`,
        [employee.user_id, sundayTemplateId, JSON.stringify(['sunday']), 'Sunday shift worker']
      );
      assignmentCount++;
      sundayWorkerCount++;
    }

    // Special case: Late Monday (start at 10:00 instead of 08:00)
    // This demonstrates custom timing for specific days
    if (isLateMondayWorker) {
      await pool.execute(
        `INSERT IGNORE INTO employee_shift_assignments
         (user_id, custom_start_time, custom_end_time, custom_break_duration_minutes,
          effective_from, recurrence_pattern, recurrence_days,
          assignment_type, assigned_by, status, notes)
         VALUES (?, '10:00:00', '18:30:00', 60, '2024-01-01', 'weekly', ?, 'permanent', 1, 'active', ?)`,
        [employee.user_id, JSON.stringify(['monday']), 'Late Monday - starts at 10:00 AM']
      );
      assignmentCount++;
      lateMondayCount++;
      console.log(`   → Employee ${employee.user_id}: Late Monday schedule (10:00 AM - 6:30 PM)`);
    }

    // Special case: Early Friday (end at 15:00 instead of 18:30)
    // This demonstrates custom timing for specific days
    if (isEarlyFridayWorker) {
      await pool.execute(
        `INSERT IGNORE INTO employee_shift_assignments
         (user_id, custom_start_time, custom_end_time, custom_break_duration_minutes,
          effective_from, recurrence_pattern, recurrence_days,
          assignment_type, assigned_by, status, notes)
         VALUES (?, '08:00:00', '15:00:00', 30, '2024-01-01', 'weekly', ?, 'permanent', 1, 'active', ?)`,
        [employee.user_id, JSON.stringify(['friday']), 'Early Friday - ends at 3:00 PM']
      );
      assignmentCount++;
      earlyFridayCount++;
      console.log(`   → Employee ${employee.user_id}: Early Friday schedule (8:00 AM - 3:00 PM)`);
    }
  }

  console.log(`   ✓ Created ${assignmentCount} shift assignments`);
  console.log(`   ✓ Sunday workers: ${sundayWorkerCount} employees`);
  console.log(`   ✓ Late Monday workers: ${lateMondayCount} employees (custom 10:00 AM start)`);
  console.log(`   ✓ Early Friday workers: ${earlyFridayCount} employees (custom 3:00 PM end)`);
  console.log(`✅ Recurring shift assignments seeded\n`);
}

async function seedShiftAssignmentsForAllStaff() {
  console.log('📋 Seeding shift assignments for ALL staff (ensuring everyone has a shift)...');

  // Get all active staff with user info
  const [staff]: any = await pool.execute(
    `SELECT s.user_id, s.branch_id, s.employee_id, u.email 
     FROM staff s
     JOIN users u ON s.user_id = u.id
     WHERE s.status = 'active' 
     ORDER BY s.user_id`
  );

  // Get the standard template
  const [templates]: any = await pool.execute(
    `SELECT id FROM shift_templates WHERE name = 'Standard Working Hours' LIMIT 1`
  );

  if (templates.length === 0) {
    console.log('   ⚠️  Standard Working Hours template not found, skipping...\n');
    return;
  }

  const standardTemplateId = templates[0].id;
  let assignmentCount = 0;
  let updatedCount = 0;

  // Assign standard shift to EVERY staff member who doesn't have one
  for (const employee of staff) {
    // Check if employee already has an active assignment
    const [existing]: any = await pool.execute(
      `SELECT id FROM employee_shift_assignments 
       WHERE user_id = ? AND status = 'active' 
       LIMIT 1`,
      [employee.user_id]
    );

    if (existing.length === 0) {
      // No existing assignment, create one
      await pool.execute(
        `INSERT INTO employee_shift_assignments
         (user_id, shift_template_id, effective_from, effective_to, assignment_type, 
          assigned_by, status, notes)
         VALUES (?, ?, '2026-01-01', '2026-12-31', 'permanent', 1, 'active', 
          'Auto-assigned during seeding')`,
        [employee.user_id, standardTemplateId]
      );
      assignmentCount++;
      console.log(`   ✓ Assigned standard shift to ${employee.email}`);
    } else {
      updatedCount++;
    }
  }

  console.log(`   ✓ Created ${assignmentCount} new shift assignments`);
  console.log(`   ✓ ${updatedCount} employees already had assignments`);
  console.log(`✅ All staff now have shift assignments\n`);
}

async function seedAutoExceptionsForAllStaff() {
  console.log('⚠️  Seeding auto-exceptions for ALL staff (sample exceptions for testing)...');

  try {
    // Get all active staff with user info
    const [staff]: any = await pool.execute(
      `SELECT s.user_id, u.email 
       FROM staff s
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'active' 
       ORDER BY s.user_id 
       LIMIT 50` // Limit to first 50 for demo purposes
    );

    // Get exception types
    const [types]: any = await pool.execute(
      `SELECT id, code FROM shift_exception_types WHERE is_active = TRUE`
    );

    if (types.length === 0) {
      console.log('   ⚠️  No exception types found, skipping...\n');
      return;
    }

    const typeMap = types.reduce((acc: any, t: any) => {
      acc[t.code] = t.id;
      return acc;
    }, {});

    let exceptionCount = 0;
    const today = new Date();

    // Create 1-2 exceptions per staff member for the next 3 months
    for (const employee of staff) {
      const numExceptions = Math.floor(Math.random() * 2) + 1; // 1 or 2 exceptions

      for (let i = 0; i < numExceptions; i++) {
        // Random date in the next 90 days
        const exceptionDate = new Date(today);
        exceptionDate.setDate(exceptionDate.getDate() + Math.floor(Math.random() * 90) + 1);

        // Skip weekends
        if (exceptionDate.getDay() === 0 || exceptionDate.getDay() === 6) {
          continue;
        }

        // Randomly select exception type
        const exceptionTypes = ['late_start', 'early_release', 'medical_appt', 'remote_work'];
        const selectedType = exceptionTypes[Math.floor(Math.random() * exceptionTypes.length)];

        if (!typeMap[selectedType]) {
          continue;
        }

        // Set times based on exception type
        let new_start_time = '08:00:00';
        let new_end_time = '17:00:00';

        if (selectedType === 'late_start') {
          new_start_time = '10:00:00';
        } else if (selectedType === 'early_release') {
          new_end_time = '15:00:00';
        } else if (selectedType === 'medical_appt') {
          new_start_time = '09:00:00';
          new_end_time = '16:00:00';
        } else if (selectedType === 'remote_work') {
          // Same hours, just different location
        }

        await pool.execute(
          `INSERT INTO shift_exceptions
           (user_id, exception_type_id, exception_type, exception_date,
            new_start_time, new_end_time, new_break_duration_minutes,
            reason, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 1)`,
          [
            employee.user_id,
            typeMap[selectedType],
            selectedType,
            exceptionDate.toISOString().split('T')[0],
            new_start_time,
            new_end_time,
            60,
            `Auto-generated ${selectedType.replace('_', ' ')} for testing`
          ]
        );
        exceptionCount++;
      }
    }

    console.log(`   ✓ Created ${exceptionCount} sample exceptions for ${staff.length} employees`);
    console.log(`✅ Auto-exceptions seeded for testing\n`);
  } catch (error: any) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('   ⚠️  shift_exception_types table not found, skipping auto-exceptions...');
      console.log('   ℹ️  Run: npm run migrate-exception-types\n');
    } else {
      throw error;
    }
  }
}

async function seedAttendance() {
  console.log('📊 Seeding attendance records (this may take a while)...');

  const start = new Date(CONFIG.startDate);
  const end = new Date(CONFIG.endDate);
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Get staff with their shift times from employee_shift_assignments (new system)
  const [staff] = await pool.execute(`
    SELECT 
      s.user_id,
      s.branch_id,
      COALESCE(esa.custom_start_time, st.start_time, '08:00:00') as start_time,
      COALESCE(esa.custom_end_time, st.end_time, '18:30:00') as end_time
    FROM staff s
    LEFT JOIN employee_shift_assignments esa 
      ON s.user_id = esa.user_id 
      AND esa.status = 'active'
    LEFT JOIN shift_templates st 
      ON esa.shift_template_id = st.id
    WHERE s.status = 'active'
    GROUP BY s.user_id
  `);

  const [holidays] = await pool.execute('SELECT date FROM holidays');
  const holidayDates = new Set(holidays.map(h => new Date(h.date).toDateString()));
  
  let recordCount = 0;
  const batchSize = 1000;
  let batch = [];
  
  for (let day = 0; day <= totalDays; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + day);
    
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const isHoliday = holidayDates.has(currentDate.toDateString());
    
    for (const employee of staff) {
      let status;
      let checkInTime = null;
      let checkOutTime = null;
      let locationVerified = false;
      let locationCoords = null;
      
      if (isHoliday) {
        status = 'holiday';
      } else {
        const rand = Math.random();
        
        if (rand < 0.03) {
          status = 'absent';
        } else if (rand < 0.05) {
          status = 'leave';
        } else if (rand < 0.15) {
          status = 'late';
          const shiftStart = employee.start_time || '09:00:00';
          const lateMinutes = 15 + Math.floor(Math.random() * 45);
          checkInTime = addMinutesToTime(shiftStart, lateMinutes);
          checkOutTime = employee.end_time || '18:00:00';
          locationVerified = Math.random() > 0.1;
        } else if (rand < 0.17) {
          status = 'half_day';
          checkInTime = employee.start_time || '09:00:00';
          checkOutTime = '13:00:00';
          locationVerified = true;
        } else {
          status = 'present';
          const shiftStart = employee.start_time || '09:00:00';
          const earlyMinutes = Math.floor(Math.random() * 10);
          checkInTime = addMinutesToTime(shiftStart, -earlyMinutes);
          checkOutTime = employee.end_time || '18:00:00';
          locationVerified = Math.random() > 0.05;
        }
      }
      
      if (locationVerified && status !== 'holiday' && status !== 'leave' && status !== 'absent') {
        const branchId = employee.branch_id || 1;
        const [branchData] = await pool.execute(
          'SELECT location_coordinates FROM branches WHERE id = ?',
          [branchId]
        );

        if (branchData.length > 0 && branchData[0].location_coordinates) {
          const coords = branchData[0].location_coordinates.split(',');
          const baseLat = parseFloat(coords[0]);
          const baseLng = parseFloat(coords[1]);
          const variation = 0.001;
          const lng = baseLng + (Math.random() - 0.5) * variation;
          const lat = baseLat + (Math.random() - 0.5) * variation;
          locationCoords = `${lat},${lng}`;
        }
      }
      
      batch.push([
        employee.user_id,
        dateStr,
        status,
        checkInTime,
        checkOutTime,
        locationCoords,
        locationVerified ? 1 : 0,
        null,
        null,
      ]);
      
      recordCount++;
      
      if (batch.length >= batchSize) {
        await insertAttendanceBatch(batch);
        console.log(`   ✓ Processed ${recordCount} attendance records...`);
        batch = [];
      }
    }
  }
  
  if (batch.length > 0) {
    await insertAttendanceBatch(batch);
  }
  
  console.log(`✅ Attendance seeded (${recordCount} records, ${totalDays} days)\n`);
}

async function insertAttendanceBatch(batch) {
  if (batch.length === 0) return;

  const placeholders = batch.map((_, i) => {
    const locIndex = i * 9 + 5;
    return `(?, ?, ?, ?, ?, ST_GeomFromText(CONCAT('POINT(', ?, ')')), ?, ?, ?)`;
  }).join(', ');
  
  const values = [];
  for (const row of batch) {
    const [userId, date, status, checkIn, checkOut, locCoords, locVerified, locAddress, notes] = row;
    values.push(
      userId, date, status, checkIn, checkOut,
      locCoords ? locCoords.replace(',', ' ') : null,
      locVerified, locAddress, notes
    );
  }

  await pool.execute(
    `INSERT INTO attendance (user_id, date, status, check_in_time, check_out_time, location_coordinates, location_verified, location_address, notes)
     VALUES ${placeholders}`,
    values
  );
}

function addMinutesToTime(timeStr, minutes) {
  const [hours, mins, secs] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, secs);
  date.setMinutes(date.getMinutes() + minutes);
  
  const newHours = String(date.getHours()).padStart(2, '0');
  const newMins = String(date.getMinutes()).padStart(2, '0');
  const newSecs = String(date.getSeconds()).padStart(2, '0');
  
  return `${newHours}:${newMins}:${newSecs}`;
}

async function seedLeaveTypes$() {
  console.log('🏖️  Seeding leave history...');
  
  const [leaveTypes] = await pool.execute('SELECT id FROM leave_types');
  if (leaveTypes.length === 0) {
    console.log('   ⚠️  No leave types found, skipping leave history');
    return;
  }
  
  const [staff] = await pool.execute('SELECT user_id, joining_date FROM staff WHERE status = \'active\'');
  
  const leaveStatuses = ['approved', 'approved', 'approved', 'pending', 'rejected'];
  
  for (const employee of staff) {
    const numLeaves = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numLeaves; i++) {
      const joinDate = new Date(employee.joining_date);
      const startDate = randomDate(joinDate, new Date(CONFIG.endDate));
      const duration = Math.floor(Math.random() * 10) + 1;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);
      
      if (endDate > new Date(CONFIG.endDate)) {
        continue;
      }
      
      const leaveType = randomElement(leaveTypes);
      const status = randomElement(leaveStatuses);
      
      await pool.execute(
        `INSERT INTO leave_history (user_id, leave_type_id, start_date, end_date, days_taken, status, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [employee.user_id, leaveType.id, startDate, endDate, duration, status, `Leave request`]
      );
    }
  }
  
  console.log('✅ Leave history seeded\n');
}

async function seedLeaveRequests() {
  console.log('📝 Seeding leave requests...');

  const [staff]: any = await pool.execute(`
    SELECT s.user_id, s.joining_date, u.full_name
    FROM staff s
    JOIN users u ON s.user_id = u.id
    WHERE s.status = 'active'
  `);

  const [leaveTypes]: any = await pool.execute('SELECT id FROM leave_types WHERE is_active = TRUE');
  
  if (leaveTypes.length === 0) {
    console.log('   ⚠️  No leave types found, skipping leave requests');
    return;
  }

  const statuses = ['submitted', 'submitted', 'submitted', 'approved', 'approved', 'approved', 'rejected', 'cancelled'];

  let createdCount = 0;
  const batchSize = 100;
  let batch = [];

  for (const employee of staff) {
    // Each employee gets 2-5 leave requests
    const numRequests = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < numRequests; i++) {
      const leaveType = randomElement(leaveTypes);
      const status = randomElement(statuses);

      // Generate dates after joining date
      const joinDate = new Date(employee.joining_date);
      const startDate = randomDate(
        joinDate,
        new Date(CONFIG.endDate)
      );

      const duration = Math.floor(Math.random() * 10) + 1; // 1-10 days
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);

      // Don't create requests that end after our end date for approved status
      if (endDate > new Date(CONFIG.endDate) && status === 'approved') {
        continue;
      }

      const reasons = [
        'Annual vacation',
        'Family emergency',
        'Medical appointment',
        'Personal matters',
        'Rest and relaxation',
        'Family wedding',
        'Medical treatment',
        'Mental health day'
      ];

      batch.push([
        employee.user_id,
        leaveType.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        duration,
        randomElement(reasons),
        status,
        status !== 'submitted' ? Math.floor(Math.random() * 50) + 1 : null, // reviewed_by
        status !== 'submitted' ? new Date() : null, // reviewed_at
        status === 'rejected' ? 'Requires additional documentation' : null // notes
      ]);

      createdCount++;

      if (batch.length >= batchSize) {
        await insertLeaveRequestsBatch(batch);
        console.log(`   ✓ Processed ${createdCount} leave requests...`);
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    await insertLeaveRequestsBatch(batch);
  }

  console.log(`✅ Leave requests seeded (${createdCount} records)\n`);
}

async function insertLeaveRequestsBatch(batch: any[]) {
  if (batch.length === 0) return;

  const placeholders = batch.map(() =>
    '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).join(', ');

  const values = batch.flat();

  await pool.execute(
    `INSERT INTO leave_requests
     (user_id, leave_type_id, start_date, end_date, days_requested, reason, status, reviewed_by, reviewed_at, notes)
     VALUES ${placeholders}`,
    values
  );
}

async function seedLeaveAllocations() {
  console.log('🏖️  Seeding leave allocations...');

  const [staff]: any = await pool.execute(`
    SELECT s.user_id, s.joining_date, u.full_name
    FROM staff s
    JOIN users u ON s.user_id = u.id
    WHERE s.status = 'active'
  `);

  const [leaveTypes]: any = await pool.execute('SELECT id, name, days_per_year FROM leave_types WHERE is_active = TRUE');

  if (leaveTypes.length === 0) {
    console.log('   ⚠️  No leave types found, skipping allocations');
    return;
  }

  let allocationCount = 0;

  // Create allocations for 2025 and 2026
  for (const year of [2025, 2026]) {
    for (const employee of staff) {
      const joinDate = new Date(employee.joining_date);

      // Only create allocations if employee was employed during this year
      if (joinDate.getFullYear() > year) {
        continue;
      }

      for (const leaveType of leaveTypes) {
        // Calculate pro-rated days for first year
        let allocatedDays = leaveType.days_per_year;
        let carriedOverDays = 0; // DO NOT add random carried over days - this causes incorrect balances

        if (joinDate.getFullYear() === year) {
          // Pro-rate based on months worked
          const monthsWorked = 12 - joinDate.getMonth();
          allocatedDays = Math.floor((leaveType.days_per_year * monthsWorked) / 12);
        }

        // Skip adding carried over days - only add if explicitly calculated from previous year's unused balance
        // carriedOverDays = Math.floor(Math.random() * 5); // ❌ WRONG - causes incorrect balances

        // Calculate used days based on approved leave requests
        const [usedRows]: any = await pool.execute(
          `SELECT COALESCE(SUM(days_requested), 0) as used_days
           FROM leave_requests
           WHERE user_id = ? AND leave_type_id = ? AND status = 'approved'
           AND YEAR(start_date) = ?`,
          [employee.user_id, leaveType.id, year]
        );

        const calculatedUsedDays = Math.floor(parseFloat(usedRows[0].used_days));
        const totalAvailableDays = allocatedDays + carriedOverDays;
        
        // Cap used days at total available to satisfy chk_used_days constraint
        const usedDays = Math.min(calculatedUsedDays, totalAvailableDays);

        // Use cycle_start_date and cycle_end_date instead of year
        const cycleStartDate = `${year}-01-01`;
        const cycleEndDate = `${year}-12-31`;

        await pool.execute(
          `INSERT INTO leave_allocations
           (user_id, leave_type_id, cycle_start_date, cycle_end_date, allocated_days, carried_over_days, used_days)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            employee.user_id,
            leaveType.id,
            cycleStartDate,
            cycleEndDate,
            allocatedDays,
            carriedOverDays,
            usedDays
          ]
        );

        allocationCount++;
      }
    }
  }

  console.log(`✅ Leave allocations seeded (${allocationCount} records for ${staff.length} employees across 2 years)\n`);
}

async function seedForms() {
  console.log('📋 Seeding forms...');

  const formTypes = [
    {
      name: 'Employee Feedback Form',
      type: 'feedback',
      description: 'Submit feedback about workplace, management, or colleagues',
      fields: [
        { label: 'Feedback Category', type: 'dropdown', options: ['Work Environment', 'Management', 'Colleague', 'Process', 'Other'], required: true },
        { label: 'Subject', type: 'text', required: true },
        { label: 'Description', type: 'textarea', required: true },
        { label: 'Attachments', type: 'file', required: false },
      ]
    },
    {
      name: 'IT Support Request',
      type: 'application',
      description: 'Request IT support for hardware, software, or network issues',
      fields: [
        { label: 'Issue Type', type: 'dropdown', options: ['Hardware', 'Software', 'Network', 'Access', 'Other'], required: true },
        { label: 'Priority', type: 'dropdown', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
        { label: 'Description', type: 'textarea', required: true },
        { label: 'Screenshots', type: 'file', required: false },
      ]
    },
    {
      name: 'Training Request Form',
      type: 'application',
      description: 'Request approval for training, workshops, or conferences',
      fields: [
        { label: 'Training Type', type: 'dropdown', options: ['Technical', 'Soft Skills', 'Leadership', 'Compliance', 'Certification'], required: true },
        { label: 'Training Name', type: 'text', required: true },
        { label: 'Provider', type: 'text', required: true },
        { label: 'Start Date', type: 'date', required: true },
        { label: 'End Date', type: 'date', required: true },
        { label: 'Estimated Cost', type: 'number', required: true },
        { label: 'Justification', type: 'textarea', required: true },
        { label: 'Brochure/Link', type: 'file', required: false },
      ]
    },
    {
      name: 'Remote Work Request',
      type: 'application',
      description: 'Request to work remotely for a specified period',
      fields: [
        { label: 'Start Date', type: 'date', required: true },
        { label: 'End Date', type: 'date', required: true },
        { label: 'Reason', type: 'textarea', required: true },
        { label: 'Work Setup Description', type: 'textarea', required: true },
      ]
    },
    {
      name: 'Performance Appraisal',
      type: 'appraisal',
      description: 'Annual/Mid-year performance review form',
      fields: [
        { label: 'Review Period Start', type: 'date', required: true },
        { label: 'Review Period End', type: 'date', required: true },
        { label: 'Key Achievements', type: 'textarea', required: true },
        { label: 'Areas for Improvement', type: 'textarea', required: true },
        { label: 'Goals for Next Period', type: 'textarea', required: true },
        { label: 'Self Rating', type: 'dropdown', options: ['1', '2', '3', '4', '5'], required: true },
        { label: 'Supporting Documents', type: 'file', required: false },
      ]
    },
  ];

  let formCount = 0;

  for (const formConfig of formTypes) {
    // Create the form
    const [formResult]: any = await pool.execute(
      `INSERT INTO forms (name, form_type, description, is_active, created_by)
       VALUES (?, ?, ?, TRUE, 1)`,
      [formConfig.name, formConfig.type, formConfig.description]
    );

    const formId = formResult.insertId;
    formCount++;

    // Create form fields
    for (let i = 0; i < formConfig.fields.length; i++) {
      const field = formConfig.fields[i];
      await pool.execute(
        `INSERT INTO form_fields (form_id, field_name, field_label, field_type, options, is_required, field_order, placeholder, help_text)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          formId,
          field.label.toLowerCase().replace(/\s+/g, '_'), // Generate field_name from label
          field.label,
          field.type,
          field.options ? JSON.stringify(field.options) : null,
          field.required ? 1 : 0,
          i + 1,
          field.type === 'textarea' ? 'Enter details...' : null,
          field.type === 'file' ? 'Upload supporting documents' : null
        ]
      );
    }

    console.log(`   ✓ Created form: ${formConfig.name}`);
  }

  console.log(`✅ Forms seeded (${formCount} forms)\n`);
}

async function seedFormSubmissions() {
  console.log('📝 Seeding form submissions...');

  const [forms]: any = await pool.execute('SELECT id, name, form_type FROM forms WHERE is_active = TRUE');
  const [staff]: any = await pool.execute('SELECT user_id, joining_date FROM staff WHERE status = \'active\'');

  if (forms.length === 0) {
    console.log('   ⚠️  No forms found, skipping submissions');
    return;
  }

  let submissionCount = 0;
  const statuses = ['submitted', 'submitted', 'submitted', 'under_review', 'approved', 'approved', 'rejected'];

  for (const form of forms) {
    // Each form gets 5-15 submissions
    const numSubmissions = Math.floor(Math.random() * 11) + 5;

    for (let i = 0; i < numSubmissions; i++) {
      const employee = randomElement(staff);
      const status = randomElement(statuses);
      const submitDate = randomDate(new Date(employee.joining_date), new Date(CONFIG.endDate));

      // Generate submission data based on form type
      let submissionData = {};

      if (form.form_type === 'feedback') {
        submissionData = {
          category: randomElement(['Work Environment', 'Management', 'Colleague', 'Process', 'Other']),
          subject: `Feedback submission ${i + 1}`,
          description: 'This is sample feedback content for testing purposes.',
        };
      } else if (form.form_type === 'application' && form.name && form.name.includes('IT Support')) {
        submissionData = {
          issue_type: randomElement(['Hardware', 'Software', 'Network', 'Access', 'Other']),
          priority: randomElement(['Low', 'Medium', 'High', 'Critical']),
          description: 'Sample IT support request description.',
        };
      } else if (form.form_type === 'application' && form.name && form.name.includes('Training')) {
        submissionData = {
          training_type: randomElement(['Technical', 'Soft Skills', 'Leadership', 'Compliance', 'Certification']),
          training_name: 'Sample Training Course',
          provider: 'Training Provider Inc.',
          start_date: submitDate.toISOString().split('T')[0],
          end_date: new Date(submitDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimated_cost: (Math.random() * 500 + 100).toFixed(2),
          justification: 'This training will help improve my skills.',
        };
      } else if (form.form_type === 'application' && form.name && form.name.includes('Remote')) {
        submissionData = {
          start_date: submitDate.toISOString().split('T')[0],
          end_date: new Date(submitDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reason: 'Need to work from home due to personal circumstances.',
          work_setup: 'I have a dedicated home office with reliable internet.',
        };
      } else if (form.form_type === 'appraisal') {
        submissionData = {
          period_start: new Date(submitDate.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          period_end: submitDate.toISOString().split('T')[0],
          achievements: 'Completed major projects, improved team productivity.',
          improvements: 'Need to work on time management skills.',
          goals: 'Lead more projects and mentor junior team members.',
          self_rating: String(Math.floor(Math.random() * 3) + 3),
        };
      }

      const [submissionResult]: any = await pool.execute(
        `INSERT INTO form_submissions
         (form_id, user_id, submission_data, status, submitted_at, reviewed_by, reviewed_at, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          form.id,
          employee.user_id,
          JSON.stringify(submissionData),
          status,
          submitDate,
          status !== 'submitted' && status !== 'under_review' ? Math.floor(Math.random() * 50) + 1 : null,
          status !== 'submitted' && status !== 'under_review' ? new Date() : null,
          status === 'rejected' ? 'Requires more information' : null
        ]
      );

      submissionCount++;

      // Add attachments to some submissions (30% chance)
      if (Math.random() < 0.3) {
        const submissionId = submissionResult.insertId;
        const numAttachments = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < numAttachments; j++) {
          const fileTypes = [
            { name: 'document.pdf', type: 'application/pdf' },
            { name: 'image.jpg', type: 'image/jpeg' },
            { name: 'report.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          ];
          const file = randomElement(fileTypes);

          await pool.execute(
            `INSERT INTO form_attachments
             (form_submission_id, field_id, file_name, file_path, file_size, mime_type)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              submissionId,
              Math.floor(Math.random() * 5) + 1, // Random field ID
              `attachment_${submissionId}_${j + 1}_${file.name}`,
              `/uploads/attachments/sample_file_${submissionCount}_${j + 1}.${file.name.split('.').pop()}`,
              Math.floor(Math.random() * 100000) + 10000,
              file.type
            ]
          );
        }
      }
    }
  }

  console.log(`✅ Form submissions seeded (${submissionCount} submissions with attachments)\n`);
}

async function seedLeaveRequestAttachments() {
  console.log('📎 Seeding leave request attachments (REQUIRED for all requests)...');

  const [leaveRequests]: any = await pool.execute(
    'SELECT id, user_id, start_date FROM leave_requests'
  );

  let attachmentCount = 0;

  // ALL leave requests MUST have at least one attachment
  for (const request of leaveRequests) {
    // Every leave request gets 1-3 attachments (REQUIRED)
    const numAttachments = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numAttachments; i++) {
      const fileTypes = [
        { name: 'medical_cert.pdf', type: 'application/pdf' },
        { name: 'supporting_letter.pdf', type: 'application/pdf' },
        { name: 'doctor_note.jpg', type: 'image/jpeg' },
        { name: 'application_letter.png', type: 'image/png' },
        { name: 'approval_form.pdf', type: 'application/pdf' },
      ];
      const file = randomElement(fileTypes);

      await pool.execute(
        `INSERT INTO form_attachments
         (leave_request_id, file_name, file_path, file_size, mime_type)
         VALUES (?, ?, ?, ?, ?)`,
        [
          request.id,
          `leave_${request.id}_attachment_${i + 1}_${file.name}`,
          `/uploads/attachments/leave_${request.id}_file_${i + 1}.${file.name.split('.').pop()}`,
          Math.floor(Math.random() * 100000) + 10000,
          file.type
        ]
      );

      attachmentCount++;
    }
  }

  console.log(`✅ Leave request attachments seeded (${attachmentCount} attachments for ${leaveRequests.length} requests - 100% coverage)\n`);
}

async function printSummary() {
  console.log('📈 Database Summary:\n');

  const tables = [
    'branches', 'users', 'staff', 'departments', 'roles',
    'holidays', 'attendance', 'leave_types',
    'leave_allocations', 'leave_requests', 'leave_history',
    'forms', 'form_submissions', 'form_attachments',
    'employee_shift_assignments', 'shift_templates', 'branch_working_days',
    'notifications', 'payroll_records', 'payroll_runs', 'payslips'
  ];

  for (const table of tables) {
    try {
      const [result] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table.padEnd(30)}: ${result[0].count.toLocaleString()} records`);
    } catch (e) {
      console.log(`   ${table.padEnd(30)}: Table not found`);
    }
  }

  // Get attendance date range
  try {
    const [minDate]: any = await pool.execute(`SELECT MIN(date) as min_date, MAX(date) as max_date FROM attendance`);
    if (minDate[0].min_date) {
      console.log(`\n   Attendance Date Range      : ${minDate[0].min_date} to ${minDate[0].max_date}`);
    }
  } catch (e) {
    // Ignore
  }

  // Get leave requests summary
  try {
    const [leaveStats]: any = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM leave_requests 
      GROUP BY status
    `);
    if (leaveStats.length > 0) {
      console.log('\n   Leave Requests by Status:');
      for (const stat of leaveStats) {
        console.log(`      ${stat.status.padEnd(15)}: ${stat.count}`);
      }
    }
  } catch (e) {
    // Ignore
  }

  console.log('\n✅ Seeding complete!\n');
  console.log('📝 Test Credentials:');
  console.log('   All employees use the same password: Password123!');
  console.log('   Create admin user manually through signup after seeding.\n');
  console.log('📊 Data Coverage:');
  console.log(`   Date Range: ${CONFIG.startDate} to ${CONFIG.endDate} (${Math.floor((new Date(CONFIG.endDate).getTime() - new Date(CONFIG.startDate).getTime()) / (1000 * 60 * 60 * 24))} days)`);
  console.log('   Leave Allocations: 2025, 2026 (cycle-based)');
  console.log('   Forms: Feedback, IT Support, Training, Remote Work, Appraisal');
  console.log('   Attachments: Form submissions and leave requests (100% coverage)');
  console.log('   Shifts: Standard hours (Mon-Sat), Sunday workers, Fasting period');
  console.log('   Holidays: Kenyan public holidays (2025-2026)');
  console.log('   Migration: Leave request cancellation fields auto-applied\n');
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');
  console.log(`Configuration:`);
  console.log(`   Date Range: ${CONFIG.startDate} to ${CONFIG.endDate}`);
  console.log(`   Branches: ${CONFIG.numBranches}`);
  console.log(`   Employees: ${CONFIG.numEmployees}`);
  console.log('');

  try {
    // First: Ensure all required migrations are applied
    await ensureLeaveRequestCancellationFields();
    
    // Clear existing transactional data
    await clearExistingData();
    
    // Seed all data
    await seedRoles();
    await seedBranches();
    await seedUsersAndStaff();
    await seedDepartments();
    await seedLeaveTypes();
    await seedHolidays();
    await seedBranchWorkingDays();
    await seedRecurringShiftAssignments();
    await seedShiftAssignmentsForAllStaff();
    await seedAutoExceptionsForAllStaff();
    await seedAttendance();
    await seedLeaveTypes$();
    await seedLeaveRequests();
    await seedLeaveAllocations();
    await seedForms();
    await seedFormSubmissions();
    await seedLeaveRequestAttachments();
    await printSummary();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase()
  .then(() => {
    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
