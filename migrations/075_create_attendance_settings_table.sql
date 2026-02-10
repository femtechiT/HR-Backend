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