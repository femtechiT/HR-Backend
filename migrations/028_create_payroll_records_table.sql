-- Migration: Create payroll_records table
-- Description: Creates the payroll_records table for storing calculated payroll data per employee

CREATE TABLE IF NOT EXISTS payroll_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payroll_run_id INT NOT NULL,
  staff_id INT NOT NULL,
  earnings JSON, -- JSON object containing earning components: { basic_salary: 50000, hra: 15000, ... }
  deductions JSON, -- JSON object containing deduction components: { pf: 6000, tds: 3000, ... }
  gross_pay DECIMAL(12, 2) NOT NULL,
  total_deductions DECIMAL(12, 2) NOT NULL,
  net_pay DECIMAL(12, 2) NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  INDEX idx_payroll_run_id (payroll_run_id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_processed_at (processed_at)
);