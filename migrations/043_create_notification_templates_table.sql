-- Migration: Create notification_templates table
-- Description: Creates the notification_templates table for storing dynamic notification templates

CREATE TABLE IF NOT EXISTS notification_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  subject_template TEXT,
  channel ENUM('email', 'push', 'in_app', 'sms') DEFAULT 'email',
  variables JSON, -- JSON array of variable names used in the template
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_name (name),
  INDEX idx_channel (channel),
  INDEX idx_enabled (enabled)
);