-- ============================================================================
-- FEMTECH HR MANAGEMENT SYSTEM - COMPLETE DATABASE MIGRATIONS
-- ============================================================================
-- This file contains all migrations combined for faster setup
-- Run this ONCE during initial setup
-- ============================================================================


-- ============================================================================
-- Migration: 001_create_roles_table.sql
-- ============================================================================

-- Migration: Create roles table
-- Description: Creates the roles table for storing user roles and permissions

CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name)
);

-- ============================================================================
-- Migration: 002_create_branches_table.sql
-- ============================================================================

-- Migration: Create branches table
-- Description: Creates the branches table for storing company branches

CREATE TABLE IF NOT EXISTS branches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_user_id INT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_status (status)
);

-- ============================================================================
-- Migration: 003_create_users_table.sql
-- ============================================================================

-- Migration: Create users table
-- Description: Creates the users table for storing user accounts

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role_id INT NOT NULL,
  branch_id INT,
  status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_email (email),
  INDEX idx_role_id (role_id),
  INDEX idx_branch_id (branch_id)
);

-- ============================================================================
-- Migration: 004_create_staff_table.sql
-- ============================================================================

-- Migration: Create staff table
-- Description: Creates the staff table for storing employee records linked to users

CREATE TABLE IF NOT EXISTS staff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  employee_id VARCHAR(50) UNIQUE,
  designation VARCHAR(255),
  department VARCHAR(255),
  branch_id INT,
  joining_date DATE,
  employment_type ENUM('full_time', 'part_time', 'contract', 'temporary') DEFAULT 'full_time',
  status ENUM('active', 'inactive', 'terminated', 'on_leave') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_department (department),
  INDEX idx_branch_id (branch_id),
  INDEX idx_status (status)
);

-- ============================================================================
-- Migration: 005_create_roles_permissions_table.sql
-- ============================================================================

-- Migration: Create roles_permissions junction table
-- Description: Creates the junction table for many-to-many relationship between roles and permissions

CREATE TABLE IF NOT EXISTS roles_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission VARCHAR(255) NOT NULL,
  allow_deny ENUM('allow', 'deny') DEFAULT 'allow',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission),
  INDEX idx_role_id (role_id),
  INDEX idx_permission (permission)
);

-- ============================================================================
-- Migration: 006_create_staff_documents_table.sql
-- ============================================================================

-- Migration: Create staff_documents table
-- Description: Creates the staff_documents table for storing employee document records

CREATE TABLE IF NOT EXISTS staff_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INT,
  verified_at TIMESTAMP NULL,
  
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_document_type (document_type),
  INDEX idx_expiry_date (expiry_date)
);

-- ============================================================================
-- Migration: 007_create_staff_addresses_table.sql
-- ============================================================================

-- Migration: Create staff_addresses table
-- Description: Creates the staff_addresses table for storing employee addresses

CREATE TABLE IF NOT EXISTS staff_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  address_type ENUM('permanent', 'current', 'emergency_contact') NOT NULL,
  street_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Nigeria',
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  INDEX idx_staff_id (staff_id),
  INDEX idx_address_type (address_type),
  INDEX idx_city (city),
  INDEX idx_state (state)
);

-- ============================================================================
-- Migration: 008_create_forms_table.sql
-- ============================================================================

-- Migration: Create forms table
-- Description: Creates the forms table for storing form definitions

CREATE TABLE IF NOT EXISTS forms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  form_type ENUM('leave_request', 'appraisal', 'application', 'feedback', 'custom', 'general') NOT NULL,
  branch_id INT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  INDEX idx_form_type (form_type),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 009_create_form_fields_table.sql
-- ============================================================================

-- Migration: Create form_fields table
-- Description: Creates the form_fields table for storing individual fields within forms

CREATE TABLE IF NOT EXISTS form_fields (
  id INT PRIMARY KEY AUTO_INCREMENT,
  form_id INT NOT NULL,
  field_name VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type ENUM('text', 'email', 'number', 'date', 'textarea', 'dropdown', 'checkbox', 'file', 'phone', 'address') NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  placeholder VARCHAR(255),
  help_text TEXT,
  validation_rule VARCHAR(500),
  options JSON,
  field_order INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  UNIQUE KEY uk_form_field_name (form_id, field_name),
  INDEX idx_field_order (field_order)
);

-- ============================================================================
-- Migration: 010_create_form_submissions_table.sql
-- ============================================================================

-- Migration: Create form_submissions table
-- Description: Creates the form_submissions table for storing submitted form data

CREATE TABLE IF NOT EXISTS form_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  form_id INT NOT NULL,
  user_id INT NOT NULL,
  submission_data JSON NOT NULL,
  status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected') DEFAULT 'submitted',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (form_id) REFERENCES forms(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_form_id_user_id_status (form_id, user_id, status),
  INDEX idx_submitted_at (submitted_at)
);

-- ============================================================================
-- Migration: 013_create_user_permissions_table.sql
-- ============================================================================

-- Migration: Create user_permissions table
-- Description: Creates the user_permissions table for storing individual user permissions

CREATE TABLE IF NOT EXISTS user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  permission VARCHAR(255) NOT NULL,
  allow_deny ENUM('allow', 'deny') DEFAULT 'allow',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission),
  INDEX idx_user_id (user_id),
  INDEX idx_permission (permission)
);

-- ============================================================================
-- Migration: 014_create_leave_types_table.sql
-- ============================================================================

-- Migration: Create leave_types table
-- Description: Creates the leave_types table for defining different types of leave

CREATE TABLE IF NOT EXISTS leave_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  days_per_year INT DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  allow_carryover BOOLEAN DEFAULT FALSE,
  carryover_limit INT DEFAULT 0,
  expiry_rule_id INT, -- Will reference leave_expiry_rules once that table is created
  created_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 015_create_leave_expiry_rules_table.sql
-- ============================================================================

-- Migration: Create leave_expiry_rules table
-- Description: Creates the leave_expiry_rules table for defining expiry rules for leave types

CREATE TABLE IF NOT EXISTS leave_expiry_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  expire_after_days INT DEFAULT 365,
  trigger_notification_days JSON, -- Array of days before expiry to notify (e.g., [30, 14, 7, 1])
  auto_expire_action ENUM('forfeit', 'carryover', 'extend') DEFAULT 'forfeit',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_name (name)
);

-- ============================================================================
-- Migration: 016_create_leave_allocations_table.sql
-- ============================================================================

-- Migration: Create leave_allocations table
-- Description: Creates the leave_allocations table for tracking leave allocations to staff

CREATE TABLE IF NOT EXISTS leave_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL, -- Will reference leave_types once that table is created
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  allocated_days DECIMAL(5,2) NOT NULL,
  used_days DECIMAL(5,2) DEFAULT 0.00,
  carried_over_days DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_leave_type (user_id, leave_type_id),
  INDEX idx_cycle_dates (cycle_start_date, cycle_end_date)
);

-- ============================================================================
-- Migration: 017_create_leave_history_table.sql
-- ============================================================================

-- Migration: Create leave_history table
-- Description: Creates the leave_history table for tracking leave usage history

CREATE TABLE IF NOT EXISTS leave_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL, -- Will reference leave_types once that table is created
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_taken DECIMAL(5,2) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approved_at TIMESTAMP NULL,
  requested_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  INDEX idx_user_dates (user_id, start_date, end_date),
  INDEX idx_approved_at (approved_at),
  INDEX idx_status (status)
);

-- ============================================================================
-- Migration: 019_create_attendance_table.sql
-- ============================================================================

-- Migration: Create attendance table
-- Description: Creates the attendance table for tracking staff attendance with location verification

CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'half_day', 'leave', 'holiday') DEFAULT 'absent',
  check_in_time TIME NULL,
  check_out_time TIME NULL,
  location_coordinates POINT NULL, -- Stores GPS coordinates (lat, lng)
  location_verified BOOLEAN DEFAULT FALSE, -- Whether location was verified against geofence
  location_address TEXT, -- Human-readable address for verification
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_date (user_id, date),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- ============================================================================
-- Migration: 020_create_shift_timings_table.sql
-- ============================================================================

-- Migration: Create shift_timings table
-- Description: Creates the shift_timings table for managing staff work schedules

CREATE TABLE IF NOT EXISTS shift_timings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL, -- NULL means applies to all staff, specific ID means individual override
  shift_name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL, -- Standard start time (e.g., '09:00:00')
  end_time TIME NOT NULL, -- Standard end time (e.g., '17:00:00')
  effective_from DATE NOT NULL,
  effective_to DATE NULL, -- NULL means indefinite
  override_branch_id INT NULL, -- Specific branch override
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (override_branch_id) REFERENCES branches(id),
  INDEX idx_user_effective (user_id, effective_from, effective_to),
  INDEX idx_branch (override_branch_id)
);

-- ============================================================================
-- Migration: 021_create_holidays_table.sql
-- ============================================================================

-- Migration: Create holidays table
-- Description: Creates the holidays table for managing company and branch-specific holidays

CREATE TABLE IF NOT EXISTS holidays (
  id INT PRIMARY KEY AUTO_INCREMENT,
  holiday_name VARCHAR(200) NOT NULL,
  date DATE NOT NULL,
  branch_id INT NULL, -- NULL means company-wide holiday, specific ID means branch-specific
  is_mandatory BOOLEAN DEFAULT TRUE, -- Whether this is a mandatory day off
  description TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_date (date),
  INDEX idx_branch (branch_id),
  INDEX idx_holiday_name (holiday_name)
);

-- ============================================================================
-- Migration: 022_add_location_to_branches_table.sql
-- ============================================================================

-- Migration: Add location coordinates to branches table
-- Description: Adds GPS coordinates to branches for attendance location verification

ALTER TABLE branches
ADD COLUMN IF NOT EXISTS location_coordinates VARCHAR(255) COMMENT 'GPS coordinates (latitude, longitude) for geofencing',
ADD COLUMN IF NOT EXISTS location_radius_meters INT DEFAULT 100 COMMENT 'Radius in meters for geofencing around branch location',
ADD COLUMN IF NOT EXISTS attendance_mode ENUM('branch_based', 'multiple_locations') DEFAULT 'branch_based' COMMENT 'Attendance verification mode for this branch';

-- ============================================================================
-- Migration: 023_create_attendance_locations_table.sql
-- ============================================================================

-- Migration: Create attendance_locations table
-- Description: Creates the attendance_locations table for managing multiple approved attendance locations

CREATE TABLE IF NOT EXISTS attendance_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  location_coordinates POINT NOT NULL, -- GPS coordinates (lat, lng)
  location_radius_meters INT DEFAULT 100, -- Radius in meters for geofencing
  branch_id INT NULL, -- Associated branch (optional)
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  SPATIAL INDEX(location_coordinates), -- Spatial index for geographic queries
  INDEX idx_active (is_active)
);

-- ============================================================================
-- Migration: 024_create_audit_logs_table.sql
-- ============================================================================

CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT NULL,
    before_data JSON NULL,
    after_data JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Migration: 025_create_payment_types_table.sql
-- ============================================================================

-- Migration: Create payment_types table
-- Description: Creates the payment_types table for defining different payment components (earnings, deductions, taxes, benefits)

CREATE TABLE IF NOT EXISTS payment_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  payment_category ENUM('earning', 'deduction', 'tax', 'benefit') NOT NULL,
  calculation_type ENUM('fixed', 'percentage', 'formula') NOT NULL DEFAULT 'fixed',
  formula TEXT, -- Stores formula for complex calculations
  applies_to_all BOOLEAN DEFAULT FALSE, -- Whether this applies to all staff by default
  created_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_category (payment_category),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 026_create_staff_payment_structure_table.sql
-- ============================================================================

-- Migration: Create staff_payment_structure table
-- Description: Creates the staff_payment_structure table for assigning payment types to staff with specific values

CREATE TABLE IF NOT EXISTS staff_payment_structure (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  payment_type_id INT NOT NULL,
  value DECIMAL(10, 2) NOT NULL, -- Amount for fixed payments or percentage for percentage-based
  effective_from DATE NOT NULL,
  effective_to DATE NULL, -- NULL means ongoing
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES staff(id),
  FOREIGN KEY (payment_type_id) REFERENCES payment_types(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_payment_type_id (payment_type_id),
  INDEX idx_effective_dates (effective_from, effective_to)
);

-- ============================================================================
-- Migration: 027_create_payroll_runs_table.sql
-- ============================================================================

-- Migration: Create payroll_runs table
-- Description: Creates the payroll_runs table for tracking payroll execution runs

CREATE TABLE IF NOT EXISTS payroll_runs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  month INT NOT NULL, -- 1-12
  year INT NOT NULL, -- 4-digit year
  branch_id INT, -- Optional: run payroll for specific branch
  status ENUM('draft', 'processing', 'completed', 'cancelled') DEFAULT 'draft',
  run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2), -- Total amount for this payroll run
  processed_by INT, -- User who ran the payroll
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (processed_by) REFERENCES users(id),
  INDEX idx_month_year (month, year),
  INDEX idx_branch_id (branch_id),
  INDEX idx_status (status),
  UNIQUE KEY uk_month_year_branch (month, year, branch_id)
);

-- ============================================================================
-- Migration: 028_create_payroll_records_table.sql
-- ============================================================================

-- Migration: Create payroll_records table
-- Description: Creates the payroll_records table for storing calculated payroll data per employee

CREATE TABLE IF NOT EXISTS payroll_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_run_id INT NOT NULL,
  staff_id INT NOT NULL,
  earnings JSON, -- JSON object containing earning components: { basic_salary: 50000, hra: 15000, ... }
  deductions JSON, -- JSON object containing deduction components: { pf: 6000, tds: 3000, ... }
  gross_pay DECIMAL(12, 2) NOT NULL,
  total_deductions DECIMAL(12, 2) NOT NULL,
  net_pay DECIMAL(12, 2) NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  INDEX idx_payroll_run_id (payroll_run_id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_processed_at (processed_at)
);

-- ============================================================================
-- Migration: 029_add_must_change_password_to_users.sql
-- ============================================================================

ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE AFTER status;

-- ============================================================================
-- Migration: 030_create_departments_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  branch_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- ============================================================================
-- Migration: 031_create_metrics_library_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS metrics_library (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  data_type ENUM('numeric', 'percentage', 'boolean', 'rating') NOT NULL,
  formula TEXT,
  data_source VARCHAR(255),
  categories JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 032_create_kpi_definitions_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS kpi_definitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  formula TEXT,
  weight DECIMAL(5,2) DEFAULT 0.00,
  metric_ids JSON,
  categories JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 033_create_appraisal_templates_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS appraisal_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  kpi_ids JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_created_by (created_by),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 034_create_targets_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kpi_id INT NOT NULL,
  employee_id INT NOT NULL,
  department_id INT NULL,
  template_id INT NULL,
  target_type ENUM('minimum', 'standard', 'stretch') NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id),
  FOREIGN KEY (employee_id) REFERENCES staff(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (template_id) REFERENCES appraisal_templates(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_kpi_id (kpi_id),
  INDEX idx_template_id (template_id)
);

-- ============================================================================
-- Migration: 035_create_kpi_assignments_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS kpi_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  kpi_definition_id INT NOT NULL,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  assigned_by INT NOT NULL,
  custom_target_value DECIMAL(10,2) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (kpi_definition_id) REFERENCES kpi_definitions(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_kpi_definition_id (kpi_definition_id)
);

-- ============================================================================
-- Migration: 036_create_kpi_scores_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS kpi_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kpi_assignment_id INT NOT NULL,
  calculated_value DECIMAL(10,2) NOT NULL,
  achievement_percentage DECIMAL(5,2) NOT NULL,
  weighted_score DECIMAL(5,2) NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  manually_overridden BOOLEAN DEFAULT FALSE,
  override_value DECIMAL(10,2) NULL,
  override_reason TEXT NULL,
  override_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kpi_assignment_id) REFERENCES kpi_assignments(id),
  FOREIGN KEY (override_by) REFERENCES users(id),
  INDEX idx_kpi_assignment_id (kpi_assignment_id),
  INDEX idx_calculated_at (calculated_at)
);

-- ============================================================================
-- Migration: 037_create_appraisal_cycles_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS appraisal_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES appraisal_templates(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_template_id (template_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
);

-- ============================================================================
-- Migration: 038_create_appraisal_assignments_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS appraisal_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  appraisal_cycle_id INT NOT NULL,
  status ENUM('pending', 'in_progress', 'submitted', 'reviewed', 'completed') DEFAULT 'pending',
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES staff(id),
  FOREIGN KEY (appraisal_cycle_id) REFERENCES appraisal_cycles(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_appraisal_cycle_id (appraisal_cycle_id),
  INDEX idx_status (status)
);

-- ============================================================================
-- Migration: 039_create_performance_scores_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  kpi_id INT NOT NULL,
  template_id INT NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  achieved_value DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculated_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES staff(id),
  FOREIGN KEY (kpi_id) REFERENCES kpi_definitions(id),
  FOREIGN KEY (template_id) REFERENCES appraisal_templates(id),
  FOREIGN KEY (calculated_by) REFERENCES users(id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_kpi_id (kpi_id),
  INDEX idx_template_id (template_id),
  INDEX idx_calculated_at (calculated_at)
);

-- ============================================================================
-- Migration: 040_create_payslips_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS payslips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payroll_record_id INT NOT NULL,
  staff_id INT NOT NULL,
  pdf_url VARCHAR(500),
  generated_by INT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (payroll_record_id) REFERENCES payroll_records(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- ============================================================================
-- Migration: 041_create_payslip_details_table.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS payslip_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payslip_id INT NOT NULL,
  earning_item VARCHAR(255) NOT NULL,
  earning_amount DECIMAL(10,2) NOT NULL,
  deduction_item VARCHAR(255) NOT NULL,
  deduction_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payslip_id) REFERENCES payslips(id)
);

-- ============================================================================
-- Migration: 042_add_updated_at_to_roles_permissions.sql
-- ============================================================================

-- Migration: Add updated_at column to roles_permissions table
-- Description: Adds updated_at column to roles_permissions table for proper timestamp tracking

ALTER TABLE roles_permissions 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================================================
-- Migration: 043_create_notification_templates_table.sql
-- ============================================================================

-- Migration: Create notification_templates table
-- Description: Creates the notification_templates table for storing dynamic notification templates

CREATE TABLE IF NOT EXISTS notification_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  subject_template TEXT,
  channel ENUM('email', 'push', 'in_app', 'sms') DEFAULT 'email',
  variables JSON, -- JSON array of variable names used in the template
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_name (name),
  INDEX idx_channel (channel),
  INDEX idx_enabled (enabled)
);

-- ============================================================================
-- Migration: 044_create_user_notification_preferences_table.sql
-- ============================================================================

-- Migration: Create user_notification_preferences table
-- Description: Creates the user_notification_preferences table for storing user notification preferences

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  channels JSON, -- JSON array of preferred channels ['email', 'push', 'in_app', 'sms']
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_notification_type (user_id, notification_type),
  INDEX idx_user_id (user_id),
  INDEX idx_notification_type (notification_type)
);

-- ============================================================================
-- Migration: 045_create_notification_queue_table.sql
-- ============================================================================

-- Migration: Create notification_queue table
-- Description: Creates the notification_queue table for storing pending notifications

CREATE TABLE IF NOT EXISTS notification_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_user_id INT NOT NULL,
  template_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  subject TEXT,
  channel ENUM('email', 'push', 'in_app', 'sms') DEFAULT 'email',
  recipient_data JSON, -- JSON object containing recipient details (email, device tokens, etc.)
  payload JSON, -- JSON object containing template variables and other data
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processing_attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  status ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (recipient_user_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES notification_templates(id),
  INDEX idx_status (status),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_recipient_user_id (recipient_user_id),
  INDEX idx_notification_type (notification_type),
  INDEX idx_priority (priority)
);

-- ============================================================================
-- Migration: 046_create_device_registrations_table.sql
-- ============================================================================

-- Migration: Create device_registrations table
-- Description: Creates the device_registrations table for storing user device information for push notifications

CREATE TABLE IF NOT EXISTS device_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_token VARCHAR(500) NOT NULL, -- FCM token or similar
  device_type ENUM('mobile', 'tablet', 'desktop') DEFAULT 'mobile',
  platform ENUM('ios', 'android', 'web') NOT NULL,
  app_version VARCHAR(50),
  os_version VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_device_token (device_token),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_platform (platform)
);

-- ============================================================================
-- Migration: 047_insert_notification_templates.sql
-- ============================================================================

-- Populate notification_templates table with default templates

-- Leave request confirmation template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_request_confirmation', 'Leave Request Submitted', 'Dear {staff_name},<br><br>Your leave request for {leave_type} from {start_date} to {end_date} ({days} days) has been successfully submitted.<br><br>Reference Number: {request_id}<br>Status: Pending Approval<br><br>You will be notified once your request has been reviewed.', 'Leave Request Confirmation - {company_name}', 'email', '["staff_name", "leave_type", "start_date", "end_date", "days", "request_id", "company_name"]', TRUE);

-- Leave request approval template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_request_approved', 'Leave Request Approved', 'Dear {staff_name},<br><br>Your leave request for {leave_type} from {start_date} to {end_date} ({days} days) has been approved.<br><br>Approved by: {approver_name}<br>Approval Date: {approval_date}<br>Reference Number: {request_id}<br><br>Please plan accordingly and ensure your duties are covered during your absence.', 'Leave Request Approved - {company_name}', 'email', '["staff_name", "leave_type", "start_date", "end_date", "days", "approver_name", "approval_date", "request_id", "company_name"]', TRUE);

-- Leave request rejection template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_request_rejected', 'Leave Request Rejected', 'Dear {staff_name},<br><br>Unfortunately, your leave request for {leave_type} from {start_date} to {end_date} ({days} days) has been rejected.<br><br>Rejected by: {approver_name}<br>Rejection Date: {rejection_date}<br>Reason: {rejection_reason}<br>Reference Number: {request_id}<br><br>Please contact your manager for more information.', 'Leave Request Rejected - {company_name}', 'email', '["staff_name", "leave_type", "start_date", "end_date", "days", "approver_name", "rejection_date", "rejection_reason", "request_id", "company_name"]', TRUE);

-- Leave expiry warning template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_expiry_warning', 'Leave Balance Expiring Soon', 'Dear {staff_name},<br><br>This is to inform you that {days_remaining} days of your {leave_type} leave balance will expire on {expiry_date}.<br><br>If you do not utilize these days before the expiry date, they will be forfeited according to company policy.<br><br>Please plan to use these days or contact HR if you have any questions.', 'Leave Balance Expiring Soon - {company_name}', 'email', '["staff_name", "days_remaining", "leave_type", "expiry_date", "company_name"]', TRUE);

-- Payroll ready template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('payroll_ready', 'Your Payroll for {pay_period} is Ready', 'Dear {staff_name},<br><br>Your payroll for {pay_period} has been processed and is now available.<br><br>Net Pay: {net_pay}<br>Pay Date: {pay_date}<br><br>You can view and download your payslip from the employee portal.', 'Payroll for {pay_period} Available - {company_name}', 'email', '["staff_name", "pay_period", "net_pay", "pay_date", "company_name"]', TRUE);

-- Appraisal reminder template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('appraisal_reminder', 'Appraisal Cycle Reminder', 'Dear {staff_name},<br><br>This is a reminder that the {appraisal_cycle} appraisal cycle is ongoing.<br><br>Deadline: {deadline}<br><br>Please complete your self-assessment and submit any required documentation through the employee portal.<br><br>Contact HR if you need assistance.', 'Appraisal Cycle Reminder - {company_name}', 'email', '["staff_name", "appraisal_cycle", "deadline", "company_name"]', TRUE);

-- System announcement template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('system_announcement', 'System Announcement: {announcement_title}', 'Dear {recipient_name},<br><br>{announcement_body}<br><br>This announcement was made on {announcement_date} by {announcer_name}.<br><br>Please comply with the instructions provided.', 'System Announcement: {announcement_title}', 'email', '["recipient_name", "announcement_title", "announcement_body", "announcement_date", "announcer_name"]', TRUE);

-- Password change required template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('password_change_required', 'Password Change Required', 'Dear {staff_name},<br><br>For security purposes, you are required to change your password.<br><br>This is mandatory and must be completed by {deadline}.<br><br>Please log in to the system and navigate to Profile > Change Password to update your credentials.', 'Action Required: Password Change - {company_name}', 'email', '["staff_name", "deadline", "company_name"]', TRUE);

-- Welcome email template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('welcome_email', 'Welcome to {company_name}, {staff_name}!', 'Dear {staff_name},<br><br>Welcome to {company_name}! We are excited to have you as part of our team.<br><br>Your account has been created with the following details:<br>Email: {work_email}<br><br>Please log in to the HR portal using your credentials and complete your profile information.<br><br>If you have any questions, feel free to reach out to HR.', 'Welcome to {company_name}!', 'email', '["staff_name", "company_name", "work_email"]', TRUE);

-- ============================================================================
-- Migration: 048_create_job_postings_table.sql
-- ============================================================================

-- Migration: Create job_postings table
-- Description: Creates the job_postings table for storing job listings

CREATE TABLE IF NOT EXISTS job_postings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  department_id INT,
  location VARCHAR(255),
  salary_range_min DECIMAL(10,2),
  salary_range_max DECIMAL(10,2),
  employment_type ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary') DEFAULT 'full_time',
  experience_level ENUM('entry', 'mid', 'senior', 'executive'),
  posted_by INT NOT NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closing_date DATE NOT NULL,
  start_date DATE,
  application_deadline DATE NOT NULL,
  status ENUM('draft', 'open', 'closed', 'filled') DEFAULT 'draft',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (posted_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_closing_date (closing_date),
  INDEX idx_department_id (department_id),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 049_create_job_applications_table.sql
-- ============================================================================

-- Migration: Create job_applications table
-- Description: Creates the job_applications table for storing job applications

CREATE TABLE IF NOT EXISTS job_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_posting_id INT NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(20),
  resume_file_path VARCHAR(500),
  cover_letter TEXT,
  application_status ENUM('applied', 'under_review', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn') DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  hired_at TIMESTAMP NULL,
  hired_by INT NULL,
  rejection_reason TEXT,
  offer_accepted BOOLEAN DEFAULT NULL,
  offer_accepted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (hired_by) REFERENCES users(id),
  INDEX idx_job_posting_id (job_posting_id),
  INDEX idx_application_status (application_status),
  INDEX idx_applicant_email (applicant_email),
  INDEX idx_applied_at (applied_at)
);

-- ============================================================================
-- Migration: 050_create_application_comments_table.sql
-- ============================================================================

-- Migration: Create application_comments table
-- Description: Creates the application_comments table for storing comments on job applications

CREATE TABLE IF NOT EXISTS application_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_application_id INT NOT NULL,
  commented_by INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (job_application_id) REFERENCES job_applications(id),
  FOREIGN KEY (commented_by) REFERENCES users(id),
  INDEX idx_job_application_id (job_application_id),
  INDEX idx_commented_by (commented_by),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- Migration: 051_insert_recruitment_notification_templates.sql
-- ============================================================================

-- Migration: Insert recruitment notification templates
-- Description: Adds notification templates for recruitment-related emails

-- Application confirmation template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('job_application_confirmation', 'Application Received for {job_title}', 'Dear {applicant_name},<br><br>Thank you for applying for the position of <strong>{job_title}</strong> at {company_name}.<br><br>We have received your application and our recruitment team will review it shortly. You will be notified about the next steps in the process.<br><br>Application Reference: {application_reference}<br>Applied on: {application_date}<br><br>Best regards,<br>The {company_name} Recruitment Team', 'Application Received for {job_title} - {company_name}', 'email', '["applicant_name", "job_title", "company_name", "application_reference", "application_date"]', TRUE);

-- Application shortlisted template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('job_application_shortlisted', 'Your Application Has Been Shortlisted', 'Dear {applicant_name},<br><br>We are pleased to inform you that your application for the position of <strong>{job_title}</strong> has been shortlisted.<br><br>We would like to invite you for an interview. Please find the details below:<br><br>Interview Date: {interview_date}<br>Interview Time: {interview_time}<br>Location: {interview_location}<br>Contact Person: {contact_person}<br><br>Please confirm your attendance by replying to this email.<br><br>Best regards,<br>The {company_name} Recruitment Team', 'Application Shortlisted for {job_title} - {company_name}', 'email', '["applicant_name", "job_title", "interview_date", "interview_time", "interview_location", "contact_person", "company_name"]', TRUE);

-- Application rejected template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('job_application_rejected', 'Update on Your Application Status', 'Dear {applicant_name},<br><br>Thank you for your interest in the position of <strong>{job_title}</strong> at {company_name}.<br><br>After careful consideration of all applications, we regret to inform you that your application has not been successful at this time. We encourage you to apply for other positions that may match your qualifications in the future.<br><br>We appreciate the time you invested in applying and wish you success in your career endeavors.<br><br>Best regards,<br>The {company_name} Recruitment Team', 'Application Update for {job_title} - {company_name}', 'email', '["applicant_name", "job_title", "company_name"]', TRUE);

-- Job offer template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('job_offer', 'Job Offer for {job_title}', 'Dear {applicant_name},<br><br>We are pleased to offer you the position of <strong>{job_title}</strong> at {company_name}.<br><br>Position Details:<br>Start Date: {start_date}<br>Salary: {salary}<br>Employment Type: {employment_type}<br>Reporting Manager: {reporting_manager}<br><br>Please review the attached offer letter and confirm your acceptance by {acceptance_deadline}.<br><br>We look forward to welcoming you to our team!<br><br>Best regards,<br>{offer_from_name}<br>{offer_from_position}<br>{company_name}', 'Job Offer for {job_title} - {company_name}', 'email', '["applicant_name", "job_title", "company_name", "start_date", "salary", "employment_type", "reporting_manager", "acceptance_deadline", "offer_from_name", "offer_from_position"]', TRUE);

-- Interview reminder template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('interview_reminder', 'Reminder: Interview for {job_title}', 'Dear {applicant_name},<br><br>This is a reminder about your upcoming interview for the position of <strong>{job_title}</strong>.<br><br>Interview Details:<br>Date: {interview_date}<br>Time: {interview_time}<br>Location: {interview_location}<br>Contact Person: {contact_person}<br><br>Please arrive 10 minutes prior to the scheduled time. If you need to reschedule, please contact us at least 24 hours in advance.<br><br>Best regards,<br>The {company_name} Recruitment Team', 'Interview Reminder for {job_title} - {company_name}', 'email', '["applicant_name", "job_title", "interview_date", "interview_time", "interview_location", "contact_person", "company_name"]', TRUE);

-- Application withdrawn template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('application_withdrawn_acknowledgment', 'Application Withdrawal Acknowledged', 'Dear {applicant_name},<br><br>We have received your request to withdraw your application for the position of <strong>{job_title}</strong>.<br><br>Your application has been successfully withdrawn from our recruitment process. If you change your mind or wish to apply for other positions, please feel free to do so.<br><br>Thank you for considering {company_name} as a potential employer.<br><br>Best regards,<br>The {company_name} Recruitment Team', 'Application Withdrawal Acknowledged - {company_name}', 'email', '["applicant_name", "job_title", "company_name"]', TRUE);

-- ============================================================================
-- Migration: 052_create_shift_templates_table.sql
-- ============================================================================

-- Migration: Create shift_templates table
-- Description: Creates the shift_templates table for storing recurring schedule patterns

CREATE TABLE IF NOT EXISTS shift_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INT DEFAULT 0,
  effective_from DATE NOT NULL,
  effective_to DATE,
  recurrence_pattern ENUM('daily', 'weekly', 'monthly', 'custom') DEFAULT 'weekly',
  recurrence_days JSON, -- JSON array of days (e.g., ["monday", "tuesday"] or [1, 3, 5])
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_is_active (is_active),
  INDEX idx_effective_dates (effective_from, effective_to)
);

-- ============================================================================
-- Migration: 053_create_employee_shift_assignments_table.sql
-- ============================================================================

-- Migration: Create employee_shift_assignments table
-- Description: Creates the employee_shift_assignments table for assigning schedules to employees

CREATE TABLE IF NOT EXISTS employee_shift_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  shift_template_id INT,
  custom_start_time TIME,
  custom_end_time TIME,
  custom_break_duration_minutes INT DEFAULT 0,
  effective_from DATE NOT NULL,
  effective_to DATE,
  assignment_type ENUM('permanent', 'temporary', 'rotating') DEFAULT 'permanent',
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  status ENUM('pending', 'approved', 'active', 'expired', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (shift_template_id) REFERENCES shift_templates(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  UNIQUE KEY unique_active_assignment (user_id, status),
  INDEX idx_user_id (user_id),
  INDEX idx_shift_template_id (shift_template_id),
  INDEX idx_effective_dates (effective_from, effective_to),
  INDEX idx_status (status)
);

-- ============================================================================
-- Migration: 054_create_shift_exceptions_table.sql
-- ============================================================================

-- Migration: Create shift_exceptions table
-- Description: Creates the shift_exceptions table for temporary schedule changes

CREATE TABLE IF NOT EXISTS shift_exceptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  shift_assignment_id INT,
  exception_date DATE NOT NULL,
  exception_type ENUM('early_release', 'late_start', 'day_off', 'special_schedule', 'holiday_work') NOT NULL,
  original_start_time TIME,
  original_end_time TIME,
  new_start_time TIME,
  new_end_time TIME,
  new_break_duration_minutes INT DEFAULT 0,
  reason TEXT,
  approved_by INT,
  approved_at TIMESTAMP NULL,
  status ENUM('pending', 'approved', 'rejected', 'active', 'expired') DEFAULT 'pending',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (shift_assignment_id) REFERENCES employee_shift_assignments(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_exception_date (exception_date),
  INDEX idx_status (status),
  INDEX idx_created_by (created_by)
);

-- ============================================================================
-- Migration: 055_create_time_off_banks_table.sql
-- ============================================================================

-- Migration: Create time_off_banks table
-- Description: Creates the time_off_banks table for tracking compensatory time

CREATE TABLE IF NOT EXISTS time_off_banks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  description TEXT,
  total_entitled_days DECIMAL(5,2) NOT NULL,
  used_days DECIMAL(5,2) DEFAULT 0.00,
  available_days DECIMAL(5,2) GENERATED ALWAYS AS (total_entitled_days - used_days) STORED,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_program_name (program_name),
  INDEX idx_valid_dates (valid_from, valid_to),
  CONSTRAINT chk_available_days CHECK (available_days >= 0)
);

-- ============================================================================
-- Migration: 056_create_schedule_requests_table.sql
-- ============================================================================

-- Migration: Create schedule_requests table
-- Description: Creates the schedule_requests table for employee self-service schedule requests

CREATE TABLE IF NOT EXISTS schedule_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  request_type ENUM('time_off_request', 'schedule_change', 'shift_swap', 'flexible_arrangement', 'compensatory_time_use') NOT NULL,
  request_subtype VARCHAR(100), -- e.g., 'early_release', 'late_start', 'day_off_choice'
  requested_date DATE,
  requested_start_time TIME,
  requested_end_time TIME,
  requested_duration_days DECIMAL(5,2), -- For multi-day requests
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled', 'implemented') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejected_by INT,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT,
  scheduled_for DATE, -- When the change should take effect
  expires_on DATE, -- When the request is no longer valid
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_request_type (request_type),
  INDEX idx_status (status),
  INDEX idx_requested_date (requested_date),
  INDEX idx_scheduled_for (scheduled_for)
);

-- ============================================================================
-- Migration: 057_create_schedule_approval_hierarchies_table.sql
-- ============================================================================

-- Migration: Create schedule_approval_hierarchies table
-- Description: Creates the schedule_approval_hierarchies table for defining approval workflows

CREATE TABLE IF NOT EXISTS schedule_approval_hierarchies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_type ENUM('time_off_request', 'schedule_change', 'shift_swap', 'flexible_arrangement', 'compensatory_time_use') NOT NULL,
  approval_level INT NOT NULL,
  approver_role_id INT,
  approver_user_id INT,
  approver_branch_id INT,
  approver_department_id INT,
  min_entitlement_days DECIMAL(5,2), -- Minimum days that require this level of approval
  max_entitlement_days DECIMAL(5,2), -- Maximum days that this level can approve
  requires_direct_manager BOOLEAN DEFAULT FALSE,
  approval_sequence INT NOT NULL, -- Order in which approvals are required
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (approver_role_id) REFERENCES roles(id),
  FOREIGN KEY (approver_user_id) REFERENCES users(id),
  FOREIGN KEY (approver_branch_id) REFERENCES branches(id),
  FOREIGN KEY (approver_department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_request_type (request_type),
  INDEX idx_approval_level (approval_level),
  INDEX idx_approval_sequence (approval_sequence),
  INDEX idx_is_active (is_active)
);

-- ============================================================================
-- Migration: 058_add_shift_fields_to_attendance_table.sql
-- ============================================================================

-- Migration: Add shift-related fields to attendance table
-- Description: Adds fields to track attendance against dynamic schedules

-- Add scheduled_start_time column (without checking if exists, assuming it doesn't)
ALTER TABLE attendance ADD COLUMN scheduled_start_time TIME NULL COMMENT 'Scheduled start time based on employee shift';

-- Add scheduled_end_time column
ALTER TABLE attendance ADD COLUMN scheduled_end_time TIME NULL COMMENT 'Scheduled end time based on employee shift';

-- Add scheduled_break_duration_minutes column
ALTER TABLE attendance ADD COLUMN scheduled_break_duration_minutes INT DEFAULT 0 COMMENT 'Scheduled break duration based on employee shift';

-- Add is_late column
ALTER TABLE attendance ADD COLUMN is_late BOOLEAN DEFAULT NULL COMMENT 'Whether the employee was late based on their scheduled start time';

-- Add is_early_departure column
ALTER TABLE attendance ADD COLUMN is_early_departure BOOLEAN DEFAULT NULL COMMENT 'Whether the employee left early based on their scheduled end time';

-- Add actual_working_hours column
ALTER TABLE attendance ADD COLUMN actual_working_hours DECIMAL(4,2) DEFAULT NULL COMMENT 'Actual working hours after deducting break time';

-- ============================================================================
-- Migration: 060_add_date_of_birth_to_users_table.sql
-- ============================================================================

-- Migration: Add date_of_birth column to users table
-- Description: Adds date of birth column to users table for birthday notifications

ALTER TABLE users ADD COLUMN date_of_birth DATE NULL COMMENT 'Date of birth for birthday notifications';

-- ============================================================================
-- Migration: 061_create_report_templates_table.sql
-- ============================================================================

-- Migration: Create report_templates table
-- Description: Creates the report_templates table for storing report configurations

CREATE TABLE IF NOT EXISTS report_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('attendance', 'leave', 'payroll', 'performance', 'staff', 'custom') DEFAULT 'custom',
  query_definition TEXT NOT NULL, -- SQL query or stored procedure name
  parameters_schema JSON, -- JSON schema defining required parameters
  output_format ENUM('json', 'csv', 'excel', 'pdf') DEFAULT 'json',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active),
  INDEX idx_created_by (created_by)
);

-- ============================================================================
-- Migration: 062_create_scheduled_reports_table.sql
-- ============================================================================

-- Migration: Create scheduled_reports table
-- Description: Creates the scheduled_reports table for recurring report generation

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_template_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'custom') DEFAULT 'monthly',
  schedule_config JSON, -- JSON configuration for custom schedules
  recipients JSON, -- JSON array of user IDs or email addresses to receive the report
  parameters JSON, -- JSON object of parameters to pass to the report
  next_run_date DATETIME,
  last_run_date DATETIME,
  last_run_status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (report_template_id) REFERENCES report_templates(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_report_template_id (report_template_id),
  INDEX idx_next_run_date (next_run_date),
  INDEX idx_last_run_status (last_run_status),
  INDEX idx_created_by (created_by)
);

-- ============================================================================
-- Migration: 063_create_report_cache_table.sql
-- ============================================================================

-- Migration: Create report_cache table
-- Description: Creates the report_cache table for storing cached report results

CREATE TABLE IF NOT EXISTS report_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_template_id INT NOT NULL,
  cache_key VARCHAR(500) NOT NULL, -- Unique identifier for cached report (includes parameters)
  cached_result JSON NOT NULL, -- Cached report data
  expires_at TIMESTAMP NOT NULL, -- When the cache expires
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (report_template_id) REFERENCES report_templates(id),
  UNIQUE KEY unique_cache_key (cache_key),
  INDEX idx_expires_at (expires_at),
  INDEX idx_report_template_id (report_template_id)
);

-- ============================================================================
-- Migration: 064_create_analytics_metrics_table.sql
-- ============================================================================

-- Migration: Create analytics_metrics table
-- Description: Creates the analytics_metrics table for storing calculated metrics

CREATE TABLE IF NOT EXISTS analytics_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_name VARCHAR(255) NOT NULL,
  metric_category ENUM('attendance', 'leave', 'payroll', 'performance', 'staff', 'productivity') NOT NULL,
  metric_value DECIMAL(10, 2) NOT NULL,
  metric_unit VARCHAR(50), -- e.g., percentage, count, currency
  calculated_at DATE NOT NULL, -- Date for which the metric was calculated
  calculated_for_period ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
  calculated_by INT,
  branch_id INT, -- Optional: metric for specific branch
  department_id INT, -- Optional: metric for specific department
  calculated_from DATETIME, -- Start date of calculation period
  calculated_to DATETIME, -- End date of calculation period
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (calculated_by) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY unique_metric_per_period (metric_name, calculated_at, branch_id, department_id),
  INDEX idx_metric_name (metric_name),
  INDEX idx_metric_category (metric_category),
  INDEX idx_calculated_at (calculated_at),
  INDEX idx_branch_id (branch_id),
  INDEX idx_department_id (department_id)
);

-- ============================================================================
-- Migration: 065_create_report_exports_table.sql
-- ============================================================================

-- Migration: Create report_exports table
-- Description: Creates the report_exports table for tracking report exports

CREATE TABLE IF NOT EXISTS report_exports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_template_id INT NOT NULL,
  exported_by INT NOT NULL,
  export_format ENUM('pdf', 'excel', 'csv') NOT NULL,
  export_parameters JSON, -- JSON object of parameters used for the export
  file_path VARCHAR(500), -- Path to the exported file
  file_size_bytes INT, -- Size of the exported file in bytes
  export_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  export_error TEXT, -- Error message if export failed
  exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- When the export file will be cleaned up

  FOREIGN KEY (report_template_id) REFERENCES report_templates(id),
  FOREIGN KEY (exported_by) REFERENCES users(id),
  INDEX idx_exported_by (exported_by),
  INDEX idx_export_format (export_format),
  INDEX idx_export_status (export_status),
  INDEX idx_exported_at (exported_at)
);

-- ============================================================================
-- Migration: 066_create_analytics_metrics_table_corrected.sql
-- ============================================================================

-- Migration: Create analytics_metrics table
-- Description: Creates the analytics_metrics table for storing calculated metrics

CREATE TABLE IF NOT EXISTS analytics_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_name VARCHAR(255) NOT NULL,
  metric_category ENUM('attendance', 'leave', 'payroll', 'performance', 'staff', 'productivity', 'compliance') NOT NULL,
  metric_value DECIMAL(10, 2) NOT NULL,
  metric_unit VARCHAR(50), -- e.g., percentage, count, currency
  calculated_at DATE NOT NULL, -- Date when the metric was calculated
  calculated_for_period VARCHAR(50) NOT NULL, -- e.g., 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  calculated_from DATE NOT NULL, -- Start date of calculation period
  calculated_to DATE NOT NULL, -- End date of calculation period
  calculated_by INT, -- User who calculated the metric (could be system user)
  branch_id INT, -- Optional: metric for specific branch
  department_id INT, -- Optional: metric for specific department
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (calculated_by) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_metric_name (metric_name),
  INDEX idx_metric_category (metric_category),
  INDEX idx_calculated_at (calculated_at),
  INDEX idx_branch_id (branch_id),
  INDEX idx_department_id (department_id),
  INDEX idx_calculated_for_period (calculated_for_period)
);

-- ============================================================================
-- Migration: 067_add_birthday_notification_templates.sql
-- ============================================================================

-- Migration: Add birthday notification templates
-- Description: Adds notification templates for birthday reminders

-- Insert birthday reminder template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled)
VALUES (
  'birthday_reminder',
  'Upcoming Birthday Reminder',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;"><h2 style="color: #333; text-align: center;">🎂 Upcoming Birthday Alert</h2><p style="font-size: 16px; color: #555;">Dear HR Team,</p><p style="font-size: 16px; color: #555;">This is to inform you that <strong>{{employee_name}}</strong> ({{employee_id}}) has a birthday coming up tomorrow, <strong>{{tomorrow_date}}</strong>.</p><div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;"><h3 style="margin-top: 0; color: #333;">Employee Details:</h3><p><strong>Name:</strong> {{employee_name}}</p><p><strong>Employee ID:</strong> {{employee_id}}</p><p><strong>Designation:</strong> {{designation}}</p><p><strong>Department:</strong> {{department}}</p><p><strong>Branch:</strong> {{branch}}</p></div><p style="font-size: 16px; color: #555;">Please consider sending birthday wishes to make them feel valued as part of our team.</p><p style="font-size: 16px; color: #555;">Best regards,<br/>The {{company_name}} HR Management System</p></div>',
  'Birthday Reminder: {{employee_name}} - Tomorrow ({{tomorrow_date}})',
  'email',
  JSON_ARRAY('employee_name', 'employee_id', 'designation', 'department', 'branch', 'tomorrow_date', 'company_name'),
  TRUE
)
ON DUPLICATE KEY UPDATE
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  subject_template = VALUES(subject_template),
  channel = VALUES(channel),
  variables = VALUES(variables),
  enabled = VALUES(enabled);

-- Insert birthday summary template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled)
VALUES (
  'birthday_summary',
  'Daily Birthday Summary',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;"><h2 style="color: #333; text-align: center;">🎂 Daily Birthday Summary</h2><p style="font-size: 16px; color: #555;">Dear HR Team,</p><p style="font-size: 16px; color: #555;">Here are the birthdays happening tomorrow, <strong>{{date}}</strong>.</p><ul style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; list-style-type: none; padding-left: 0;">{% for birthday in birthday_list %}<li style="padding: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;"><span><strong>{{birthday.name}}</strong> ({{birthday.id}})</span><span>{{birthday.designation}}, {{birthday.department}}</span></li>{% endfor %}</ul><p style="font-size: 16px; color: #555;">Please consider sending birthday wishes to make them feel valued as part of our team.</p><p style="font-size: 16px; color: #555;">Best regards,<br/>The {{company_name}} HR Management System</p></div>',
  'Birthday Summary for Tomorrow ({{date}}) - {{company_name}}',
  'email',
  JSON_ARRAY('date', 'birthday_list', 'company_name'),
  TRUE
)
ON DUPLICATE KEY UPDATE
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  subject_template = VALUES(subject_template),
  channel = VALUES(channel),
  variables = VALUES(variables),
  enabled = VALUES(enabled);

-- ============================================================================
-- Migration: 068_create_notification_logs_table.sql
-- ============================================================================

-- Migration: Create notification_logs table
-- Description: Creates the notification_logs table for storing notification delivery audit logs

CREATE TABLE IF NOT EXISTS notification_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_user_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel ENUM('email', 'push', 'in_app', 'sms') DEFAULT 'email',
  related_entity_type VARCHAR(50), -- e.g., 'leave_request', 'payroll', 'appraisal'
  related_entity_id INT,           -- ID of the related entity
  sent_at TIMESTAMP NULL,
  delivery_status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  external_id VARCHAR(255),        -- External ID from email service provider
  opened_at TIMESTAMP NULL,        -- When the notification was opened/read
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (recipient_user_id) REFERENCES users(id),
  INDEX idx_recipient_user_id (recipient_user_id),
  INDEX idx_notification_type (notification_type),
  INDEX idx_delivery_status (delivery_status),
  INDEX idx_sent_at (sent_at),
  INDEX idx_related_entity (related_entity_type, related_entity_id)
);

-- ============================================================================
-- Migration: 069_create_api_keys_table.sql
-- ============================================================================

-- Migration: Create API Keys table
-- Description: Creates the api_keys table for managing API access to the HR system

CREATE TABLE IF NOT EXISTS api_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  api_key VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key (changed from 'key' to avoid reserved word)
  name VARCHAR(255) NOT NULL, -- Descriptive name for the key
  user_id INT NOT NULL, -- Foreign key to users table
  permissions TEXT NOT NULL, -- JSON array of permissions granted to this key (using TEXT instead of JSON for compatibility)
  is_active BOOLEAN DEFAULT TRUE, -- Whether the key is active
  expires_at TIMESTAMP NULL, -- Optional expiration date
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_api_key (api_key),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
);

-- ============================================================================
-- Migration: 070_enhance_staff_table_with_additional_fields.sql
-- ============================================================================

-- Migration: Enhance staff table with additional fields
-- Description: Adds comprehensive fields for professional, payroll, personal, and asset tracking

-- Add the new columns first (excluding updated_at which needs separate handling)
ALTER TABLE staff
ADD COLUMN reporting_manager_id INT NULL,
ADD COLUMN work_mode ENUM('onsite', 'remote', 'hybrid') DEFAULT 'onsite',
ADD COLUMN bank_name VARCHAR(255),
ADD COLUMN bank_account_number VARCHAR(50),
ADD COLUMN bank_ifsc_code VARCHAR(50),
ADD COLUMN tax_identification_number VARCHAR(50),
ADD COLUMN base_salary DECIMAL(10, 2),
ADD COLUMN pay_grade VARCHAR(50),
ADD COLUMN pension_insurance_id VARCHAR(50),
ADD COLUMN emergency_contact_name VARCHAR(255),
ADD COLUMN emergency_contact_phone VARCHAR(20),
ADD COLUMN emergency_contact_relationship VARCHAR(100),
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender ENUM('male', 'female', 'other'),
ADD COLUMN current_address_id INT NULL,
ADD COLUMN permanent_address_id INT NULL,
ADD COLUMN company_assets JSON,
ADD COLUMN primary_skills TEXT,
ADD COLUMN education_certifications JSON,
ADD COLUMN employee_photo VARCHAR(500),
ADD COLUMN probation_end_date DATE,
ADD COLUMN contract_end_date DATE,
ADD COLUMN weekly_working_hours DECIMAL(4, 2) DEFAULT 40.00,
ADD COLUMN overtime_eligibility BOOLEAN DEFAULT TRUE,
ADD COLUMN medical_insurance_id VARCHAR(50),
ADD COLUMN provident_fund_id VARCHAR(50),
ADD COLUMN gratuity_applicable BOOLEAN DEFAULT TRUE,
ADD COLUMN notice_period_days INT DEFAULT 30,
ADD COLUMN work_email VARCHAR(255),
ADD COLUMN personal_email VARCHAR(255),
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN alternate_phone_number VARCHAR(20),
ADD COLUMN marital_status ENUM('single', 'married', 'divorced', 'widowed') DEFAULT 'single',
ADD COLUMN blood_group VARCHAR(5),
ADD COLUMN allergies TEXT,
ADD COLUMN special_medical_notes TEXT,
ADD COLUMN highest_qualification VARCHAR(100),
ADD COLUMN university_school VARCHAR(255),
ADD COLUMN year_of_graduation YEAR,
ADD COLUMN professional_certifications TEXT,
ADD COLUMN certifications_json JSON,
ADD COLUMN languages_known JSON,
ADD COLUMN notice_period_start_date DATE,
ADD COLUMN notice_period_end_date DATE,
ADD COLUMN relieving_date DATE,
ADD COLUMN experience_years DECIMAL(4, 2),
ADD COLUMN previous_company VARCHAR(255),
ADD COLUMN resignation_date DATE,
ADD COLUMN last_working_date DATE,
ADD COLUMN reason_for_leaving TEXT,
ADD COLUMN reference_check_status ENUM('pending', 'cleared', 'failed') DEFAULT 'pending',
ADD COLUMN background_verification_status ENUM('pending', 'cleared', 'failed') DEFAULT 'pending';

-- Modify the updated_at column separately to preserve its trigger behavior if any
ALTER TABLE staff MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add foreign key constraint for reporting manager (after the column exists)
ALTER TABLE staff
ADD CONSTRAINT fk_reporting_manager
FOREIGN KEY (reporting_manager_id) REFERENCES staff(id) ON DELETE SET NULL;

-- Add foreign key constraints for address references
ALTER TABLE staff 
ADD CONSTRAINT fk_current_address 
FOREIGN KEY (current_address_id) REFERENCES staff_addresses(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_permanent_address 
FOREIGN KEY (permanent_address_id) REFERENCES staff_addresses(id) ON DELETE SET NULL;

-- Update indexes
CREATE INDEX idx_work_mode ON staff(work_mode);
CREATE INDEX idx_date_of_birth ON staff(date_of_birth);
CREATE INDEX idx_gender ON staff(gender);
CREATE INDEX idx_probation_end_date ON staff(probation_end_date);
CREATE INDEX idx_contract_end_date ON staff(contract_end_date);
CREATE INDEX idx_resignation_date ON staff(resignation_date);
CREATE INDEX idx_last_working_date ON staff(last_working_date);
CREATE INDEX idx_reporting_manager ON staff(reporting_manager_id);

-- ============================================================================
-- Migration: 071_create_staff_dynamic_fields_table.sql
-- ============================================================================

-- Migration: Create staff_dynamic_fields table
-- Description: Creates a table for admin-defined custom fields for staff profiles

CREATE TABLE IF NOT EXISTS staff_dynamic_fields (
  id INT PRIMARY KEY AUTO_INCREMENT,
  field_name VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type ENUM('text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'radio', 'textarea', 'file', 'email', 'phone') NOT NULL,
  field_options JSON, -- For select, multiselect, radio options
  required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_field_name (field_name),
  INDEX idx_field_type (field_type),
  INDEX idx_is_active (is_active),
  INDEX idx_created_by (created_by)
);

-- ============================================================================
-- Migration: 072_create_staff_dynamic_field_values_table.sql
-- ============================================================================

-- Migration: Create staff_dynamic_field_values table
-- Description: Creates a table to store values for dynamic fields per staff member

CREATE TABLE IF NOT EXISTS staff_dynamic_field_values (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  field_id INT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES staff_dynamic_fields(id) ON DELETE CASCADE,
  UNIQUE KEY uk_staff_field (staff_id, field_id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_field_id (field_id)
);

-- ============================================================================
-- Migration: 073_create_staff_skills_table.sql
-- ============================================================================

-- Migration: Create staff_skills table
-- Description: Creates a table to store skills for staff members

CREATE TABLE IF NOT EXISTS staff_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
  years_of_experience DECIMAL(4, 2),
  certification_status ENUM('none', 'certified', 'in_progress') DEFAULT 'none',
  last_used_date DATE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  INDEX idx_staff_id (staff_id),
  INDEX idx_skill_name (skill_name),
  INDEX idx_proficiency_level (proficiency_level)
);

-- ============================================================================
-- Migration: 074_create_company_assets_table.sql
-- ============================================================================

-- Migration: Create company_assets table
-- Description: Creates a table to track company assets assigned to staff

CREATE TABLE IF NOT EXISTS company_assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_tag VARCHAR(100) UNIQUE NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(255),
  specifications TEXT,
  purchase_date DATE,
  warranty_expiry_date DATE,
  asset_condition ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
  asset_status ENUM('available', 'assigned', 'maintenance', 'disposed') DEFAULT 'available',
  assigned_to_staff_id INT NULL,
  assigned_date DATE,
  returned_date DATE,
  asset_image VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (assigned_to_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_asset_tag (asset_tag),
  INDEX idx_asset_type (asset_type),
  INDEX idx_assigned_to_staff (assigned_to_staff_id),
  INDEX idx_asset_status (asset_status)
);

-- ============================================================================
-- Migration: 075_create_attendance_settings_table.sql
-- ============================================================================

-- Migration: Create attendance_settings table
-- Description: Creates the attendance_settings table for storing branch-specific attendance configurations

CREATE TABLE IF NOT EXISTS attendance_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  require_check_in BOOLEAN DEFAULT TRUE,
  require_check_out BOOLEAN DEFAULT TRUE,
  auto_checkout_enabled BOOLEAN DEFAULT FALSE,
  auto_checkout_minutes_after_close INT DEFAULT 30,
  allow_manual_attendance_entry BOOLEAN DEFAULT TRUE,
  allow_future_attendance_entry BOOLEAN DEFAULT FALSE,
  grace_period_minutes INT DEFAULT 0,
  enable_location_verification BOOLEAN DEFAULT TRUE,
  enable_face_recognition BOOLEAN DEFAULT FALSE,
  enable_biometric_verification BOOLEAN DEFAULT FALSE,
  notify_absent_employees BOOLEAN DEFAULT TRUE,
  notify_supervisors_daily_summary BOOLEAN DEFAULT TRUE,
  enable_weekend_attendance BOOLEAN DEFAULT FALSE,
  enable_holiday_attendance BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_branch_settings (branch_id)
);

-- ============================================================================
-- Migration: 076_create_global_attendance_settings_table.sql
-- ============================================================================

-- Migration: Create global_attendance_settings table
-- Description: Creates the global_attendance_settings table for storing system-wide attendance configurations

CREATE TABLE IF NOT EXISTS global_attendance_settings (
  id INT PRIMARY KEY,
  auto_checkout_enabled BOOLEAN DEFAULT FALSE,
  auto_checkout_minutes_after_close INT DEFAULT 30,
  allow_manual_attendance_entry BOOLEAN DEFAULT TRUE,
  allow_future_attendance_entry BOOLEAN DEFAULT FALSE,
  grace_period_minutes INT DEFAULT 0,
  enable_face_recognition BOOLEAN DEFAULT FALSE,
  enable_biometric_verification BOOLEAN DEFAULT FALSE,
  notify_absent_employees BOOLEAN DEFAULT TRUE,
  notify_supervisors_daily_summary BOOLEAN DEFAULT TRUE,
  enable_weekend_attendance BOOLEAN DEFAULT FALSE,
  enable_holiday_attendance BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default global settings
INSERT IGNORE INTO global_attendance_settings (id) VALUES (1);

-- ============================================================================
-- Migration: 077_create_leave_requests_table.sql
-- ============================================================================

-- Migration: Create leave_requests table
-- Description: Dedicated table for leave requests (replaces form_submissions approach)

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INT NOT NULL,
  reason TEXT NOT NULL,
  attachments JSON COMMENT 'Array of attachment objects {name, url, size}',
  status ENUM('submitted', 'approved', 'rejected', 'cancelled') DEFAULT 'submitted',
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_leave_type_id (leave_type_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
);


-- ============================================================================
-- Migration: 078_add_recurring_shift_fields.sql
-- ============================================================================

-- Migration: Add recurring shift fields to employee_shift_assignments
-- Description: Enhances employee_shift_assignments table to support recurring weekly shift patterns
--              This enables use cases like "Resume Late every Monday" or "Close Early every Wednesday"
--              on a per-staff basis

-- Add recurrence_pattern column
ALTER TABLE employee_shift_assignments
ADD COLUMN recurrence_pattern ENUM('none', 'daily', 'weekly', 'monthly') DEFAULT 'none'
AFTER assignment_type;

-- Add recurrence_day_of_week column
ALTER TABLE employee_shift_assignments
ADD COLUMN recurrence_day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
AFTER recurrence_pattern;

-- Add recurrence_day_of_month column (for monthly patterns like "first Monday of every month")
ALTER TABLE employee_shift_assignments
ADD COLUMN recurrence_day_of_month INT
AFTER recurrence_day_of_week;

-- Add recurrence_end_date column
ALTER TABLE employee_shift_assignments
ADD COLUMN recurrence_end_date DATE
AFTER recurrence_day_of_month;

-- Add index for efficient recurring shift queries
ALTER TABLE employee_shift_assignments
ADD INDEX idx_recurrence_pattern (recurrence_pattern, recurrence_day_of_week, recurrence_end_date);

-- Add index for user-specific recurring shifts
ALTER TABLE employee_shift_assignments
ADD INDEX idx_user_recurrence (user_id, recurrence_pattern, recurrence_day_of_week);

-- Update existing permanent assignments to have recurrence_pattern = 'none'
UPDATE employee_shift_assignments 
SET recurrence_pattern = 'none' 
WHERE assignment_type = 'permanent' AND recurrence_pattern IS NULL;

-- Update existing temporary assignments to have recurrence_pattern = 'none'
UPDATE employee_shift_assignments 
SET recurrence_pattern = 'none' 
WHERE assignment_type = 'temporary' AND recurrence_pattern IS NULL;

-- Update existing rotating assignments to have recurrence_pattern = 'weekly'
UPDATE employee_shift_assignments 
SET recurrence_pattern = 'weekly' 
WHERE assignment_type = 'rotating' AND recurrence_pattern IS NULL;


-- ============================================================================
-- Migration: 079_add_expiry_columns_to_leave_allocations.sql
-- ============================================================================

-- Migration: Add expiry tracking columns to leave_allocations
-- Description: Adds columns needed for leave expiry processing

ALTER TABLE leave_allocations
ADD COLUMN expiry_rule_id INT,
ADD COLUMN processed_for_expiry TIMESTAMP NULL;

ALTER TABLE leave_allocations
ADD FOREIGN KEY (expiry_rule_id) REFERENCES leave_expiry_rules(id);

CREATE INDEX idx_leave_allocations_expiry ON leave_allocations(expiry_rule_id, processed_for_expiry);


-- ============================================================================
-- Migration: 079_add_recurrence_days_to_assignments.sql
-- ============================================================================

-- Migration: Add recurrence_days JSON column to employee_shift_assignments
-- Description: Adds recurrence_days JSON column for flexible weekly recurring shift patterns
--              This complements the existing recurrence_day_of_week ENUM column

-- Add recurrence_days JSON column
ALTER TABLE employee_shift_assignments
ADD COLUMN recurrence_days JSON
AFTER recurrence_pattern;

-- Update existing weekly assignments to have recurrence_days based on recurrence_day_of_week
UPDATE employee_shift_assignments
SET recurrence_days = JSON_ARRAY(recurrence_day_of_week)
WHERE recurrence_pattern = 'weekly' AND recurrence_day_of_week IS NOT NULL;

-- Set recurrence_days to NULL for non-weekly patterns
UPDATE employee_shift_assignments
SET recurrence_days = NULL
WHERE recurrence_pattern != 'weekly';


-- ============================================================================
-- Migration: 080_add_leave_allocation_constraints.sql
-- ============================================================================

-- Migration: Add constraints to leave_allocations table
-- Description: Prevents invalid data and duplicate allocations

-- Add check constraint to prevent used_days exceeding allocated + carried_over
ALTER TABLE leave_allocations
ADD CONSTRAINT chk_used_days CHECK (used_days <= allocated_days + carried_over_days);

-- Add unique constraint to prevent duplicate allocations for same user/leave_type/cycle
ALTER TABLE leave_allocations
ADD CONSTRAINT uniq_user_leave_cycle UNIQUE (user_id, leave_type_id, cycle_start_date, cycle_end_date);


-- ============================================================================
-- Migration: 080_create_shift_exception_types_table.sql
-- ============================================================================

-- Migration: Create shift_exception_types table
-- Description: Creates a dynamic table for managing shift exception types
--              Allows admins to create custom exception types instead of hardcoded ENUM

CREATE TABLE IF NOT EXISTS shift_exception_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,                    -- e.g., "Medical Appointment"
  code VARCHAR(50) NOT NULL UNIQUE,              -- e.g., "medical_appt"
  description TEXT,                               -- e.g., "For medical/doctor appointments"
  icon VARCHAR(50) DEFAULT 'AlertCircle',        -- Icon name from lucide-react
  color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',  -- Tailwind color classes
  default_start_time TIME,                        -- Optional: Suggested start time
  default_end_time TIME,                          -- Optional: Suggested end time
  default_break_duration INT DEFAULT 60,          -- Default break duration in minutes
  is_active BOOLEAN DEFAULT TRUE,                 -- Can be disabled but not deleted
  is_system BOOLEAN DEFAULT FALSE,                -- System types can't be deleted
  sort_order INT DEFAULT 0,                       -- Display order
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_sort_order (sort_order)
);

-- Insert default exception types
INSERT INTO shift_exception_types (name, code, description, icon, color, is_system, sort_order) VALUES
('Late Start', 'late_start', 'Employee starts later than their scheduled time', 'Clock', 'bg-blue-100 text-blue-700', TRUE, 1),
('Early Release', 'early_release', 'Employee leaves earlier than their scheduled time', 'Clock', 'bg-amber-100 text-amber-700', TRUE, 2),
('Day Off', 'day_off', 'Employee is not required to work on this date', 'Calendar', 'bg-red-100 text-red-700', TRUE, 3),
('Special Schedule', 'special_schedule', 'Custom schedule for this specific date', 'Settings', 'bg-purple-100 text-purple-700', TRUE, 4),
('Holiday Work', 'holiday_work', 'Employee is scheduled to work on a holiday', 'Calendar', 'bg-green-100 text-green-700', TRUE, 5),
('Medical Appointment', 'medical_appt', 'Medical or doctor appointment', 'Stethoscope', 'bg-pink-100 text-pink-700', TRUE, 6),
('Remote Work', 'remote_work', 'Working from a different location', 'Wifi', 'bg-indigo-100 text-indigo-700', TRUE, 7),
('Training', 'training', 'Attending training or professional development', 'BookOpen', 'bg-cyan-100 text-cyan-700', TRUE, 8);

-- Update shift_exceptions table to reference exception types
ALTER TABLE shift_exceptions
ADD COLUMN exception_type_id INT AFTER exception_type,
ADD FOREIGN KEY (exception_type_id) REFERENCES shift_exception_types(id) ON DELETE SET NULL,
ADD INDEX idx_exception_type_id (exception_type_id);

-- Migrate existing data: Map old ENUM values to new type IDs
UPDATE shift_exceptions se
JOIN shift_exception_types st ON se.exception_type = st.code
SET se.exception_type_id = st.id
WHERE se.exception_type_id IS NULL;


-- ============================================================================
-- Migration: 081_create_staff_invitations.sql
-- ============================================================================

-- Migration: Create staff_invitations table
-- Description: Tracks staff invitations with tokens for acceptance

CREATE TABLE staff_invitations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role_id INT NOT NULL,
  branch_id INT,
  department_id INT,
  status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  accepted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_token (token),
  INDEX idx_status (status),
  INDEX idx_email (email)
);


-- ============================================================================
-- Migration: 082_add_leave_request_pending_template.sql
-- ============================================================================

-- Migration: Add notification template for pending leave requests
-- Description: Notifies users with leave:approve permission about new pending requests

INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_request_pending', 'New Leave Request Pending Approval', 'Dear {approver_name},<br><br>A new leave request requires your approval.<br><br>Employee: {staff_name}<br>Leave Type: {leave_type}<br>Dates: {start_date} to {end_date}<br>Days Requested: {days}<br>Reason: {reason}<br><br>Please log in to the HR system to review and approve/reject this request.', 'New Leave Request Pending - {company_name}', 'email', '["approver_name", "staff_name", "leave_type", "start_date", "end_date", "days", "reason", "company_name"]', TRUE);


-- ============================================================================
-- Migration: 083_create_branch_working_days.sql
-- ============================================================================

-- Migration: Create branch_working_days table
-- Description: Configure working days and hours per branch

CREATE TABLE IF NOT EXISTS branch_working_days (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  is_working_day BOOLEAN DEFAULT TRUE,
  start_time TIME,
  end_time TIME,
  break_duration_minutes INT DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_branch_day (branch_id, day_of_week),
  INDEX idx_branch (branch_id),
  INDEX idx_day_of_week (day_of_week)
);

-- Insert default working days (Mon-Fri 9am-5pm) for all existing branches
INSERT IGNORE INTO branch_working_days (branch_id, day_of_week, is_working_day, start_time, end_time, break_duration_minutes)
SELECT
  b.id,
  day.day_of_week,
  CASE
    WHEN day.day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday') THEN TRUE
    ELSE FALSE
  END as is_working_day,
  CASE
    WHEN day.day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday') THEN '09:00:00'
    ELSE NULL
  END as start_time,
  CASE
    WHEN day.day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday') THEN '17:00:00'
    ELSE NULL
  END as end_time,
  30 as break_duration_minutes
FROM branches b
CROSS JOIN (
  SELECT 'monday' as day_of_week UNION ALL
  SELECT 'tuesday' UNION ALL
  SELECT 'wednesday' UNION ALL
  SELECT 'thursday' UNION ALL
  SELECT 'friday' UNION ALL
  SELECT 'saturday' UNION ALL
  SELECT 'sunday'
) day;


-- ============================================================================
-- Migration: 084_add_staff_location_assignment.sql
-- ============================================================================

-- Migration: Add location assignment fields to staff table
-- Description: Allows assigning specific attendance locations to employees
-- Date: March 1, 2026

-- Add assigned_location_id column for primary location assignment
ALTER TABLE staff
ADD COLUMN assigned_location_id INT NULL COMMENT 'Primary attendance location ID for this employee',
ADD FOREIGN KEY (assigned_location_id) REFERENCES attendance_locations(id) ON DELETE SET NULL,
ADD INDEX idx_assigned_location (assigned_location_id);

-- Add JSON field for multiple location assignments (optional, for advanced use cases)
-- Note: Functional index removed for MariaDB compatibility
ALTER TABLE staff
ADD COLUMN location_assignments JSON NULL COMMENT 'JSON: {"primary_location": 1, "secondary_locations": [2,3]}';

-- Add notes field for location-related comments (if not already exists)
ALTER TABLE staff
ADD COLUMN location_notes TEXT NULL COMMENT 'Notes about employee location assignment';

-- Migrate existing staff to default location (their branch's main location)
-- This ensures all existing employees have a location assignment
UPDATE staff s
JOIN branches b ON s.branch_id = b.id
JOIN attendance_locations al ON al.branch_id = b.id AND al.is_active = TRUE
SET s.assigned_location_id = al.id
WHERE s.assigned_location_id IS NULL
LIMIT 100; -- Limit to avoid locking table for too long

-- Create view for easy location assignment lookup
CREATE OR REPLACE VIEW staff_location_assignments AS
SELECT
  s.user_id,
  s.employee_id,
  u.full_name,
  s.branch_id,
  b.name AS branch_name,
  s.assigned_location_id,
  al.name AS location_name,
  al.location_coordinates,
  al.location_radius_meters,
  s.location_assignments,
  s.location_notes
FROM staff s
JOIN users u ON s.user_id = u.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN attendance_locations al ON s.assigned_location_id = al.id
WHERE s.status = 'active';

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON staff_location_assignments TO 'hr_user';

SELECT 'Migration complete: Staff location assignment fields added' AS status;


-- ============================================================================
-- Migration: 085_create_holiday_duty_roster_table.sql
-- ============================================================================

-- Migration: Create holiday_duty_roster table
-- Description: Creates the holiday_duty_roster table for tracking who works on holidays
-- Dependencies: 021_create_holidays_table.sql, 003_create_users_table.sql

CREATE TABLE IF NOT EXISTS holiday_duty_roster (
  id INT PRIMARY KEY AUTO_INCREMENT,
  holiday_id INT NOT NULL,
  user_id INT NOT NULL,
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (holiday_id) REFERENCES holidays(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_holiday_id (holiday_id),
  INDEX idx_user_id (user_id),
  INDEX idx_holiday_user (holiday_id, user_id)
);

-- Add comment to explain table purpose
ALTER TABLE holiday_duty_roster COMMENT = 'Tracks which employees are scheduled to work on public holidays';


-- ============================================================================
-- Migration: 086_add_holiday_working_status_to_attendance.sql
-- ============================================================================

-- Migration: Add holiday-working status to attendance table
-- Description: Adds 'holiday-working' status for employees scheduled to work on holidays

ALTER TABLE attendance
MODIFY COLUMN status ENUM('present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'holiday-working') DEFAULT 'absent';


-- ============================================================================
-- Migration: 087_add_cancellation_fields_to_leave_requests.sql
-- ============================================================================

-- Migration: Add cancellation tracking fields to leave_requests table
-- Description: Track who cancelled leave, when, and why
-- Run: npm run migrate

-- Add cancelled_by column (references users table)
ALTER TABLE leave_requests
ADD COLUMN cancelled_by INT NULL AFTER reviewed_by,
ADD CONSTRAINT fk_leave_requests_cancelled_by
  FOREIGN KEY (cancelled_by) REFERENCES users(id)
  ON DELETE SET NULL;

-- Add cancelled_at column
ALTER TABLE leave_requests
ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by;

-- Add cancellation_reason column
ALTER TABLE leave_requests
ADD COLUMN cancellation_reason TEXT NULL AFTER cancelled_at;


-- ============================================================================
-- Migration: 088_add_leave_request_cancelled_template.sql
-- ============================================================================

-- Migration: Add leave request cancelled notification template
-- Description: Email template for when leave is cancelled

INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled)
VALUES (
  'leave_request_cancelled',
  'Your Leave Request has been Cancelled',
  'Dear {staff_name},\n\nYour {leave_type} request from {start_date} to {end_date} ({days} days) has been cancelled.\n\nReason: {rejection_reason}\n\nIf you have any questions, please contact your manager or HR department.\n\nBest regards,\n{company_name}',
  'Leave Request Cancelled - {staff_name}',
  'email',
  '["staff_name", "leave_type", "start_date", "end_date", "days", "rejection_reason", "company_name"]',
  TRUE
)
ON DUPLICATE KEY UPDATE
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  subject_template = VALUES(subject_template),
  variables = VALUES(variables),
  enabled = VALUES(enabled);


-- ============================================================================
-- Migration: 089_fix_leave_requests.sql
-- ============================================================================

-- Fix for leave_requests table
-- Run this if the table exists but doesn't have user_id column

-- First check if table exists
-- If it doesn't exist, run the migration: migrations/077_create_leave_requests_table.sql

-- If table exists but wrong structure, recreate it:
DROP TABLE IF EXISTS leave_requests;

CREATE TABLE leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INT NOT NULL,
  reason TEXT NOT NULL,
  attachments JSON COMMENT 'Array of attachment objects {name, url, size}',
  status ENUM('submitted', 'approved', 'rejected', 'cancelled') DEFAULT 'submitted',
  reviewed_by INT,
  reviewed_at TIMESTAMP NULL,
  notes TEXT,
  cancelled_by INT NULL,
  cancelled_at DATETIME NULL,
  cancellation_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_leave_type_id (leave_type_id),
  INDEX idx_status (status),
  INDEX idx_dates (start_date, end_date)
);

-- Verify the table structure
DESCRIBE leave_requests;


-- ============================================================================
-- Migration: 090_create_form_attachments_table.sql
-- ============================================================================

-- Migration: Create form_attachments table
-- Description: Creates the form_attachments table for storing uploaded files tied to form submissions
-- and other entities (leave requests, staff documents, appraisals, etc.)

CREATE TABLE IF NOT EXISTS form_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  form_submission_id INT NULL,
  leave_request_id INT NULL,
  field_id INT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (form_submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES form_fields(id),
  INDEX idx_form_submission_field (form_submission_id, field_id),
  INDEX idx_leave_request (leave_request_id)
);


-- ============================================================================
-- Migration: 091_add_strict_location_mode.sql
-- ============================================================================

-- Migration: Add strict location mode to attendance settings
-- Description: Allows toggling between strict (assigned locations only) and legacy (branch-based) mode
-- Date: March 12, 2026

-- Add strict_location_mode column
ALTER TABLE attendance_settings
ADD COLUMN strict_location_mode BOOLEAN DEFAULT FALSE COMMENT 'TRUE = Staff must check in at assigned locations only, FALSE = Use branch-based legacy mode';

-- Update existing settings to use legacy mode by default (backward compatible)
UPDATE attendance_settings SET strict_location_mode = FALSE WHERE strict_location_mode IS NULL;

-- Add to global settings too
ALTER TABLE global_attendance_settings
ADD COLUMN strict_location_mode BOOLEAN DEFAULT FALSE COMMENT 'Global default: TRUE = Staff must check in at assigned locations only';

SELECT 'Migration complete: Strict location mode added' AS status;


-- ============================================================================
-- Migration: 092_fix_leave_allocations_carryover.sql
-- ============================================================================

-- ============================================
-- MIGRATION: Fix Incorrect Leave Allocations
-- ============================================
-- Description: Resets incorrect carried_over_days values caused by seed script
-- Run Date: 2026-03-13
-- Issue: Seed script was adding random carried_over_days (0-5) causing incorrect balances
-- ============================================

-- IMPORTANT: Backup your database before running this!
-- mysqldump -u root -p hr_db > backup_before_fix.sql

-- ============================================
-- STEP 1: Show Current State
-- ============================================

SELECT '=== BEFORE FIX: Current Allocations with Carried Over Days ===' as status;

SELECT 
    la.user_id,
    u.full_name,
    lt.name as leave_type,
    la.allocated_days,
    la.used_days,
    la.carried_over_days,
    la.allocated_days + la.carried_over_days - la.used_days as current_remaining,
    la.cycle_start_date,
    la.cycle_end_date
FROM leave_allocations la
LEFT JOIN users u ON la.user_id = u.id
LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
WHERE la.carried_over_days > 0
  AND la.cycle_end_date >= CURDATE()
ORDER BY la.user_id, lt.id;

-- ============================================
-- STEP 2: Reset Carried Over Days to 0
-- ============================================
-- This fixes the root cause - seed script added random carried_over_days

SELECT '=== RESETTING: Setting all carried_over_days to 0 ===' as status;

UPDATE leave_allocations 
SET carried_over_days = 0.00,
    updated_at = CURRENT_TIMESTAMP
WHERE carried_over_days > 0
  AND cycle_end_date >= CURDATE();

SELECT 
    CONCAT(ROW_COUNT(), ' allocations updated') as result;

-- ============================================
-- STEP 3: Verify Used Days Match Approved Requests
-- ============================================
-- This ensures used_days is accurate

SELECT '=== VERIFYING: Recalculating used_days from approved requests ===' as status;

UPDATE leave_allocations la
LEFT JOIN (
    SELECT 
        user_id,
        leave_type_id,
        SUM(days_requested) as total_used
    FROM leave_requests
    WHERE status = 'approved'
    GROUP BY user_id, leave_type_id
) used ON la.user_id = used.user_id 
      AND la.leave_type_id = used.leave_type_id
SET la.used_days = COALESCE(used.total_used, 0.00),
    la.updated_at = CURRENT_TIMESTAMP
WHERE la.cycle_end_date >= CURDATE();

SELECT 
    CONCAT(ROW_COUNT(), ' allocations updated') as result;

-- ============================================
-- STEP 4: Verification Query
-- ============================================
-- Run this to verify the fix worked

SELECT '=== AFTER FIX: Verified Balances ===' as status;

SELECT 
    la.user_id,
    u.full_name,
    lt.name as leave_type,
    la.allocated_days,
    la.used_days,
    la.carried_over_days,
    (SELECT COALESCE(SUM(lr.days_requested), 0) 
     FROM leave_requests lr 
     WHERE lr.user_id = la.user_id 
       AND lr.leave_type_id = la.leave_type_id
       AND lr.status IN ('submitted', 'pending')) as pending_days,
    GREATEST(0, la.allocated_days + la.carried_over_days - la.used_days - (
        SELECT COALESCE(SUM(lr.days_requested), 0) 
        FROM leave_requests lr 
        WHERE lr.user_id = la.user_id 
          AND lr.leave_type_id = la.leave_type_id
          AND lr.status IN ('submitted', 'pending')
    )) as correct_remaining,
    CASE 
        WHEN la.allocated_days >= la.used_days AND la.carried_over_days = 0 THEN '✓ OK'
        WHEN la.carried_over_days > 0 THEN '⚠️ STILL HAS CARRIED OVER'
        ELSE '⚠️ CHECK'
    END as status
FROM leave_allocations la
LEFT JOIN users u ON la.user_id = u.id
LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
WHERE la.cycle_end_date >= CURDATE()
ORDER BY la.user_id, lt.id;

-- ============================================
-- STEP 5: Summary
-- ============================================

SELECT '=== SUMMARY ===' as status;

SELECT 
    COUNT(*) as total_allocations,
    SUM(CASE WHEN carried_over_days > 0 THEN 1 ELSE 0 END) as still_have_carried_over,
    SUM(CASE WHEN carried_over_days = 0 THEN 1 ELSE 0 END) as fixed_allocations,
    CONCAT('Fixed: ', SUM(CASE WHEN carried_over_days = 0 THEN 1 ELSE 0 END), ' / ', COUNT(*)) as progress
FROM leave_allocations
WHERE cycle_end_date >= CURDATE();

-- ============================================
-- DONE
-- ============================================

SELECT '✅ Migration complete! Refresh your browser to see correct balances.' as message;


-- ============================================================================
-- Migration: 093_add_unique_constraint_leave_allocations.sql
-- ============================================================================

-- Migration: Add unique constraint to leave_allocations table
-- Description: Ensures a staff member can only be allocated a leave type once per cycle
-- Issue: Prevents duplicate leave allocations for the same user, leave type, and cycle

-- First, remove any existing duplicate allocations (keep the most recent one)
DELETE la1 FROM leave_allocations la1
INNER JOIN leave_allocations la2 
WHERE 
  la1.user_id = la2.user_id 
  AND la1.leave_type_id = la2.leave_type_id 
  AND la1.cycle_start_date = la2.cycle_start_date
  AND la1.created_at < la2.created_at;

-- Add unique constraint to prevent future duplicates
ALTER TABLE leave_allocations
ADD UNIQUE INDEX idx_unique_user_leave_cycle (user_id, leave_type_id, cycle_start_date);

-- Verify the constraint was added
SELECT 
  TABLE_NAME, 
  INDEX_NAME, 
  NON_UNIQUE 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'leave_allocations' 
  AND INDEX_NAME = 'idx_unique_user_leave_cycle';


-- ============================================================================
-- Migration: 094_create_guarantors_table.sql
-- ============================================================================

-- Migration: Create guarantors table for staff emergency contacts and guarantees
-- Description: Creates the guarantors table for storing staff guarantor information
-- Features: 
--   - Multiple guarantors per staff member
--   - Comprehensive contact information
--   - Document upload support for signed guarantor forms
--   - Verification workflow for admin

CREATE TABLE IF NOT EXISTS guarantors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other') NULL,
  phone_number VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  
  -- Address
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) DEFAULT 'Nigeria',
  
  -- Identification
  id_type ENUM('national_id', 'passport', 'drivers_license', 'voters_card', 'other') NULL,
  id_number VARCHAR(50) NULL,
  id_issuing_authority VARCHAR(100) NULL,
  id_issue_date DATE NULL,
  id_expiry_date DATE NULL,
  
  -- Relationship to Staff
  relationship VARCHAR(100) NULL COMMENT 'Relationship to the staff member',
  occupation VARCHAR(100) NULL,
  employer_name VARCHAR(200) NULL,
  employer_address VARCHAR(255) NULL,
  employer_phone VARCHAR(20) NULL,
  
  -- Guarantee Details
  guarantee_type ENUM('personal', 'financial', 'both') DEFAULT 'personal',
  guarantee_amount DECIMAL(15,2) NULL COMMENT 'Maximum guarantee amount if financial',
  guarantee_start_date DATE NULL,
  guarantee_end_date DATE NULL,
  guarantee_terms TEXT NULL COMMENT 'Special terms or conditions',
  
  -- Document Reference (for uploaded signed form)
  guarantor_form_path VARCHAR(500) NULL COMMENT 'Path to uploaded signed guarantor form',
  id_document_path VARCHAR(500) NULL COMMENT 'Path to uploaded ID document',
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  verification_notes TEXT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_guarantor_staff (staff_id),
  INDEX idx_guarantor_active (is_active),
  INDEX idx_guarantor_verified (is_verified)
);

-- Create view for easy guarantor lookup
CREATE OR REPLACE VIEW staff_guarantors_summary AS
SELECT
  g.id,
  g.staff_id,
  s.user_id,
  CONCAT(g.first_name, ' ', IFNULL(g.middle_name, ''), ' ', g.last_name) AS guarantor_name,
  g.first_name,
  g.middle_name,
  g.last_name,
  g.phone_number,
  g.alternate_phone,
  g.email,
  g.relationship,
  g.occupation,
  g.guarantee_type,
  g.is_verified,
  g.is_active,
  g.guarantor_form_path,
  g.id_document_path,
  g.created_at,
  u.full_name AS verified_by_name,
  g.verified_at,
  g.verification_notes
FROM guarantors g
LEFT JOIN staff s ON g.staff_id = s.id
LEFT JOIN users u ON g.verified_by = u.id
ORDER BY g.is_active DESC, g.created_at DESC;


-- ============================================================================
-- Migration: 095_simplify_branch_locations.sql
-- ============================================================================

-- Migration: Simplify Branch and Location System
-- Description: Unifies all location data into attendance_locations table
--              Removes redundant location data from branches table
--              Simplifies staff location assignments
-- Date: March 18, 2026

-- ========================================
-- PHASE 1: Create New Structure
-- ========================================

-- 1. Add location_type to attendance_locations (if not exists)
ALTER TABLE attendance_locations
ADD COLUMN IF NOT EXISTS location_type ENUM('branch_office', 'remote_site', 'client_location', 'co_working', 'other') 
DEFAULT 'branch_office' COMMENT 'Type of location for better categorization';

-- 2. Add address to attendance_locations (if not exists)
ALTER TABLE attendance_locations
ADD COLUMN IF NOT EXISTS address VARCHAR(500) COMMENT 'Full address of location';

-- 3. Create staff_secondary_locations table for multiple location assignments
CREATE TABLE IF NOT EXISTS staff_secondary_locations (
  staff_id INT NOT NULL,
  location_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (staff_id, location_id),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES attendance_locations(id) ON DELETE CASCADE,
  INDEX idx_location_id (location_id)
) COMMENT 'Secondary locations for staff who work at multiple sites';

-- 4. Migrate branch locations to attendance_locations
-- This creates attendance locations for all branches that have coordinates
INSERT INTO attendance_locations (
  name, 
  location_type, 
  branch_id, 
  location_coordinates, 
  location_radius_meters, 
  address,
  is_active
)
SELECT 
  CONCAT(b.name, ' - Main Office'),
  'branch_office',
  b.id,
  ST_GeomFromText(CONCAT('POINT(', 
    SUBSTRING_INDEX(b.location_coordinates, ',', -1), ' ', 
    SUBSTRING_INDEX(b.location_coordinates, ',', 1), 
  ')')),
  b.location_radius_meters,
  CONCAT_WS(', ', b.address, b.city, b.state, b.country),
  IF(b.status = 'active', TRUE, FALSE)
FROM branches b
WHERE b.location_coordinates IS NOT NULL 
  AND b.location_coordinates != ''
  AND NOT EXISTS (
    SELECT 1 FROM attendance_locations al 
    WHERE al.branch_id = b.id AND al.location_type = 'branch_office'
  );

-- ========================================
-- PHASE 2: Update Staff Assignments
-- ========================================

-- Migrate staff location_assignments JSON to staff_secondary_locations table
-- Note: JSON_TABLE requires MariaDB 10.4+, so we use a simpler approach
-- that works with older versions. This handles the common case where
-- secondary_locations is a simple array of location IDs.

-- For MariaDB < 10.4, we'll skip the complex JSON extraction
-- and allow the application to handle migration on first use.
-- The staff_secondary_locations table is ready to use for new assignments.

-- If you have existing data in location_assignments, you can migrate it manually:
-- INSERT IGNORE INTO staff_secondary_locations (staff_id, location_id)
-- SELECT s.id, JSON_EXTRACT(s.location_assignments, '$.secondary_locations[0]')
-- FROM staff s WHERE s.location_assignments IS NOT NULL;

-- ========================================
-- PHASE 3: Update Attendance Check-in Logic
-- ========================================

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_location ON staff(assigned_location_id);
CREATE INDEX IF NOT EXISTS idx_location_branch ON attendance_locations(branch_id);
CREATE INDEX IF NOT EXISTS idx_location_active ON attendance_locations(is_active);

-- ========================================
-- PHASE 4: Create Views for Backward Compatibility
-- ========================================

-- Create view for easy staff location lookup
-- Simplified version without secondary locations to avoid MariaDB syntax issues
CREATE OR REPLACE VIEW staff_locations_simple AS
SELECT
  s.id as staff_id,
  s.user_id,
  u.full_name,
  s.employee_id,
  al.id as primary_location_id,
  al.name as primary_location_name,
  al.location_type,
  al.branch_id,
  b.name as branch_name
FROM staff s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN attendance_locations al ON s.assigned_location_id = al.id
LEFT JOIN branches b ON al.branch_id = b.id
WHERE s.status != 'terminated';

-- ========================================
-- PHASE 5: Deprecation Notices (DO NOT DELETE YET)
-- ========================================

-- We're NOT deleting old columns yet for safety
-- These columns are now DEPRECATED and will be removed in a future migration

-- Mark deprecated columns with comments
ALTER TABLE branches 
MODIFY COLUMN location_coordinates VARCHAR(255) COMMENT '[DEPRECATED] Use attendance_locations table instead',
MODIFY COLUMN location_radius_meters INT COMMENT '[DEPRECATED] Use attendance_locations table instead',
MODIFY COLUMN attendance_mode ENUM('branch_based', 'multiple_locations') COMMENT '[DEPRECATED] All locations now use attendance_locations';

ALTER TABLE staff
MODIFY COLUMN location_assignments JSON COMMENT '[DEPRECATED] Use staff_secondary_locations table instead';

-- ========================================
-- Summary
-- ========================================

SELECT 'Migration Complete!' as status;
SELECT '✅ Created staff_secondary_locations table' as result;
SELECT '✅ Migrated branch locations to attendance_locations' as result;
SELECT '✅ Migrated staff secondary locations from JSON to relational table' as result;
SELECT '✅ Created staff_locations_simple view for easy queries' as result;
SELECT '⚠️  Deprecated columns marked for future removal' as result;
SELECT '' as result;
SELECT 'Next Steps:' as result;
SELECT '1. Update backend code to use new unified location system' as result;
SELECT '2. Simplify attendance check-in logic' as result;
SELECT '3. Test thoroughly' as result;
SELECT '4. After verification, remove deprecated columns' as result;


-- ============================================================================
-- Migration: 096_attendance_auto_mark_settings.sql
-- ============================================================================

-- Attendance Auto-Mark Settings Migration
-- Date: March 21, 2026
-- Purpose: Add configurable auto-mark absent time and locking mechanism

-- STEP 1: Add columns to branches table

ALTER TABLE branches
  ADD COLUMN auto_mark_absent_enabled BOOLEAN DEFAULT TRUE AFTER attendance_mode,
  ADD COLUMN auto_mark_absent_time VARCHAR(5) DEFAULT '12:00' AFTER auto_mark_absent_enabled,
  ADD COLUMN auto_mark_absent_timezone VARCHAR(50) DEFAULT 'Africa/Nairobi' AFTER auto_mark_absent_time,
  ADD COLUMN attendance_lock_date DATE NULL AFTER auto_mark_absent_timezone;

-- Set existing branches to default (12:00 PM auto-mark)
UPDATE branches
SET
  auto_mark_absent_enabled = TRUE,
  auto_mark_absent_time = '12:00',
  auto_mark_absent_timezone = 'Africa/Nairobi'
WHERE auto_mark_absent_enabled IS NULL;

-- STEP 2: Add locking columns to attendance table

ALTER TABLE attendance
  ADD COLUMN is_locked BOOLEAN DEFAULT FALSE AFTER notes,
  ADD COLUMN locked_at TIMESTAMP NULL AFTER is_locked,
  ADD COLUMN locked_by INT NULL AFTER locked_at,
  ADD COLUMN lock_reason VARCHAR(255) NULL AFTER locked_by,
  ADD CONSTRAINT fk_attendance_locked_by
    FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL;

-- STEP 3: Create attendance_lock_log table

CREATE TABLE IF NOT EXISTS attendance_lock_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  branch_id INT NOT NULL,
  lock_date DATE NOT NULL,
  locked_by INT NOT NULL,
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attendance_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_lock_date (lock_date),
  INDEX idx_branch_date (branch_id, lock_date),
  INDEX idx_locked_at (locked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- STEP 4: Verify changes

-- Check branches table
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_DEFAULT,
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'branches'
  AND COLUMN_NAME IN (
    'auto_mark_absent_enabled',
    'auto_mark_absent_time',
    'auto_mark_absent_timezone',
    'attendance_lock_date'
  );

-- Check attendance table
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_DEFAULT,
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'attendance'
  AND COLUMN_NAME IN (
    'is_locked',
    'locked_at',
    'locked_by',
    'lock_reason'
  );

-- Check attendance_lock_log table exists
SHOW TABLES LIKE 'attendance_lock_log';


-- ============================================================================
-- Migration: 097_create_attendance_auto_checkout_log.sql
-- ============================================================================

-- Migration: Create attendance_auto_checkout_log table
-- Purpose: Log all automatic checkouts for audit trail
-- Date: March 24, 2026

CREATE TABLE IF NOT EXISTS attendance_auto_checkout_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  checkout_date DATE NOT NULL,
  checkout_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_checkout_date (checkout_date),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment
ALTER TABLE attendance_auto_checkout_log 
COMMENT = 'Logs all automatic attendance checkouts for audit and compliance';


-- ============================================================================
-- Migration: 098_fix_attendance_location_column.sql
-- ============================================================================

-- Migration: Fix attendance location_coordinates column to accept NULL
-- Date: March 24, 2026
-- Issue: GEOMETRY field doesn't accept NULL properly

-- First, drop the existing column
ALTER TABLE attendance DROP COLUMN IF EXISTS location_coordinates;

-- Add it back with proper NULL handling
ALTER TABLE attendance 
ADD COLUMN location_coordinates GEOMETRY NULL DEFAULT NULL AFTER check_out_time;

-- Add comment
ALTER TABLE attendance 
COMMENT = 'Attendance records with proper NULL handling for optional location data';


-- ============================================================================
-- Migration: 099_add_branch_auto_checkout_columns.sql
-- ============================================================================

-- Migration: Add auto_checkout columns to branches table
-- Date: March 24, 2026
-- Purpose: Enable auto-checkout functionality for branches
-- Migration Number: 099

-- Add auto_checkout_enabled column (default: FALSE for safety)
ALTER TABLE branches 
ADD COLUMN auto_checkout_enabled BOOLEAN DEFAULT FALSE COMMENT 'Enable automatic checkout for this branch';

-- Add auto_checkout_minutes_after_close column (default: 30 minutes)
ALTER TABLE branches 
ADD COLUMN auto_checkout_minutes_after_close INT DEFAULT 30 COMMENT 'Minutes after closing time to auto-checkout';

-- Add closing_time column if it doesn't exist (default: 17:00)
ALTER TABLE branches 
ADD COLUMN closing_time TIME DEFAULT '17:00:00' COMMENT 'Branch closing time for auto-checkout calculation';

-- Update existing branches to have sensible defaults
-- Enable auto-checkout with 30 minutes after 5 PM closing
UPDATE branches 
SET 
  auto_checkout_enabled = TRUE,
  auto_checkout_minutes_after_close = 30,
  closing_time = '17:00:00'
WHERE id > 0;

-- Add index for faster queries
CREATE INDEX idx_branches_auto_checkout ON branches(auto_checkout_enabled, closing_time);

-- Add comment to table
ALTER TABLE branches 
COMMENT = 'Branches with auto-checkout configuration for attendance management';


-- ============================================================================
-- Migration: 100_update_staff_invitations_for_new_flow.sql
-- ============================================================================

-- Migration: Update staff_invitations table for new invitation flow
-- Description: Add 'cancelled' to status ENUM, add user_id foreign key
-- Date: March 25, 2026

-- Step 1: Modify status ENUM to include 'cancelled'
ALTER TABLE staff_invitations
MODIFY COLUMN status ENUM('pending', 'accepted', 'declined', 'expired', 'cancelled') DEFAULT 'pending';

-- Step 2: Add user_id column to link to pre-created user account
ALTER TABLE staff_invitations
ADD COLUMN user_id INT NULL AFTER department_id,
ADD CONSTRAINT fk_invitation_user
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Add index for better query performance
CREATE INDEX idx_user_id ON staff_invitations(user_id);

-- Step 4: Update existing invitations to have NULL user_id (no pre-created accounts)
UPDATE staff_invitations SET user_id = NULL WHERE user_id IS NULL;

-- Verification: Check column changes
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'staff_invitations'
  AND COLUMN_NAME IN ('status', 'user_id');

-- Verification: Check foreign key constraint
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'staff_invitations'
  AND CONSTRAINT_NAME = 'fk_invitation_user';


-- ============================================================================
-- Migration: 101_add_profile_picture_to_users.sql
-- ============================================================================

-- Migration: Add profile_picture column to users table
-- Description: Support for staff profile photo uploads
-- Date: March 25, 2026

-- Add profile_picture column
ALTER TABLE users
ADD COLUMN profile_picture VARCHAR(255) NULL AFTER must_change_password;

-- Verify the column was added
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'profile_picture';


-- ============================================================================
-- Migration: 102_add_course_of_study_to_staff.sql
-- ============================================================================

-- Migration 102: Add course_of_study field to staff table
-- Created: 2026-03-26
-- Purpose: Add course of study field for staff education information

ALTER TABLE staff
ADD COLUMN course_of_study VARCHAR(255) NULL AFTER year_of_graduation;

-- Add index for better query performance (optional)
-- ALTER TABLE staff ADD INDEX idx_course_of_study (course_of_study);


-- ============================================================================
-- Migration: 103_fix_auto_mark_timezone_to_lagos.sql
-- ============================================================================

ALTER TABLE branches
MODIFY COLUMN auto_mark_absent_timezone VARCHAR(50) DEFAULT 'Africa/Lagos';

UPDATE branches
SET auto_mark_absent_timezone = 'Africa/Lagos'
WHERE auto_mark_absent_timezone = 'Africa/Nairobi';

CREATE INDEX IF NOT EXISTS idx_auto_mark_time_enabled 
ON branches(auto_mark_absent_time, auto_mark_absent_enabled);


-- ============================================================================
-- Migration: 104_add_leave_request_cancellation_fields.sql
-- ============================================================================

-- Migration: Ensure leave_requests has cancellation tracking fields
-- Description: Adds cancelled_by, cancelled_at, cancellation_reason if they don't exist
-- Date: March 27, 2026
-- Issue: Migration 089 dropped and recreated leave_requests table without cancellation fields

-- Check and add cancelled_by column
SET @dbname = DATABASE();
SET @tablename = 'leave_requests';
SET @columnname = 'cancelled_by';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE leave_requests ADD COLUMN cancelled_by INT NULL AFTER reviewed_by, ADD CONSTRAINT fk_leave_requests_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add cancelled_at column
SET @columnname = 'cancelled_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE leave_requests ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add cancellation_reason column
SET @columnname = 'cancellation_reason';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE leave_requests ADD COLUMN cancellation_reason TEXT NULL AFTER cancelled_at'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verify the columns exist
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'leave_requests'
  AND COLUMN_NAME IN ('cancelled_by', 'cancelled_at', 'cancellation_reason')
ORDER BY ORDINAL_POSITION;


