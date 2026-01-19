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