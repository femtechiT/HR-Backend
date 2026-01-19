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