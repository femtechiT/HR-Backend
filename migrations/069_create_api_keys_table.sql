-- Migration: Create API Keys table
-- Description: Creates the api_keys table for managing API access to the HR system

CREATE TABLE IF NOT EXISTS api_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  key VARCHAR(255) NOT NULL UNIQUE, -- Hashed API key
  name VARCHAR(255) NOT NULL, -- Descriptive name for the key
  user_id INT NOT NULL, -- Foreign key to users table
  permissions JSON NOT NULL, -- JSON array of permissions granted to this key
  is_active BOOLEAN DEFAULT TRUE, -- Whether the key is active
  expires_at TIMESTAMP NULL, -- Optional expiration date
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_key (key),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
);