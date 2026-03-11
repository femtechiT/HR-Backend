-- Migration: Add cancellation tracking fields to leave_requests table
-- Description: Track who cancelled leave, when, and why
-- Run: npm run migrate

-- Add cancelled_by column (references users table)
ALTER TABLE leave_requests
ADD COLUMN cancelled_by INT NULL AFTER reviewed_by,
ADD CONSTRAINT fk_leave_requests_cancelled_by
  FOREIGN KEY (cancelled_by) REFERENCES users(id)
  ON DELETE SET NULL;

-- Add cancelled_at column
ALTER TABLE leave_requests
ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by;

-- Add cancellation_reason column
ALTER TABLE leave_requests
ADD COLUMN cancellation_reason TEXT NULL AFTER cancelled_at;
