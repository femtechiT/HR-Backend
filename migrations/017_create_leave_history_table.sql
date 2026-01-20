-- Migration: Create leave_history table
-- Description: Creates the leave_history table for tracking leave usage history

CREATE TABLE IF NOT EXISTS leave_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL, -- Will reference leave_types once that table is created
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_taken DECIMAL(5,2) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  approved_at TIMESTAMP NULL,
  requested_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  INDEX idx_user_dates (user_id, start_date, end_date),
  INDEX idx_approved_at (approved_at),
  INDEX idx_status (status)
);