-- Migration: Create notification_logs table
-- Description: Creates the notification_logs table for storing notification delivery audit logs

CREATE TABLE IF NOT EXISTS notification_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipient_user_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel ENUM('email', 'push', 'in_app', 'sms') DEFAULT 'email',
  related_entity_type VARCHAR(50), -- e.g., 'leave_request', 'payroll', 'appraisal'
  related_entity_id INT,           -- ID of the related entity
  sent_at TIMESTAMP NULL,
  delivery_status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  error_message TEXT,
  external_id VARCHAR(255),        -- External ID from email service provider
  opened_at TIMESTAMP NULL,        -- When the notification was opened/read
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (recipient_user_id) REFERENCES users(id),
  INDEX idx_recipient_user_id (recipient_user_id),
  INDEX idx_notification_type (notification_type),
  INDEX idx_delivery_status (delivery_status),
  INDEX idx_sent_at (sent_at),
  INDEX idx_related_entity (related_entity_type, related_entity_id)
);