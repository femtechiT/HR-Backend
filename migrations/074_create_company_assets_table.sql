-- Migration: Create company_assets table
-- Description: Creates a table to track company assets assigned to staff

CREATE TABLE IF NOT EXISTS company_assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_tag VARCHAR(100) UNIQUE NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(255),
  specifications TEXT,
  purchase_date DATE,
  warranty_expiry_date DATE,
  asset_condition ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good',
  asset_status ENUM('available', 'assigned', 'maintenance', 'disposed') DEFAULT 'available',
  assigned_to_staff_id INT NULL,
  assigned_date DATE,
  returned_date DATE,
  asset_image VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (assigned_to_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_asset_tag (asset_tag),
  INDEX idx_asset_type (asset_type),
  INDEX idx_assigned_to_staff (assigned_to_staff_id),
  INDEX idx_asset_status (asset_status)
);