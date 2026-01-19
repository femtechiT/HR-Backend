-- Migration: Create schedule_requests table
-- Description: Creates the schedule_requests table for employee self-service schedule requests

CREATE TABLE IF NOT EXISTS schedule_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  request_type ENUM('time_off_request', 'schedule_change', 'shift_swap', 'flexible_arrangement', 'compensatory_time_use') NOT NULL,
  request_subtype VARCHAR(100), -- e.g., 'early_release', 'late_start', 'day_off_choice'
  requested_date DATE,
  requested_start_time TIME,
  requested_end_time TIME,
  requested_duration_days DECIMAL(5,2), -- For multi-day requests
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled', 'implemented') DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP NULL,
  rejected_by INT,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT,
  scheduled_for DATE, -- When the change should take effect
  expires_on DATE, -- When the request is no longer valid
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (rejected_by) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_request_type (request_type),
  INDEX idx_status (status),
  INDEX idx_requested_date (requested_date),
  INDEX idx_scheduled_for (scheduled_for)
);