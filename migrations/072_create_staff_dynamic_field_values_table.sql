-- Migration: Create staff_dynamic_field_values table
-- Description: Creates a table to store values for dynamic fields per staff member

CREATE TABLE IF NOT EXISTS staff_dynamic_field_values (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  field_id INT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES staff_dynamic_fields(id) ON DELETE CASCADE,
  UNIQUE KEY uk_staff_field (staff_id, field_id),
  INDEX idx_staff_id (staff_id),
  INDEX idx_field_id (field_id)
);