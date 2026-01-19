-- Migration: Create report_exports table
-- Description: Creates the report_exports table for tracking report exports

CREATE TABLE IF NOT EXISTS report_exports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_template_id INT NOT NULL,
  exported_by INT NOT NULL,
  export_format ENUM('pdf', 'excel', 'csv') NOT NULL,
  export_parameters JSON, -- JSON object of parameters used for the export
  file_path VARCHAR(500), -- Path to the exported file
  file_size_bytes INT, -- Size of the exported file in bytes
  export_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  export_error TEXT, -- Error message if export failed
  exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- When the export file will be cleaned up

  FOREIGN KEY (report_template_id) REFERENCES report_templates(id),
  FOREIGN KEY (exported_by) REFERENCES users(id),
  INDEX idx_exported_by (exported_by),
  INDEX idx_export_format (export_format),
  INDEX idx_export_status (export_status),
  INDEX idx_exported_at (exported_at)
);