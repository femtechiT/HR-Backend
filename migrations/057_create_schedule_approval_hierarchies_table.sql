-- Migration: Create schedule_approval_hierarchies table
-- Description: Creates the schedule_approval_hierarchies table for defining approval workflows

CREATE TABLE IF NOT EXISTS schedule_approval_hierarchies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_type ENUM('time_off_request', 'schedule_change', 'shift_swap', 'flexible_arrangement', 'compensatory_time_use') NOT NULL,
  approval_level INT NOT NULL,
  approver_role_id INT,
  approver_user_id INT,
  approver_branch_id INT,
  approver_department_id INT,
  min_entitlement_days DECIMAL(5,2), -- Minimum days that require this level of approval
  max_entitlement_days DECIMAL(5,2), -- Maximum days that this level can approve
  requires_direct_manager BOOLEAN DEFAULT FALSE,
  approval_sequence INT NOT NULL, -- Order in which approvals are required
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (approver_role_id) REFERENCES roles(id),
  FOREIGN KEY (approver_user_id) REFERENCES users(id),
  FOREIGN KEY (approver_branch_id) REFERENCES branches(id),
  FOREIGN KEY (approver_department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_request_type (request_type),
  INDEX idx_approval_level (approval_level),
  INDEX idx_approval_sequence (approval_sequence),
  INDEX idx_is_active (is_active)
);