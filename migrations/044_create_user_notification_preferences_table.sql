-- Migration: Create user_notification_preferences table
-- Description: Creates the user_notification_preferences table for storing user notification preferences

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  channels JSON, -- JSON array of preferred channels ['email', 'push', 'in_app', 'sms']
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_notification_type (user_id, notification_type),
  INDEX idx_user_id (user_id),
  INDEX idx_notification_type (notification_type)
);