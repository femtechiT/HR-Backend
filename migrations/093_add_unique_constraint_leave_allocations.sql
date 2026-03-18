-- Migration: Add unique constraint to leave_allocations table
-- Description: Ensures a staff member can only be allocated a leave type once per cycle
-- Issue: Prevents duplicate leave allocations for the same user, leave type, and cycle

-- First, remove any existing duplicate allocations (keep the most recent one)
DELETE la1 FROM leave_allocations la1
INNER JOIN leave_allocations la2 
WHERE 
  la1.user_id = la2.user_id 
  AND la1.leave_type_id = la2.leave_type_id 
  AND la1.cycle_start_date = la2.cycle_start_date
  AND la1.created_at < la2.created_at;

-- Add unique constraint to prevent future duplicates
ALTER TABLE leave_allocations
ADD UNIQUE INDEX idx_unique_user_leave_cycle (user_id, leave_type_id, cycle_start_date);

-- Verify the constraint was added
SELECT 
  TABLE_NAME, 
  INDEX_NAME, 
  NON_UNIQUE 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'leave_allocations' 
  AND INDEX_NAME = 'idx_unique_user_leave_cycle';
