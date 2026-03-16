-- Migration: Add recurrence_days JSON column to employee_shift_assignments
-- Description: Adds recurrence_days JSON column for flexible weekly recurring shift patterns
--              This complements the existing recurrence_day_of_week ENUM column

-- Add recurrence_days JSON column
ALTER TABLE employee_shift_assignments
ADD COLUMN recurrence_days JSON
AFTER recurrence_pattern;

-- Add index for efficient queries on recurrence_days
ALTER TABLE employee_shift_assignments
ADD INDEX idx_recurrence_days ((CAST(recurrence_days AS CHAR(255))));

-- Update existing weekly assignments to have recurrence_days based on recurrence_day_of_week
UPDATE employee_shift_assignments
SET recurrence_days = JSON_ARRAY(recurrence_day_of_week)
WHERE recurrence_pattern = 'weekly' AND recurrence_day_of_week IS NOT NULL;

-- Set recurrence_days to NULL for non-weekly patterns
UPDATE employee_shift_assignments
SET recurrence_days = NULL
WHERE recurrence_pattern != 'weekly';
