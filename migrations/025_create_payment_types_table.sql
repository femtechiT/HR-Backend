-- Migration: Create payment_types table
-- Description: Creates the payment_types table for defining different payment components (earnings, deductions, taxes, benefits)

CREATE TABLE IF NOT EXISTS payment_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  payment_category ENUM('earning', 'deduction', 'tax', 'benefit') NOT NULL,
  calculation_type ENUM('fixed', 'percentage', 'formula') NOT NULL DEFAULT 'fixed',
  formula TEXT, -- Stores formula for complex calculations
  applies_to_all BOOLEAN DEFAULT FALSE, -- Whether this applies to all staff by default
  created_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_category (payment_category),
  INDEX idx_is_active (is_active)
);