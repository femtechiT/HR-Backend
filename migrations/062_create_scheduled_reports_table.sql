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