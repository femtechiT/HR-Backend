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
