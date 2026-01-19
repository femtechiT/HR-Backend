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