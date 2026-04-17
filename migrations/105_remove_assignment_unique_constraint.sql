-- Migration: Remove unique constraint on employee_shift_assignments
-- Description: Allows multiple active shift assignments per employee
--              Day-based conflict prevention is handled at application level
-- Author: HR System
-- Date: 2026-03-29

-- Step 1: Drop the unique constraint that prevents multiple active assignments
-- This constraint was preventing employees from having multiple shifts
-- even when they don't conflict on days
ALTER TABLE employee_shift_assignments 
DROP INDEX unique_active_assignment;

-- Step 2: Add a new composite index for efficient queries (optional but recommended)
-- This improves performance for user-specific assignment queries
ALTER TABLE employee_shift_assignments
ADD INDEX idx_user_status_dates (user_id, status, effective_from, effective_to);

-- Step 3: Add index for day-based queries (optional)
-- Improves performance when filtering by recurrence pattern
ALTER TABLE employee_shift_assignments
ADD INDEX idx_recurrence (recurrence_pattern);

-- Verification: Check that the unique constraint was dropped
SELECT 
  TABLE_NAME, 
  INDEX_NAME, 
  NON_UNIQUE 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'employee_shift_assignments'
  AND INDEX_NAME = 'unique_active_assignment';

-- Should return 0 rows if successful

-- Step 4: Add documentation comment (MySQL 8.0+)
ALTER TABLE employee_shift_assignments
MODIFY COLUMN status ENUM('pending', 'approved', 'active', 'expired', 'cancelled') 
DEFAULT 'pending' 
COMMENT 'Multiple active assignments per user are now allowed. Day-based conflict prevention is handled at application level.';

-- Rollback (if needed):
-- ALTER TABLE employee_shift_assignments ADD UNIQUE KEY unique_active_assignment (user_id, status);
-- ALTER TABLE employee_shift_assignments DROP INDEX idx_user_status_dates;
-- ALTER TABLE employee_shift_assignments DROP INDEX idx_recurrence;
-- UPDATE employee_shift_assignments SET status = 'active' WHERE status = 'active_multi';
