-- Migration: Create staff_dynamic_fields table
-- Description: Creates a table for admin-defined custom fields for staff profiles

CREATE TABLE IF NOT EXISTS staff_dynamic_fields (
  id INT PRIMARY KEY AUTO_INCREMENT,
  field_name VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type ENUM('text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'radio', 'textarea', 'file', 'email', 'phone') NOT NULL,
  field_options JSON, -- For select, multiselect, radio options
  required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_field_name (field_name),
  INDEX idx_field_type (field_type),
  INDEX idx_is_active (is_active),
  INDEX idx_created_by (created_by)
);