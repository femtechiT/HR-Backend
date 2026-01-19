-- Migration: Create report_templates table
-- Description: Creates the report_templates table for storing report configurations

CREATE TABLE IF NOT EXISTS report_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('attendance', 'leave', 'payroll', 'performance', 'staff', 'custom') DEFAULT 'custom',
  query_definition TEXT NOT NULL, -- SQL query or stored procedure name
  parameters_schema JSON, -- JSON schema defining required parameters
  output_format ENUM('json', 'csv', 'excel', 'pdf') DEFAULT 'json',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active),
  INDEX idx_created_by (created_by)
);