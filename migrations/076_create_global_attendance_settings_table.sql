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