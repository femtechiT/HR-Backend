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