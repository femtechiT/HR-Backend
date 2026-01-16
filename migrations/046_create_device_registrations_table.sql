-- Migration: Create device_registrations table
-- Description: Creates the device_registrations table for storing user device information for push notifications

CREATE TABLE IF NOT EXISTS device_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  device_token VARCHAR(500) NOT NULL, -- FCM token or similar
  device_type ENUM('mobile', 'tablet', 'desktop') DEFAULT 'mobile',
  platform ENUM('ios', 'android', 'web') NOT NULL,
  app_version VARCHAR(50),
  os_version VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_device_token (device_token),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_platform (platform)
);