-- Migration: Create notification_queue table
-- Description: Creates the notification_queue table for storing pending notifications

CREATE TABLE IF NOT EXISTS notification_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_user_id INT NOT NULL,
  template_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  subject TEXT,
  channel ENUM('email', 'push', 'in_app', 'sms') DEFAULT 'email',
  recipient_data JSON, -- JSON object containing recipient details (email, device tokens, etc.)
  payload JSON, -- JSON object containing template variables and other data
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processing_attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  status ENUM('pending', 'processing', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (recipient_user_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES notification_templates(id),
  INDEX idx_status (status),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_recipient_user_id (recipient_user_id),
  INDEX idx_notification_type (notification_type),
  INDEX idx_priority (priority)
);