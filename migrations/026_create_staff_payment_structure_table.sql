-- Migration: Create staff_payment_structure table
-- Description: Creates the staff_payment_structure table for assigning payment types to staff with specific values

CREATE TABLE IF NOT EXISTS staff_payment_structure (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  payment_type_id INT NOT NULL,
  value DECIMAL(10, 2) NOT NULL, -- Amount for fixed payments or percentage for percentage-based
  effective_from DATE NOT NULL,
  effective_to DATE NULL, -- NULL means ongoing
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES staff(id),
  FOREIGN KEY (payment_type_id) REFERENCES payment_types(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_payment_type_id (payment_type_id),
  INDEX idx_effective_dates (effective_from, effective_to)
);