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