-- Migration: Create report_cache table
-- Description: Creates the report_cache table for storing cached report results

CREATE TABLE IF NOT EXISTS report_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  report_template_id INT NOT NULL,
  cache_key VARCHAR(500) NOT NULL, -- Unique identifier for cached report (includes parameters)
  cached_result JSON NOT NULL, -- Cached report data
  expires_at TIMESTAMP NOT NULL, -- When the cache expires
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (report_template_id) REFERENCES report_templates(id),
  UNIQUE KEY unique_cache_key (cache_key),
  INDEX idx_expires_at (expires_at),
  INDEX idx_report_template_id (report_template_id)
);