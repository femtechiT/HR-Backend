import { pool } from '../src/config/database.js';

async function tableExists(table: string): Promise<boolean> {
  const [rows]: any = await pool.execute(
    `SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows[0].cnt > 0;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const [rows]: any = await pool.execute(
    `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function ensureTable(sql: string, table: string) {
  if (await tableExists(table)) {
    console.log(`   ✓ Table ${table} already exists`);
    return;
  }
  try {
    await pool.execute(sql);
    console.log(`   ✅ Created table ${table}`);
  } catch (e: any) {
    console.log(`   ⚠️  Could not create ${table}: ${e.message?.substring(0, 80)}`);
  }
}

async function ensureColumn(table: string, column: string, colType: string) {
  if (await columnExists(table, column)) {
    return;
  }
  try {
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${colType}`);
    console.log(`   ✅ Added ${table}.${column}`);
  } catch (e: any) {
    console.log(`   ⚠️  Could not add ${table}.${column}: ${e.message?.substring(0, 80)}`);
  }
}

async function fixSchema() {
  console.log('🔧 Fixing database schema...\n');

  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

  // Tables that should exist
  console.log('📋 Checking tables...');

  await ensureTable(`CREATE TABLE IF NOT EXISTS leave_types (
    id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL,
    days_per_year INT NOT NULL, is_paid BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, 'leave_types');

  await ensureTable(`CREATE TABLE IF NOT EXISTS leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    leave_type_id INT NOT NULL, start_date DATE NOT NULL,
    end_date DATE NOT NULL, days_requested INT NOT NULL,
    reason TEXT NOT NULL, attachments JSON,
    status ENUM('submitted','approved','rejected','cancelled') DEFAULT 'submitted',
    reviewed_by INT, reviewed_at TIMESTAMP NULL, notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
    INDEX idx_user_id (user_id), INDEX idx_status (status)
  )`, 'leave_requests');

  await ensureTable(`CREATE TABLE IF NOT EXISTS global_attendance_settings (
    id INT PRIMARY KEY, auto_checkout_enabled BOOLEAN DEFAULT FALSE,
    auto_checkout_minutes_after_close INT DEFAULT 30,
    allow_manual_attendance_entry BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`, 'global_attendance_settings');

  await ensureTable(`CREATE TABLE IF NOT EXISTS staff_invitations (
    id INT PRIMARY KEY AUTO_INCREMENT, email VARCHAR(255) UNIQUE NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20), role_id INT NOT NULL, branch_id INT,
    department_id INT,
    status ENUM('pending','accepted','declined','expired','cancelled') DEFAULT 'pending',
    expires_at DATETIME NOT NULL, accepted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT, user_id INT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_token (token), INDEX idx_email (email)
  )`, 'staff_invitations');

  await ensureTable(`CREATE TABLE IF NOT EXISTS attendance_locations (
    id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL,
    branch_id INT, location_coordinates POINT,
    location_radius_meters INT DEFAULT 100, address VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
  )`, 'attendance_locations');

  await ensureTable(`CREATE TABLE IF NOT EXISTS form_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT, leave_request_id INT,
    form_submission_id INT, field_id INT,
    file_name VARCHAR(255) NOT NULL, file_path VARCHAR(500) NOT NULL,
    file_size INT DEFAULT 0, mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
    INDEX idx_leave_request (leave_request_id)
  )`, 'form_attachments');

  await ensureTable(`CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL,
    description TEXT, branch_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, 'departments');

  await ensureTable(`CREATE TABLE IF NOT EXISTS holidays (
    id INT PRIMARY KEY AUTO_INCREMENT, holiday_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL, branch_id INT, is_mandatory BOOLEAN DEFAULT TRUE,
    description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, 'holidays');

  await ensureTable(`CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    date DATE NOT NULL, clock_in DATETIME, clock_out DATETIME,
    status ENUM('present','absent','late','half-day','holiday','weekend','leave') DEFAULT 'present',
    notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, 'attendance');

  await ensureTable(`CREATE TABLE IF NOT EXISTS leave_allocations (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    leave_type_id INT NOT NULL, total_days INT NOT NULL,
    used_days INT DEFAULT 0, year YEAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id)
  )`, 'leave_allocations');

  await ensureTable(`CREATE TABLE IF NOT EXISTS leave_history (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    leave_request_id INT, leave_type_id INT,
    action ENUM('created','approved','rejected','cancelled') NOT NULL,
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by INT, notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE SET NULL
  )`, 'leave_history');

  await ensureTable(`CREATE TABLE IF NOT EXISTS shift_templates (
    id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL, end_time TIME NOT NULL,
    break_duration_minutes INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, 'shift_templates');

  await ensureTable(`CREATE TABLE IF NOT EXISTS employee_shift_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    shift_template_id INT, start_date DATE, end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, 'employee_shift_assignments');

  await ensureTable(`CREATE TABLE IF NOT EXISTS branch_working_days (
    id INT PRIMARY KEY AUTO_INCREMENT, branch_id INT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL, is_working_day BOOLEAN DEFAULT TRUE,
    start_time TIME, end_time TIME, break_duration_minutes INT DEFAULT 30
  )`, 'branch_working_days');

  await ensureTable(`CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL, message TEXT,
    type VARCHAR(50), is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`, 'notifications');

  await ensureTable(`CREATE TABLE IF NOT EXISTS guarantors (
    id INT PRIMARY KEY AUTO_INCREMENT, staff_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20), email VARCHAR(255),
    relationship VARCHAR(50), occupation VARCHAR(100),
    address_line_1 VARCHAR(255), city VARCHAR(100),
    state VARCHAR(100), country VARCHAR(100) DEFAULT 'Nigeria',
    guarantee_type ENUM('personal','financial','both') DEFAULT 'personal',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
  )`, 'guarantors');

  await ensureTable(`CREATE TABLE IF NOT EXISTS payroll_records (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    salary DECIMAL(12,2), payment_date DATE,
    status ENUM('pending','paid','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, 'payroll_records');

  await ensureTable(`CREATE TABLE IF NOT EXISTS performance_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NOT NULL,
    reviewer_id INT, review_date DATE,
    rating INT, notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, 'performance_reviews');

  await ensureTable(`CREATE TABLE IF NOT EXISTS forms (
    id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255) NOT NULL,
    description TEXT, is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, 'forms');

  await ensureTable(`CREATE TABLE IF NOT EXISTS form_submissions (
    id INT PRIMARY KEY AUTO_INCREMENT, form_id INT NOT NULL,
    user_id INT NOT NULL, submission_data JSON,
    status VARCHAR(50) DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, 'form_submissions');

  // Missing columns on existing tables
  console.log('\n📋 Checking columns...');

  await ensureColumn('branches', 'auto_mark_absent_enabled',   `BOOLEAN DEFAULT TRUE`);
  await ensureColumn('branches', 'auto_mark_absent_time',      `VARCHAR(5) DEFAULT '12:00'`);
  await ensureColumn('branches', 'auto_mark_absent_timezone',  `VARCHAR(50) DEFAULT 'Africa/Lagos'`);
  await ensureColumn('branches', 'attendance_lock_date',       `DATE NULL`);
  await ensureColumn('branches', 'attendance_mode',            `VARCHAR(50) DEFAULT 'branch_based'`);
  await ensureColumn('branches', 'location_coordinates',       `VARCHAR(255) NULL`);
  await ensureColumn('branches', 'location_radius_meters',     `INT DEFAULT 100`);

  await ensureColumn('users', 'must_change_password',  `BOOLEAN DEFAULT FALSE`);
  await ensureColumn('users', 'date_of_birth',         `DATE NULL`);
  await ensureColumn('users', 'profile_picture',       `VARCHAR(500) NULL`);

  await ensureColumn('staff', 'assigned_location_id',  `INT NULL`);
  await ensureColumn('staff', 'course_of_study',       `VARCHAR(255) NULL`);
  await ensureColumn('staff', 'nationality',           `VARCHAR(100) NULL`);
  await ensureColumn('staff', 'state_of_origin',       `VARCHAR(100) NULL`);
  await ensureColumn('staff', 'lga',                   `VARCHAR(100) NULL`);
  await ensureColumn('staff', 'religion',              `VARCHAR(100) NULL`);

  // Insert default row for global_attendance_settings
  if (await tableExists('global_attendance_settings')) {
    try {
      await pool.execute(`INSERT IGNORE INTO global_attendance_settings (id) VALUES (1)`);
    } catch (_) {}
  }

  // Add early_departure to attendance.status ENUM if not already present
  if (await tableExists('attendance')) {
    try {
      const [enumCheck]: any = await pool.execute(
        `SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance' AND COLUMN_NAME = 'status'`
      );
      if (enumCheck.length > 0 && !enumCheck[0].COLUMN_TYPE.includes('early_departure')) {
        await pool.execute(`ALTER TABLE attendance MODIFY COLUMN status ENUM('present','absent','late','half_day','leave','holiday','holiday-working','weekend','early_departure') NOT NULL DEFAULT 'absent'`);
        console.log('   ✅ Added early_departure to attendance.status ENUM');
      }
    } catch (e: any) {
      console.log(`   ⚠️  Could not update ENUM: ${e.message?.substring(0, 80)}`);
    }
  }

  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

  console.log('\n✅ Schema fix complete!');
}

fixSchema()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌ Fix failed:', e); process.exit(1); });
