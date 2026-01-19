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